<script setup>
import { ref, watch, onUnmounted } from "vue";

const props = defineProps({
  enabled: Boolean,
  src: String,
});

const audio = ref(null);
const unlocked = ref(false);

/**
 * Được gọi sau interaction đầu tiên
 */
async function unlockAndPlay() {
  if (!audio.value || unlocked.value) return;

  audio.value.volume = 0.35;
  audio.value.loop = true;

  try {
    await audio.value.play();
    unlocked.value = true;
  } catch {
    // Chrome sẽ cho phép sau interaction tiếp theo
  }
}

watch(
  () => props.enabled,
  (on) => {
    if (!audio.value) return;

    if (!on) {
      audio.value.pause();
      audio.value.currentTime = 0;
      unlocked.value = false;
    }
  }
);

onUnmounted(() => {
  audio.value?.pause();
});

defineExpose({ unlockAndPlay });
</script>

<template>
  <audio ref="audio" :src="src" preload="auto" />
</template>
