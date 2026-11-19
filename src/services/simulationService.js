import { centsToDecimal } from '../models/responses.js';

export class SimulationService {
  constructor(db, paymentService, invoiceService, webhookDispatcher, walletService) {
    this.db = db;
    this.paymentService = paymentService;
    this.invoiceService = invoiceService;
    this.webhookDispatcher = webhookDispatcher;
    this.walletService = walletService;
  }

  async payPayment(paymentId) {
    const raw = this.paymentService.getRaw(paymentId);
    if (!raw) return { error: 'Payment not found' };

    const now = new Date().toISOString().split('T')[0];
    this.paymentService.updateStatus(paymentId, 'RECEIVED', {
      paymentDate: now,
      clientPaymentDate: now,
      confirmedDate: now,
    });

    // Credit full value to account
    this.walletService.credit(
      raw.account_id, raw.value,
      `Cobrança recebida ${paymentId} - R$ ${centsToDecimal(raw.value)}`,
      'PAYMENT', paymentId
    );

    // Process splits: debit from owner, credit to split wallets
    this._processSplits(raw);

    const payment = this.paymentService.format(this.paymentService.getRaw(paymentId));
    await this.webhookDispatcher.dispatch(raw.account_id, 'PAYMENT_RECEIVED', payment);
    return payment;
  }

  async confirmPayment(paymentId) {
    const raw = this.paymentService.getRaw(paymentId);
    if (!raw) return { error: 'Payment not found' };

    const now = new Date().toISOString().split('T')[0];
    this.paymentService.updateStatus(paymentId, 'CONFIRMED', { confirmedDate: now });

    const payment = this.paymentService.format(this.paymentService.getRaw(paymentId));
    await this.webhookDispatcher.dispatch(raw.account_id, 'PAYMENT_CONFIRMED', payment);

    // Auto-transition to RECEIVED after confirm
    return this.payPayment(paymentId);
  }

  async overduePayment(paymentId) {
    const raw = this.paymentService.getRaw(paymentId);
    if (!raw) return { error: 'Payment not found' };

    this.paymentService.updateStatus(paymentId, 'OVERDUE');

    const payment = this.paymentService.format(this.paymentService.getRaw(paymentId));
    await this.webhookDispatcher.dispatch(raw.account_id, 'PAYMENT_OVERDUE', payment);
    return payment;
  }

  async refundPayment(paymentId) {
    const raw = this.paymentService.getRaw(paymentId);
    if (!raw) return { error: 'Payment not found' };

    this.paymentService.updateStatus(paymentId, 'REFUNDED');

    // Debit full value from account
    this.walletService.debit(
      raw.account_id, raw.value,
      `Estorno cobrança ${paymentId} - R$ ${centsToDecimal(raw.value)}`,
      'REFUND', paymentId
    );

    const payment = this.paymentService.format(this.paymentService.getRaw(paymentId));
    await this.webhookDispatcher.dispatch(raw.account_id, 'PAYMENT_REFUNDED', payment);
    return payment;
  }

  async authorizeInvoice(invoiceId) {
    const row = this.db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
    if (!row) return { error: 'Invoice not found' };

    this.invoiceService.updateStatus(invoiceId, 'AUTHORIZED');

    const invoice = this.invoiceService.format(this.db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId));
    await this.webhookDispatcher.dispatch(row.account_id, 'INVOICE_AUTHORIZED', invoice);
    return invoice;
  }

  async errorInvoice(invoiceId) {
    const row = this.db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
    if (!row) return { error: 'Invoice not found' };

    this.invoiceService.updateStatus(invoiceId, 'ERROR');

    const invoice = this.invoiceService.format(this.db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId));
    await this.webhookDispatcher.dispatch(row.account_id, 'INVOICE_ERROR', invoice);
    return invoice;
  }

  advanceTime(days) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const dateStr = futureDate.toISOString().split('T')[0];

    const overduePayments = this.db.prepare(
      "SELECT * FROM payments WHERE status = 'PENDING' AND due_date < ? AND deleted = 0"
    ).all(dateStr);

    const results = [];
    for (const p of overduePayments) {
      this.paymentService.updateStatus(p.id, 'OVERDUE');
      const formatted = this.paymentService.format(this.paymentService.getRaw(p.id));
      this.webhookDispatcher.dispatch(p.account_id, 'PAYMENT_OVERDUE', formatted);
      results.push(formatted);
    }

    return { overdueCount: results.length, payments: results };
  }

  _processSplits(raw) {
    if (!raw.splits) return;

    const splits = JSON.parse(raw.splits);
    for (const split of splits) {
      const targetWalletId = split.walletId;
      const splitValue = split.fixedValue
        ? Math.round(split.fixedValue * 100)
        : Math.round(raw.value * (split.percentualValue || 0) / 100);

      if (!targetWalletId || splitValue <= 0) continue;

      // Debit split commission from payment owner
      this.walletService.debit(
        raw.account_id, splitValue,
        `Comissão split → ${targetWalletId} (${raw.id})`,
        'SPLIT', raw.id
      );

      // Credit split commission to target wallet
      this.walletService.credit(
        targetWalletId, splitValue,
        `Comissão split ← ${raw.account_id} (${raw.id})`,
        'SPLIT', raw.id
      );
    }
  }
}
