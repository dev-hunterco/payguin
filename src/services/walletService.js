import { makeId } from '../helpers/ids.js';
import { centsToDecimal, decimalToCents } from '../models/responses.js';

export class WalletService {
  constructor(db) {
    this.db = db;
  }

  credit(accountId, valueCents, description, referenceType = null, referenceId = null) {
    return this.db.transaction(() => {
      this.db.prepare('UPDATE accounts SET wallet_balance = wallet_balance + ? WHERE id = ?')
        .run(valueCents, accountId);

      const account = this.db.prepare('SELECT wallet_balance FROM accounts WHERE id = ?').get(accountId);

      const id = makeId('mov');
      this.db.prepare(`
        INSERT INTO wallet_movements (id, account_id, type, value, balance_after, description, reference_type, reference_id)
        VALUES (?, ?, 'CREDIT', ?, ?, ?, ?, ?)
      `).run(id, accountId, valueCents, account.wallet_balance, description, referenceType, referenceId);

      return { id, balanceAfter: account.wallet_balance };
    })();
  }

  debit(accountId, valueCents, description, referenceType = null, referenceId = null) {
    return this.db.transaction(() => {
      this.db.prepare('UPDATE accounts SET wallet_balance = wallet_balance - ? WHERE id = ?')
        .run(valueCents, accountId);

      const account = this.db.prepare('SELECT wallet_balance FROM accounts WHERE id = ?').get(accountId);

      const id = makeId('mov');
      this.db.prepare(`
        INSERT INTO wallet_movements (id, account_id, type, value, balance_after, description, reference_type, reference_id)
        VALUES (?, ?, 'DEBIT', ?, ?, ?, ?, ?)
      `).run(id, accountId, valueCents, account.wallet_balance, description, referenceType, referenceId);

      return { id, balanceAfter: account.wallet_balance };
    })();
  }

  addManualBalance(accountId, valueDecimal, description) {
    const valueCents = decimalToCents(valueDecimal);
    return this.credit(accountId, valueCents, description || 'Crédito manual', 'MANUAL', null);
  }

  getStatement(accountId, { offset = 0, limit = 50 } = {}) {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM wallet_movements WHERE account_id = ?')
      .get(accountId).count;

    const rows = this.db.prepare(
      'SELECT * FROM wallet_movements WHERE account_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?'
    ).all(accountId, limit, offset);

    return {
      data: rows.map(r => this.format(r)),
      totalCount: total,
    };
  }

  format(row) {
    return {
      id: row.id,
      type: row.type,
      value: centsToDecimal(row.value),
      balanceAfter: centsToDecimal(row.balance_after),
      description: row.description,
      referenceType: row.reference_type,
      referenceId: row.reference_id,
      dateCreated: row.created_at,
    };
  }
}
