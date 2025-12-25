<template>
  <span
    class="badge"
    :class="enabled ? 'bg-success' : 'bg-secondary'"
  >
    {{ enabled ? "ACTIVE" : "INACTIVE" }}
  </span>
</template>

<script setup>
defineProps({
  enabled: Boolean,
});
</script>
