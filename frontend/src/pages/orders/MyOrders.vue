<!-- frontend/src/pages/orders/MyOrders.vue -->
<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="mb-0">My Orders</h3>
      <!-- NÚT MỚI: pill gradient -->
      
    </div>

    <div class="card">
      <div class="card-body">
        <div class="row g-2 mb-3">
          <div class="col-sm-6 col-md-4">
            <input
              v-model="q"
              type="search"
              class="form-control"
              placeholder="Find by ID / Name / State / Payment..."
              @input="onType"
            >
          </div>
          <div class="col-sm-6 col-md-4">
            <select v-model="status" class="form-select" @change="applyFilter">
              <option value="">All States</option>
              <option value="pending">pending</option>
              <option value="processing">processing</option>
              <option value="shipped">shipped</option>
              <option value="delivered">delivered</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="text-muted">Loading…</div>
        <div v-else-if="!rows.length" class="text-muted">Chưa có đơn hàng.</div>

        <div v-else class="table-responsive">
          <table class="table align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th style="width:110px">ID</th>
                <th>Products</th>
                <th>Booking Date</th>
                <th>State</th>
                <th>Pay</th>
                <th class="text-end">Total Amount</th>
                <th style="width:120px" class="text-center">Detail</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in filtered" :key="o.orderid">
                <td>#{{ o.orderid }}</td>

                <td>
                  <span v-if="o.productnames && o.productnames.trim()">
                    {{ o.productnames }}
                  </span>
                  <span v-else>—</span>
                </td>

                <td>{{ formatDate(o.orderdate) }}</td>
                <td>
                  <span
                    class="badge text-capitalize"
                    :class="badgeClass(o.orderstatus)"
                  >
                    {{ o.orderstatus }}
                  </span>
                </td>
                <td>
                  <span
                    class="badge text-capitalize"
                    :class="payBadgeClass(o.paymentstatus)"
                  >
                    {{ o.paymentstatus }}
                  </span>
                </td>
                <td class="text-end fw-semibold">
                  {{ money(o.totalamount) }}
                </td>
                <td class="text-center">
                  <RouterLink
                    class="btn btn-sm btn-outline-primary"
                    :to="{ name:'OrderDetail', params:{ id: String(o.orderid) } }"
                  >
                    Watch
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/services/api'

const loading = ref(true)
const rows = ref([])
const error = ref('')
const q = ref('')
const status = ref('')

let timer = null
function onType () {
  clearTimeout(timer)
  timer = setTimeout(applyFilter, 200)
}

function applyFilter () {
  // chỉ kích hoạt computed re-eval; dữ liệu đã có sẵn
}

const filtered = computed(() => {
  let list = rows.value
  if (status.value) {
    list = list.filter(o => String(o.orderstatus) === status.value)
  }
  if (q.value) {
    const s = q.value.toLowerCase().trim()
    list = list.filter(o =>
      String(o.orderid).includes(s) ||
      String(o.orderstatus).toLowerCase().includes(s) ||
      String(o.paymentstatus).toLowerCase().includes(s) ||
      String(o.productnames || '').toLowerCase().includes(s)
    )
  }
  return list
})

function money (v) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(v ?? 0)
}
function formatDate (s) {
  try { return new Date(s).toLocaleString('vi-VN') } catch { return s }
}
function badgeClass (st) {
  switch ((st || '').toLowerCase()) {
    case 'pending':    return 'bg-warning text-dark'
    case 'processing': return 'bg-brown'
    case 'shipped':    return 'bg-primary'
    case 'delivered':  return 'bg-success'
    case 'cancelled':  return 'bg-danger'
    default:           return 'bg-secondary'
  }
}
function payBadgeClass (st) {
  switch ((st || '').toLowerCase()) {
    case 'paid':     return 'bg-success'
    case 'unpaid':   return 'bg-secondary'
    case 'refunded': return 'bg-warning text-dark'
    default:         return 'bg-secondary'
  }
}
async function load () {
  loading.value = true
  error.value = ''
  try {
    const r = await api.get('/orders')
    rows.value = Array.isArray(r.data) ? r.data : []
  } catch (e) {
    console.error(e)
    error.value = e?.response?.data?.message || 'Load orders failed'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
/* Reuse màu nâu */
.bg-brown {
  background-color: #795548 !important;
  color: #fff !important;
}

/* Nút "Tiếp tục mua sắm" kiểu pill gradient giống Watch Players */
.continue-shopping-btn {
  display: inline-block;
  padding: 10px 32px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #ffffff;
  text-decoration: none;
  border-radius: 999px;
  border: none;
  background: linear-gradient(90deg, #3b39f2, #9b6dfc);
  box-shadow: 0 8px 20px rgba(59, 57, 242, 0.35);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    opacity 0.15s ease;
}

.continue-shopping-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 10px 28px rgba(59, 57, 242, 0.45);
  color: #ffffff;
}
</style>
