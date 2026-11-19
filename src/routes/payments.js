import { Router } from 'express';
import { listResponse, parsePagination } from '../models/responses.js';

export function paymentRoutes(paymentService) {
  const router = Router();

  // POST /v3/payments
  router.post('/v3/payments', (req, res) => {
    // Asaas accepts both "value" and "totalValue" (used with installments)
    if (req.body.totalValue && !req.body.value) {
      req.body.value = req.body.totalValue;
    }
    if (!req.body.customer || !req.body.value || !req.body.dueDate) {
      return res.status(400).json({
        errors: [{ code: 'invalid_value', description: 'customer, value, and dueDate are required' }]
      });
    }
    const payment = paymentService.create(req.accountId, req.body);
    res.status(200).json(payment);
  });

  // GET /v3/payments
  router.get('/v3/payments', (req, res) => {
    if (req.query.installment) {
      const { offset, limit } = parsePagination(req.query);
      const result = paymentService.getByInstallment(req.accountId, req.query.installment, { offset, limit });
      return res.json(listResponse(result.data, result.totalCount, offset, limit));
    }

    const { offset, limit } = parsePagination(req.query);
    const result = paymentService.list(req.accountId, {
      offset, limit,
      status: req.query.status,
      billingType: req.query.billingType,
      customer: req.query.customer,
    });
    res.json(listResponse(result.data, result.totalCount, offset, limit));
  });

  // GET /v3/payments/:id
  router.get('/v3/payments/:id', (req, res) => {
    const payment = paymentService.getById(req.params.id, req.accountId);
    if (!payment) return res.status(404).json({ errors: [{ code: 'not_found', description: 'Payment not found' }] });
    res.json(payment);
  });

  // POST /v3/payments/:id (update splits)
  router.post('/v3/payments/:id', (req, res) => {
    if (!req.body.split) {
      return res.status(400).json({ errors: [{ code: 'invalid_value', description: 'split is required' }] });
    }
    const payment = paymentService.updateSplits(req.params.id, req.accountId, req.body.split);
    if (!payment) return res.status(404).json({ errors: [{ code: 'not_found', description: 'Payment not found' }] });
    res.json(payment);
  });

  // POST /v3/payments/:id/receiveInCash
  router.post('/v3/payments/:id/receiveInCash', (req, res) => {
    const payment = paymentService.receiveInCash(req.params.id, req.accountId, req.body);
    if (!payment) return res.status(404).json({ errors: [{ code: 'not_found', description: 'Payment not found' }] });
    res.json(payment);
  });

  return router;
}
