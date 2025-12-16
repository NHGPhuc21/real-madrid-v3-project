<!-- MatchScoreboard.vue -->
<template>
  <section v-if="match" class="rm-scoreboard text-white">
    <div class="scoreboard-inner">
      <!-- Left info -->
      <div class="left-info small text-opacity-75">
        <div class="fw-semibold">{{ match.competition || 'Match' }}</div>
        <div v-if="match.stadium">{{ match.stadium }}</div>
        <div class="mt-1">
          <i class="bi bi-tv"></i>
        </div>
      </div>

      <!-- Center score -->
      <div class="score-center d-flex align-items-center gap-4 text-center">
        <!-- Home team -->
        <div class="d-flex align-items-center gap-2">
          <img :src="homeLogo(match)" alt="home" class="club-logo" />
          <span class="h5 mb-0 d-none d-md-inline">{{ homeName(match) }}</span>
        </div>

        <div class="display-6 fw-bold">
          {{ match.homescore }} : {{ match.awayscore }}
        </div>

        <!-- Away team -->
        <div class="d-flex align-items-center gap-2">
          <img :src="awayLogo(match)" alt="away" class="club-logo" />
          <span class="h5 mb-0 d-none d-md-inline">{{ awayName(match) }}</span>
        </div>
      </div>

      <div class="right-gap"></div>
    </div>
  </section>
</template>

<script setup>
import { ABS } from '@/services/api'

const props = defineProps({
  match: { type: Object, default: null }
})

const RM_LOGO = '/assets/logo/real.png'
const FALLBACK_OPPONENT = '/assets/logo/default-opponent.png'

// Lấy logo opponent đúng chuẩn
function opponentLogo(m) {
  const url = m.opponentteamlogourl
  if (url) return ABS(url)     // nếu DB có logo upload
  return FALLBACK_OPPONENT     // fallback
}

function homeLogo(m) {
  return m.ishomematch ? RM_LOGO : opponentLogo(m)
}
function awayLogo(m) {
  return m.ishomematch ? opponentLogo(m) : RM_LOGO
}

function homeName(m) {
  return m.ishomematch ? 'Real Madrid' : (m.opponentteam || 'Opponent')
}
function awayName(m) {
  return m.ishomematch ? (m.opponentteam || 'Opponent') : 'Real Madrid'
}
</script>

<style scoped>
.rm-scoreboard {
  background: linear-gradient(90deg, #0d2340, #0f2b55 60%, #0d2340);
  width: 100%;
  --side-col: 140px;

  /* 🔥 Hiệu ứng fade-in nhẹ */
  animation: fadeIn 0.8s ease-out;
}

.scoreboard-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 16px;
  display: grid;
  grid-template-columns: var(--side-col) 1fr var(--side-col);
  align-items: center;
  column-gap: 16px;
}

.score-center {
  justify-self: center;

  /* 🔥 Hiệu ứng nhịp đập toàn khối */
  animation: pulseGlow 3.5s infinite ease-in-out;
}

.club-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;

  /* 🔥 Light glow nhẹ cho logo */
  filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.5));
}

.display-6 {
  position: relative;
  letter-spacing: 2px;

  /* 🔥 Viền neon + animation đổi màu */
  animation: scoreFlash 2.8s infinite ease-in-out;
}

/* Mobile optimize */
.left-info, .right-gap { min-width: var(--side-col); }

@media (max-width: 992px) {
  .rm-scoreboard { --side-col: 120px; }
}
@media (max-width: 576px) {
  .rm-scoreboard { --side-col: 96px; }
  .club-logo { width: 32px; height: 32px; }
  .display-6 { font-size: 1.7rem; }
}

/* ========================
   🔥 ANIMATIONS
   ======================== */

/* mượt khi xuất hiện */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* nhịp đập logo + tên */
@keyframes pulseGlow {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.035);
  }
}

/* Đổi màu + glow nhịp rất đẹp (Option D mix) */
@keyframes scoreFlash {
  0% {
    color: #00ff85;
    text-shadow: 0 0 10px #00ff85, 0 0 25px #00ff8544;
    transform: scale(1);
  }

  40% {
    color: #5fc7ff;
    text-shadow: 0 0 12px #5fc7ff, 0 0 26px #5fc7ff44;
    transform: scale(1.08);
  }

  70% {
    color: #ff3366;
    text-shadow: 0 0 12px #ff3366, 0 0 26px #ff336644;
    transform: scale(1.05);
  }

  100% {
    color: #00ff85;
    text-shadow: 0 0 10px #00ff85, 0 0 25px #00ff8544;
    transform: scale(1);
  }
}
</style>

