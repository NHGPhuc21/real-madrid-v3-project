<template>
  <!-- 🎁 Trigger banner -->
  <div
    v-if="isChristmas"
    class="christmas-gift-box"
    @click="openAnimation"
  >
    🎁 Merry Christmas from Real Madrid
  </div>

  <!-- 🎁 Full animation -->
  <ChristmasGiftAnimation
    v-if="showAnimation"
    :message="greetingMessage"
    @close="handleClose"
  />
</template>

<script setup>
import { ref, computed } from "vue";
import { useEvent } from "@/events/useEvent";
import { useGreeting } from "@/events/useGreeting";
import ChristmasGiftAnimation from "./ChristmasGiftAnimation.vue";

const { activeEvent } = useEvent();
const { greetingMessage, loadGreeting, resetGreeting } = useGreeting();

const showAnimation = ref(false);

const isChristmas = computed(() =>
  activeEvent.value?.enabled === true &&
  activeEvent.value?.key === "christmas"
);

async function openAnimation() {
  await loadGreeting("christmas");
  showAnimation.value = true;
}

function handleClose() {
  showAnimation.value = false;
  resetGreeting();
}
</script>

<style scoped>
.christmas-gift-box {
  display: inline-block;
  background: #b30000;
  color: #ffffff;
  padding: 10px 20px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;

  box-shadow: 0 4px 14px rgba(179, 0, 0, 0.4);

  /* 🔥 Attention animation */
  animation: subtle-shake 2.8s ease-in-out infinite;

  transition: transform 0.15s ease, box-shadow 0.15s ease;
}


.christmas-gift-box:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(179, 0, 0, 0.5);
}
@keyframes subtle-shake {
  0%   { transform: translateX(0); }
  10%  { transform: translateX(-2px); }
  20%  { transform: translateX(2px); }
  30%  { transform: translateX(-2px); }
  40%  { transform: translateX(2px); }
  50%  { transform: translateX(0); }
  100% { transform: translateX(0); }
}

</style>
