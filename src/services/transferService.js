import { makeId } from '../helpers/ids.js';
import { centsToDecimal, decimalToCents } from '../models/responses.js';

export class TransferService {
  constructor(db, walletService) {
    this.db = db;
    this.walletService = walletService;
  }

  create(sourceAccountId, data) {
    const id = makeId('trf');
    const value = decimalToCents(data.value);

    const targetAccount = data.walletId
      ? this.db.prepare('SELECT * FROM accounts WHERE id = ?').get(data.walletId)
      : null;

    this.db.transaction(() => {
      // Debit source
      this.walletService.debit(
        sourceAccountId, value,
        `Transferência enviada → ${data.walletId || 'externo'} (${id})`,
        'TRANSFER', id
      );

      // Credit target if internal
      if (targetAccount) {
        this.walletService.credit(
          targetAccount.id, value,
          `Transferência recebida ← ${sourceAccountId} (${id})`,
          'TRANSFER', id
        );
      }

      this.db.prepare(`
        INSERT INTO transfers (id, source_account_id, target_wallet_id, target_account_id, value, description, operation_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, sourceAccountId,
        data.walletId || null,
        targetAccount ? targetAccount.id : null,
        value,
        data.description || null,
        targetAccount ? 'INTERNAL' : 'EXTERNAL'
      );
    })();

    return this.format(this.db.prepare('SELECT * FROM transfers WHERE id = ?').get(id));
  }

  getBalance(accountId) {
    const account = this.db.prepare('SELECT wallet_balance FROM accounts WHERE id = ?').get(accountId);
    return {
      object: 'balance',
      totalBalance: centsToDecimal(account?.wallet_balance || 0),
    };
  }

  format(row) {
    if (!row) return null;
    return {
      object: 'transfer',
      id: row.id,
      value: centsToDecimal(row.value),
      status: row.status,
      description: row.description,
      operationType: row.operation_type,
      walletId: row.target_wallet_id,
      dateCreated: row.created_at,
    };
  }
}
