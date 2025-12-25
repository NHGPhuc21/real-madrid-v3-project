<template>
  <div class="container py-4">
    <h2 class="mb-4">Event Management</h2>

    <table class="table table-hover align-middle">
      <thead class="table-light">
        <tr>
          <th>Event</th>
          <th>Time</th>
          <th>Status</th>
          <th class="text-end">Action</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="event in events" :key="event.key">
          <td class="fw-semibold">{{ event.name }}</td>

          <td class="text-muted">
            {{ event.startDate }} → {{ event.endDate }}
          </td>

          <td>
            <EventStatusBadge :enabled="event.enabled" />
          </td>

          <td class="text-end">
            <button
              class="btn btn-outline-primary btn-sm me-2"
              @click="toggle(event)"
            >
              {{ event.enabled ? "Disable" : "Enable" }}
            </button>

            <!-- Greeting Manager -->
            <button
              v-if="event.key === 'christmas'"
              class="btn btn-outline-secondary btn-sm"
              @click="openEdit(event)"
            >
              Greeting
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 🔥 GREETING LIST MODAL -->
  <GreetingListModal
    v-if="showGreetingModal"
    :eventKey="selectedEvent.key"
    @close="showGreetingModal = false"
  />
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import EventStatusBadge from "@/components/admin/EventStatusBadge.vue";
import GreetingListModal from "@/components/admin/GreetingListModal.vue";

import { enableEvent, disableEvent } from "@/api/events.api";
import { useEvent, loadActiveEvent } from "@/events/useEvent";

/**
 * Global event state (backend-driven)
 */
const { activeEvent } = useEvent();

/**
 * Local admin list (UI)
 */
const events = ref([
  {
    key: "christmas",
    name: "Christmas",
    startDate: "2025-12-24",
    endDate: "2025-12-25",
    enabled: false,
  },
  {
    key: "newyear",
    name: "New Year",
    startDate: "2025-12-31",
    endDate: "2026-01-01",
    enabled: false,
  },
]);

/**
 * Toggle event (enable / disable)
 */
async function toggle(event) {
  try {
    if (event.enabled) {
      await disableEvent();
    } else {
      await enableEvent(event.key);
    }

    await loadActiveEvent();
  } catch (err) {
    console.error("Toggle event failed:", err);
    alert("Failed to toggle event");
  }
}

/**
 * Sync table on load
 */
onMounted(async () => {
  await loadActiveEvent();

  events.value.forEach(e => {
    e.enabled = activeEvent.value
      ? e.key === activeEvent.value.key
      : false;
  });
});

/**
 * Sync when activeEvent changes
 */
watch(activeEvent, (ev) => {
  events.value.forEach(e => {
    e.enabled = ev ? e.key === ev.key : false;
  });
});

/**
 * Greeting modal control (ONLY OPEN MODAL)
 */
const selectedEvent = ref(null);
const showGreetingModal = ref(false);

function openEdit(event) {
  selectedEvent.value = event;
  showGreetingModal.value = true;
}
</script>
