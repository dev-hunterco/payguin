import { Router } from 'express';
import { listResponse, parsePagination } from '../models/responses.js';

export function customerRoutes(customerService) {
  const router = Router();

  // POST /v3/customers
  router.post('/v3/customers', (req, res) => {
    if (!req.body.name) {
      return res.status(400).json({ errors: [{ code: 'invalid_value', description: 'Name is required' }] });
    }
    const customer = customerService.create(req.accountId, req.body);
    res.status(200).json(customer);
  });

  // GET /v3/customers
  router.get('/v3/customers', (req, res) => {
    if (req.query.cpfCnpj) {
      const customers = customerService.findByCpfCnpj(req.accountId, req.query.cpfCnpj);
      return res.json(listResponse(customers, customers.length, 0, customers.length || 10));
    }

    const { offset, limit } = parsePagination(req.query);
    const result = customerService.list(req.accountId, { offset, limit });
    res.json(listResponse(result.data, result.totalCount, offset, limit));
  });

  // GET /v3/customers/:id
  router.get('/v3/customers/:id', (req, res) => {
    const customer = customerService.findById(req.params.id, req.accountId);
    if (!customer) return res.status(404).json({ errors: [{ code: 'not_found', description: 'Customer not found' }] });
    res.json(customer);
  });

  // GET /v3/customerFiscalInfo
  router.get('/v3/customerFiscalInfo', (req, res) => {
    res.json(customerService.getFiscalInfo(req.accountId));
  });

  return router;
}
