<template>
  <div class="birthday-sides">
    <!-- Left cake -->
    <img
      class="side-img left"
      src="@/assets/sinhnhat.png"
      alt="Birthday cake left"
    />

    <!-- Right cake -->
    <img
      class="side-img right"
      src="@/assets/sinhnhat.png"
      alt="Birthday cake right"
    />
  </div>
</template>

<script setup>
// purely decorative component
</script>

<style scoped>
.birthday-sides {
  pointer-events: none;
}

/* ===== COMMON ===== */
.side-img {
  position: fixed;
  top: 50%;                         /* 👈 giữa theo chiều dọc */
  transform: translateY(-50%);      /* 👈 chuẩn center */

  width: 180px;                     /* 👈 120px × 1.5 = 180px */
  height: auto;                     /* 👈 KHÔNG vỡ ảnh */

  z-index: 900;
  opacity: 0.95;
}

/* LEFT */
.side-img.left {
  left: -25px;
}

/* RIGHT */
.side-img.right {
  right: -25px;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 992px) {
  .side-img {
    width: 140px;
  }
}

@media (max-width: 576px) {
  .side-img {
    display: none; /* mobile ẩn như Christmas */
  }
}
</style>
