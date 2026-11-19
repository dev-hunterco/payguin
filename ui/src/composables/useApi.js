import { ref } from 'vue'

const API_BASE = '/__admin/api'
const SIM_BASE = '/__sim'

export function useApi() {
  const loading = ref(false)
  const error = ref(null)

  async function fetchJson(url, options = {}) {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.errors?.[0]?.description || 'Request failed')
      return data
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Admin API
  const getAccounts = () => fetchJson(`${API_BASE}/accounts`)
  const createAccount = (data) => fetchJson(`${API_BASE}/accounts`, { method: 'POST', body: JSON.stringify(data) })
  const deleteAccount = (accountId) => fetchJson(`${API_BASE}/accounts/${accountId}`, { method: 'DELETE' })
  const addBalance = (accountId, data) => fetchJson(`${API_BASE}/accounts/${accountId}/balance`, { method: 'POST', body: JSON.stringify(data) })
  const getStatement = (accountId) => fetchJson(`${API_BASE}/accounts/${accountId}/statement`)
  const getCustomers = (accountId) => fetchJson(`${API_BASE}/accounts/${accountId}/customers`)
  const getPayments = (accountId) => fetchJson(`${API_BASE}/accounts/${accountId}/payments`)
  const getInvoices = (accountId) => fetchJson(`${API_BASE}/accounts/${accountId}/invoices`)
  const getWebhooks = (accountId) => fetchJson(`${API_BASE}/accounts/${accountId}/webhooks`)
  const createWebhook = (accountId, data) => fetchJson(`${API_BASE}/accounts/${accountId}/webhooks`, { method: 'POST', body: JSON.stringify(data) })
  const updateWebhook = (id, accountId, data) => fetchJson(`${API_BASE}/webhooks/${id}`, { method: 'PUT', body: JSON.stringify({ ...data, accountId }) })
  const deleteWebhook = (id, accountId) => fetchJson(`${API_BASE}/webhooks/${id}?accountId=${accountId}`, { method: 'DELETE' })
  const getWebhookLog = (accountId) => fetchJson(`${API_BASE}/webhook-log${accountId ? `?accountId=${accountId}` : ''}`)

  // Simulation API
  const simPayPayment = (id) => fetchJson(`${SIM_BASE}/payments/${id}/pay`, { method: 'POST' })
  const simOverduePayment = (id) => fetchJson(`${SIM_BASE}/payments/${id}/overdue`, { method: 'POST' })
  const simRefundPayment = (id) => fetchJson(`${SIM_BASE}/payments/${id}/refund`, { method: 'POST' })
  const simConfirmPayment = (id) => fetchJson(`${SIM_BASE}/payments/${id}/confirm`, { method: 'POST' })
  const simAuthorizeInvoice = (id) => fetchJson(`${SIM_BASE}/invoices/${id}/authorize`, { method: 'POST' })
  const simErrorInvoice = (id) => fetchJson(`${SIM_BASE}/invoices/${id}/error`, { method: 'POST' })
  const simReset = () => fetchJson(`${SIM_BASE}/reset`, { method: 'POST' })
  const simAdvanceTime = (days) => fetchJson(`${SIM_BASE}/time/advance`, { method: 'POST', body: JSON.stringify({ days }) })

  return {
    loading, error,
    getAccounts, createAccount, deleteAccount, addBalance, getStatement, getCustomers, getPayments, getInvoices, getWebhooks, createWebhook, updateWebhook, deleteWebhook, getWebhookLog,
    simPayPayment, simOverduePayment, simRefundPayment, simConfirmPayment,
    simAuthorizeInvoice, simErrorInvoice, simReset, simAdvanceTime,
  }
}
