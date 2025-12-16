<!-- frontend/src/pages/Players.vue -->
<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h1 class="h3 mb-0">Players</h1>
      <RouterLink
  :to="{ path: '/' }"
  class="back-btn-custom d-inline-block text-center"
>
  Back to Home
</RouterLink>

    </div>

    <div v-if="loading" class="text-muted">Loading players…</div>
    <div v-else-if="error" class="text-danger">{{ error }}</div>
    <div v-else-if="!players.length" class="text-muted">No players.</div>

    <!-- ====== HIỂN THỊ THEO NHÓM VỊ TRÍ ====== -->
    <div v-else>
      <!-- Mỗi nhóm: GK / CB / CM / CF -->
      <section
        v-for="group in groupedPlayers"
        :key="group.key"
        class="mb-5"
      >
        <!-- Tiêu đề nhóm (Thủ môn / Hậu vệ / …) -->
        <h3 class="mb-3 position-heading">
          {{ group.label }}
        </h3>

        <div class="row g-3">
          <div
            class="col-12 col-sm-6 col-md-4 col-lg-3"
            v-for="p in group.players"
            :key="p.playerid"
          >
            <!-- Bọc cả card trong RouterLink để click được -->
            <RouterLink
              :to="{ name: 'PlayerDetail', params: { id: p.playerid } }"
              class="text-decoration-none text-reset"
            >
              <div class="card h-100 player-card">
                <!-- Avatar tròn giống Home -->
                <div class="player-img-wrapper">
                  <div class="player-avatar-wrapper">
                    <img
                      :src="avatarSrc(p.imageurl)"
                      alt=""
                      class="player-avatar"
                    />
                  </div>
                </div>

                <div class="card-body player-info">
                  <!-- Số áo -->
                  <div v-if="p.shirtnumber" class="player-number mb-1">
                    {{ p.shirtnumber }}
                  </div>

                  <!-- Tên -->
                  <div class="player-name fw-bold mb-2">
                    {{ p.fullname }}
                  </div>

                  <!-- Vị trí -->
                  <div v-if="p.position" class="player-meta-row">
                    <span class="player-meta-label">Position Play</span>
                    <span class="player-meta-value">{{ p.position }}</span>
                  </div>

                  <!-- Ngày sinh -->
                  <div v-if="p.birthdate" class="player-meta-row">
                    <span class="player-meta-label">Date of Birth</span>
                    <span class="player-meta-value">
                      {{ formatBirthdate(p.birthdate) }}
                    </span>
                  </div>

                  <!-- Quốc tịch -->
                  <div v-if="p.nationality" class="player-meta-row">
                    <span class="player-meta-label">Nationality</span>
                    <span class="player-meta-value">{{ p.nationality }}</span>
                  </div>
                </div>
              </div>
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- Nhóm “khác” nếu có cầu thủ không thuộc GK/CB/CM/CF -->
      <section v-if="othersGroup.players.length" class="mb-5">
        <h3 class="mb-3 position-heading">Other</h3>
        <div class="row g-3">
          <div
            class="col-12 col-sm-6 col-md-4 col-lg-3"
            v-for="p in othersGroup.players"
            :key="p.playerid"
          >
            <RouterLink
              :to="{ name: 'PlayerDetail', params: { id: p.playerid } }"
              class="text-decoration-none text-reset"
            >
              <div class="card h-100 player-card">
                <div class="player-img-wrapper">
                  <div class="player-avatar-wrapper">
                    <img
                      :src="avatarSrc(p.imageurl)"
                      alt=""
                      class="player-avatar"
                    />
                  </div>
                </div>

                <div class="card-body player-info">
                  <div v-if="p.shirtnumber" class="player-number mb-1">
                    {{ p.shirtnumber }}
                  </div>
                  <div class="player-name fw-bold mb-2">
                    {{ p.fullname }}
                  </div>

                  <div v-if="p.position" class="player-meta-row">
                    <span class="player-meta-label">Position Play</span>
                    <span class="player-meta-value">{{ p.position }}</span>
                  </div>
                  <div v-if="p.birthdate" class="player-meta-row">
                    <span class="player-meta-label">Date of Birth</span>
                    <span class="player-meta-value">
                      {{ formatBirthdate(p.birthdate) }}
                    </span>
                  </div>
                  <div v-if="p.nationality" class="player-meta-row">
                    <span class="player-meta-label">Nationality</span>
                    <span class="player-meta-value">{{ p.nationality }}</span>
                  </div>
                </div>
              </div>
            </RouterLink>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import api, { ABS } from '@/services/api'

const players = ref([])
const loading = ref(false)
const error = ref('')

// === mapping vị trí -> tiêu đề tiếng Việt ===
const POSITION_GROUPS = [
  { key: 'GK', label: 'GoalKeeper' },
  { key: 'CB', label: 'Defender' },
  { key: 'CM', label: 'Midfielder' },
  { key: 'CF', label: 'Striker' }
]

// format ngày sinh giống Home.vue
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

// avatar giống Home / ManagePlayers
function avatarSrc (filename) {
  if (!filename) return ''

  if (filename.startsWith('http') || filename.startsWith('data:')) {
    return filename
  }

  if (filename.startsWith('/uploads/')) {
    return ABS(filename)
  }

  return new URL(`../assets/players/${filename}`, import.meta.url).href
}

async function loadPlayers () {
  loading.value = true
  error.value = ''
  try {
    const r = await api.get('/players')
    players.value = r.data || []
  } catch (e) {
    console.error('loadPlayers error:', e)
    error.value = 'Failed to load players.'
  } finally {
    loading.value = false
  }
}

// === computed group ===
const groupedPlayers = computed(() => {
  const map = {}
  POSITION_GROUPS.forEach(g => { map[g.key] = [] })

  for (const p of players.value) {
    const code = (p.position || '').toUpperCase()
    if (map[code]) {
      map[code].push(p)
    }
  }

  return POSITION_GROUPS
    .filter(g => map[g.key].length)
    .map(g => ({
      key: g.key,
      label: g.label,
      players: map[g.key]
    }))
})

// cầu thủ không thuộc GK/CB/CM/CF
const othersGroup = computed(() => {
  const known = new Set(POSITION_GROUPS.map(g => g.key))
  const list = players.value.filter(p => !known.has((p.position || '').toUpperCase()))
  return { key: 'OTHERS', label: 'Khác', players: list }
})

onMounted(loadPlayers)
</script>

<style scoped>
.position-heading {
  font-weight: 700;
  font-size: 1.3rem;
  margin-bottom: 1.25rem;
}

/* Avatar tròn giống Home */
.player-img-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.player-avatar-wrapper {
  width: 160px;
  height: 160px;
  margin: 0 auto;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 3px solid #625d5d;

}

.player-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Info */
.player-info {
  text-align: left;
  padding: 16px 20px 20px;
}

.player-number {
  font-size: 1.6rem;
  font-weight: 700;
}

.player-name {
  font-size: 1rem;
  margin-bottom: 0.4rem;
}

.player-meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 0.2rem;
}

.player-meta-label {
  color: #555;
}

.player-meta-value {
  font-weight: 500;
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
/* ================================
   🔥 Dark Mode – Player Card
===================================*/
html[data-bs-theme="dark"] .player-card {
  background-color: #2c2c2c !important;
  color: #f0f0f0 !important;
  border-color: #444 !important;
}

html[data-bs-theme="dark"] .player-meta-label {
  color: #cccccc !important;
}

html[data-bs-theme="dark"] .player-meta-value {
  color: #ffffff !important;
}


</style>
