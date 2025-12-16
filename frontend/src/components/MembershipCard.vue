<!-- frontend/src/components/MembershipCard.vue -->
<template>
  <div class="membership-card" :class="planClass">
    <div class="mc-left">
      <!-- Logo Real Madrid -->
      <div class="club-logo-wrap">
        <img src="/assets/logo/real.png" alt="Real Madrid" />
      </div>

      <!-- Tên & thời gian -->
      <div class="member-info">
        <div class="member-name">{{ displayName }}</div>
        <div v-if="since" class="member-since">
          Madridista since {{ since }}
        </div>
      </div>
    </div>

    <!-- Badge BASIC / PREMIUM -->
    <div class="mc-right">
      <span class="plan-pill">{{ planLabel }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  user: { type: Object, default: null },
  plan: { type: Object, default: null },
  // Profile.vue đang truyền chuỗi đã format sẵn
  since: { type: String, default: '' }
})

const displayName = computed(() =>
  props.user?.fullname ||
  props.user?.name ||
  props.user?.username ||
  'Madridista'
)

const planCode = computed(() =>
  (props.plan?.plan_code || 'basic').toLowerCase()
)

const planLabel = computed(() =>
  planCode.value === 'premium' ? 'PREMIUM' : 'BASIC'
)

const planClass = computed(() =>
  planCode.value === 'premium' ? 'is-premium' : 'is-basic'
)
</script>

<style scoped>
.membership-card {
  position: relative;
  border-radius: 24px;
  padding: 24px 32px;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  overflow: hidden;

  /* nền kiểu gradient + hơi “tech” giống Real */
  background: radial-gradient(circle at top left,
              #3a6cff 0,
              #141852 55%,
              #050b24 100%);
  box-shadow: 0 12px 40px rgba(5, 11, 36, 0.55);
}

/* Vân chấm chấm */
.membership-card::before {
  content: '';
  position: absolute;
  inset: -40%;
  background-image:
    radial-gradient(circle at 0 0, rgba(255,255,255,.25) 0, transparent 55%),
    radial-gradient(circle at 100% 100%, rgba(255,255,255,.12) 0, transparent 55%);
  opacity: .18;
  mix-blend-mode: screen;
}

.mc-left,
.mc-right {
  position: relative;
  z-index: 1;
}

.mc-left {
  display: flex;
  align-items: center;
  gap: 18px;
}

.club-logo-wrap {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.25);
}

.club-logo-wrap img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.member-name {
  font-size: 1.4rem;
  font-weight: 700;
}

.member-since {
  font-size: 0.9rem;
  opacity: 0.8;
}

.mc-right {
  display: flex;
  align-items: flex-start;
}

.plan-pill {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: rgba(255,255,255,0.15);
  box-shadow: 0 0 0 1px rgba(255,255,255,0.25);
}

/* Màu riêng cho Premium */
.membership-card.is-premium {
  background: radial-gradient(circle at top left,
              #7b2cff 0,
              #4330ff 40%,
              #050b24 100%);
}

.membership-card.is-premium .plan-pill {
  background: rgba(255,215,0,0.22);
  box-shadow: 0 0 0 1px rgba(255,215,0,0.55);
}

/* Responsive cho mobile */
@media (max-width: 576px) {
  .membership-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
  }

  .mc-right {
    align-self: flex-end;
  }
}
</style>
