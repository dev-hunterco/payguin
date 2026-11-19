import { Router } from 'express';
import { resetDatabase, resetAccountData } from '../db/connection.js';

export function simulationRoutes(simulationService, db) {
  const router = Router();

  router.post('/__sim/payments/:id/pay', async (req, res) => {
    const result = await simulationService.payPayment(req.params.id);
    if (result.error) return res.status(404).json({ errors: [{ code: 'not_found', description: result.error }] });
    res.json(result);
  });

  router.post('/__sim/payments/:id/confirm', async (req, res) => {
    const result = await simulationService.confirmPayment(req.params.id);
    if (result.error) return res.status(404).json({ errors: [{ code: 'not_found', description: result.error }] });
    res.json(result);
  });

  router.post('/__sim/payments/:id/overdue', async (req, res) => {
    const result = await simulationService.overduePayment(req.params.id);
    if (result.error) return res.status(404).json({ errors: [{ code: 'not_found', description: result.error }] });
    res.json(result);
  });

  router.post('/__sim/payments/:id/refund', async (req, res) => {
    const result = await simulationService.refundPayment(req.params.id);
    if (result.error) return res.status(404).json({ errors: [{ code: 'not_found', description: result.error }] });
    res.json(result);
  });

  router.post('/__sim/invoices/:id/authorize', async (req, res) => {
    const result = await simulationService.authorizeInvoice(req.params.id);
    if (result.error) return res.status(404).json({ errors: [{ code: 'not_found', description: result.error }] });
    res.json(result);
  });

  router.post('/__sim/invoices/:id/error', async (req, res) => {
    const result = await simulationService.errorInvoice(req.params.id);
    if (result.error) return res.status(404).json({ errors: [{ code: 'not_found', description: result.error }] });
    res.json(result);
  });

  router.post('/__sim/time/advance', async (req, res) => {
    const days = req.body.days || 1;
    const result = simulationService.advanceTime(days);
    res.json(result);
  });

  router.post('/__sim/reset', (req, res) => {
    resetDatabase(db);
    res.json({ ok: true, message: 'All data has been reset' });
  });

  router.post('/__sim/reset/:accountId', (req, res) => {
    resetAccountData(db, req.params.accountId);
    res.json({ ok: true, message: `Account ${req.params.accountId} data has been reset` });
  });

  return router;
}
