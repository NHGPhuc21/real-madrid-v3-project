<template>
  <div class="container py-4">
    <h2 class="mb-4 fw-bold">Matches of Real Madrid</h2>

    <div v-if="loading" class="text-muted">Đang tải dữ liệu…</div>

    <div v-else>
      <div class="match-row" v-for="m in list" :key="m.matchid">

        <!-- LEFT TEAM -->
        <div class="left-team">
          <img :src="homeLogo(m)" class="team-logo" />
          <div class="team-name">{{ homeName(m) }}</div>
        </div>

        <!-- CENTER BLOCK -->
        <div class="match-center">

          <!-- LIVE -->
          <template v-if="m.status === 'live'">
            <div class="competition">{{ m.competition }}</div>

            <div class="score live-score">
              {{ m.homescore }}
              <span class="blink-dash">-</span>
              {{ m.awayscore }}
            </div>

            <div class="status live">LIVE</div>
          </template>

          <!-- FINISHED -->
          <template v-else-if="m.status === 'finished'">
            <div class="competition">{{ m.competition }}</div>

            <div class="score finished-score">
              {{ m.homescore }} - {{ m.awayscore }}
            </div>

            <div class="status finished">KT</div>
          </template>

          <!-- UPCOMING -->
          <template v-else>
            <div class="competition">{{ m.competition }}</div>

            <div class="date">
              {{ formatVN(m.matchdatetime) }}
            </div>

            <div class="status upcoming">Up Coming</div>
          </template>

        </div>

        <!-- RIGHT TEAM -->
        <div class="right-team">
          <img :src="awayLogo(m)" class="team-logo" />
          <div class="team-name">{{ awayName(m) }}</div>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api, { ABS } from "@/services/api"

const list = ref([])
const loading = ref(true)

const RM = "/assets/logo/real.png"

function opponentLogo(m) {
  return m.opponentteamlogourl ? ABS(m.opponentteamlogourl) : "/assets/logo/default-opponent.png"
}

function homeLogo(m) { return m.ishomematch ? RM : opponentLogo(m) }
function awayLogo(m) { return m.ishomematch ? opponentLogo(m) : RM }

function homeName(m) { return m.ishomematch ? "Real Madrid" : m.opponentteam }
function awayName(m) { return m.ishomematch ? m.opponentteam : "Real Madrid" }

function formatVN(dt) {
  if (!dt) return ""
  const d = new Date(dt.replace(" ", "T"))
  return d.toLocaleString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  })
}

onMounted(async () => {
  try {
    loading.value = true
    const r = await api.get("/matches")
    list.value = r.data || []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* ======================
   MATCH ROW STYLE
====================== */
.match-row {
  display: grid;
  grid-template-columns: 1fr 140px 1fr;
  gap: 16px;
  align-items: center;
  padding: 18px 10px;
  border-bottom: 1px solid #e9ecef;
}

html[data-bs-theme="dark"] .match-row {
  border-bottom-color: #2f2f2f;
}

/* ======================
   TEAM SIDE
====================== */
.left-team,
.right-team {
  text-align: center;
}

.team-logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
  margin-bottom: 4px;
  filter: drop-shadow(0 2px 2px rgba(0,0,0,0.15));
}

.team-name {
  font-size: 0.95rem;
  font-weight: 600;
}

/* ======================
   CENTER BLOCK
====================== */
.match-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* ===== COMPETITION ===== */
.competition {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #1d2d44;
  margin-bottom: 4px;
  white-space: nowrap;
}

html[data-bs-theme="dark"] .competition {
  color: #d7e6ff;
}

/* ===== SCORE ===== */
.score {
  font-weight: 700;
  margin: 2px 0;
}

/* LIVE score */
.live-score {
  font-size: 1.6rem;
  color: #111;
}
html[data-bs-theme="dark"] .live-score {
  color: #fff;
}

/* Finished score */
.finished-score {
  font-size: 1rem;
  color: #222;
}
html[data-bs-theme="dark"] .finished-score {
  color: #ddd;
}

/* Date (Upcoming) */
.date {
  font-size: 0.95rem;
  font-weight: 600;
  color: #495057;
}
html[data-bs-theme="dark"] .date {
  color: #eaeaea;
}

/* ===== STATUS ===== */
.status {
  font-size: 0.8rem;
  font-weight: 700;
  margin-top: 4px;
}

/* LIVE badge */
.status.live {
  color: #e63946;
  animation: liveBlink 3s infinite;
}

/* FINISHED badge */
.status.finished {
  color: #6c757d;
}

/* UPCOMING badge */
.status.upcoming {
  color: #0d6efd;
}

/* LIVE animation */
@keyframes liveBlink {
  0%,100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ===== LIVE "-" animation ===== */
.blink-dash {
  display: inline-block;
  animation: comboPulse 1.1s infinite ease-in-out;
}

@keyframes comboPulse {
  0% { opacity: 1; transform: scale(1); color: #00ff66; }
  40% { opacity: 0.6; transform: scale(1.4); color: #ff3333; }
  100% { opacity: 1; transform: scale(1); color: #00ff66; }
}
</style>
