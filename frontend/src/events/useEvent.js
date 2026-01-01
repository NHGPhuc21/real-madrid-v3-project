// src/events/useEvent.js
import { ref, computed } from "vue";
import { getActiveEvent } from "@/api/events.api";

/**
 * Global event state (BACKEND DRIVEN)
 */
const activeEvent = ref(null);

/**
 * Load active event từ backend
 */
export async function loadActiveEvent() {
  try {
    const res = await getActiveEvent();
    let event = res.data || null;

    // Parse config JSON nếu cần
    if (event?.config && typeof event.config === "string") {
      try {
        event.config = JSON.parse(event.config);
      } catch {
        event.config = {};
      }
    }

    activeEvent.value = event;
  } catch (err) {
    console.error("Failed to load active event", err);
    activeEvent.value = null;
  }
}

export function useEvent() {
  const isActive = computed(() => !!activeEvent.value);

  return {
    activeEvent,
    isActive,
  };
}
