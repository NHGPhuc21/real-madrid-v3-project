<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="mb-0">Highlights</h3>

      <div class="d-flex gap-2">
        <input
          v-model="q"
          class="form-control"
          placeholder="Find by Title/Description"
          @keyup.enter="reload"
          style="min-width: 260px"
        />
        <button class="btn btn-outline-primary" @click="reload">Find</button>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-12 col-sm-6 col-md-4 col-lg-3" v-for="v in items" :key="v.videoid">
        <RouterLink class="text-decoration-none" :to="{ name:'HighlightDetail', params:{ id:String(v.videoid) } }">
          <div class="card h-100">
            <div class="ratio ratio-16x9 bg-light">
              <img
                v-if="v.thumburl"
                class="card-img-top object-fit-cover"
                :src="ABS(v.thumburl)"
                :alt="v.title"
              />
              <div v-else class="d-flex align-items-center justify-content-center text-muted">
                No thumbnail
              </div>
            </div>

            <div class="card-body">
              <div class="fw-semibold text-dark text-truncate">{{ v.title }}</div>
              <div class="text-muted small text-truncate-2">{{ v.description }}</div>
            </div>
            <div class="card-footer d-flex justify-content-between small text-muted">
              <span>{{ fmt(v.createdat) }}</span>
              <span>{{ v.views || 0 }} views</span>
            </div>
          </div>
        </RouterLink>
      </div>

      <div v-if="!items.length" class="col-12 text-center text-muted py-5">
        There are no highlights.
      </div>
    </div>

    <div class="d-flex justify-content-center my-3" v-if="pages > 1">
      <nav>
        <ul class="pagination mb-0">
          <li class="page-item" :class="{disabled: page === 1}">
            <button class="page-link" @click="go(page-1)">«</button>
          </li>
          <li class="page-item" v-for="n in pages" :key="n" :class="{active: page === n}">
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
import api, { ABS } from '@/services/api'

const q = ref('')
const status = ref('published') // mặc định public list
const page = ref(1)
const limit = ref(12)
const total = ref(0)
const items = ref([])

const pages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)))

function fmt(d){ try { return new Date(d).toLocaleDateString('vi-VN') } catch { return d } }
function go(n){ if(n<1 || n>pages.value) return; page.value = n; load() }
function reload(){ page.value = 1; load() }

async function load() {
  const r = await api.get('/highlights', {
    params: { q: q.value, status: status.value, page: page.value, limit: limit.value }
  })
  items.value = r.data?.items || []
  total.value = r.data?.total || items.value.length
}

onMounted(load)

defineExpose({ ABS }) // dùng trong template
</script>

<style scoped>
.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.object-fit-cover { object-fit: cover; }
</style>
