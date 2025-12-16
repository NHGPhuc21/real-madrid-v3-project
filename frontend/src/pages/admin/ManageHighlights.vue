<!-- frontend/src/pages/admin/ManageHighlights.vue -->
<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="mb-0">Manage Highlights</h3>
      <div class="d-flex gap-2">
        <RouterLink class="btn btn-outline-secondary btn-sm" to="/admin">← Dashboard</RouterLink>
        <RouterLink class="btn btn-primary btn-sm" to="/admin/highlights">+ Upload Highlight</RouterLink>
      </div>
    </div>

    <!-- Filters -->
    <div class="row g-2 mb-3">
      <div class="col-sm-6 col-md-5">
        <input v-model="q" class="form-control" placeholder="Find by Topic/Description" @keyup.enter="reload" />
      </div>
      <div class="col-sm-3 col-md-3">
        <select v-model="status" class="form-select" @change="reload">
          <option value="">All state</option>
          <option value="draft">draft</option>
          <option value="published">published</option>
          <option value="archived">archived</option>
        </select>
      </div>
      <div class="col-sm-3 col-md-2">
        <select v-model="limit" class="form-select" @change="go(1)">
          <option :value="12">12 / page</option>
          <option :value="24">24 / page</option>
          <option :value="48">48 / page</option>
        </select>
      </div>
      <div class="col-sm-12 col-md-2 text-md-end">
        <button class="btn btn-outline-primary w-100" @click="reload">Find</button>
      </div>
    </div>

    <!-- Table -->
    <div class="table-responsive">
      <table class="table align-middle">
        <thead class="table-light">
          <tr>
            <th style="width:70px">ID</th>
            <th>Topic</th>
            <th>Match</th>
            <th style="width:140px">State</th>
            <th style="width:160px">HLS / MP4</th>
            <th style="width:160px">Create /Update</th>
            <th style="width:230px">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in items" :key="v.videoid">
            <td>#{{ v.videoid }}</td>
            <td>
              <div class="fw-semibold text-truncate" style="max-width: 360px">{{ v.title }}</div>
              <div v-if="v.description" class="text-muted small text-truncate" style="max-width: 360px">
                {{ v.description }}
              </div>
            </td>
            <td>
              <div v-if="v.opponentteam" class="small">
                vs {{ v.opponentteam }}
              </div>
              <div v-if="v.matchdatetime" class="text-muted small">
                {{ fmt(v.matchdatetime) }}
              </div>
            </td>
            <td>
              <span class="badge text-capitalize" :class="statusClass(v.status)">{{ v.status }}</span>
            </td>
            <td class="small">
              <div>
                <span class="badge" :class="v.hlspath ? 'bg-success' : 'bg-secondary'">HLS</span>
                <span class="ms-1 text-truncate d-inline-block" style="max-width: 200px">{{ v.hlspath || '—' }}</span>
              </div>
              <div class="mt-1">
                <span class="badge" :class="v.sourcemp4 ? 'bg-info' : 'bg-secondary'">MP4</span>
                <span class="ms-1 text-truncate d-inline-block" style="max-width: 200px">{{ v.sourcemp4 || '—' }}</span>
              </div>
            </td>
            <td class="small">
              <div>{{ fmt(v.createdat) }}</div>
              <div class="text-muted">{{ fmt(v.updatedat) }}</div>
            </td>
            <td>
              <div class="d-flex gap-1">
                <select v-model="v.__status" class="form-select form-select-sm" style="width: 140px">
                  <option disabled value="">— set status —</option>
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="archived">archived</option>
                </select>
                <button class="btn btn-sm btn-primary" @click="saveStatus(v)">Save</button>
                <RouterLink
                  class="btn btn-sm btn-success"
                  :to="publicLink(v)"
                  target="_blank"
                >
                  Watch public
                </RouterLink>
                <button
                  class="btn btn-sm btn-danger ms-2"
                  :disabled="deletingId === v.videoid"
                  @click="onDelete(v.videoid)"
                >
                  <span v-if="deletingId === v.videoid" class="spinner-border spinner-border-sm me-1"></span>
                  Delete
                </button>
              </div>
              <div v-if="v.__error" class="text-danger small mt-1">{{ v.__error }}</div>
              <div v-if="v.__ok" class="text-success small mt-1">Saved</div>
            </td>
          </tr>
          <tr v-if="!items.length">
            <td colspan="7" class="text-center text-muted">No items</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/services/api'
import { deleteHighlight } from '@/services/highlights';

const q = ref('')
const status = ref('')
const page = ref(1)
const limit = ref(12)
const total = ref(0)
const items = ref([])
const deletingId = ref(null)
const pages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)))

function fmt(d){ try { return new Date(d).toLocaleString('vi-VN') } catch { return d } }
function statusClass(s){
  switch ((s || '').toLowerCase()) {
    case 'draft': return 'bg-warning text-dark'
    case 'published': return 'bg-success'
    case 'archived': return 'bg-secondary'
    default: return 'bg-light text-dark'
  }
}
function publicLink(v){
  // link sang trang public detail (Step 7)
  return { name: 'HighlightDetail', params: { id: String(v.videoid) } }
}

async function load(){
  const r = await api.get('/highlights', {
    params: { q: q.value, status: status.value, page: page.value, limit: limit.value }
  })
  const list = r.data?.items || []
  items.value = list.map(x => ({ ...x, __status: '', __error: '', __ok: false }))
  total.value = r.data?.total || list.length
}

function reload(){ page.value = 1; load() }
function go(n){ if(n<1 || n>pages.value) return; page.value = n; load() }

async function onDelete(id) {
  if (!confirm('Xoá highlight này? HLS/MP4/thumbnail sẽ bị xoá khỏi server.')) return;
  try {
    deletingId.value = id;
    await deleteHighlight(id);

    // Refetch để đồng bộ với server-side paging
    await load();

    // Nếu trang hiện tại rỗng và còn trang trước đó -> lùi 1 trang và load lại
    if (items.value.length === 0 && page.value > 1) {
      page.value = page.value - 1;
      await load();
    }
  } catch (e) {
    alert(e?.response?.data?.message || 'Xoá thất bại');
  } finally {
    deletingId.value = null;
  }
}

async function saveStatus(v){
  v.__error = ''; v.__ok = false
  if (!v.__status) { v.__error = 'Choose the status'; return }
  try {
    await api.patch(`/highlights/${v.videoid}`, { status: v.__status })
    v.status = v.__status
    v.__status = ''
    v.__ok = true
    setTimeout(() => (v.__ok = false), 1200)
  } catch (e) {
    v.__error = e?.response?.data?.message || 'Update failed'
  }
}

onMounted(load)
</script>
