<template>
  <div class="balloon-container">
    <div
      v-for="n in 28"
      :key="n"
      class="balloon-wrapper"
      :style="randomStyle()"
    >
      <div class="balloon">
        <span class="highlight"></span>
      </div>
      <span class="string"></span>
    </div>
  </div>
</template>

<script setup>
function randomStyle() {
  const colors = [
    ["#ff7a7a", "#ff3b3b"],
    ["#ffd36a", "#ffb703"],
    ["#8ce99a", "#51cf66"],
    ["#74c0fc", "#339af0"],
    ["#d0bfff", "#845ef7"],
  ];

  const [c1, c2] = colors[Math.floor(Math.random() * colors.length)];

  return {
    left: Math.random() * 100 + "%",
    animationDuration: 10 + Math.random() * 10 + "s",
    animationDelay: Math.random() * 4 + "s",
    "--c1": c1,
    "--c2": c2,
    "--scale": (0.9 + Math.random() * 0.7).toFixed(2),
  };
}
</script>

<style scoped>
/* ===== CONTAINER ===== */
.balloon-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1500;
  overflow: hidden;
}

/* ===== WRAPPER (CHỈ BAY) ===== */
.balloon-wrapper {
  position: absolute;
  bottom: -140px;
  transform: scale(var(--scale));
  animation: fly linear infinite;
}

/* ===== BALLOON BODY ===== */
.balloon {
  position: relative;
  width: 34px;
  height: 44px;
  border-radius: 50% 50% 48% 48%;
  background: radial-gradient(
      circle at 30% 25%,
      rgba(255,255,255,0.85),
      rgba(255,255,255,0.25) 35%,
      transparent 40%
    ),
    linear-gradient(135deg, var(--c1), var(--c2));
  box-shadow:
    inset -4px -6px 10px rgba(0,0,0,0.12),
    inset 4px 6px 10px rgba(255,255,255,0.25),
    0 8px 18px rgba(0,0,0,0.25);
}

/* ===== BALLOON NECK ===== */
.balloon::after {
  content: "";
  position: absolute;
  bottom: -6px;
  left: 50%;
  width: 10px;
  height: 8px;
  background: linear-gradient(135deg, var(--c2), var(--c1));
  border-radius: 0 0 6px 6px;
  transform: translateX(-50%);
}

/* ===== STRING ===== */
.string {
  display: block;
  margin: 0 auto;

  width: 2px;                 /* ⬆️ đậm hơn */
  height: 48px;

  background: linear-gradient(
    to bottom,
    rgba(255,255,255,0.9),    /* sáng hơn ở trên */
    rgba(0,0,0,0.55)          /* đậm hơn ở dưới */
  );

  opacity: 0.95;

  /* 👇 tạo cảm giác dây nổi */
  box-shadow:
    0 0 2px rgba(0,0,0,0.4),
    0 2px 4px rgba(0,0,0,0.35);
}


/* ===== FLY UP (GIỮ NGUYÊN CƠ CHẾ GỐC) ===== */
@keyframes fly {
  from {
    transform: translateY(0) scale(var(--scale));
    opacity: 0.95;
  }
  to {
    transform: translateY(-120vh) scale(var(--scale));
    opacity: 0;
  }
}
</style>
