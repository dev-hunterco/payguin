import { makeId } from '../helpers/ids.js';

export class WebhookService {
  constructor(db) {
    this.db = db;
  }

  create(accountId, data) {
    const id = makeId('cfg');
    this.db.prepare(`
      INSERT INTO webhook_configs (id, account_id, name, url, email, api_version, enabled,
        auth_token, send_type, events)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, accountId,
      data.name || 'Webhook',
      data.url,
      data.email || null,
      data.apiVersion || 3,
      data.enabled !== false ? 1 : 0,
      data.authToken || null,
      data.sendType || 'NON_REQUIRED',
      data.events ? JSON.stringify(data.events) : null
    );

    return this.format(this.db.prepare('SELECT * FROM webhook_configs WHERE id = ?').get(id));
  }

  update(id, accountId, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.url !== undefined) { fields.push('url = ?'); values.push(data.url); }
    if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
    if (data.apiVersion !== undefined) { fields.push('api_version = ?'); values.push(data.apiVersion); }
    if (data.enabled !== undefined) { fields.push('enabled = ?'); values.push(data.enabled ? 1 : 0); }
    if (data.interrupted !== undefined) { fields.push('interrupted = ?'); values.push(data.interrupted ? 1 : 0); }
    if (data.authToken !== undefined) { fields.push('auth_token = ?'); values.push(data.authToken); }
    if (data.sendType !== undefined) { fields.push('send_type = ?'); values.push(data.sendType); }
    if (data.events !== undefined) { fields.push('events = ?'); values.push(JSON.stringify(data.events)); }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(id, accountId);
      this.db.prepare(`UPDATE webhook_configs SET ${fields.join(', ')} WHERE id = ? AND account_id = ?`).run(...values);
    }

    return this.format(this.db.prepare('SELECT * FROM webhook_configs WHERE id = ? AND account_id = ?').get(id, accountId));
  }

  list(accountId, { offset = 0, limit = 10 } = {}) {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM webhook_configs WHERE account_id = ?').get(accountId).count;
    const rows = this.db.prepare('SELECT * FROM webhook_configs WHERE account_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(accountId, limit, offset);
    return { data: rows.map(r => this.format(r)), totalCount: total };
  }

  getActiveForAccount(accountId) {
    return this.db.prepare('SELECT * FROM webhook_configs WHERE account_id = ? AND enabled = 1 AND interrupted = 0').all(accountId);
  }

  format(row) {
    if (!row) return null;
    return {
      object: 'webhook',
      id: row.id,
      name: row.name,
      url: row.url,
      email: row.email,
      apiVersion: row.api_version,
      enabled: !!row.enabled,
      interrupted: !!row.interrupted,
      authToken: row.auth_token,
      sendType: row.send_type,
      events: row.events ? JSON.parse(row.events) : null,
      dateCreated: row.created_at,
    };
  }
}
