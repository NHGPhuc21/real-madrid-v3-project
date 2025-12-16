<template>
  <div class="container py-4">
    <h3 class="mb-3">Cashback Rules</h3>

    <form class="row g-2 mb-3" @submit.prevent="createRule">
      <div class="col-auto"><input class="form-control" v-model="f.name" placeholder="Name"/></div>
      <div class="col-auto"><input type="number" class="form-control" v-model.number="f.percent" placeholder="%"/></div>
      <div class="col-auto"><input type="number" class="form-control" v-model.number="f.max_amount" placeholder="Cap (VND)"/></div>
      <div class="col-auto form-check mt-2"><input type="checkbox" class="form-check-input" v-model="f.active" id="ractive"/><label for="ractive" class="form-check-label">Active</label></div>
      <div class="col-auto"><button class="btn btn-primary">Create</button></div>
    </form>

    <div v-if="loading">Loading…</div>
    <table v-else class="table table-sm">
      <thead><tr><th>ID</th><th>Name</th><th>%</th><th>Cap</th><th>Active</th><th></th></tr></thead>
      <tbody>
        <tr v-for="r in items" :key="r.id">
          <td>#{{r.id}}</td>
          <td>{{r.name}}</td>
          <td>{{r.percent}}</td>
          <td>{{r.max_amount ?? '—'}}</td>
          <td>{{r.active ? 'Yes':'No'}}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-secondary" @click="toggle(r)">{{ r.active?'Deactivate':'Activate'}}</button>
            <button class="btn btn-sm btn-outline-danger" @click="del(r)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup>
import api from '@/services/api'
import { ref, onMounted } from 'vue'
const items=ref([]), loading=ref(false), f=ref({name:'CB 5%', percent:5, max_amount:50000, active:true})
async function load(){ loading.value=true; const r=await api.get('/admin/cashback-rules'); items.value=r.data; loading.value=false }
async function createRule(){ await api.post('/admin/cashback-rules', f.value); f.value={name:'',percent:0,max_amount:null,active:true}; await load() }
async function toggle(r){ await api.patch(`/admin/cashback-rules/${r.id}`, { active: !r.active }); await load() }
async function del(r){ if(!confirm('Delete?'))return; await api.delete(`/admin/cashback-rules/${r.id}`); await load() }
onMounted(load)
</script>
