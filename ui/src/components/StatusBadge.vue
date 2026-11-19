<script setup>
defineProps(['status'])

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  RECEIVED: 'bg-green-100 text-green-800',
  RECEIVED_IN_CASH: 'bg-green-100 text-green-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  OVERDUE: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  AUTHORIZED: 'bg-green-100 text-green-800',
  ERROR: 'bg-red-100 text-red-800',
  DONE: 'bg-green-100 text-green-800',
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
      statusColors[status] || 'bg-gray-100 text-gray-800'
    ]"
  >
    {{ status }}
  </span>
</template>
