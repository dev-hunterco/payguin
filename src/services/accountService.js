import { makeId } from '../helpers/ids.js';
import { nanoid } from 'nanoid';
import { centsToDecimal } from '../models/responses.js';

export class AccountService {
  constructor(db) {
    this.db = db;
  }

  create(data) {
    const id = makeId('acct');
    const apiKey = `aact_${nanoid(32)}`;

    this.db.prepare(`
      INSERT INTO accounts (id, api_key, name, email, cpf_cnpj, company_type, phone, mobile_phone,
        address, address_number, province, complement, postal_code, city_name, state)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, apiKey,
      data.name || 'Subconta',
      data.email || null,
      data.cpfCnpj || null,
      data.companyType || null,
      data.phone || null,
      data.mobilePhone || null,
      data.address || null,
      data.addressNumber || null,
      data.province || null,
      data.complement || null,
      data.postalCode || null,
      data.cityName || null,
      data.state || null
    );

    return this.formatAccount(this.db.prepare('SELECT * FROM accounts WHERE id = ?').get(id), true);
  }

  getCommercialInfo(accountId) {
    const account = this.db.prepare('SELECT * FROM accounts WHERE id = ?').get(accountId);
    return {
      object: 'commercialInfo',
      ...this.formatAccount(account),
    };
  }

  getWallets(accountId) {
    const account = this.db.prepare('SELECT * FROM accounts WHERE id = ?').get(accountId);
    return [{
      object: 'wallet',
      id: account.id,
      balance: centsToDecimal(account.wallet_balance),
    }];
  }

  getBanks() {
    return [
      { code: '001', name: 'Banco do Brasil' },
      { code: '033', name: 'Santander' },
      { code: '104', name: 'Caixa Econômica Federal' },
      { code: '237', name: 'Bradesco' },
      { code: '341', name: 'Itaú Unibanco' },
      { code: '356', name: 'Banco Real' },
      { code: '389', name: 'Banco Mercantil do Brasil' },
      { code: '399', name: 'HSBC' },
      { code: '422', name: 'Banco Safra' },
      { code: '453', name: 'Banco Rural' },
      { code: '633', name: 'Banco Rendimento' },
      { code: '652', name: 'Itaú Unibanco Holding' },
      { code: '745', name: 'Citibank' },
    ];
  }

  getAll() {
    const accounts = this.db.prepare('SELECT * FROM accounts ORDER BY created_at DESC').all();
    return accounts.map(a => this.formatAccount(a, true));
  }

  formatAccount(account, includeApiKey = false) {
    if (!account) return null;
    const result = {
      object: 'account',
      id: account.id,
      name: account.name,
      email: account.email,
      cpfCnpj: account.cpf_cnpj,
      companyType: account.company_type,
      phone: account.phone,
      mobilePhone: account.mobile_phone,
      address: account.address,
      addressNumber: account.address_number,
      province: account.province,
      complement: account.complement,
      postalCode: account.postal_code,
      cityName: account.city_name,
      state: account.state,
      country: account.country,
      walletBalance: centsToDecimal(account.wallet_balance),
      dateCreated: account.created_at,
    };
    if (includeApiKey) {
      result.apiKey = account.api_key;
      result.walletId = account.id;
    }
    return result;
  }
}
