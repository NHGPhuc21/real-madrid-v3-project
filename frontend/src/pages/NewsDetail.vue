<template>
  <div class="container py-4" v-if="!loading">
    <nav class="mb-3">
      
    </nav>

    <h2 class="mb-2">{{ news.title }}</h2>
    <div class="text-muted mb-3">
      {{ fmtDate(news.publishdate || news.created_at) }}
    </div>

    <!-- 🔥 SỬA TẠI ĐÂY: dùng ABS() để load ảnh từ backend -->
    <img
      v-if="news.imageurl"
      :src="ABS(news.imageurl)"
      class="news-hero mb-3"
      alt=""
    />

    <div class="lead" style="white-space: pre-line;">
      {{ news.content }}
    </div>
  </div>

  <div class="container py-5 text-center" v-else>
    Loading…
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import api, { ABS } from '@/services/api'   // 🔥 import ABS()

const route = useRoute()
const id = route.params.id
const news = ref({})
const loading = ref(true)

function fmtDate (v) {
  if (!v) return ''
  const d = new Date(v)
  return isNaN(d) ? String(v) : d.toLocaleString()
}

onMounted(async () => {
  try {
    // backend có GET /api/news/:id
    const r = await api.get(`/news/${id}`)
    news.value = r.data || {}
  } catch (e) {
    // fallback nếu chưa có endpoint chi tiết
    try {
      const r2 = await api.get('/news')
      const all = r2.data || []
      news.value = all.find(x =>
        String(x.newid || x.id || x.newsid) === String(id)
      ) || {}
    } catch {}
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.news-hero {
  width: 100%;
  max-width: 500px;   /* KHUNG TỐI ĐA */
  height: auto;
  display: block;
  margin: 20px auto;  /* căn giữa */
  object-fit: contain;
  
}



</style>
