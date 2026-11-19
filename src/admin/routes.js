import { Router } from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import express from 'express';
import { resetAccountData } from '../db/connection.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function adminRoutes({ accountService, customerService, paymentService, invoiceService, webhookService, webhookDispatcher, simulationService, walletService, db }) {
  const router = Router();

  // Serve Vue build if it exists
  const distPath = join(__dirname, '../../ui/dist');
  if (existsSync(distPath)) {
    router.use('/__admin', express.static(distPath));
  }

  // Admin API endpoints
  router.get('/__admin/api/accounts', (req, res) => {
    res.json(accountService.getAll());
  });

  router.post('/__admin/api/accounts', express.json(), (req, res) => {
    const account = accountService.create(req.body);
    res.status(201).json(account);
  });

  router.delete('/__admin/api/accounts/:id', (req, res) => {
    resetAccountData(db, req.params.id);
    res.json({ ok: true });
  });

  router.post('/__admin/api/accounts/:id/balance', express.json(), (req, res) => {
    const { value, description } = req.body;
    if (!value) return res.status(400).json({ errors: [{ code: 'invalid_value', description: 'value is required' }] });
    walletService.addManualBalance(req.params.id, value, description);
    res.json({ ok: true });
  });

  router.get('/__admin/api/accounts/:id/statement', (req, res) => {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 50;
    res.json(walletService.getStatement(req.params.id, { offset, limit }));
  });

  router.get('/__admin/api/accounts/:id/customers', (req, res) => {
    const result = customerService.list(req.params.id, { offset: 0, limit: 100 });
    res.json(result);
  });

  router.get('/__admin/api/accounts/:id/payments', (req, res) => {
    const result = paymentService.list(req.params.id, { offset: 0, limit: 100 });
    const customers = customerService.list(req.params.id, { offset: 0, limit: 1000 });
    const customerMap = {};
    for (const c of customers.data) {
      customerMap[c.id] = c.name;
    }
    const allAccounts = accountService.getAll();
    const accountMap = {};
    for (const a of allAccounts) {
      accountMap[a.id] = a.name;
    }
    result.data = result.data.map(p => ({
      ...p,
      customerName: customerMap[p.customer] || null,
      split: p.split ? p.split.map(s => ({
        ...s,
        walletName: accountMap[s.walletId] || null,
      })) : p.split,
    }));
    res.json(result);
  });

  router.get('/__admin/api/accounts/:id/invoices', (req, res) => {
    const result = invoiceService.list(req.params.id, { offset: 0, limit: 100 });
    res.json(result);
  });

  router.get('/__admin/api/accounts/:id/webhooks', (req, res) => {
    const result = webhookService.list(req.params.id, { offset: 0, limit: 100 });
    res.json(result);
  });

  router.post('/__admin/api/accounts/:id/webhooks', express.json(), (req, res) => {
    const webhook = webhookService.create(req.params.id, req.body);
    res.status(201).json(webhook);
  });

  router.put('/__admin/api/webhooks/:id', express.json(), (req, res) => {
    const webhook = webhookService.update(req.params.id, req.body.accountId, req.body);
    if (!webhook) return res.status(404).json({ errors: [{ code: 'not_found', description: 'Webhook not found' }] });
    res.json(webhook);
  });

  router.delete('/__admin/api/webhooks/:id', (req, res) => {
    const accountId = req.query.accountId;
    db.prepare('DELETE FROM webhook_configs WHERE id = ? AND account_id = ?').run(req.params.id, accountId);
    res.json({ ok: true });
  });

  router.get('/__admin/api/webhook-log', (req, res) => {
    const accountId = req.query.accountId;
    if (accountId) {
      res.json(webhookDispatcher.getLog(accountId));
    } else {
      res.json(webhookDispatcher.getAllLog());
    }
  });

  // Catch-all for SPA routing
  router.get('/__admin/*', (req, res) => {
    if (existsSync(distPath)) {
      res.sendFile(join(distPath, 'index.html'));
    } else {
      res.status(200).send('Admin UI not built. Run: cd ui && npm run build');
    }
  });

  return router;
}
