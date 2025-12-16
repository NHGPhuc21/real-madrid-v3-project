<!-- frontend/src/pages/tickets/TicketOrderDetail.vue -->
<template>
  <div class="container py-4">
    <h3 class="mb-3">Tickets Order Detail #{{ orderId }}</h3>

    <div v-if="loading" class="text-muted">Loading…</div>
    <div v-else-if="error" class="text-danger">{{ error }}</div>
    <div v-else-if="!rows.length">Can not find ticket order.</div>
    <div v-else class="card">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <div class="text-muted">Order Date</div>
            <div>{{ formatDate(head.orderdate) }}</div>
          </div>
          <div class="text-end">
            <div class="text-muted">State</div>
            <span class="badge text-capitalize" :class="statusClass(head.orderstatus)">
              {{ head.orderstatus }}
            </span>
            <div class="mt-2 text-muted">Pay</div>
            <span class="badge text-capitalize" :class="payClass(head.paymentstatus)">
              {{ head.paymentstatus }}
            </span>
          </div>
        </div>
        <hr />
        <div>
          <div class="mb-1">
            <strong>Match:</strong>
            {{ head.opponentteam }} — {{ formatDate(head.matchdatetime) }}
          </div>
          <div class="text-muted">
            {{ head.competition }} @ {{ head.stadium }}
          </div>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>Kind of Tickets</th>
              <th class="text-center">Quantity</th>
              <th class="text-end">unit price</th>
              <th class="text-end">Money</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="it in rows" :key="it.ticketid">
              <td>{{ it.categoryname }}</td>
              <td class="text-center">{{ it.quantity }}</td>
              <td class="text-end">{{ money(it.unitprice) }}</td>
              <td class="text-end fw-semibold">{{ money(it.subtotal) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card-body d-flex justify-content-end">
        <div class="h5 mb-0">
          <span class="text-muted me-2">Total:</span>
          <span class="fw-bold">{{ money(head.totalamount) }}</span>
        </div>
      </div>

      <div class="card-footer d-flex justify-content-between">
        <RouterLink class="btn btn-outline-secondary" to="/tickets">
          ← Back to the list Matches
        </RouterLink>

        <div class="d-flex gap-2">
          <RouterLink class="btn btn-outline-primary" to="/my-tickets">
            Watch My Tickets
          </RouterLink>

          <button
            v-if="head.paymentstatus === 'unpaid' && head.orderstatus === 'pending'"
            class="btn btn-success"
            @click="payWithWallet"
          >
            Pay by wallet
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, RouterLink, useRouter } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import { toast } from "@/composables/useToast";
import { useAuthStore } from "@/store/auth";

const route = useRoute()
const router = useRouter()
const orderId = computed(() => route.params.id)

const rows = ref([])
const loading = ref(true)
const error = ref('')

const head = computed(() => rows.value[0] || {})

function money (v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v ?? 0)
}
function formatDate (s) {
  if (!s) return ''
  try { return new Date(s).toLocaleString('vi-VN') } catch { return s }
}
function statusClass (st) {
  switch ((st || '').toLowerCase()) {
    case 'pending': return 'bg-warning text-dark'
    case 'confirmed': return 'bg-success'
    case 'cancelled': return 'bg-danger'
    default: return 'bg-secondary'
  }
}
function payClass (st) {
  switch ((st || '').toLowerCase()) {
    case 'paid': return 'bg-success'
    case 'unpaid': return 'bg-secondary'
    default: return 'bg-secondary'
  }
}

async function fetchDetail () {
  loading.value = true
  error.value = ''
  try {
    const r = await api.get(`/ticket-orders/${orderId.value}`)
    rows.value = r.data || []
  } catch (e) {
    console.error(e)
    error.value = e?.response?.data?.message || 'Load đơn vé thất bại'
  } finally {
    loading.value = false
  }
}

async function payWithWallet() {
  const pin = window.prompt('Nhập PIN ví:')
  if (!pin) return

  // ----- Chỉ try/catch API thanh toán -----
  let payOK = false
  try {
    await api.post(`/ticket-orders/${orderId.value}/pay-wallet`, { pin })
    payOK = true
  } catch (e) {
    const code = e?.response?.data?.message;

  let msg = "Payment unsuccessfully";

  if (code === "PIN_INCORRECT") 
    msg = "Real Madrid Club responded that: Incorrect PIN. Please try again.";

  else if (code === "NOT_ENOUGH_BALANCE") 
    msg = "Real Madrid Club responded that: Your wallet balance is not enough.";

  else if (code === "ORDER_NOT_FOUND") 
    msg = "Real Madrid Club responded that: Ticket order not found.";

  else if (code === "ORDER_ALREADY_PAID") 
    msg = "Real Madrid Club responded that: This order is already paid.";

  toast(msg, 'error');
  return;
}



  // ----- Chỉ khi thanh toán THÀNH CÔNG -----
  if (payOK) {
    toast('Real Madrid Club responded that: Payment successfully', 'success')

    await fetchDetail()

    // refreshUser lỗi thì bỏ qua, không báo failed nữa
    try {
      const auth = useAuthStore()
      await auth.refreshUser()
    } catch {}
  }
}


onMounted(fetchDetail)
</script>
