<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from "vue";
import { useEvent, loadActiveEvent } from "./useEvent";

import SnowEffect from "@/components/events/christmas/SnowEffect.vue";
import ChristmasBanner from "@/components/events/christmas/ChristmasBanner.vue";
import ChristmasSides from "@/components/events/christmas/ChristmasSides.vue";
import ChristmasLights from "@/components/events/christmas/ChristmasLights.vue";
import ChristmasMusic from "@/components/events/christmas/ChristmasMusic.vue";
import ChristmasGiftBox from "@/components/events/christmas/ChristmasGiftBox.vue";

import BirthdaySides from "@/components/events/birthday/BirthdaySides.vue";
import BirthdayBanner from "@/components/events/birthday/BirthdayBanner.vue";
import BalloonEffect from "@/components/events/birthday/BalloonEffect.vue";
import BirthdayGreetingModal from "@/components/events/birthday/BirthdayGreetingModal.vue";
const showBirthdayModal = ref(false);
const showBirthdayBanner = ref(
  localStorage.getItem("birthday_banner_closed") !== "1"
);

const { activeEvent } = useEvent();
const musicRef = ref(null);
const interactionUnlocked = ref(false);
const isBirthday = computed(
  () => activeEvent.value?.enabled && activeEvent.value.key === "birthday"
);

/**
 * 🎯 Interaction đầu tiên TOÀN SITE
 */
function unlockByInteraction() {
  if (interactionUnlocked.value) return;
  interactionUnlocked.value = true;

  if (
    activeEvent.value?.key === "christmas" &&
    activeEvent.value.music_enabled &&
    activeEvent.value.music_url
  ) {
    musicRef.value?.unlockAndPlay();
  }
}


/**
 * Đăng ký bắt interaction
 */
function registerInteractionListeners() {
  window.addEventListener("click", unlockByInteraction, { once: true });
  window.addEventListener("keydown", unlockByInteraction, { once: true });
  window.addEventListener("touchstart", unlockByInteraction, { once: true });
}

onMounted(async () => {
  await loadActiveEvent();
  registerInteractionListeners();
});

onUnmounted(() => {
  window.removeEventListener("click", unlockByInteraction);
  window.removeEventListener("keydown", unlockByInteraction);
  window.removeEventListener("touchstart", unlockByInteraction);
});

/**
 * Nếu admin bật Christmas khi user đang online
 */
watch(activeEvent, (ev) => {
  if (!ev?.enabled) {
    showBirthdayModal.value = false;
    return;
  }

  // 🎂 Birthday
  if (ev.key === "birthday") {
    // 🔥 RESET local dismiss khi admin bật lại event
    localStorage.removeItem("birthday_banner_closed");
  showBirthdayBanner.value = true;
    showBirthdayModal.value = true;
  }

  // 🎄 Christmas music
  if (
    ev.key === "christmas" &&
    ev.music_enabled &&
    ev.music_url &&
    interactionUnlocked.value
  ) {
    musicRef.value?.unlockAndPlay();
  }
});


/* ===== UI STATES ===== */
const isChristmas = computed(
  () => activeEvent.value?.enabled && activeEvent.value.key === "christmas"
);

const snowEnabled = computed(
  () => isChristmas.value && activeEvent.value?.config?.snow
);

const musicSrc = computed(() => {
  if (!activeEvent.value?.music_url) return "";
  return import.meta.env.VITE_API_BASE.replace("/api", "") + activeEvent.value.music_url;
});
</script>

<template>
  <!-- 🎂 BIRTHDAY (ĐỘC LẬP – LUÔN Ở TRÊN CONTENT) -->
<BirthdayBanner
  v-if="isBirthday && showBirthdayBanner"
  @close="showBirthdayBanner = false"
/>

<BalloonEffect v-if="isBirthday" />
<BirthdaySides v-if="isBirthday" />

<!-- 🎄 CHRISTMAS (GIỮ NGUYÊN) -->
<ChristmasMusic
  v-if="isChristmas && activeEvent.music_enabled"
  ref="musicRef"
  :enabled="true"
  :src="musicSrc"
/>

<ChristmasBanner v-if="isChristmas" />
<ChristmasGiftBox v-if="isChristmas" />
<ChristmasLights v-if="isChristmas" />
<component v-if="snowEnabled" :is="SnowEffect" />
<ChristmasSides v-if="isChristmas" />

<!-- 🎂 MODAL (NÊN ĐỂ GẦN SLOT) -->
<BirthdayGreetingModal
  v-if="showBirthdayModal"
  @close="showBirthdayModal = false"
/>

<!-- ⚽ PAGE CONTENT (SCOREBOARD, HERO, ETC.) -->
<slot />

</template>
