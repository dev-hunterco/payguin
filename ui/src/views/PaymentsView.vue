<script setup>
import { ref, watch } from 'vue'
import { useApi } from '../composables/useApi.js'
import DataTable from '../components/DataTable.vue'
import StatusBadge from '../components/StatusBadge.vue'

const props = defineProps(['selectedAccount'])
const api = useApi()

const payments = ref([])
const expandedId = ref(null)
const showJsonId = ref(null)

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'customer', label: 'Cliente' },
  { key: 'billingType', label: 'Tipo' },
  { key: 'value', label: 'Valor' },
  { key: 'status', label: 'Status' },
  { key: 'dueDate', label: 'Vencimento' },
  { key: 'description', label: 'Descrição' },
  { key: 'split', label: 'Splits' },
  { key: 'actions', label: 'Ações' },
]

async function loadPayments() {
  if (props.selectedAccount) {
    const result = await api.getPayments(props.selectedAccount.id)
    payments.value = result.data || []
  }
}

watch(() => props.selectedAccount, loadPayments, { immediate: true })

async function simulateAction(action, paymentId) {
  const actions = {
    pay: api.simPayPayment,
    overdue: api.simOverduePayment,
    refund: api.simRefundPayment,
    confirm: api.simConfirmPayment,
  }
  await actions[action](paymentId)
  await loadPayments()
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function toggleJson(id) {
  showJsonId.value = showJsonId.value === id ? null : id
}

function formatCurrency(value) {
  if (value == null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function canSimulate(status, action) {
  const allowed = {
    pay: ['PENDING', 'CONFIRMED'],
    overdue: ['PENDING'],
    refund: ['RECEIVED', 'RECEIVED_IN_CASH', 'CONFIRMED'],
    confirm: ['PENDING'],
  }
  return (allowed[action] || []).includes(status)
}

function splitSummary(split) {
  if (!split || split.length === 0) return null
  return split.length + ' split' + (split.length > 1 ? 's' : '')
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Cobranças</h2>
      <p class="text-sm text-gray-500 mt-1">
        <template v-if="selectedAccount">
          Cobranças da conta <strong>{{ selectedAccount.name }}</strong>
        </template>
        <template v-else>Selecione uma conta na aba "Contas"</template>
      </p>
    </div>

    <div v-if="!selectedAccount" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
      Selecione uma conta primeiro.
    </div>

    <div v-else class="space-y-2">
      <div v-if="api.loading.value" class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
        Carregando...
      </div>
      <div v-else-if="payments.length === 0" class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
        Nenhuma cobrança encontrada
      </div>
      <div
        v-for="pay in payments"
        :key="pay.id"
        class="bg-white shadow rounded-lg overflow-hidden"
      >
        <!-- Main row -->
        <div class="px-4 py-3 flex items-center gap-4 hover:bg-gray-50 cursor-pointer" @click="toggleExpand(pay.id)">
          <div class="flex-shrink-0 w-5 text-gray-400 text-xs">
            {{ expandedId === pay.id ? '▼' : '▶' }}
          </div>
          <code class="text-xs bg-gray-100 px-1 py-0.5 rounded flex-shrink-0">{{ pay.id }}</code>
          <span v-if="pay.customerName" class="text-sm text-gray-700 truncate max-w-[180px]">{{ pay.customerName }}</span>
          <span class="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded flex-shrink-0">{{ pay.billingType }}</span>
          <StatusBadge :status="pay.status" />
          <span class="font-medium text-sm">{{ formatCurrency(pay.value) }}</span>
          <span class="text-xs text-gray-500">venc. {{ pay.dueDate }}</span>
          <span v-if="pay.description" class="text-xs text-gray-400 truncate">{{ pay.description }}</span>
          <span v-if="splitSummary(pay.split)" class="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded flex-shrink-0">
            {{ splitSummary(pay.split) }}
          </span>
          <div class="ml-auto flex gap-1 flex-shrink-0" @click.stop>
            <button
              v-if="canSimulate(pay.status, 'pay')"
              @click="simulateAction('pay', pay.id)"
              class="px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded"
            >
              Pagar
            </button>
            <button
              v-if="canSimulate(pay.status, 'confirm')"
              @click="simulateAction('confirm', pay.id)"
              class="px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
            >
              Confirmar
            </button>
            <button
              v-if="canSimulate(pay.status, 'overdue')"
              @click="simulateAction('overdue', pay.id)"
              class="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded"
            >
              Vencer
            </button>
            <button
              v-if="canSimulate(pay.status, 'refund')"
              @click="simulateAction('refund', pay.id)"
              class="px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded"
            >
              Estornar
            </button>
          </div>
        </div>

        <!-- Expanded details -->
        <div v-if="expandedId === pay.id" class="border-t border-gray-100 bg-gray-50 px-4 py-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-gray-500 text-xs block">Cliente</span>
              <span v-if="pay.customerName" class="text-sm font-medium">{{ pay.customerName }}</span>
              <code class="text-xs block">{{ pay.customer }}</code>
            </div>
            <div>
              <span class="text-gray-500 text-xs block">Valor Original</span>
              {{ formatCurrency(pay.originalValue) }}
            </div>
            <div>
              <span class="text-gray-500 text-xs block">Valor Líquido</span>
              {{ formatCurrency(pay.netValue) }}
            </div>
            <div>
              <span class="text-gray-500 text-xs block">Data Criação</span>
              {{ pay.dateCreated }}
            </div>
            <div v-if="pay.paymentDate">
              <span class="text-gray-500 text-xs block">Data Pagamento</span>
              {{ pay.paymentDate }}
            </div>
            <div v-if="pay.confirmedDate">
              <span class="text-gray-500 text-xs block">Data Confirmação</span>
              {{ pay.confirmedDate }}
            </div>
            <div v-if="pay.externalReference">
              <span class="text-gray-500 text-xs block">Ref. Externa</span>
              <code class="text-xs">{{ pay.externalReference }}</code>
            </div>
            <div v-if="pay.installment">
              <span class="text-gray-500 text-xs block">Parcela</span>
              {{ pay.installmentNumber }}/{{ pay.installmentCount }}
            </div>
            <div v-if="pay.invoiceUrl">
              <span class="text-gray-500 text-xs block">Invoice URL</span>
              <code class="text-xs break-all">{{ pay.invoiceUrl }}</code>
            </div>
            <div v-if="pay.bankSlipUrl">
              <span class="text-gray-500 text-xs block">Boleto URL</span>
              <code class="text-xs break-all">{{ pay.bankSlipUrl }}</code>
            </div>
            <div v-if="pay.pixCopyAndPaste">
              <span class="text-gray-500 text-xs block">PIX Copia e Cola</span>
              <code class="text-xs break-all">{{ pay.pixCopyAndPaste }}</code>
            </div>
          </div>

          <!-- Splits -->
          <div v-if="pay.split && pay.split.length > 0" class="mt-4">
            <h4 class="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Splits</h4>
            <div class="bg-white rounded border border-gray-200 divide-y divide-gray-100">
              <div v-for="(s, i) in pay.split" :key="i" class="px-3 py-2 flex items-center gap-4 text-sm">
                <span class="text-gray-400 text-xs w-6">#{{ i + 1 }}</span>
                <div>
                  <span class="text-gray-500 text-xs">Wallet:</span>
                  <span v-if="s.walletName" class="text-sm font-medium ml-1">{{ s.walletName }}</span>
                  <code class="text-xs ml-1 text-gray-400">{{ s.walletId }}</code>
                </div>
                <div v-if="s.fixedValue != null">
                  <span class="text-gray-500 text-xs">Valor fixo:</span>
                  <span class="font-medium text-sm ml-1">{{ formatCurrency(s.fixedValue) }}</span>
                </div>
                <div v-if="s.percentualValue != null">
                  <span class="text-gray-500 text-xs">Percentual:</span>
                  <span class="font-medium text-sm ml-1">{{ s.percentualValue }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- JSON toggle -->
          <div class="mt-4">
            <button
              @click="toggleJson(pay.id)"
              class="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {{ showJsonId === pay.id ? 'Ocultar JSON' : 'Ver JSON completo' }}
            </button>
            <pre
              v-if="showJsonId === pay.id"
              class="mt-2 bg-gray-900 text-green-400 text-xs rounded-lg p-4 overflow-x-auto max-h-80"
            >{{ JSON.stringify(pay, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
