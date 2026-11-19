const config = {
  port: parseInt(process.env.PORT || '8787'),
  dbPath: process.env.DB_PATH || './data/payguin.db',
  webhookTimeout: parseInt(process.env.WEBHOOK_TIMEOUT || '5000'),
  logLevel: process.env.LOG_LEVEL || 'info',
};

export default config;
