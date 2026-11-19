<script setup>
import { ref, watch } from 'vue'
import { useApi } from '../composables/useApi.js'
import DataTable from '../components/DataTable.vue'
import StatusBadge from '../components/StatusBadge.vue'

const props = defineProps(['selectedAccount'])
const api = useApi()

const invoices = ref([])

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'value', label: 'Valor' },
  { key: 'status', label: 'Status' },
  { key: 'serviceDescription', label: 'Descrição Serviço' },
  { key: 'effectiveDate', label: 'Data Efetiva' },
  { key: 'number', label: 'Número NF' },
  { key: 'actions', label: 'Ações' },
]

async function loadInvoices() {
  if (props.selectedAccount) {
    const result = await api.getInvoices(props.selectedAccount.id)
    invoices.value = result.data || []
  }
}

watch(() => props.selectedAccount, loadInvoices, { immediate: true })

async function simulateAction(action, invoiceId) {
  const actions = {
    authorize: api.simAuthorizeInvoice,
    error: api.simErrorInvoice,
  }
  await actions[action](invoiceId)
  await loadInvoices()
}

function formatCurrency(value) {
  if (value == null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Notas Fiscais</h2>
      <p class="text-sm text-gray-500 mt-1">
        <template v-if="selectedAccount">
          Notas fiscais da conta <strong>{{ selectedAccount.name }}</strong>
        </template>
        <template v-else>Selecione uma conta na aba "Contas"</template>
      </p>
    </div>

    <div v-if="!selectedAccount" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
      Selecione uma conta primeiro.
    </div>

    <DataTable v-else :columns="columns" :rows="invoices" :loading="api.loading.value">
      <template #id="{ value }">
        <code class="text-xs bg-gray-100 px-1 py-0.5 rounded">{{ value }}</code>
      </template>
      <template #value="{ value }">
        <span class="font-medium">{{ formatCurrency(value) }}</span>
      </template>
      <template #status="{ value }">
        <StatusBadge :status="value" />
      </template>
      <template #actions="{ row }">
        <div class="flex gap-1">
          <button
            v-if="row.status === 'SCHEDULED'"
            @click="simulateAction('authorize', row.id)"
            class="px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded"
          >
            Autorizar
          </button>
          <button
            v-if="row.status === 'SCHEDULED'"
            @click="simulateAction('error', row.id)"
            class="px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded"
          >
            Simular Erro
          </button>
        </div>
      </template>
    </DataTable>
  </div>
</template>
