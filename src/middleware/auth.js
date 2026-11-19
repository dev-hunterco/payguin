import { nanoid } from 'nanoid';

export function authMiddleware(db) {
  return (req, res, next) => {
    // Skip auth for simulation, admin, health, and static paths
    if (req.path.startsWith('/__sim') ||
        req.path.startsWith('/__admin') ||
        req.path === '/health' ||
        req.path === '/' ||
        (req.method === 'POST' && req.path === '/v2/accounts')) {
      return next();
    }

    const apiKey = req.headers['access_token'] || req.headers['access-token'];
    if (!apiKey) {
      return res.status(401).json({
        errors: [{ code: 'unauthorized', description: 'Header access_token is required' }]
      });
    }

    // Find or create account
    let account = db.prepare('SELECT * FROM accounts WHERE api_key = ?').get(apiKey);
    if (!account) {
      const id = `acct_${nanoid(16)}`;
      db.prepare(
        'INSERT INTO accounts (id, api_key, name) VALUES (?, ?, ?)'
      ).run(id, apiKey, 'Auto-created Account');
      account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
    }

    req.account = account;
    req.accountId = account.id;
    next();
  };
}
