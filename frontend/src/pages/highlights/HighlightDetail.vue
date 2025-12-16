<!-- frontend/src/pages/highlights/HighlightDetail.vue -->
<template>
  <div class="container py-4">
    <div class="d-flex align-items-center mb-3">
      <h2 class="mb-0 me-3">{{ detail?.title || 'Highlight' }}</h2>
      <RouterLink class="btn btn-outline-secondary btn-sm" to="/highlights">← Back</RouterLink>
    </div>

    <div class="row g-4">
      <!-- LEFT: Player + meta -->
      <div class="col-lg-8">
        <div class="ratio ratio-16x9 mb-3">
          <!-- DÙNG ABS() để không bị lấy từ 5173 -->
          <video
            v-if="videoSrc"
            class="w-100 h-100"
            :src="videoSrc"
            controls
            playsinline
            @error="onErr"
          />
          <video v-else class="w-100 h-100" controls playsinline />
        </div>

        <div class="text-muted small">
          <span>{{ fmt(detail?.createdat) }}</span>
          <span class="mx-2">•</span>
          <span>{{ (detail?.views ?? 0).toLocaleString('vi-VN') }} views</span>
        </div>

        <p class="mt-3" v-if="detail?.description">{{ detail.description }}</p>
      </div>

      <!-- RIGHT: Recommendations -->
      <div class="col-lg-4">
        <div class="card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="mb-0">Gợi ý khác</h6>
              <select
                v-model="sortBy"
                class="form-select form-select-sm"
                style="width:auto"
                @change="loadRecs"
                title="Sắp xếp"
              >
                <option value="recent">Newest</option>
                <option value="views_desc">Xem nhiều nhất</option>
              </select>
            </div>

            <div v-if="recs.length === 0" class="text-muted small">Chưa có gợi ý.</div>

            <div v-for="h in recs" :key="h.videoid" class="d-flex gap-2 mb-3">
              <RouterLink :to="{ name: 'HighlightDetail', params: { id: String(h.videoid) } }" class="text-decoration-none d-flex">
                <img
                  :src="h.thumburl ? ABS(h.thumburl) : fallbackThumb"
                  class="rounded"
                  style="width: 120px; height: 68px; object-fit: cover"
                  :alt="h.title"
                />
              </RouterLink>
              <div class="flex-grow-1">
                <RouterLink
                  class="fw-semibold text-decoration-none"
                  :to="{ name: 'HighlightDetail', params: { id: String(h.videoid) } }"
                >
                  <div class="line-clamp-2">{{ h.title }}</div>
                </RouterLink>
                <div class="text-muted small mt-1">
                  {{ fmt(h.createdat) }} · {{ (h.views ?? 0).toLocaleString('vi-VN') }} views
                </div>
              </div>
            </div>

            <div class="mt-2 text-end">
              <RouterLink class="btn btn-outline-primary btn-sm" to="/highlights">Watch all</RouterLink>
            </div>
          </div>
        </div>
      </div>
      <!-- end sidebar -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { getHighlight, addHighlightView, listHighlights } from '@/services/highlights'
import { ABS } from '@/services/api'

const route = useRoute()
const id = ref(Number(route.params.id))
const detail = ref(null)
const recs = ref([])
const sortBy = ref('recent')
const fallbackThumb = '/images/placeholder-16x9.jpg'

function fmt(d){ try { return new Date(d).toLocaleString('vi-VN') } catch { return d } }

// URL tuyệt đối cho MP4
const videoSrc = computed(() => (detail.value?.sourcemp4 ? ABS(detail.value.sourcemp4) : ''))

function onErr(e){
  console.error('[VIDEO] mp4 error', e?.target?.error || e)
}

async function loadDetail() {
  detail.value = await getHighlight(id.value)
  try { await addHighlightView(id.value) } catch {}
}

async function loadRecs() {
  const { items = [] } = await listHighlights({
    status: 'published',
    sort: sortBy.value,
    limit: 6,
    excludeId: id.value
  })
  recs.value = items
}

onMounted(async () => {
  await loadDetail()
  await loadRecs()
})

watch(() => route.params.id, async (v) => {
  id.value = Number(v)
  await loadDetail()
  await loadRecs()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
