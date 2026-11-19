import { makeId } from '../helpers/ids.js';
import { centsToDecimal, decimalToCents } from '../models/responses.js';
import config from '../config.js';

export class PaymentService {
  constructor(db, walletService) {
    this.db = db;
    this.walletService = walletService;
  }

  create(accountId, data) {
    const value = decimalToCents(data.value);
    const installmentCount = data.installmentCount || 1;

    // If installments, create a group
    if (installmentCount > 1) {
      return this._createInstallments(accountId, data, value, installmentCount);
    }

    return this._createSingle(accountId, data, value, null, null, null);
  }

  _createInstallments(accountId, data, totalValue, count) {
    const installmentId = makeId('inst');
    const perInstallment = Math.floor(totalValue / count);
    const remainder = totalValue - (perInstallment * count);
    const results = [];

    const dueDate = new Date(data.dueDate);

    for (let i = 1; i <= count; i++) {
      const installmentValue = i === count ? perInstallment + remainder : perInstallment;
      const installmentDueDate = new Date(dueDate);
      installmentDueDate.setMonth(installmentDueDate.getMonth() + (i - 1));

      const payment = this._createSingle(
        accountId,
        { ...data, dueDate: installmentDueDate.toISOString().split('T')[0] },
        installmentValue,
        installmentId,
        i,
        count
      );
      results.push(payment);
    }

    return results[0]; // Asaas returns the first installment
  }

  _createSingle(accountId, data, valueCents, installmentId, installmentNumber, installmentCount) {
    const id = makeId('pay');
    const baseUrl = `http://localhost:${config.port}`;

    const splits = data.split ? JSON.stringify(data.split) : null;

    this.db.prepare(`
      INSERT INTO payments (id, account_id, customer_id, billing_type, value, net_value, original_value,
        due_date, original_due_date, description, external_reference, installment_id, installment_number,
        installment_count, discount_value, discount_type, discount_due_date_limit_days,
        interest_value, fine_value, splits, invoice_url, bank_slip_url, pix_qr_code_id, pix_copy_and_paste)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, accountId,
      data.customer,
      data.billingType || 'BOLETO',
      valueCents,
      valueCents, // net_value starts as value
      valueCents,
      data.dueDate,
      data.dueDate,
      data.description || null,
      data.externalReference || null,
      installmentId,
      installmentNumber,
      installmentCount,
      decimalToCents(data.discount?.value) || 0,
      data.discount?.type || null,
      data.discount?.dueDateLimitDays || null,
      decimalToCents(data.interest?.value) || 0,
      decimalToCents(data.fine?.value) || 0,
      splits,
      `${baseUrl}/__fake/invoice/${id}`,
      data.billingType === 'BOLETO' ? `${baseUrl}/__fake/boleto/${id}` : null,
      data.billingType === 'PIX' ? makeId('pix') : null,
      data.billingType === 'PIX' ? `00020126580014br.gov.bcb.pix0136${id}520400005303986540${centsToDecimal(valueCents)}5802BR6014FAKEASAAS` : null
    );

    return this.format(this.db.prepare('SELECT * FROM payments WHERE id = ?').get(id));
  }

  getById(id, accountId) {
    const row = this.db.prepare('SELECT * FROM payments WHERE id = ? AND account_id = ? AND deleted = 0').get(id, accountId);
    return row ? this.format(row) : null;
  }

  // Get by ID without account filter (for simulation endpoints)
  getByIdGlobal(id) {
    const row = this.db.prepare('SELECT * FROM payments WHERE id = ? AND deleted = 0').get(id);
    return row ? this.format(row) : null;
  }

  updateSplits(id, accountId, splits) {
    this.db.prepare("UPDATE payments SET splits = ?, updated_at = datetime('now') WHERE id = ? AND account_id = ?")
      .run(JSON.stringify(splits), id, accountId);
    return this.getById(id, accountId);
  }

  getByInstallment(accountId, installmentId, { offset = 0, limit = 10 } = {}) {
    const total = this.db.prepare(
      'SELECT COUNT(*) as count FROM payments WHERE account_id = ? AND installment_id = ? AND deleted = 0'
    ).get(accountId, installmentId).count;

    const rows = this.db.prepare(
      'SELECT * FROM payments WHERE account_id = ? AND installment_id = ? AND deleted = 0 ORDER BY installment_number LIMIT ? OFFSET ?'
    ).all(accountId, installmentId, limit, offset);

    return { data: rows.map(r => this.format(r)), totalCount: total };
  }

  list(accountId, { offset = 0, limit = 10, status, billingType, customer } = {}) {
    let where = 'account_id = ? AND deleted = 0';
    const params = [accountId];

    if (status) { where += ' AND status = ?'; params.push(status); }
    if (billingType) { where += ' AND billing_type = ?'; params.push(billingType); }
    if (customer) { where += ' AND customer_id = ?'; params.push(customer); }

    const total = this.db.prepare(`SELECT COUNT(*) as count FROM payments WHERE ${where}`).get(...params).count;
    params.push(limit, offset);
    const rows = this.db.prepare(`SELECT * FROM payments WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params);

    return { data: rows.map(r => this.format(r)), totalCount: total };
  }

  receiveInCash(id, accountId, data) {
    const payment = this.db.prepare('SELECT * FROM payments WHERE id = ? AND account_id = ?').get(id, accountId);
    if (!payment) return null;

    const paymentDate = data.paymentDate || new Date().toISOString().split('T')[0];
    const value = data.value ? decimalToCents(data.value) : payment.value;

    this.db.prepare(`
      UPDATE payments SET status = 'RECEIVED_IN_CASH', received_in_cash = 1,
        payment_date = ?, client_payment_date = ?, value = ?, updated_at = datetime('now')
      WHERE id = ? AND account_id = ?
    `).run(paymentDate, paymentDate, value, id, accountId);

    // Credit wallet with movement
    this.walletService.credit(
      accountId, value,
      `Recebido em dinheiro ${id} - R$ ${centsToDecimal(value)}`,
      'PAYMENT', id
    );

    return this.getById(id, accountId);
  }

  updateStatus(id, status, extraFields = {}) {
    const sets = ["status = ?", "updated_at = datetime('now')"];
    const params = [status];

    if (extraFields.paymentDate) {
      sets.push('payment_date = ?');
      params.push(extraFields.paymentDate);
    }
    if (extraFields.clientPaymentDate) {
      sets.push('client_payment_date = ?');
      params.push(extraFields.clientPaymentDate);
    }
    if (extraFields.confirmedDate) {
      sets.push('confirmed_date = ?');
      params.push(extraFields.confirmedDate);
    }

    params.push(id);
    this.db.prepare(`UPDATE payments SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  }

  getRaw(id) {
    return this.db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
  }

  format(row) {
    if (!row) return null;
    return {
      object: 'payment',
      id: row.id,
      dateCreated: row.date_created || row.created_at,
      customer: row.customer_id,
      billingType: row.billing_type,
      status: row.status,
      value: centsToDecimal(row.value),
      netValue: centsToDecimal(row.net_value),
      originalValue: centsToDecimal(row.original_value),
      dueDate: row.due_date,
      originalDueDate: row.original_due_date,
      description: row.description,
      externalReference: row.external_reference,
      installment: row.installment_id,
      installmentNumber: row.installment_number,
      installmentCount: row.installment_count,
      discount: {
        value: centsToDecimal(row.discount_value),
        type: row.discount_type,
        dueDateLimitDays: row.discount_due_date_limit_days,
      },
      interest: { value: centsToDecimal(row.interest_value) },
      fine: { value: centsToDecimal(row.fine_value) },
      split: row.splits ? JSON.parse(row.splits) : null,
      invoiceUrl: row.invoice_url,
      bankSlipUrl: row.bank_slip_url,
      invoiceNumber: row.invoice_number,
      pixQrCodeId: row.pix_qr_code_id,
      pixCopyAndPaste: row.pix_copy_and_paste,
      confirmedDate: row.confirmed_date,
      paymentDate: row.payment_date,
      clientPaymentDate: row.client_payment_date,
      receivedInCash: !!row.received_in_cash,
      deleted: !!row.deleted,
    };
  }
}
