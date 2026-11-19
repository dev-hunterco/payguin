<script setup>
import { ref, watch } from 'vue'
import { useApi } from '../composables/useApi.js'
import DataTable from '../components/DataTable.vue'

const props = defineProps(['selectedAccount'])
const api = useApi()

const movements = ref([])
const currentBalance = ref(null)
const showAddBalance = ref(false)
const balanceForm = ref({ value: '', description: '' })

const columns = [
  { key: 'dateCreated', label: 'Data' },
  { key: 'type', label: 'Tipo' },
  { key: 'value', label: 'Valor' },
  { key: 'balanceAfter', label: 'Saldo Após' },
  { key: 'description', label: 'Descrição' },
  { key: 'referenceType', label: 'Origem' },
  { key: 'referenceId', label: 'Referência' },
]

async function loadStatement() {
  if (props.selectedAccount) {
    const result = await api.getStatement(props.selectedAccount.id)
    movements.value = result.data || []
    currentBalance.value = movements.value.length > 0 ? movements.value[movements.value.length - 1].balanceAfter : 0
  }
}

watch(() => props.selectedAccount, loadStatement, { immediate: true })

async function handleAddBalance() {
  const value = parseFloat(balanceForm.value.value)
  if (!value || value <= 0) return
  await api.addBalance(props.selectedAccount.id, {
    value,
    description: balanceForm.value.description || 'Crédito manual',
  })
  balanceForm.value = { value: '', description: '' }
  showAddBalance.value = false
  await loadStatement()
}

function formatCurrency(value) {
  if (value == null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('pt-BR')
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Extrato</h2>
        <p class="text-sm text-gray-500 mt-1">
          <template v-if="selectedAccount">
            Movimentações da conta <strong>{{ selectedAccount.name }}</strong>
          </template>
          <template v-else>Selecione uma conta para ver o extrato</template>
        </p>
      </div>
      <button
        v-if="selectedAccount"
        @click="showAddBalance = !showAddBalance"
        class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {{ showAddBalance ? 'Cancelar' : '+ Adicionar Saldo' }}
      </button>
    </div>

    <div v-if="selectedAccount && currentBalance !== null" class="bg-white shadow rounded-lg p-6 mb-6 flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-500">Saldo atual</p>
        <p :class="[currentBalance >= 0 ? 'text-green-600' : 'text-red-600', 'text-3xl font-bold']">
          {{ formatCurrency(currentBalance) }}
        </p>
      </div>
      <div class="text-right text-xs text-gray-400">
        {{ movements.length }} movimentação{{ movements.length !== 1 ? 'ões' : '' }}
      </div>
    </div>

    <div v-if="!selectedAccount" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
      Selecione uma conta primeiro.
    </div>

    <template v-else>
      <div v-if="showAddBalance" class="bg-white shadow rounded-lg p-6 mb-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Adicionar Saldo</h3>
        <form @submit.prevent="handleAddBalance" class="flex gap-4 items-end">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
            <input
              v-model="balanceForm.value"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0,00"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div class="flex-[2]">
            <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              v-model="balanceForm.description"
              type="text"
              placeholder="Crédito manual"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <button
            type="submit"
            class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Creditar
          </button>
        </form>
      </div>

      <DataTable :columns="columns" :rows="movements" :loading="api.loading.value" empty-message="Nenhuma movimentação encontrada">
        <template #dateCreated="{ value }">
          <span class="text-xs text-gray-500">{{ formatDate(value) }}</span>
        </template>
        <template #type="{ value }">
          <span
            :class="[
              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
              value === 'CREDIT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            ]"
          >
            {{ value === 'CREDIT' ? 'Crédito' : 'Débito' }}
          </span>
        </template>
        <template #value="{ row }">
          <span :class="row.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'" class="font-medium">
            {{ row.type === 'CREDIT' ? '+' : '-' }}{{ formatCurrency(row.value) }}
          </span>
        </template>
        <template #balanceAfter="{ value }">
          <span class="font-medium">{{ formatCurrency(value) }}</span>
        </template>
        <template #referenceType="{ value }">
          <span v-if="value" class="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{{ value }}</span>
        </template>
        <template #referenceId="{ value }">
          <code v-if="value" class="text-xs bg-gray-100 px-1 py-0.5 rounded">{{ value }}</code>
        </template>
      </DataTable>
    </template>
  </div>
</template>
