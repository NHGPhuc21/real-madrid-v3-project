<!-- frontend/src/pages/News.vue -->
<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-end mb-3">
      <div>
        <h2 class="mb-1">News</h2>
        <small class="text-muted">All articles from the club</small>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-3">
      <div class="btn-group flex-wrap">
        <button
          class="btn"
          :class="activeTopic === 'all' ? 'btn-primary' : 'btn-outline-primary'"
          @click="activeTopic = 'all'"
        >
          All
        </button>
        <button
          v-for="t in topics"
          :key="t"
          class="btn"
          :class="activeTopic === t ? 'btn-primary' : 'btn-outline-primary'"
          @click="activeTopic = t"
        >
          {{ labelOf(t) }}
        </button>
      </div>
    </div>

    <!-- List -->
    <div class="row g-3">
      <div
        class="col-md-6 col-lg-4"
        v-for="n in filtered"
        :key="n.newid || n.id || n.newsid"
      >
        <div class="card h-100 shadow-sm">
          <img
            v-if="getThumb(n)"
            :src="getThumb(n)"
            alt=""
            class="card-img-top"
            style="aspect-ratio: 16/9; object-fit: cover;"
          />
          <div class="card-body d-flex flex-column">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="badge text-bg-light text-dark">
                {{ labelOf((n.topic || 'general').toLowerCase()) }}
              </span>
              <small class="text-muted">
                {{ fmtDate(n.publishdate || n.createdat || n.created_at) }}
              </small>
            </div>

            <h6 class="card-title">{{ n.title }}</h6>
            <p class="card-text small text-muted">
              {{ short(n.content, 140) }}
            </p>

            <!-- Nút pill gradient giống Watch Players -->
            <RouterLink
              class="news-read-btn mt-auto"
              :to="`/news/${n.newid || n.id || n.newsid}`"
            >
              Read article
            </RouterLink>
          </div>
        </div>
      </div>

      <div v-if="!filtered.length" class="text-muted py-5 text-center">
        No articles found.
      </div>
    </div>
  </div>
</template>

<script setup>
import api from '@/services/api'
import { ABS } from '@/services/api'
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

const list = ref([])
const activeTopic = ref('all')

const builtinLabels = {
  featured: 'Special News',
  madridistas: 'Madridistas News',
  club: 'Club News',
  academy: 'Academy News',
  sponsor: 'Sponsor News',
  general: 'General News'
}
function labelOf(t) { return builtinLabels[t] || t }

// 🔥 SỬA TẠI ĐÂY — dùng ABS() để load hình từ backend
function getThumb(n) {
  return ABS(n.imageurl)
}

function fmtDate(v) {
  if (!v) return ''
  const d = new Date(v)
  return isNaN(d) ? String(v) : d.toLocaleDateString()
}
function short(t, n) {
  if (!t) return ''
  return t.length > n ? t.slice(0, n) + '…' : t
}

const topics = computed(() => {
  const set = new Set()
  list.value.forEach(n =>
    set.add(String(n.topic || 'general').toLowerCase())
  )
  return Array.from(set)
})

const filtered = computed(() => {
  if (activeTopic.value === 'all') return list.value
  return list.value.filter(
    n => String(n.topic || 'general').toLowerCase() === activeTopic.value
  )
})

async function load() {
  const r = await api.get('/news')
  list.value = (r.data || []).filter(n => n.ispublished !== false)
}

onMounted(load)
</script>

<style scoped>
.news-read-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 1.8rem;
  border-radius: 999px;
  border: none;
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffffff;
  text-decoration: none;
  background: linear-gradient(90deg, #3b39f2, #9b6dfc);
  box-shadow: 0 6px 20px rgba(59, 57, 242, 0.35);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    opacity 0.15s ease;
}

.news-read-btn:hover {
  opacity: 0.96;
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(59, 57, 242, 0.45);
}

.news-read-btn:focus-visible {
  outline: 2px solid rgba(59, 57, 242, 0.7);
  outline-offset: 2px;
}
</style>
