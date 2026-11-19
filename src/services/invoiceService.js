import { makeId } from '../helpers/ids.js';
import { centsToDecimal, decimalToCents } from '../models/responses.js';

export class InvoiceService {
  constructor(db) {
    this.db = db;
  }

  create(accountId, data) {
    const id = makeId('inv');
    const value = decimalToCents(data.value);

    this.db.prepare(`
      INSERT INTO invoices (id, account_id, payment_id, customer_id, service_description,
        observations, value, deductions, effective_date, external_reference, iss_retained,
        municipal_service_id, municipal_service_code, municipal_service_name, taxes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, accountId,
      data.payment || null,
      data.customer || null,
      data.serviceDescription || null,
      data.observations || null,
      value,
      decimalToCents(data.deductions) || 0,
      data.effectiveDate || new Date().toISOString().split('T')[0],
      data.externalReference || null,
      data.issRetained ? 1 : 0,
      data.municipalServiceId || null,
      data.municipalServiceCode || null,
      data.municipalServiceName || null,
      data.taxes ? JSON.stringify(data.taxes) : null
    );

    return this.format(this.db.prepare('SELECT * FROM invoices WHERE id = ?').get(id));
  }

  getById(id, accountId) {
    const row = this.db.prepare('SELECT * FROM invoices WHERE id = ? AND account_id = ?').get(id, accountId);
    return row ? this.format(row) : null;
  }

  getByIdGlobal(id) {
    const row = this.db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    return row ? this.format(row) : null;
  }

  list(accountId, { offset = 0, limit = 10, status } = {}) {
    let where = 'account_id = ?';
    const params = [accountId];

    if (status) { where += ' AND status = ?'; params.push(status); }

    const total = this.db.prepare(`SELECT COUNT(*) as count FROM invoices WHERE ${where}`).get(...params).count;
    params.push(limit, offset);
    const rows = this.db.prepare(`SELECT * FROM invoices WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params);

    return { data: rows.map(r => this.format(r)), totalCount: total };
  }

  getMunicipalServices() {
    return [
      { id: '1', code: '01.01', description: 'Análise e desenvolvimento de sistemas' },
      { id: '2', code: '01.02', description: 'Programação' },
      { id: '3', code: '01.03', description: 'Processamento de dados e congêneres' },
      { id: '4', code: '01.04', description: 'Elaboração de programas de computadores' },
      { id: '5', code: '01.05', description: 'Licenciamento ou cessão de direito de uso de programas de computação' },
      { id: '6', code: '01.06', description: 'Assessoria e consultoria em informática' },
      { id: '7', code: '01.07', description: 'Suporte técnico em informática' },
      { id: '8', code: '01.08', description: 'Planejamento, confecção, manutenção e atualização de páginas eletrônicas' },
      { id: '9', code: '07.01', description: 'Engenharia, agronomia e congêneres' },
      { id: '10', code: '17.01', description: 'Assessoria ou consultoria de qualquer natureza' },
    ];
  }

  updateStatus(id, status) {
    const now = new Date().toISOString();
    const sets = ["status = ?", "updated_at = ?"];
    const params = [status, now];

    if (status === 'AUTHORIZED') {
      sets.push("number = ?");
      params.push(`NF-${Date.now()}`);
      sets.push("pdf_url = ?");
      params.push(`http://localhost:${8787}/__fake/nfse/${id}.pdf`);
      sets.push("xml_url = ?");
      params.push(`http://localhost:${8787}/__fake/nfse/${id}.xml`);
    }

    params.push(id);
    this.db.prepare(`UPDATE invoices SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  }

  format(row) {
    if (!row) return null;
    return {
      object: 'invoice',
      id: row.id,
      status: row.status,
      type: row.type,
      payment: row.payment_id,
      customer: row.customer_id,
      serviceDescription: row.service_description,
      observations: row.observations,
      value: centsToDecimal(row.value),
      deductions: centsToDecimal(row.deductions),
      effectiveDate: row.effective_date,
      externalReference: row.external_reference,
      issRetained: !!row.iss_retained,
      municipalServiceId: row.municipal_service_id,
      municipalServiceCode: row.municipal_service_code,
      municipalServiceName: row.municipal_service_name,
      taxes: row.taxes ? JSON.parse(row.taxes) : null,
      number: row.number,
      rpsSerie: row.rpsSerie,
      rpsNumber: row.rpsNumber,
      pdfUrl: row.pdf_url,
      xmlUrl: row.xml_url,
      dateCreated: row.created_at,
    };
  }
}
