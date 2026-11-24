import { Router } from 'express';
import { listResponse, parsePagination } from '../models/responses.js';

export function invoiceRoutes(invoiceService, webhookDispatcher) {
  const router = Router();

  // POST /v3/invoices
  router.post('/v3/invoices', async (req, res) => {
    if (!req.body.value) {
      return res.status(400).json({ errors: [{ code: 'invalid_value', description: 'value is required' }] });
    }
    const invoice = invoiceService.create(req.accountId, req.body);
    await webhookDispatcher.dispatch(req.accountId, 'INVOICE_CREATED', invoice);
    res.status(200).json(invoice);
  });

  // GET /v3/invoices
  router.get('/v3/invoices', (req, res) => {
    const { offset, limit } = parsePagination(req.query);
    const result = invoiceService.list(req.accountId, { offset, limit, status: req.query.status });
    res.json(listResponse(result.data, result.totalCount, offset, limit));
  });

  // GET /v3/invoices/municipalServices
  router.get('/v3/invoices/municipalServices', (req, res) => {
    const services = invoiceService.getMunicipalServices(req.query.description);
    res.json({ object: 'list', data: services, totalCount: services.length });
  });

  // GET /v3/invoices/:id
  router.get('/v3/invoices/:id', (req, res) => {
    const invoice = invoiceService.getById(req.params.id, req.accountId);
    if (!invoice) return res.status(404).json({ errors: [{ code: 'not_found', description: 'Invoice not found' }] });
    res.json(invoice);
  });

  return router;
}
