<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
  <h3 class="mb-0">Manage Tickets</h3>
  <button class="btn btn-success" @click="openCreate">+ Add Ticket</button>
</div>


    <div class="table-responsive">
      <table class="table table-striped align-middle">
        <thead>
          <tr>
            <th>ID</th>
            <th>Match</th>
            <th>Category</th>
            <th>Total</th>
            <th>Available</th>
            <th>Sales Period</th>
            <th style="width:150px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in tickets" :key="t.ticketid">
            <td>{{ t.ticketid }}</td>
            <td>
              {{ t.opponentteam }} ({{ formatDate(t.matchdatetime) }})
            </td>
            <td>{{ t.categoryname }}</td>
            <td>{{ t.totalquantity }}</td>
            <td>{{ t.availablequantity }}</td>
            <td>
              {{ formatDate(t.salestartdate) }} – {{ formatDate(t.saleenddate) }}
            </td>
            <td>
              <button class="btn btn-sm btn-primary me-2" @click="openEdit(t)">Edit</button>
              <button class="btn btn-sm btn-danger" @click="remove(t.ticketid)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div class="modal fade" ref="modalRef" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <form @submit.prevent="save">
            <div class="modal-header">
              <h5 class="modal-title">{{ editingId ? 'Edit Ticket' : 'Add Ticket' }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"/>
            </div>
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Match</label>
                  <select v-model="form.matchid" class="form-select" required>
                    <option disabled value="">-- Select match --</option>
                    <option v-for="m in matches" :key="m.matchid" :value="m.matchid">
                      {{ m.opponentteam }} ({{ formatDate(m.matchdatetime) }})
                    </option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Category</label>
                  <select v-model="form.categoryid" class="form-select" required>
                    <option disabled value="">-- Select category --</option>
                    <option v-for="c in categories" :key="c.categoryid" :value="c.categoryid">
                      {{ c.categoryname }} - {{ formatCurrency(c.categoryprice) }}
                    </option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Total Quantity</label>
                  <input v-model.number="form.totalquantity" type="number" min="0" class="form-control" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Available Quantity</label>
                  <input v-model.number="form.availablequantity" type="number" min="0" class="form-control" required />
                </div>

                <div class="col-md-6">
                  <label class="form-label">Sale Start</label>
                  <input v-model="form.salestart_local" type="datetime-local" class="form-control" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Sale End</label>
                  <input v-model="form.saleend_local" type="datetime-local" class="form-control" required />
                </div>
              </div>

              <div v-if="error" class="text-danger mt-3">{{ error }}</div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" type="button" data-bs-dismiss="modal">Cancel</button>
              <button class="btn btn-primary" type="submit">{{ editingId ? 'Save changes' : 'Create' }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <!-- /Modal -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

// data
const tickets = ref([])
const matches = ref([])
const categories = ref([])
const modalRef = ref(null)
let bsModal = null

const editingId = ref(null)
const error = ref('')

const form = ref({
  ticketid: null,
  matchid: '',
  categoryid: '',
  totalquantity: 0,
  availablequantity: 0,
  salestart_local: '', // for input type="datetime-local"
  saleend_local: ''    // for input type="datetime-local"
})

// helpers
function formatDate(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleString()
}
function formatCurrency(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0)
}

// convert "YYYY-MM-DDTHH:MM" -> "YYYY-MM-DD HH:MM:SS"
function toServerDateTime(localDT) {
  if (!localDT) return null
  return localDT.replace('T', ' ') + ':00'
}
// convert DB datetime -> input[type=datetime-local] value
function toLocalInput(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  const pad = n => String(n).padStart(2,'0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// CRUD
async function loadAll() {
  const [tR, mR, cR] = await Promise.all([
  api.get('/tickets'),
  api.get('/matches'),
  api.get('/ticketcategories')
])

tickets.value = tR.data

// Lọc match tương lai
const now = new Date()
matches.value = (mR.data || []).filter(m => {
  if (!m.matchdatetime) return false
  return new Date(m.matchdatetime) > now
})

categories.value = cR.data

}

function openCreate() {
  editingId.value = null
  error.value = ''
  Object.assign(form.value, {
    ticketid: null,
    matchid: '',
    categoryid: '',
    totalquantity: 0,
    availablequantity: 0,
    salestart_local: '',
    saleend_local: ''
  })
  bsModal?.show()
}

function openEdit(t) {
  editingId.value = t.ticketid
  error.value = ''
  Object.assign(form.value, {
    ticketid: t.ticketid,
    matchid: t.matchid,
    categoryid: t.categoryid,
    totalquantity: t.totalquantity,
    availablequantity: t.availablequantity,
    salestart_local: toLocalInput(t.salestartdate),
    saleend_local: toLocalInput(t.saleenddate)
  })
  bsModal?.show()
}

async function save() {
  try {
    error.value = ''
    const payload = {
      matchid: Number(form.value.matchid),
      categoryid: Number(form.value.categoryid),
      totalquantity: Number(form.value.totalquantity),
      availablequantity: Number(form.value.availablequantity),
      salestartdate: toServerDateTime(form.value.salestart_local),
      saleenddate: toServerDateTime(form.value.saleend_local)
    }

    if (editingId.value) {
      await api.put(`/tickets/${editingId.value}`, payload)
    } else {
      await api.post('/tickets', payload)
    }
    bsModal?.hide()
    await loadAll()
  } catch (e) {
    error.value = e.response?.data?.message || 'Save failed'
    console.error('Save ticket error:', e)
  }
}

async function remove(id) {
  if (!confirm('Delete this ticket?')) return
  await api.delete(`/tickets/${id}`)
  await loadAll()
}

// init
onMounted(async () => {
  await loadAll()
  // bootstrap modal init (no need to import bootstrap js globally if Vite includes it)
  const Modal = (await import('bootstrap/js/dist/modal')).default
  bsModal = new Modal(modalRef.value)
})
</script>
