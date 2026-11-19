import { Router } from 'express';

export function accountRoutes(accountService) {
  const router = Router();

  // POST /v2/accounts - Create subaccount
  router.post('/v2/accounts', (req, res) => {
    const account = accountService.create(req.body);
    res.status(200).json(account);
  });

  // GET /v3/myAccount/commercialInfo
  router.get('/v3/myAccount/commercialInfo', (req, res) => {
    const info = accountService.getCommercialInfo(req.accountId);
    res.json(info);
  });

  // GET /v3/wallets
  router.get('/v3/wallets', (req, res) => {
    const wallets = accountService.getWallets(req.accountId);
    res.json({ object: 'list', data: wallets, totalCount: wallets.length });
  });

  // GET /v3/banks
  router.get('/v3/banks', (req, res) => {
    const banks = accountService.getBanks();
    res.json({ object: 'list', data: banks, totalCount: banks.length });
  });

  return router;
}
