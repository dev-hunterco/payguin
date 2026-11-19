<script setup>
import { useApi } from '../composables/useApi.js'

const props = defineProps(['currentView', 'selectedAccount', 'accounts'])
const emit = defineEmits(['navigate', 'selectAccount'])

const { simReset } = useApi()

const navItems = [
  { id: 'accounts', label: 'Contas', icon: '🏦' },
  { id: 'customers', label: 'Clientes', icon: '👤' },
  { id: 'payments', label: 'Cobranças', icon: '💰' },
  { id: 'invoices', label: 'Notas Fiscais', icon: '📄' },
  { id: 'webhooks', label: 'Webhooks', icon: '🔗' },
  { id: 'statement', label: 'Extrato', icon: '📊' },
]

function handleAccountChange(event) {
  const accountId = event.target.value
  if (!accountId) return
  const account = props.accounts.find(a => a.id === accountId)
  if (account) emit('selectAccount', account)
}

async function handleReset() {
  if (confirm('Tem certeza? Isso vai apagar TODOS os dados.')) {
    await simReset()
    window.location.reload()
  }
}
</script>

<template>
  <aside class="w-64 bg-gray-900 text-white flex flex-col">
    <div class="p-4 border-b border-gray-700">
      <h1 class="text-lg font-bold">PayGuin 🐧</h1>
      <p class="text-xs text-gray-400 mt-1">Flightless Asaas</p>
    </div>

    <div class="px-4 py-3 bg-gray-800 border-b border-gray-700">
      <label class="text-[10px] uppercase tracking-wider text-gray-500 block mb-1.5">Conta ativa</label>
      <select
        :value="selectedAccount?.id || ''"
        @change="handleAccountChange"
        class="w-full bg-gray-700 text-white text-sm rounded px-2 py-1.5 border border-gray-600 focus:outline-none focus:border-indigo-500"
      >
        <option value="" disabled>Selecione uma conta...</option>
        <option v-for="account in accounts" :key="account.id" :value="account.id">
          {{ account.name }}
        </option>
      </select>
      <div v-if="selectedAccount" class="mt-1.5 text-gray-500 font-mono truncate text-[10px]">
        {{ selectedAccount.id }}
      </div>
    </div>

    <nav class="flex-1 py-4">
      <button
        v-for="item in navItems"
        :key="item.id"
        @click="emit('navigate', item.id)"
        :class="[
          'w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition-colors',
          currentView === item.id
            ? 'bg-gray-700 text-white'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        ]"
      >
        <span>{{ item.icon }}</span>
        {{ item.label }}
      </button>
    </nav>

    <div class="p-4 border-t border-gray-700">
      <button
        @click="handleReset"
        class="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
      >
        Reset Database
      </button>
    </div>
  </aside>
</template>
