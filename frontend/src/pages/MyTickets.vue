<!-- frontend/src/pages/MyTickets.vue -->
<template>
  <div class="container py-4">
    <div class="d-flex align-items-center mb-3">
  <button class="btn btn-outline-secondary me-2" @click="$router.push('/tickets')">
    ← Back to Tickets
  </button>
</div>


    <div v-if="!orders.length" class="text-muted">
      You have no ticket orders yet.
    </div>

    <div v-for="g in grouped" :key="g.orderid" class="card mb-3">
      <div class="card-body">
        <div class="d-flex justify-content-between">
          <div>
            <h5 class="mb-1">Order #{{ g.orderid }}</h5>
            <small class="text-muted">Date: {{ formatDate(g.orderdate) }}</small>
          </div>
          <div class="text-end">
            <div>
              Status:
              <span class="badge bg-secondary">{{ g.orderstatus }}</span>
            </div>
            <div>
              Payment:
              <span
                class="badge"
                :class="g.paymentstatus === 'paid' ? 'bg-success' : 'bg-warning'"
              >
                {{ g.paymentstatus }}
              </span>
            </div>
            <div class="fw-bold mt-1">
              Total: {{ formatCurrency(g.totalamount) }}
            </div>
          </div>
        </div>
        <hr />
        <div class="mb-2">
          <strong>Match:</strong>
          {{ g.items[0]?.opponentteam }} — {{ formatDate(g.items[0]?.matchdatetime) }}
        </div>
        <ul class="mb-0">
          <li v-for="it in g.items" :key="it.ticketid">
            {{ it.categoryname }} — Qty: {{ it.quantity }} —
            {{ formatCurrency(it.unitprice) }}
            (Subtotal: {{ formatCurrency(it.subtotal) }})

            <!-- QR cho từng dòng vé -->
            <div v-if="it.qrcode" class="mt-2">
              <img :src="it.qrImage" alt="QR" width="120" height="120" />
              <div class="small text-muted">{{ it.qrcode }}</div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import { useAuthStore } from '../store/auth'
import QRCode from 'qrcode'

const auth = useAuthStore()
const orders = ref([])

function formatDate (dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleString()
}
function formatCurrency (v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0)
}

const grouped = computed(() => {
  const map = new Map()
  for (const r of orders.value) {
    if (!map.has(r.orderid)) {
      map.set(r.orderid, {
        orderid: r.orderid,
        orderdate: r.orderdate,
        orderstatus: r.orderstatus,
        paymentstatus: r.paymentstatus,
        totalamount: r.totalamount,
        items: []
      })
    }
    map.get(r.orderid).items.push(r)
  }
  return Array.from(map.values())
})

async function generateQrForOrders (rows) {
  for (const row of rows) {
    if (row.qrcode) {
      try {
        row.qrImage = await QRCode.toDataURL(row.qrcode)
      } catch (e) {
        console.error('QR gen error', e)
      }
    }
  }
}

onMounted(async () => {
  if (!auth.isLoggedIn) return
  try {
    const r = await api.get('/ticket-orders/my')
    const rows = r.data || []
    await generateQrForOrders(rows)
    orders.value = rows
  } catch (e) {
    console.error(e)
    alert(e.response?.data?.message || 'Load failed')
  }
})
</script>
