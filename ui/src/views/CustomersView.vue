<script setup>
import { ref, watch } from 'vue'
import { useApi } from '../composables/useApi.js'
import DataTable from '../components/DataTable.vue'

const props = defineProps(['selectedAccount'])
const { getCustomers, loading } = useApi()

const customers = ref([])

const columns = [
  { key: 'name', label: 'Nome' },
  { key: 'id', label: 'ID' },
  { key: 'cpfCnpj', label: 'CPF/CNPJ' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Telefone' },
]

watch(() => props.selectedAccount, async (account) => {
  if (account) {
    const result = await getCustomers(account.id)
    customers.value = result.data || []
  }
}, { immediate: true })
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Clientes</h2>
      <p class="text-sm text-gray-500 mt-1">
        <template v-if="selectedAccount">
          Clientes da conta <strong>{{ selectedAccount.name }}</strong>
        </template>
        <template v-else>Selecione uma conta na aba "Contas" para ver os clientes</template>
      </p>
    </div>

    <div v-if="!selectedAccount" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
      Selecione uma conta primeiro.
    </div>

    <DataTable v-else :columns="columns" :rows="customers" :loading="loading">
      <template #id="{ value }">
        <code class="text-xs bg-gray-100 px-1 py-0.5 rounded">{{ value }}</code>
      </template>
    </DataTable>
  </div>
</template>
