<template>
  <div class="christmas-modal-backdrop" @click.self="emit('close')">
    <div class="christmas-card christmas-lights">
      <h2>🎄 Merry Christmas 🎄</h2>

      <p class="message">
        {{ message }}
      </p>

      <button class="btn btn-primary mt-3" @click="emit('close')">
        Close
      </button>
    </div>
  </div>
</template>

<script setup>
/* ✅ Props */
defineProps({
  message: {
    type: String,
    required: true,
  },
});

/* ✅ Emits */
const emit = defineEmits(["close"]);
</script>

<style scoped>
/* ===== Backdrop ===== */
.christmas-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

/* ===== Card ===== */
.christmas-card {
  position: relative;
  background: #ffffff;
  padding: 28px 32px;
  border-radius: 16px;
  max-width: 420px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  z-index: 1;
}

/* ===== Text ===== */
.christmas-card h2 {
  margin-bottom: 12px;
  color: #1f1f1f;
}

.message {
  font-size: 1.05rem;
  line-height: 1.6;
  color: #222;
  margin-top: 12px;
}

/* =====================================================
   🎄 CHRISTMAS LIGHTS – CHỚP XEN KẼ (CHẴN / LẺ)
===================================================== */

/* ===== ĐÈN CHẴN ===== */
.christmas-lights::before,
/* ===== ĐÈN LẺ ===== */
.christmas-lights::after {
  content: "";
  position: absolute;
  inset: -10px;
  border-radius: 22px;
  pointer-events: none;

  background:
    repeating-linear-gradient(
      90deg,
      transparent 0 10px,
      #ffd966 10px 16px
    ),
    repeating-linear-gradient(
      180deg,
      transparent 0 10px,
      #ffd966 10px 16px
    ),
    repeating-linear-gradient(
      270deg,
      transparent 0 10px,
      #ffd966 10px 16px
    ),
    repeating-linear-gradient(
      0deg,
      transparent 0 10px,
      #ffd966 10px 16px
    );

  background-size:
    100% 5px,
    5px 100%,
    100% 5px,
    5px 100%;

  background-position:
    top left,
    top right,
    bottom right,
    bottom left;

  background-repeat: no-repeat;

  filter:
    drop-shadow(0 0 6px rgba(255, 217, 102, 1))
    drop-shadow(0 0 14px rgba(255, 217, 102, 1));
}

/* ===== LỆCH PHA: đèn lẻ ===== */
.christmas-lights::after {
  background-position:
    top 8px left,
    top right 8px,
    bottom 8px right,
    bottom left 8px;
}

/* ===== ANIMATION ===== */
.christmas-lights::before {
  animation: blinkEven 0.9s infinite steps(1);
}

.christmas-lights::after {
  animation: blinkOdd 0.9s infinite steps(1);
}

/* ===== KEYFRAMES ===== */
@keyframes blinkEven {
  0% {
    opacity: 1;   /* 🔆 CHẴN BẬT */
  }
  50% {
    opacity: 0.15; /* ❌ CHẴN TẮT */
    filter: none;
  }
  100% {
    opacity: 1;
  }
}

@keyframes blinkOdd {
  0% {
    opacity: 0.15; /* ❌ LẺ TẮT */
    filter: none;
  }
  50% {
    opacity: 1;   /* 🔆 LẺ BẬT */
  }
  100% {
    opacity: 0.15;
    filter: none;
  }
}

</style>
