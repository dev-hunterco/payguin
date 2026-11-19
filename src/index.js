import config from './config.js';
import { createDatabase } from './db/connection.js';
import { createApp } from './app.js';

const db = createDatabase(config.dbPath);
const app = createApp(db);

app.listen(config.port, () => {
  app.locals.logger.info(`🐧 PayGuin running at http://localhost:${config.port}`);
  app.locals.logger.info(`📋 Admin UI at http://localhost:${config.port}/__admin`);
  app.locals.logger.info(`🔧 Simulation API at http://localhost:${config.port}/__sim`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
