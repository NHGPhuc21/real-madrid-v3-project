<template>
  <div class="snow-container">
    <span
      v-for="n in 80"
      :key="n"
      class="snowflake"
      :style="randomStyle()"
    ></span>
  </div>
</template>

<script setup>
function randomStyle() {
  const x = Math.random() * 100;
  const duration = 5 + Math.random() * 5;
  const size = 3 + Math.random() * 4;

  return {
    left: `${x}%`,
    animationDuration: `${duration}s`,
    width: `${size}px`,
    height: `${size}px`,
  };
}
</script>

<style scoped>
.snow-container {
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 1;
}

.snowflake {
  pointer-events: none;
  position: absolute;
  top: -20px;

  background: white;
  border-radius: 50%;
  opacity: 0.8;

  animation-name: fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

@keyframes fall {
  to {
    transform: translateY(110vh);
  }
}
</style>
