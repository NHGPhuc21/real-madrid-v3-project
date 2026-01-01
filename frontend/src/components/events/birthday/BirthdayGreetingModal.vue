<template>
  <div class="birthday-backdrop" @click.self="emit('close')">
    <div class="birthday-card">
      <h2>🎂 Happy Birthday 🎂</h2>

      <p class="message">
        Chúc bạn một ngày sinh nhật thật nhiều niềm vui và chiến thắng!
      </p>

      <button class="btn btn-primary mt-3" @click="emit('close')">
        Close
      </button>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(["close"]);
</script>

<style scoped>
.birthday-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.birthday-card {
  background: #fff;
  padding: 28px 32px;
  border-radius: 16px;
  max-width: 420px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
}

.message {
  font-size: 1.05rem;
  margin-top: 12px;
}
</style>
