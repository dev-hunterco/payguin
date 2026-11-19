import { Router } from 'express';
import { listResponse, parsePagination } from '../models/responses.js';

export function webhookRoutes(webhookService) {
  const router = Router();

  // POST /v3/webhooks
  router.post('/v3/webhooks', (req, res) => {
    if (!req.body.url) {
      return res.status(400).json({ errors: [{ code: 'invalid_value', description: 'url is required' }] });
    }
    const webhook = webhookService.create(req.accountId, req.body);
    res.status(200).json(webhook);
  });

  // PUT /v3/webhooks/:id
  router.put('/v3/webhooks/:id', (req, res) => {
    const webhook = webhookService.update(req.params.id, req.accountId, req.body);
    if (!webhook) return res.status(404).json({ errors: [{ code: 'not_found', description: 'Webhook not found' }] });
    res.json(webhook);
  });

  // GET /v3/webhooks
  router.get('/v3/webhooks', (req, res) => {
    const { offset, limit } = parsePagination(req.query);
    const result = webhookService.list(req.accountId, { offset, limit });
    res.json(listResponse(result.data, result.totalCount, offset, limit));
  });

  return router;
}
