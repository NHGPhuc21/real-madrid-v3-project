<template>
  <div class="christmas-sides">
    <!-- LEFT -->
    <img
      class="side-image left"
      src="@/assets/giangsinh.png"
      alt="Christmas decoration left"
    />

    <!-- RIGHT -->
    <img
      class="side-image right"
      src="@/assets/giangsinh.png"
      alt="Christmas decoration right"
    />
  </div>
</template>

<script setup>
// purely decorative – no logic
</script>

<style scoped>
.christmas-sides {
  position: fixed;
  top: 50%;
  left: 0;
  width: 100%;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 20;
}

/* Shared */
.side-image {
  position: absolute;
  width: 120px;
  max-width: 10vw;
  opacity: 0.95;
}

/* Left side */
.side-image.left {
  left: 5px;
}

/* Right side */
.side-image.right {
  right: 5px;
}

/* Responsive: ẩn trên mobile */
@media (max-width: 768px) {
  .side-image {
    display: none;
  }
}
</style>
