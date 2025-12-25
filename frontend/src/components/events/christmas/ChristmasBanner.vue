<template>
  <div
    v-if="visible"
    class="christmas-banner"
  >
    <div class="container d-flex align-items-center justify-content-between">
      <div class="banner-left">
        🎄 <strong>Merry Christmas!</strong>
        <span class="ms-2">
          Wishing you a joyful holiday season with Real Madrid FC
        </span>
      </div>

      <button
        class="btn-close btn-close-white"
        @click="close"
      ></button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useEvent } from "@/events/useEvent";

const { activeEvent } = useEvent();

// local dismiss (user đóng)
const dismissed = ref(false);

// visible khi:
// - có event
// - event enabled
// - config.banner = true
// - user chưa đóng
const visible = ref(false);

watch(
  activeEvent,
  (event) => {
    dismissed.value = false;
    visible.value = !!(
      event &&
      event.enabled &&
      event.config?.banner
    );
  },
  { immediate: true }
);

function close() {
  dismissed.value = true;
  visible.value = false;
}
</script>

<style scoped>
.christmas-banner {
  position: sticky;
  top: 56px; /* ngay dưới navbar */
  z-index: 1020;
  background: linear-gradient(
    90deg,
    #b30000,
    #e60026
  );
  color: #fff;
  padding: 10px 0;
  font-size: 14px;
}

.banner-left {
  display: flex;
  align-items: center;
}
</style>
