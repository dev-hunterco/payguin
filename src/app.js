import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import pino from 'pino';
import config from './config.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { AccountService } from './services/accountService.js';
import { CustomerService } from './services/customerService.js';
import { PaymentService } from './services/paymentService.js';
import { InvoiceService } from './services/invoiceService.js';
import { WebhookService } from './services/webhookService.js';
import { WebhookDispatcher } from './services/webhookDispatcher.js';
import { TransferService } from './services/transferService.js';
import { SimulationService } from './services/simulationService.js';
import { WalletService } from './services/walletService.js';
import { accountRoutes } from './routes/accounts.js';
import { customerRoutes } from './routes/customers.js';
import { paymentRoutes } from './routes/payments.js';
import { invoiceRoutes } from './routes/invoices.js';
import { fiscalInfoRoutes } from './routes/fiscalInfo.js';
import { webhookRoutes } from './routes/webhooks.js';
import { transferRoutes } from './routes/transfers.js';
import { simulationRoutes } from './routes/simulation.js';
import { adminRoutes } from './admin/routes.js';

export function createApp(db) {
  const app = express();
  const logger = pino({ level: config.logLevel, transport: { target: 'pino-pretty' } });

  // Services
  const walletService = new WalletService(db);
  const accountService = new AccountService(db);
  const customerService = new CustomerService(db);
  const paymentService = new PaymentService(db, walletService);
  const invoiceService = new InvoiceService(db);
  const webhookService = new WebhookService(db);
  const webhookDispatcher = new WebhookDispatcher(db, webhookService, logger);
  const transferService = new TransferService(db, walletService);
  const simulationService = new SimulationService(db, paymentService, invoiceService, webhookDispatcher, walletService);

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(requestLogger(logger));
  app.use(authMiddleware(db));

  // Health check
  app.get('/health', (req, res) => res.json({ ok: true, service: 'payguin' }));

  // LLMs.txt — public, no auth
  const __dirname = dirname(fileURLToPath(import.meta.url));
  app.get('/llms.txt', (req, res) => {
    const content = readFileSync(join(__dirname, '..', 'llms.txt'), 'utf-8');
    res.type('text/plain').send(content);
  });

  // Root redirect
  app.get('/', (req, res) => res.redirect('/__admin'));

  // Admin (before API routes, no auth required)
  app.use(adminRoutes({ accountService, customerService, paymentService, invoiceService, webhookService, webhookDispatcher, simulationService, walletService, db }));

  // Simulation (no auth required)
  app.use(simulationRoutes(simulationService, db));

  // API routes (auth required)
  app.use(accountRoutes(accountService));
  app.use(customerRoutes(customerService));
  app.use(paymentRoutes(paymentService));
  app.use(invoiceRoutes(invoiceService, webhookDispatcher));
  app.use(fiscalInfoRoutes());
  app.use(webhookRoutes(webhookService));
  app.use(transferRoutes(transferService));

  // Error handler
  app.use(errorHandler(logger));

  // Expose for external use
  app.locals.services = {
    accountService, customerService, paymentService, invoiceService,
    webhookService, webhookDispatcher, transferService, simulationService, walletService,
  };
  app.locals.logger = logger;

  return app;
}
