<template>
  <div class="container py-4">
    <h2 class="mb-4">Event Management</h2>

    <table class="table table-hover align-middle">
      <thead class="table-light">
        <tr>
          <th>Event</th>
          <th>Time</th>
          <th>Status</th>
          <th>Music</th>
          <th class="text-end">Action</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="event in events" :key="event.key">
          <!-- Event -->
          <td class="fw-semibold">{{ event.name }}</td>

          <!-- Time -->
          <td class="text-muted">
            {{ event.startDate }} → {{ event.endDate }}
          </td>

          <!-- Status -->
          <td>
            <EventStatusBadge :enabled="event.enabled" />
          </td>

          <!-- 🎵 Music (Christmas only) -->
          <td>
            <div v-if="event.key === 'christmas'">
              <input
                type="file"
                accept="audio/mpeg"
                class="form-control form-control-sm mb-1"
                :disabled="event.enabled"
                @change="onSelectMusic($event)"
              />

              <small
                v-if="event.musicUploaded"
                class="text-success"
              >
                🎵 Music uploaded & saved
              </small>

              <small
                v-else-if="selectedMusic"
                class="text-muted"
              >
                Selected: {{ selectedMusic.name }}
              </small>
            </div>
          </td>

          <!-- Action -->
          <td class="text-end">
            <button
              class="btn btn-outline-primary btn-sm me-2"
              @click="toggle(event)"
            >
              {{ event.enabled ? "Disable" : "Enable" }}
            </button>

            <!-- Greeting Manager -->
            <button
  v-if="event.key === 'christmas' || event.key === 'birthday'"
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
  v-if="showGreetingModal && selectedEvent?.key === 'christmas'"
  :eventKey="selectedEvent.key"
  @close="showGreetingModal = false"
/>

<BirthdayGreetingListModal
  v-if="showGreetingModal && selectedEvent?.key === 'birthday'"
  @close="showGreetingModal = false"
/>



</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import EventStatusBadge from "@/components/admin/EventStatusBadge.vue";
import GreetingListModal from "@/components/admin/GreetingListModal.vue";
import BirthdayGreetingListModal
  from "@/components/admin/BirthdayGreetingListModal.vue";

import {
  enableEvent,
  disableEvent,
  uploadChristmasMusic,
} from "@/api/events.api";
import { useEvent, loadActiveEvent } from "@/events/useEvent";

/**
 * Global event state (backend-driven)
 */
const { activeEvent } = useEvent();

/**
 * Selected music file (Christmas)
 */
const selectedMusic = ref(null);

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
    musicUploaded: false,
  },
  {
    key: "newyear",
    name: "New Year",
    startDate: "2025-12-31",
    endDate: "2026-01-01",
    enabled: false,
  },
  {
  key: "birthday",
  name: "Birthday",
  startDate: "-",
  endDate: "-",
  enabled: false,
}

]);

/**
 * Toggle event (enable / disable)
 */
async function toggle(event) {
  try {
    if (!event.enabled && event.key === "christmas") {
      // 1️⃣ Upload music first (if selected)
      if (selectedMusic.value) {
        const form = new FormData();
        form.append("music", selectedMusic.value);
        await uploadChristmasMusic(form);

        event.musicUploaded = true;
        selectedMusic.value = null;
      }

      // 2️⃣ Enable Christmas event
      await enableEvent("christmas");
    } else if (event.enabled) {
      // Disable all events
      await disableEvent();
    } else {
      // Enable other events
      await enableEvent(event.key);
    }

    await loadActiveEvent();
  } catch (err) {
    console.error("Toggle event failed:", err);
    alert("Failed to toggle event");
  }
}

/**
 * Handle music file selection
 */
function onSelectMusic(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.type !== "audio/mpeg") {
    alert("Only MP3 files are allowed");
    return;
  }

  selectedMusic.value = file;
}

/**
 * Sync table on load
 */
onMounted(async () => {
  await loadActiveEvent();

  events.value.forEach((e) => {
    e.enabled = activeEvent.value
      ? e.key === activeEvent.value.key
      : false;

    if (
      e.key === "christmas" &&
      activeEvent.value?.music_url
    ) {
      e.musicUploaded = true;
    }
  });
});

/**
 * Sync when activeEvent changes
 */
watch(activeEvent, (ev) => {
  events.value.forEach((e) => {
    e.enabled = ev ? e.key === ev.key : false;

    if (e.key === "christmas") {
      e.musicUploaded = !!ev?.music_url;
    }
  });
});

/**
 * Greeting modal control
 */
const selectedEvent = ref(null);
const showGreetingModal = ref(false);

function openEdit(event) {
  selectedEvent.value = event;
  showGreetingModal.value = true;
}
</script>
