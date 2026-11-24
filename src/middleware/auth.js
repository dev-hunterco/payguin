export function authMiddleware(db) {
  return (req, res, next) => {
    // Skip auth for simulation, admin, health, and static paths
    if (req.path.startsWith('/__sim') ||
        req.path.startsWith('/__admin') ||
        req.path === '/health' ||
        req.path === '/llms.txt' ||
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

    // Find account by API key
    const account = db.prepare('SELECT * FROM accounts WHERE api_key = ?').get(apiKey);
    if (!account) {
      return res.status(401).json({
        errors: [{ code: 'unauthorized', description: 'Invalid access_token. Create an account first via POST /v2/accounts' }]
      });
    }

    req.account = account;
    req.accountId = account.id;
    next();
  };
}
