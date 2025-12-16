<template>
  <div class="toast-host">
    <transition-group name="toast" tag="div">
      <div 
        v-for="t in toasts" 
        :key="t.id" 
        class="toast-item" 
        :class="t.type"
      >
        <div class="text">{{ t.message }}</div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { toasts } from "@/composables/useToast";
</script>

<style scoped>
/* Vị trí top-center */
.toast-host {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3000;
  display: grid;
  gap: 10px;
}

/* === 🔥 Toast Style chính (gradient tím → xanh + glow) === */
.toast-item {
  min-width: 280px;
  max-width: 420px;
  padding: 12px 20px;
  border-radius: 9999px; /* full rounded */
  color: #fff;
  font-size: 15px;
  font-weight: 500;

  /* gradient tím → xanh (hợp với nút Read article) */
  background: linear-gradient(135deg, #3a0eff, #b96cf7);

  /* Glow mềm */
  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.25),
    0 0 20px rgba(111, 0, 255, 0.45);

  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(8px); /* glassmorphism */
}

/* === Success: gradient xanh lá + glow === */
.toast-item.success {
  background: linear-gradient(135deg, #00c853, #4cd964);
  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.25),
    0 0 20px rgba(0, 255, 120, 0.45);
}

/* === Error: gradient đỏ + glow === */
.toast-item.error {
  background: linear-gradient(135deg, #ff5252, #ff1744);
  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.25),
    0 0 20px rgba(255, 48, 48, 0.45);
}

/* === Animation mượt === */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-15px) scale(0.96);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>
