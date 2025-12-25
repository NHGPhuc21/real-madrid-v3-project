// src/events/useEvent.js
import { ref, computed } from "vue";
import { getActiveEvent } from "@/api/events.api";

/**
 * Global event state (BACKEND DRIVEN)
 */
const activeEvent = ref(null);

/**
 * Load active event từ backend
 * Gọi khi app start / admin toggle xong
 */
export async function loadActiveEvent() {
  try {
    const res = await getActiveEvent();
    let event = res.data || null;

    // 🔥 FIX CHÍNH: parse config nếu backend trả string JSON
    if (event?.config && typeof event.config === "string") {
      try {
        event.config = JSON.parse(event.config);
      } catch (e) {
        console.error("Invalid event config JSON", e);
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
