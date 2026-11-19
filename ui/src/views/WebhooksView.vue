<script setup>
import { ref, watch } from 'vue'
import { useApi } from '../composables/useApi.js'

const props = defineProps(['selectedAccount'])
const api = useApi()

const webhooks = ref([])
const webhookLog = ref([])
const showLog = ref(false)
const showForm = ref(false)
const form = ref({ name: '', url: '', email: '', authToken: '', sendType: 'NON_REQUIRED' })

async function loadData() {
  if (props.selectedAccount) {
    const result = await api.getWebhooks(props.selectedAccount.id)
    webhooks.value = result.data || []
    const logResult = await api.getWebhookLog(props.selectedAccount.id)
    webhookLog.value = logResult.data || []
  }
}

watch(() => props.selectedAccount, loadData, { immediate: true })

async function handleCreate() {
  await api.createWebhook(props.selectedAccount.id, form.value)
  form.value = { name: '', url: '', email: '', authToken: '', sendType: 'NON_REQUIRED' }
  showForm.value = false
  await loadData()
}

async function toggleEnabled(wh) {
  await api.updateWebhook(wh.id, props.selectedAccount.id, { enabled: !wh.enabled })
  await loadData()
}

async function handleDelete(wh) {
  if (!confirm(`Excluir o webhook "${wh.name}"?`)) return
  await api.deleteWebhook(wh.id, props.selectedAccount.id)
  await loadData()
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Webhooks</h2>
        <p class="text-sm text-gray-500 mt-1">
          <template v-if="selectedAccount">
            Webhooks da conta <strong>{{ selectedAccount.name }}</strong>
          </template>
          <template v-else>Selecione uma conta na aba "Contas"</template>
        </p>
      </div>
      <button
        v-if="selectedAccount"
        @click="showForm = !showForm"
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {{ showForm ? 'Cancelar' : '+ Novo Webhook' }}
      </button>
    </div>

    <div v-if="!selectedAccount" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
      Selecione uma conta primeiro.
    </div>

    <template v-else>
      <!-- Create form -->
      <div v-if="showForm" class="bg-white shadow rounded-lg p-6 mb-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Criar Webhook</h3>
        <form @submit.prevent="handleCreate" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Meu Webhook"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">URL *</label>
            <input
              v-model="form.url"
              type="url"
              required
              placeholder="https://meusite.com/webhook"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email (notificação de falha)</label>
            <input
              v-model="form.email"
              type="email"
              placeholder="email@exemplo.com"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Auth Token</label>
            <input
              v-model="form.authToken"
              type="text"
              placeholder="Token de autenticação (opcional)"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div class="md:col-span-2 flex justify-end">
            <button
              type="submit"
              class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Criar Webhook
            </button>
          </div>
        </form>
      </div>

      <!-- Webhooks list -->
      <div class="mb-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-3">Configurações</h3>
        <div v-if="api.loading.value" class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
          Carregando...
        </div>
        <div v-else-if="webhooks.length === 0" class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
          Nenhum webhook configurado
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="wh in webhooks"
            :key="wh.id"
            class="bg-white shadow rounded-lg px-4 py-3 flex items-center gap-4"
          >
            <code class="text-xs bg-gray-100 px-1 py-0.5 rounded flex-shrink-0">{{ wh.id }}</code>
            <span class="text-sm font-medium">{{ wh.name }}</span>
            <code class="text-xs text-gray-500 truncate max-w-[300px]">{{ wh.url }}</code>
            <span
              :class="wh.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
              class="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
            >
              {{ wh.enabled ? 'Ativo' : 'Inativo' }}
            </span>
            <span
              v-if="wh.interrupted"
              class="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex-shrink-0"
            >
              Interrompido
            </span>
            <span v-if="wh.authToken" class="text-xs text-gray-400">token: ***</span>
            <div class="ml-auto flex gap-2 flex-shrink-0">
              <button
                @click="toggleEnabled(wh)"
                :class="wh.enabled
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'"
                class="px-2 py-1 text-xs rounded"
              >
                {{ wh.enabled ? 'Desativar' : 'Ativar' }}
              </button>
              <button
                @click="handleDelete(wh)"
                class="px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Log -->
      <div class="mt-8">
        <div class="flex items-center gap-3 mb-3">
          <h3 class="text-lg font-semibold text-gray-800">Log de Disparos</h3>
          <button
            @click="showLog = !showLog"
            class="text-sm text-indigo-600 hover:text-indigo-800"
          >
            {{ showLog ? 'Ocultar' : 'Mostrar' }}
          </button>
        </div>
        <div v-if="showLog" class="space-y-2">
          <div v-if="webhookLog.length === 0" class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
            Nenhum disparo registrado
          </div>
          <div
            v-for="(log, i) in webhookLog"
            :key="i"
            class="bg-white shadow rounded-lg px-4 py-3 flex items-center gap-4 text-sm"
          >
            <span class="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">{{ log.event }}</span>
            <code class="text-xs bg-gray-100 px-1 py-0.5 rounded">{{ log.webhook_config_id }}</code>
            <span
              :class="log.success ? 'text-green-600' : 'text-red-600'"
              class="text-xs font-medium"
            >
              {{ log.status_code || '—' }} {{ log.success ? '✓' : '✗' }}
            </span>
            <span class="text-xs text-gray-400">{{ log.sent_at }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
