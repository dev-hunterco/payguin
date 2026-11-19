import { makeId } from '../helpers/ids.js';

export class CustomerService {
  constructor(db) {
    this.db = db;
  }

  create(accountId, data) {
    // If cpfCnpj is provided, check if customer already exists for this account - update if so
    if (data.cpfCnpj) {
      const existing = this.db.prepare(
        'SELECT * FROM customers WHERE account_id = ? AND cpf_cnpj = ?'
      ).get(accountId, data.cpfCnpj);

      if (existing) {
        return this.update(existing.id, accountId, data);
      }
    }

    const id = makeId('cus');
    this.db.prepare(`
      INSERT INTO customers (id, account_id, name, cpf_cnpj, email, phone, mobile_phone,
        address, address_number, province, complement, postal_code, city_name, state,
        person_type, additional_emails, external_reference, notification_disabled, observations, group_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, accountId,
      data.name,
      data.cpfCnpj || null,
      data.email || null,
      data.phone || null,
      data.mobilePhone || null,
      data.address || null,
      data.addressNumber || null,
      data.province || null,
      data.complement || null,
      data.postalCode || null,
      data.cityName || null,
      data.state || null,
      data.personType || (data.cpfCnpj && data.cpfCnpj.length > 11 ? 'JURIDICA' : 'FISICA'),
      data.additionalEmails || null,
      data.externalReference || null,
      data.notificationDisabled ? 1 : 0,
      data.observations || null,
      data.groupName || null
    );

    return this.format(this.db.prepare('SELECT * FROM customers WHERE id = ?').get(id));
  }

  update(id, accountId, data) {
    const fields = [];
    const values = [];

    const mappings = {
      name: 'name', cpfCnpj: 'cpf_cnpj', email: 'email', phone: 'phone',
      mobilePhone: 'mobile_phone', address: 'address', addressNumber: 'address_number',
      province: 'province', complement: 'complement', postalCode: 'postal_code',
      cityName: 'city_name', state: 'state', personType: 'person_type',
      additionalEmails: 'additional_emails', externalReference: 'external_reference',
      observations: 'observations', groupName: 'group_name',
    };

    for (const [key, col] of Object.entries(mappings)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = ?`);
        values.push(data[key]);
      }
    }

    if (data.notificationDisabled !== undefined) {
      fields.push('notification_disabled = ?');
      values.push(data.notificationDisabled ? 1 : 0);
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(id, accountId);
      this.db.prepare(`UPDATE customers SET ${fields.join(', ')} WHERE id = ? AND account_id = ?`).run(...values);
    }

    return this.format(this.db.prepare('SELECT * FROM customers WHERE id = ? AND account_id = ?').get(id, accountId));
  }

  findByCpfCnpj(accountId, cpfCnpj) {
    const rows = this.db.prepare('SELECT * FROM customers WHERE account_id = ? AND cpf_cnpj = ?').all(accountId, cpfCnpj);
    return rows.map(r => this.format(r));
  }

  findById(id, accountId) {
    const row = this.db.prepare('SELECT * FROM customers WHERE id = ? AND account_id = ?').get(id, accountId);
    return row ? this.format(row) : null;
  }

  list(accountId, { offset = 0, limit = 10 } = {}) {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM customers WHERE account_id = ?').get(accountId).count;
    const rows = this.db.prepare('SELECT * FROM customers WHERE account_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(accountId, limit, offset);
    return { data: rows.map(r => this.format(r)), totalCount: total };
  }

  getFiscalInfo(accountId) {
    return {
      object: 'customerFiscalInfo',
      municipalInscription: null,
      stateInscription: null,
      simplesNacional: false,
      rpsSerie: 'IO',
      rpsNumber: 1,
      loteNumber: 1,
      specialTaxRegime: null,
      serviceListItem: null,
    };
  }

  format(row) {
    if (!row) return null;
    return {
      object: 'customer',
      id: row.id,
      dateCreated: row.created_at,
      name: row.name,
      cpfCnpj: row.cpf_cnpj,
      email: row.email,
      phone: row.phone,
      mobilePhone: row.mobile_phone,
      address: row.address,
      addressNumber: row.address_number,
      province: row.province,
      complement: row.complement,
      postalCode: row.postal_code,
      cityName: row.city_name,
      state: row.state,
      country: row.country,
      personType: row.person_type,
      additionalEmails: row.additional_emails,
      externalReference: row.external_reference,
      notificationDisabled: !!row.notification_disabled,
      observations: row.observations,
      groupName: row.group_name,
    };
  }
}
