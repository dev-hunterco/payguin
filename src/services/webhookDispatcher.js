import { makeId } from '../helpers/ids.js';
import config from '../config.js';

export class WebhookDispatcher {
  constructor(db, webhookService, logger) {
    this.db = db;
    this.webhookService = webhookService;
    this.logger = logger;
  }

  async dispatch(accountId, event, payload) {
    const configs = this.webhookService.getActiveForAccount(accountId);

    for (const cfg of configs) {
      // Check if this config filters events
      if (cfg.events) {
        const events = JSON.parse(cfg.events);
        if (events.length > 0 && !events.includes(event)) continue;
      }

      const payloadKey = event.startsWith('INVOICE_') ? 'invoice' : 'payment';
      const body = JSON.stringify({ event, [payloadKey]: payload });

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), config.webhookTimeout);

        const headers = { 'Content-Type': 'application/json' };
        if (cfg.auth_token) {
          headers['asaas-access-token'] = cfg.auth_token;
        }

        const response = await fetch(cfg.url, {
          method: 'POST',
          headers,
          body,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        const responseBody = await response.text().catch(() => '');

        this._log(accountId, cfg.id, event, body, response.status, responseBody, response.ok);

        this.logger.info({
          event, webhookId: cfg.id, url: cfg.url, status: response.status,
        }, 'Webhook dispatched');
      } catch (err) {
        this._log(accountId, cfg.id, event, body, 0, err.message, false);

        this.logger.warn({
          event, webhookId: cfg.id, url: cfg.url, error: err.message,
        }, 'Webhook dispatch failed');
      }
    }
  }

  _log(accountId, configId, event, payload, statusCode, responseBody, success) {
    this.db.prepare(`
      INSERT INTO webhook_log (id, account_id, webhook_config_id, event, payload, status_code, response_body, success)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(makeId('whl'), accountId, configId, event, payload, statusCode, responseBody, success ? 1 : 0);
  }

  getLog(accountId, { offset = 0, limit = 20 } = {}) {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM webhook_log WHERE account_id = ?').get(accountId).count;
    const rows = this.db.prepare(
      'SELECT * FROM webhook_log WHERE account_id = ? ORDER BY sent_at DESC LIMIT ? OFFSET ?'
    ).all(accountId, limit, offset);
    return { data: rows.map(r => ({ ...r, success: !!r.success, payload: JSON.parse(r.payload) })), totalCount: total };
  }

  getAllLog({ offset = 0, limit = 50 } = {}) {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM webhook_log').get().count;
    const rows = this.db.prepare(
      'SELECT * FROM webhook_log ORDER BY sent_at DESC LIMIT ? OFFSET ?'
    ).all(limit, offset);
    return { data: rows.map(r => ({ ...r, success: !!r.success, payload: JSON.parse(r.payload) })), totalCount: total };
  }
}
