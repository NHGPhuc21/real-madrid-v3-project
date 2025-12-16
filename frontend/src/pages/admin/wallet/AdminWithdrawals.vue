<template>
  <div class="container py-4">
    <h3 class="mb-3">Withdrawals</h3>

    <div class="d-flex gap-2 mb-3">
      <select class="form-select w-auto" v-model="status">
        <option value="">(all)</option>
        <option>pending</option>
        <option>approved</option>
        <option>processing</option>
        <option>rejected</option>
        <option>success</option>
      </select>
      <input class="form-control w-auto" placeholder="Search id/user" v-model="q"/>
      <button class="btn btn-outline-primary" @click="load">Filter</button>
    </div>

    <div v-if="loading">Loading…</div>
    <div v-else class="table-responsive">
      <table class="table table-sm align-middle">
        <thead><tr>
          <th>ID</th><th>User</th><th>Amount</th><th>Status</th><th>Updated</th><th></th>
        </tr></thead>
        <tbody>
          <tr v-for="it in items" :key="it.id">
            <td>#{{it.id}}</td>
            <td>{{ it.userid }} — {{ it.username }} ({{ it.email }})</td>
            <td class="text-end">{{ money(it.amount) }}</td>
            <td class="text-capitalize">{{ it.status }}</td>
            <td>{{ format(it.updated_at) }}</td>
            <td class="text-end">
              <div class="btn-group">
                <button class="btn btn-sm btn-outline-secondary" @click="setStatus(it,'approved')">Approve</button>
                <button class="btn btn-sm btn-outline-secondary" @click="setStatus(it,'processing')">Processing</button>
                <button class="btn btn-sm btn-outline-danger" @click="setStatus(it,'rejected')">Reject</button>
                <button class="btn btn-sm btn-success" :disabled="it.status==='success'" @click="complete(it)">Complete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
import api from '@/services/api'
import { ref, onMounted } from 'vue'
const items=ref([]), loading=ref(false), status=ref('pending'), q=ref('')

function money(v){ return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(v??0) }
function format(s){ try{ return new Date(s).toLocaleString('vi-VN')}catch{return s} }

async function load(){
  loading.value=true
  try{
    const r = await api.get('/admin/wallet/withdrawals',{ params:{ status: status.value, q: q.value }})
    items.value = r.data.items || []
  } finally { loading.value=false }
}
async function setStatus(it, st){
  if(!confirm(`Set #${it.id} -> ${st}?`)) return
  await api.patch(`/admin/wallet/withdrawals/${it.id}/status`, { status: st })
  await load()
}
async function complete(it){
  if(!confirm(`Complete payout #${it.id}?`)) return
  await api.post(`/admin/wallet/withdrawals/${it.id}/complete`)
  await load()
}
onMounted(load)
</script>
