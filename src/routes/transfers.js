import { Router } from 'express';

export function transferRoutes(transferService) {
  const router = Router();

  // POST /v3/transfers
  router.post('/v3/transfers', (req, res) => {
    if (!req.body.value) {
      return res.status(400).json({ errors: [{ code: 'invalid_value', description: 'value is required' }] });
    }
    const transfer = transferService.create(req.accountId, req.body);
    res.json(transfer);
  });

  // GET /v3/finance/getCurrentBalance
  router.get('/v3/finance/getCurrentBalance', (req, res) => {
    res.json(transferService.getBalance(req.accountId));
  });

  return router;
}
