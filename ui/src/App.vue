<script setup>
import { ref, onMounted } from 'vue'
import { useApi } from './composables/useApi.js'
import Sidebar from './components/Sidebar.vue'
import AccountsView from './views/AccountsView.vue'
import CustomersView from './views/CustomersView.vue'
import PaymentsView from './views/PaymentsView.vue'
import InvoicesView from './views/InvoicesView.vue'
import WebhooksView from './views/WebhooksView.vue'
import StatementView from './views/StatementView.vue'

const api = useApi()

const savedAccountId = localStorage.getItem('localAsaas_selectedAccountId')
const savedView = localStorage.getItem('localAsaas_currentView')

const currentView = ref(savedView || 'accounts')
const selectedAccount = ref(null)
const accounts = ref([])

async function loadAccounts() {
  const list = await api.getAccounts()
  accounts.value = list
  if (savedAccountId && !selectedAccount.value) {
    const found = list.find(a => a.id === savedAccountId)
    if (found) selectAccount(found)
  }
}

onMounted(loadAccounts)

const views = {
  accounts: AccountsView,
  customers: CustomersView,
  payments: PaymentsView,
  invoices: InvoicesView,
  webhooks: WebhooksView,
  statement: StatementView,
}

function selectAccount(account) {
  selectedAccount.value = account
  if (account) {
    localStorage.setItem('localAsaas_selectedAccountId', account.id)
  } else {
    localStorage.removeItem('localAsaas_selectedAccountId')
  }
}

function setView(view) {
  currentView.value = view
  localStorage.setItem('localAsaas_currentView', view)
}

function updateAccounts(list) {
  accounts.value = list
}
</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar
      :current-view="currentView"
      :selected-account="selectedAccount"
      :accounts="accounts"
      @navigate="setView"
      @select-account="selectAccount"
    />
    <main class="flex-1 overflow-auto p-6">
      <component
        :is="views[currentView]"
        :selected-account="selectedAccount"
        @select-account="selectAccount"
        @accounts-loaded="updateAccounts"
      />
    </main>
  </div>
</template>
