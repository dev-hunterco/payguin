import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createDatabase(dbPath) {
  // For :memory: we don't need directory creation
  if (dbPath !== ':memory:') {
    const dir = dirname(dbPath);
    mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);

  return db;
}

export function resetDatabase(db) {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'").all();
  db.pragma('foreign_keys = OFF');
  for (const { name } of tables) {
    db.exec(`DELETE FROM "${name}"`);
  }
  db.pragma('foreign_keys = ON');
}

export function resetAccountData(db, accountId) {
  db.pragma('foreign_keys = OFF');
  const tables = ['wallet_movements', 'webhook_log', 'webhook_configs', 'transfers', 'invoices', 'payments', 'customers'];
  for (const table of tables) {
    const col = table === 'transfers' ? 'source_account_id' : 'account_id';
    db.prepare(`DELETE FROM "${table}" WHERE ${col} = ?`).run(accountId);
  }
  db.prepare('DELETE FROM accounts WHERE id = ?').run(accountId);
  db.pragma('foreign_keys = ON');
}
