<!-- frontend/src/pages/admin/AdminDashboard.vue -->
<template>
  <div class="container py-4">

    <!-- TITLE -->
    <h2 class="fw-bold mb-4">Dashboard Overview</h2>

    <div class="row g-4">

      <!-- Matches -->
      <div class="col-md-3">
        <div class="card dashboard-card text-center p-3">
          <div class="dashboard-icon">⚽</div>
          <div class="dashboard-title">Matches</div>
          <div class="dashboard-number">{{ matchesCount }}</div>
          <RouterLink class="btn btn-primary w-100 mt-3" to="/admin/matches">
            Manage
          </RouterLink>
        </div>
      </div>

      <!-- Tickets -->
      <div class="col-md-3">
        <div class="card dashboard-card text-center p-3">
          <div class="dashboard-icon">🎫</div>
          <div class="dashboard-title">Tickets</div>
          <div class="dashboard-number">{{ ticketsCount }}</div>
          <RouterLink class="btn btn-primary w-100 mt-3" to="/admin/tickets">
            Manage
          </RouterLink>
        </div>
      </div>

      <!-- Products -->
      <div class="col-md-3">
        <div class="card dashboard-card text-center p-3">
          <div class="dashboard-icon">🛒</div>
          <div class="dashboard-title">Products</div>
          <div class="dashboard-number">{{ productsCount }}</div>
          <RouterLink class="btn btn-primary w-100 mt-3" to="/admin/products">
            Manage
          </RouterLink>
        </div>
      </div>

      <!-- Users -->
      <div class="col-md-3">
        <div class="card dashboard-card text-center p-3">
          <div class="dashboard-icon">👥</div>
          <div class="dashboard-title">Users</div>
          <div class="dashboard-number">{{ usersCount }}</div>
          <RouterLink class="btn btn-primary w-100 mt-3" to="/admin/users">
            Manage
          </RouterLink>
        </div>
      </div>

      <!-- News -->
      <div class="col-md-3">
        <div class="card dashboard-card text-center p-3">
          <div class="dashboard-icon">📰</div>
          <div class="dashboard-title">News</div>
          <div class="dashboard-number">{{ newsCount }}</div>
          <RouterLink class="btn btn-primary w-100 mt-3" to="/admin/news">
            Manage
          </RouterLink>
        </div>
      </div>

      <!-- Orders -->
      <div class="col-md-3">
        <div class="card dashboard-card text-center p-3">
          <div class="dashboard-icon">📦</div>
          <div class="dashboard-title">Orders</div>
          <div class="dashboard-number">{{ ordersCount }}</div>
          <RouterLink class="btn btn-primary w-100 mt-3" to="/admin/orders">
            Manage
          </RouterLink>
        </div>
      </div>

      <!-- Players -->
      <div class="col-md-3">
        <div class="card dashboard-card text-center p-3">
          <div class="dashboard-icon">🧍</div>
          <div class="dashboard-title">Players</div>
          <div class="dashboard-number">{{ playersCount }}</div>
          <RouterLink class="btn btn-primary w-100 mt-3" to="/admin/players">
            Manage
          </RouterLink>
        </div>
      </div>

      <!-- Wallet -->
      <div class="col-md-3">
        <div class="card dashboard-card text-center p-3">
          <div class="dashboard-icon">💰</div>
          <div class="dashboard-title">Wallet</div>
          <div class="dashboard-number">{{ walletCount }}</div>
          <RouterLink class="btn btn-primary w-100 mt-3" to="/admin/wallet">
            Manage
          </RouterLink>
        </div>
      </div>

      <!-- Highlights -->
      <div class="col-md-3">
        <div class="card dashboard-card text-center p-3">
          <div class="dashboard-icon">🎥</div>
          <div class="dashboard-title">Highlights</div>
          <div class="dashboard-number">{{ highlightsTotal }}</div>
          <RouterLink class="btn btn-primary w-100 mt-3"
            :to="{ name: 'ManageHighlights' }"
          >
            Manage
          </RouterLink>
        </div>
      </div>

      <!-- Reconcile Now -->
      <div class="col-md-3">
        <div class="card dashboard-card text-center p-3">
          <div class="dashboard-icon">📄</div>
          <div class="dashboard-title">Wallet / Sessions</div>
          <button
            class="btn btn-warning w-100 mt-3 fw-bold"
            @click="reconcileNow"
          >
            Reconcile Now
          </button>
        </div>
      </div>
      <!-- Event Management Card -->
<div class="col-md-3">
  <div class="card border-0 shadow-sm p-4 text-center">
    <div class="mb-2 fs-2">🎉</div>
    <h6 class="mb-1">Events</h6>
    <p class="text-muted small">Seasonal & club events</p>

    <RouterLink
      to="/admin/events"
      class="btn btn-primary btn-sm"
    >
      Manage
    </RouterLink>
  </div>
</div>


    </div>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/services/api'
import { listHighlights } from '@/services/highlights'

// đếm cho từng khối
const matchesCount     = ref(0)
const ticketsCount     = ref(0)
const productsCount    = ref(0)
const usersCount       = ref(0)
const newsCount        = ref(0)
const ordersCount      = ref(0)
const highlightsTotal  = ref(0)
const playersCount     = ref(0) // NEW
const walletCount = ref(0)

// helper đọc count từ nhiều kiểu payload khác nhau: {total}, {items:[]}, []...
function pickCount(payload) {
  if (!payload) return 0
  if (typeof payload.total === 'number') return payload.total
  if (Array.isArray(payload.items))     return payload.items.length
  if (Array.isArray(payload))           return payload.length
  return 0
}

async function reconcileNow() {
  try {
    await api.post('/admin/reconcile/run')
    alert('Adjusted (overdue expired sessions and frozen releases if any).')
  } catch (e) {
    alert(e?.response?.data?.message || 'Reconcile Error')
  }
}

async function fetchAllCounts () {
  try {
    const [
      matchesRes,
      ticketsRes,
      productsRes,
      usersRes,
      newsRes,
      ordersRes,
      playersRes, // NEW
      walletRes  
    ] = await Promise.all([
      api.get('/matches'),
      api.get('/tickets'),
      api.get('/products'),
      api.get('/users'),
      api.get('/news'),
      // orders (admin list) có thể trả dạng {total,...} hoặc mảng
      api.get('/orders/admin', { params: { page: 1, limit: 1 } }).catch(() => ({ data: [] })),
      api.get('/players'), // NEW
      api.get('/wallet/admin')

    ])

    matchesCount.value   = pickCount(matchesRes.data)
    ticketsCount.value   = pickCount(ticketsRes.data)
    productsCount.value  = pickCount(productsRes.data)
    usersCount.value     = pickCount(usersRes.data)
    newsCount.value      = pickCount(newsRes.data)
    ordersCount.value    = pickCount(ordersRes.data)
    playersCount.value   = pickCount(playersRes.data) // NEW
    walletCount.value = pickCount(walletRes.data)

  } catch (e) {
    // Nếu lỗi API nào đó, giữ nguyên số cũ (0) để dashboard vẫn render
    console.error('fetch counts error', e?.message || e)
  }
}

async function fetchHighlightsTotal () {
  try {
    const { total, items } = await listHighlights({ page: 1, limit: 1 })
    highlightsTotal.value = typeof total === 'number'
      ? total
      : (Array.isArray(items) ? items.length : 0)
  } catch (e) {
    highlightsTotal.value = 0
  }
}

onMounted(async () => {
  await Promise.all([fetchAllCounts(), fetchHighlightsTotal()])
})
</script>
<style scoped>
.dashboard-card {
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: transform .15s ease;
}
.dashboard-card:hover {
  transform: translateY(-3px);
}

.dashboard-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.dashboard-title {
  font-size: 15px;
  font-weight: 500;
  color: #6c757d;
}

.dashboard-number {
  font-size: 32px;
  font-weight: 700;
  margin-top: 4px;
}
</style>
