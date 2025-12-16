<!-- frontend/src/components/NotificationBell.vue -->
<template>
  <div class="dropdown">
    <button class="btn btn-outline-light btn-sm position-relative" data-bs-toggle="dropdown">
      <i class="bi bi-bell"></i>
      <span v-if="unreadCount" class="badge rounded-pill bg-danger position-absolute top-0 start-100 translate-middle">
        {{ unreadCount }}
      </span>
    </button>
    <ul class="dropdown-menu dropdown-menu-end" style="width:320px; max-height:360px; overflow:auto">
      <li class="px-3 py-2 d-flex justify-content-between align-items-center">
        <strong>Thông báo</strong>
        <button class="btn btn-link btn-sm p-0" @click="markAll">Đánh dấu đã đọc</button>
      </li>
      <li v-if="!items.length" class="px-3 py-2 text-muted small">Không có thông báo</li>
      <li v-for="n in items" :key="n.id" class="px-3 py-2 border-top">
        <div class="d-flex justify-content-between">
          <div class="fw-semibold">{{ n.title || 'Notification' }}</div>
          <span v-if="!n.read_at" class="badge bg-primary">new</span>
        </div>
        <div class="small text-muted">{{ n.message }}</div>
        <div class="small text-muted">{{ fmt(n.created_at) }}</div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import api from '@/services/api'

const items = ref([])
const unreadCount = ref(0)
let timer = null

function fmt(s){ try { return new Date(s).toLocaleString('vi-VN') } catch { return s } }

async function fetchNoti(){
  const r = await api.get('/notifications')
  items.value = Array.isArray(r.data) ? r.data : []
  unreadCount.value = items.value.filter(x => !x.read_at).length
}
async function markAll(){
  await api.patch('/notifications/read-all')
  await fetchNoti()
}

onMounted(async () => {
  await fetchNoti()
  timer = setInterval(fetchNoti, 15000)  // poll mỗi 15s
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>
