<template>
  <div class="christmas-lights">
    <span
      v-for="n in 30"
      :key="n"
      class="light"
      :style="styleFor(n)"
    />
  </div>
</template>

<script setup>
function styleFor(i) {
  const colors = ["#ffd966", "#ff4d4d", "#4dd2ff", "#7CFF6B"];
  return {
    left: `${i * 3.3}%`,
    backgroundColor: colors[i % colors.length],
    animationDelay: `${Math.random() * 2}s`,
    animationDuration: `${1.2 + Math.random() * 1.5}s`, // 🔥 nhanh/chậm khác nhau
  };
}
</script>


<style scoped>
.christmas-lights {
  position: fixed;
  top: 56px;
  left: 0;
  right: 0;
  height: 24px;
  pointer-events: none;
  z-index: 1050;
}

.light {
  position: absolute;
  top: 0;
  width: 9px;
  height: 14px;
  border-radius: 50%;

  /* trạng thái mặc định */
  opacity: 0.4;
  box-shadow: 0 0 4px currentColor;

  animation-name: blink;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

/* 🔥 CHỚP NOEL RÕ */
@keyframes blink {
  0% {
    opacity: 0.3;
    transform: scale(0.85);
    box-shadow: 0 0 4px currentColor;
  }

  40% {
    opacity: 1;
    transform: scale(1.15);
    box-shadow: 0 0 14px currentColor,
                0 0 24px currentColor;
  }

  70% {
    opacity: 0.5;
    transform: scale(0.95);
    box-shadow: 0 0 6px currentColor;
  }

  100% {
    opacity: 0.3;
    transform: scale(0.85);
    box-shadow: 0 0 4px currentColor;
  }
}
</style>


