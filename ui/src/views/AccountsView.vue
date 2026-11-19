<script setup>
import { ref, onMounted } from 'vue'
import { useApi } from '../composables/useApi.js'
import DataTable from '../components/DataTable.vue'

const emit = defineEmits(['selectAccount', 'accountsLoaded'])
const props = defineProps(['selectedAccount'])
const { getAccounts, createAccount, deleteAccount, loading } = useApi()

const accounts = ref([])
const showForm = ref(false)
const form = ref({ name: '', cpfCnpj: '', email: '' })
const copiedField = ref(null)

const columns = [
  { key: 'name', label: 'Nome' },
  { key: 'id', label: 'ID' },
  { key: 'apiKey', label: 'API Key' },
  { key: 'walletId', label: 'Wallet ID' },
  { key: 'cpfCnpj', label: 'CPF/CNPJ' },
  { key: 'walletBalance', label: 'Saldo' },
  { key: 'actions', label: 'Ações' },
]

async function loadAccounts() {
  accounts.value = await getAccounts()
  emit('accountsLoaded', accounts.value)
}

onMounted(loadAccounts)

function selectAccount(account) {
  emit('selectAccount', account)
}

async function handleCreate() {
  await createAccount(form.value)
  form.value = { name: '', cpfCnpj: '', email: '' }
  showForm.value = false
  await loadAccounts()
}

async function copyToClipboard(value, fieldKey) {
  await navigator.clipboard.writeText(value)
  copiedField.value = fieldKey
  setTimeout(() => { copiedField.value = null }, 1500)
}

async function handleDelete(account) {
  if (!confirm(`Excluir a conta "${account.name}"?\n\nIsso vai apagar todos os dados desta conta (clientes, cobranças, webhooks, etc).`)) return
  await deleteAccount(account.id)
  if (props.selectedAccount?.id === account.id) {
    emit('selectAccount', null)
  }
  await loadAccounts()
}

function formatCurrency(value) {
  if (value == null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Contas</h2>
        <p class="text-sm text-gray-500 mt-1">Todas as contas registradas no sistema</p>
      </div>
      <button
        @click="showForm = !showForm"
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {{ showForm ? 'Cancelar' : '+ Nova Conta' }}
      </button>
    </div>

    <div v-if="showForm" class="bg-white shadow rounded-lg p-6 mb-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Criar Nova Conta</h3>
      <form @submit.prevent="handleCreate" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="Nome da conta"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ</label>
          <input
            v-model="form.cpfCnpj"
            type="text"
            placeholder="00.000.000/0001-00"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            v-model="form.email"
            type="email"
            placeholder="email@exemplo.com"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div class="md:col-span-3 flex justify-end">
          <button
            type="submit"
            class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Criar Conta
          </button>
        </div>
      </form>
    </div>

    <DataTable :columns="columns" :rows="accounts" :loading="loading">
      <template #id="{ value }">
        <code class="text-xs bg-gray-100 px-1 py-0.5 rounded">{{ value }}</code>
      </template>
      <template #apiKey="{ row, value }">
        <code
          @click="copyToClipboard(value, 'apiKey-' + row.id)"
          class="text-xs bg-gray-100 px-1 py-0.5 rounded truncate max-w-[200px] block cursor-pointer hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
          :title="value"
        >
          {{ copiedField === 'apiKey-' + row.id ? 'Copiado!' : value }}
        </code>
      </template>
      <template #walletId="{ row }">
        <code
          @click="copyToClipboard(row.walletId, 'walletId-' + row.id)"
          class="text-xs bg-gray-100 px-1 py-0.5 rounded truncate max-w-[200px] block cursor-pointer hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
          :title="row.walletId"
        >
          {{ copiedField === 'walletId-' + row.id ? 'Copiado!' : row.walletId }}
        </code>
      </template>
      <template #walletBalance="{ value }">
        <span :class="value > 0 ? 'text-green-600' : 'text-gray-500'" class="font-medium">
          {{ formatCurrency(value) }}
        </span>
      </template>
      <template #actions="{ row }">
        <div class="flex gap-2">
          <button
            @click="selectAccount(row)"
            class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            Selecionar
          </button>
          <button
            @click="handleDelete(row)"
            class="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            Excluir
          </button>
        </div>
      </template>
    </DataTable>
  </div>
</template>
