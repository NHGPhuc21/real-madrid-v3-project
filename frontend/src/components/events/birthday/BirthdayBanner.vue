<template>
  <div class="birthday-banner">
    <div class="container d-flex align-items-center justify-content-between">
      <div class="banner-left">
        🎂 <strong>Happy Birthday!</strong>
        <span class="ms-2">
          Wishing you a wonderful day with Real Madrid FC
        </span>
      </div>

      <button
        class="btn-close btn-close-white"
        @click="close"
        aria-label="Close"
      ></button>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(["close"]);

function close() {
  // Lưu trạng thái user đã đóng banner
  localStorage.setItem("birthday_banner_closed", "1");
  emit("close");
}
</script>

<style scoped>
.birthday-banner {
  position: sticky;
  top: 56px; /* giống ChristmasBanner */
  z-index: 1020;

  background: linear-gradient(
    90deg,
    #ff4d4f,
    #ff7875
  );
  color: #fff;

  padding: 10px 0; /* 🔥 GIỐNG 100% CHRISTMAS */
  font-size: 14px;
}

.banner-left {
  display: flex;
  align-items: center;
}
</style>
