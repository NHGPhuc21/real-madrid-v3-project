<template>
  <!-- 🎄 Seasonal banner -->
  <ChristmasBanner />

  <!-- 💡 Christmas lights around navbar -->
  <ChristmasLights v-if="isChristmas" />

  <!-- ❄ Snow effect -->
  <component
    v-if="snowEnabled"
    :is="SnowEffect"
  />

  <!-- 🎄 Christmas side decorations -->
  <ChristmasSides v-if="isChristmas" />

  <!-- Toàn bộ app -->
  <slot />
</template>

<script setup>
import { computed, onMounted, watch } from "vue";
import { useEvent, loadActiveEvent } from "./useEvent";

/* ===== Seasonal components ===== */
import SnowEffect from "@/components/events/christmas/SnowEffect.vue";
import ChristmasBanner from "@/components/events/christmas/ChristmasBanner.vue";
import ChristmasSides from "@/components/events/christmas/ChristmasSides.vue";
import ChristmasLights from "@/components/events/christmas/ChristmasLights.vue";

/**
 * Global event state (backend-driven)
 * FILE DUY NHẤT điều khiển event & theme toàn site
 */
const { activeEvent } = useEvent();

/**
 * Load active event when app starts
 */
onMounted(() => {
  loadActiveEvent();
});

/**
 * Apply event theme to <html>
 * Ví dụ: data-event-theme="christmas"
 */
watch(
  activeEvent,
  (event) => {
    const html = document.documentElement;

    if (event?.enabled && event.config?.theme) {
      html.setAttribute("data-event-theme", event.config.theme);
    } else {
      html.removeAttribute("data-event-theme");
    }
  },
  { immediate: true }
);

/**
 * Check Christmas mode
 */
const isChristmas = computed(() => {
  return (
    activeEvent.value?.enabled &&
    activeEvent.value.config?.theme === "christmas"
  );
});

/**
 * Snow effect toggle
 */
const snowEnabled = computed(() => {
  return (
    activeEvent.value?.enabled &&
    activeEvent.value.config?.snow
  );
});
</script>
