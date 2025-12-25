// src/events/useGreeting.js
import { ref } from "vue";
import api from "@/api/api.js";

/**
 * Greeting state
 * - Random 1 lần cho mỗi lần mở gift box
 * - Reset khi đóng modal
 */
const greetingMessage = ref(null);
const loading = ref(false);

/**
 * Load random greeting từ backend
 * @param {string} eventKey
 */
export async function loadGreeting(eventKey) {
  if (loading.value) return;

  loading.value = true;

  try {
    const res = await api.get(`/events/${eventKey}/random-greeting`);
    greetingMessage.value = res.data?.message ?? null;
  } catch (err) {
    console.error("Failed to load greeting", err);
    greetingMessage.value = null;
  } finally {
    loading.value = false;
  }
}

/**
 * Reset greeting (khi đóng modal)
 */
export function resetGreeting() {
  greetingMessage.value = null;
}

/**
 * Composable
 */
export function useGreeting() {
  return {
    greetingMessage,
    loadGreeting,
    resetGreeting,
  };
}
