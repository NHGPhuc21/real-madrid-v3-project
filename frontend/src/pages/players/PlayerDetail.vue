<!-- frontend/src/pages/players/PlayerDetail.vue -->
<template>
  <div class="container py-4">
    <RouterLink
  :to="{ name: 'Players' }"
  class="back-btn-custom mb-4 d-inline-block text-center"
>
  Back to Players
</RouterLink>


    <div v-if="loading" class="text-muted">Loading player…</div>
    <div v-else-if="error" class="text-danger">{{ error }}</div>
    <div v-else-if="!player" class="text-muted">Player not found.</div>
      <div v-else>
  <div class="row">

    <!-- ============ CỘT TRÁI ============ -->
    <div class="col-md-4">

      <!-- Avatar + tên + CLB hiện tại (chung 1 khung) -->
      <div class="card mb-4 player-header-card text-center">
        <div class="card-body">
          <div class="player-avatar-wrapper mb-3 mx-auto">
            <img :src="avatarSrc(player.imageurl)" alt="" class="player-avatar" />
          </div>
          <h2 class="mb-1 fs-4">{{ player.fullname }}</h2>
          <div class="text-muted small">
            Đội bóng hiện tại:
            <strong class="text-success">Real Madrid</strong>
            <span v-if="player.nationality">, {{ player.nationality }}</span>
          </div>
        </div>
      </div>

      <!-- Thông tin cá nhân -->
      <div class="card mb-4 info-card">
        <div class="card-header fw-bold">personal information</div>
        <div class="table-responsive">
          <table class="table table-sm mb-0">
            <tbody>
              <tr>
                <th>Full Name</th>
                <td>{{ player.fullname }}</td>
              </tr>
              <tr v-if="player.birthdate">
                <th>Date of Birth</th>
                <td>{{ formatBirthdate(player.birthdate) }}</td>
              </tr>
              <tr v-if="player.nationality">
                <th>Nationality</th>
                <td>{{ player.nationality }}</td>
              </tr>
              <tr v-if="player.height">
                <th>Height</th>
                <td>{{ player.height }}</td>
              </tr>
              <tr v-if="player.weight">
                <th>Weight</th>
                <td>{{ player.weight }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Thông tin về CLB -->
      <div class="card mb-4 info-card">
        <div class="card-header fw-bold">Information of club</div>
        <div class="table-responsive">
          <table class="table table-sm mb-0">
            <tbody>
              <tr v-if="player.position">
                <th>Position Play</th>
                <td>{{ player.position }}</td>
              </tr>
              <tr v-if="player.shirtnumber">
                <th>Number</th>
                <td>{{ player.shirtnumber }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- ============ CỘT PHẢI ============ -->
    <div class="col-md-8">

      <!-- Career statistics -->
      <div v-if="player.career?.length" class="mb-4">
        <h4 class="mb-2">Career statistics</h4>

        <ul class="nav nav-pills career-tabs mb-3">
          <li class="nav-item" v-for="tab in careerTabs" :key="tab.key">
            <button
              class="nav-link"
              :class="{ active: activeCareerTab === tab.key }"
              @click="activeCareerTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </li>
        </ul>

        <div class="table-responsive">
          <table class="table table-sm align-middle">
            <thead class="table-light">
              <tr>
                <th>Season</th>
                <th class="text-end">Appearances</th>
                <th class="text-end">Goals</th>
                <th class="text-end">Assists</th>
                <th class="text-end">Yellow</th>
                <th class="text-end">Red</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in filteredCareer" :key="c.id">
                <td>{{ c.season }}</td>
                <td class="text-end">{{ c.appearances }}</td>
                <td class="text-end">{{ c.goals }}</td>
                <td class="text-end">{{ c.assists }}</td>
                <td class="text-end">{{ c.yellowcards ?? 0 }}</td>
                <td class="text-end">{{ c.redcards ?? 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Transfers -->
      <div v-if="player.transfers?.length" class="mb-4">
        <h4 class="mb-2">Transfers</h4>
        <div class="table-responsive">
          <table class="table table-sm align-middle">
            <thead class="table-light">
              <tr>
                <th style="width:100px">Year</th>
                <th>From</th>
                <th>To</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in player.transfers" :key="t.id">
                <td>{{ t.year }}</td>
                <td>{{ t.fromclub }}</td>
                <td>{{ t.toclub }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Injuries -->
      <div v-if="player.injuries?.length">
        <h4 class="mb-2">Injuries</h4>
        <div class="table-responsive">
          <table class="table table-sm align-middle">
            <thead class="table-light">
              <tr>
                <th>Injury</th>
                <th style="width:140px">From</th>
                <th style="width:140px">To</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inj in player.injuries" :key="inj.id">
                <td>{{ inj.injury }}</td>
                <td>{{ fmtDate(inj.startdate) }}</td>
                <td>{{ fmtDate(inj.enddate) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</div>


    

    </div>
  
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import api, { ABS } from '@/services/api'

const route   = useRoute()
const player  = ref(null)
const loading = ref(false)
const error   = ref('')

// Avatar: dùng ABS cho /uploads/, fallback sang assets/players
function avatarSrc (filename) {
  if (!filename) return ''

  if (filename.startsWith('http') || filename.startsWith('data:')) {
    return filename
  }

  if (filename.startsWith('/uploads/')) {
    return ABS(filename)
  }

  // fallback ảnh local trong assets/players
  return new URL(`../../assets/players/${filename}`, import.meta.url).href
}

function formatBirthdate (d) {
  if (!d) return ''
  try {
    const src = (typeof d === 'string' && d.includes(' ') && !d.endsWith('Z'))
      ? d.replace(' ', 'T')
      : d
    const date = new Date(src)
    if (isNaN(date)) return ''
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return d
  }
}

// Tabs career
const careerTabs = [
  { key: 'league',       label: 'Laliga' },
  { key: 'cup',          label: 'Copa del Rey' },
  { key: 'continental',  label: 'UEFA Champion League' },
  { key: 'national',     label: 'National Team' }
]

const activeCareerTab = ref('league')

// Lọc career theo category (mặc định nếu không có category thì xem là 'league')
const filteredCareer = computed(() => {
  const list = player.value?.career || []
  return list.filter((c) => (c.category || 'league') === activeCareerTab.value)
})

function fmtDate (d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('vi-VN')
  } catch {
    return d
  }
}

async function loadPlayer () {
  loading.value = true
  error.value = ''
  try {
    const id = route.params.id
    const r  = await api.get(`/players/${id}`)
    player.value = r.data || null
  } catch (e) {
    console.error('loadPlayer error', e)
    error.value = 'Failed to load player.'
  } finally {
    loading.value = false
  }
}

onMounted(loadPlayer)
</script>

<style scoped>
/* Avatar tròn giống Home */
.player-avatar-wrapper {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border: 3px solid #625d5d;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.player-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.card-header {
  background: #f3f3f3;
  font-weight: 600;
}

table th {
  width: 130px;
  white-space: nowrap;
}
.player-header-card {
  border-radius: 12px;
  overflow: hidden;
}
.info-card .card-header {
  text-align: center;
}

.player-meta-row-top {
  display: flex;
  flex-wrap: wrap;
}

/* Career tabs giữ nguyên style cũ */
.career-tabs .nav-link {
  border-radius: 0;
  padding: 0.5rem 1.25rem;
  color: #155724;
  background-color: #e9f7ef;
  margin-right: 4px;
  font-weight: 600;
}

.career-tabs .nav-link.active {
  color: #fff;
  background-color: #28a745; /* xanh lá như hình */
}

.career-tabs .nav-link:hover {
  background-color: #cdeccd;
}
.back-btn-custom {
  display: inline-block;
  padding: 10px 26px;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(90deg, #3b39f2, #9b6dfc);
  border-radius: 40px;
  text-decoration: none;
  transition: 0.2s ease-in-out;
}

.back-btn-custom:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}

</style>
