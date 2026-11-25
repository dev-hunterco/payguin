<script setup>
import { ref, watch } from 'vue'
import { useApi } from '../composables/useApi.js'
import StatusBadge from '../components/StatusBadge.vue'

const props = defineProps(['selectedAccount'])
const api = useApi()

const invoices = ref([])
const expandedId = ref(null)
const showJsonId = ref(null)

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

    <div v-else class="space-y-2">
      <div v-if="api.loading.value" class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
        Carregando...
      </div>
      <div v-else-if="invoices.length === 0" class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
        Nenhuma nota fiscal encontrada
      </div>
      <div
        v-for="inv in invoices"
        :key="inv.id"
        class="bg-white shadow rounded-lg overflow-hidden"
      >
        <!-- Main row -->
        <div class="px-4 py-3 flex items-center gap-4 hover:bg-gray-50 cursor-pointer" @click="toggleExpand(inv.id)">
          <div class="flex-shrink-0 w-5 text-gray-400 text-xs">
            {{ expandedId === inv.id ? '▼' : '▶' }}
          </div>
          <code class="text-xs bg-gray-100 px-1 py-0.5 rounded flex-shrink-0">{{ inv.id }}</code>
          <StatusBadge :status="inv.status" />
          <span class="font-medium text-sm">{{ formatCurrency(inv.value) }}</span>
          <span v-if="inv.number" class="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded flex-shrink-0">
            {{ inv.number }}
          </span>
          <span v-if="inv.effectiveDate" class="text-xs text-gray-500">{{ inv.effectiveDate }}</span>
          <span v-if="inv.serviceDescription" class="text-xs text-gray-400 truncate max-w-[250px]">{{ inv.serviceDescription }}</span>
          <div class="ml-auto flex gap-1 flex-shrink-0" @click.stop>
            <button
              v-if="inv.status === 'SCHEDULED'"
              @click="simulateAction('authorize', inv.id)"
              class="px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded"
            >
              Autorizar
            </button>
            <button
              v-if="inv.status === 'SCHEDULED'"
              @click="simulateAction('error', inv.id)"
              class="px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded"
            >
              Simular Erro
            </button>
          </div>
        </div>

        <!-- Expanded details -->
        <div v-if="expandedId === inv.id" class="border-t border-gray-100 bg-gray-50 px-4 py-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-gray-500 text-xs block">Valor</span>
              <span class="font-medium">{{ formatCurrency(inv.value) }}</span>
            </div>
            <div>
              <span class="text-gray-500 text-xs block">Deduções</span>
              {{ formatCurrency(inv.deductions) }}
            </div>
            <div>
              <span class="text-gray-500 text-xs block">Data Criação</span>
              {{ inv.dateCreated }}
            </div>
            <div>
              <span class="text-gray-500 text-xs block">Data Efetiva</span>
              {{ inv.effectiveDate }}
            </div>
            <div v-if="inv.customer">
              <span class="text-gray-500 text-xs block">Cliente</span>
              <code class="text-xs">{{ inv.customer }}</code>
            </div>
            <div v-if="inv.payment">
              <span class="text-gray-500 text-xs block">Cobrança</span>
              <code class="text-xs">{{ inv.payment }}</code>
            </div>
            <div v-if="inv.number">
              <span class="text-gray-500 text-xs block">Número NF</span>
              <span class="font-medium">{{ inv.number }}</span>
            </div>
            <div v-if="inv.externalReference">
              <span class="text-gray-500 text-xs block">Ref. Externa</span>
              <code class="text-xs">{{ inv.externalReference }}</code>
            </div>
            <div>
              <span class="text-gray-500 text-xs block">ISS Retido</span>
              {{ inv.issRetained ? 'Sim' : 'Não' }}
            </div>
            <div v-if="inv.municipalServiceCode">
              <span class="text-gray-500 text-xs block">Serviço Municipal</span>
              <span class="text-xs">{{ inv.municipalServiceCode }} - {{ inv.municipalServiceName }}</span>
            </div>
            <div v-if="inv.serviceDescription" class="col-span-2">
              <span class="text-gray-500 text-xs block">Descrição Serviço</span>
              {{ inv.serviceDescription }}
            </div>
            <div v-if="inv.observations" class="col-span-2">
              <span class="text-gray-500 text-xs block">Observações</span>
              {{ inv.observations }}
            </div>
            <div v-if="inv.rpsSerie">
              <span class="text-gray-500 text-xs block">RPS Série</span>
              {{ inv.rpsSerie }}
            </div>
            <div v-if="inv.rpsNumber">
              <span class="text-gray-500 text-xs block">RPS Número</span>
              {{ inv.rpsNumber }}
            </div>
            <div v-if="inv.pdfUrl">
              <span class="text-gray-500 text-xs block">PDF URL</span>
              <code class="text-xs break-all">{{ inv.pdfUrl }}</code>
            </div>
            <div v-if="inv.xmlUrl">
              <span class="text-gray-500 text-xs block">XML URL</span>
              <code class="text-xs break-all">{{ inv.xmlUrl }}</code>
            </div>
          </div>

          <!-- Taxes -->
          <div v-if="inv.taxes" class="mt-4">
            <h4 class="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Impostos</h4>
            <div class="bg-white rounded border border-gray-200 px-3 py-2 text-sm">
              <pre class="text-xs text-gray-700 whitespace-pre-wrap">{{ JSON.stringify(inv.taxes, null, 2) }}</pre>
            </div>
          </div>

          <!-- JSON toggle -->
          <div class="mt-4">
            <button
              @click="toggleJson(inv.id)"
              class="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {{ showJsonId === inv.id ? 'Ocultar JSON' : 'Ver JSON completo' }}
            </button>
            <pre
              v-if="showJsonId === inv.id"
              class="mt-2 bg-gray-900 text-green-400 text-xs rounded-lg p-4 overflow-x-auto max-h-80"
            >{{ JSON.stringify(inv, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
