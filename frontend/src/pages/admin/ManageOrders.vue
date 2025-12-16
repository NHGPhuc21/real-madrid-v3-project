frontend/src/pages/admin/ManageOrders.vue
<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="mb-0">Manage Orders</h3>
      <RouterLink class="btn btn-outline-secondary btn-sm" to="/admin">← Dashboard</RouterLink>
    </div>

    <div class="row g-2 mb-3">
      <div class="col-md-6">
        <input v-model="q" class="form-control" placeholder="Find by ID/ Email / Username" @keyup.enter="load" />
      </div>
      <div class="col-md-3">
        <select v-model="status" class="form-select" @change="load">
          <option value="">All state</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div class="col-md-3">
        <select v-model="payment" class="form-select" @change="load">
          <option value="">All Pay</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table align-middle">
        <thead class="table-light">
          <tr>
            <th style="width: 70px">ID</th>
            <th>User</th>
            <th>Date</th>
            <th>State</th>
            <th>Pay</th>
            <th class="text-end">Total</th>
            <th style="width: 220px">Update</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in items" :key="o.orderid">
            <td>#{{ o.orderid }}</td>
            <td>
              <div class="fw-semibold">{{ o.username || 'user' }}</div>
              <div class="text-muted small">{{ o.email }}</div>
            </td>
            <td>{{ fmt(o.orderdate) }}</td>

            <!-- ĐỔI: badge màu theo trạng thái -->
            <td>
              <span class="badge text-capitalize" :class="statusClass(o.orderstatus)">
                {{ o.orderstatus }}
              </span>
            </td>

            <td><span class="badge bg-dark text-capitalize">{{ o.paymentstatus }}</span></td>
            <td class="text-end">{{ money(o.totalamount) }}</td>
            <td>
              <div class="d-flex gap-1">
                <select v-model="o.__newStatus" class="form-select form-select-sm">
                  <option disabled value="">— State —</option>
                  <option value="processing">processing</option>
                  <option value="shipped">shipped</option>
                  <option value="delivered">delivered</option>
                  <option value="cancelled">cancelled</option>
                </select>
                <button class="btn btn-sm btn-primary" @click="openTracking(o)">Set</button>
                <button
  class="btn btn-sm btn-danger"
  :disabled="deletingId === o.orderid"
  @click="onDelete(o.orderid)"
>
  <span v-if="deletingId === o.orderid" class="spinner-border spinner-border-sm me-1"></span>
  Delete
</button>

              </div>
            </td>
          </tr>
          <tr v-if="!items.length">
            <td colspan="7" class="text-center text-muted">No orders</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="d-flex justify-content-center my-3" v-if="pages > 1">
      <nav>
        <ul class="pagination mb-0">
          <li class="page-item" :class="{disabled: page === 1}">
            <button class="page-link" @click="go(page-1)">«</button>
          </li>
          <li v-for="n in pages" :key="n" class="page-item" :class="{active: page === n}">
            <button class="page-link" @click="go(n)">{{ n }}</button>
          </li>
          <li class="page-item" :class="{disabled: page === pages}">
            <button class="page-link" @click="go(page+1)">»</button>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Modal nhập tracking (tuỳ chọn) -->
    <div class="modal fade" tabindex="-1" ref="modalRef">
      <div class="modal-dialog">
        <form class="modal-content" @submit.prevent="submitStatus">
          <div class="modal-header">
            <h5 class="modal-title">Update State</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"/>
          </div>
          <div class="modal-body">
            <div class="mb-2">
              <label class="form-label">Order #</label>
              <div class="form-control-plaintext">#{{ editing?.orderid }}</div>
            </div>
            <div class="mb-2">
              <label class="form-label">State</label>
              <div class="form-control-plaintext text-capitalize">{{ editing?.__newStatus }}</div>
            </div>
            <div class="row g-2">
              <div class="col-md-6">
                <label class="form-label">Carrier (optional)</label>
                <input v-model.trim="form.carrier" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Tracking number (optional)</label>
                <input v-model.trim="form.tracking_number" class="form-control" />
              </div>
            </div>
            <div class="mt-2">
              <label class="form-label">Note (optional)</label>
              <textarea v-model.trim="form.note" class="form-control" rows="2"/>
            </div>
            <div v-if="error" class="text-danger mt-2">{{ error }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" type="button" data-bs-dismiss="modal">Close</button>
            <button class="btn btn-primary" type="submit">Cập nhật</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/services/api'

const q = ref('')
const status = ref('')
const payment = ref('')
const page = ref(1)
const limit = ref(12)
const items = ref([])
const total = ref(0)
const pages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)))

async function load() {
  const r = await api.get('/orders/admin', {
    params: { q: q.value, status: status.value, payment: payment.value, page: page.value, limit: limit.value }
  })
  items.value = r.data?.items?.map(o => ({ ...o, __newStatus: '' })) || []
  total.value = r.data?.total || 0
}
function go(n){ if(n<1 || n>pages.value) return; page.value=n; load() }
function fmt(d){ return new Date(d).toLocaleString('vi-VN') }
function money(v){ return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(v||0) }

/* Map màu theo yêu cầu:
   pending: vàng, processing: nâu, shipped: xanh dương,
   delivered: xanh lá, cancelled: đỏ */
function statusClass(st){
  switch ((st || '').toLowerCase()) {
    case 'pending':    return 'bg-warning text-dark'
    case 'processing': return 'bg-brown'
    case 'shipped':    return 'bg-primary'
    case 'delivered':  return 'bg-success'
    case 'cancelled':  return 'bg-danger'
    default:           return 'bg-secondary'
  }
}

const modalRef = ref(null)
let Modal
let modal
const editing = ref(null)
const form = ref({ carrier: '', tracking_number: '', note: '' })
const error = ref('')

async function ensureModal() {
  if (!Modal) Modal = (await import('bootstrap/js/dist/modal')).default
  if (!modal) modal = new Modal(modalRef.value)
}

async function openTracking(o){
  if (!o.__newStatus) return alert('Chọn trạng thái trước')
  editing.value = o
  form.value = { carrier:'', tracking_number:'', note:'' }
  error.value = ''
  await ensureModal()
  modal.show()
}

// NEW:
const deletingId = ref(null);

async function onDelete(id) {
  if (!confirm(`Xóa đơn #${id}? Hành động không thể hoàn tác.`)) return;
  try {
    deletingId.value = id;
    await api.delete(`/orders/admin/${id}`);

    // Refetch để đồng bộ phân trang server-side
    await load();
    if (items.value?.length === 0 && page.value > 1) {
      page.value = page.value - 1;
      await load();
    }
  } catch (e) {
    alert(e?.response?.data?.message || 'Xóa đơn thất bại');
  } finally {
    deletingId.value = null;
  }
}
async function submitStatus(){
  try {
    error.value = ''
    await api.put(`/orders/admin/${editing.value.orderid}/status`, {
      status: editing.value.__newStatus,
      carrier: form.value.carrier || null,
      tracking_number: form.value.tracking_number || null,
      note: form.value.note || null
    })
    modal.hide()
    await load()
  } catch (e) {
    error.value = e.response?.data?.message || 'Update failed'
  }
}

onMounted(load)
</script>

<style scoped>
/* Bootstrap không có màu nâu: thêm utility này */
.bg-brown {
  background-color: #795548 !important; /* brown */
  color: #fff !important;
}
</style>


