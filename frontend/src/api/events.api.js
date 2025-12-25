import api from "@/services/api";

/**
 * Lấy event đang active
 */
export function getActiveEvent() {
  return api.get("/events/active");
}

/**
 * Enable một event theo key
 */
export function enableEvent(key, payload = {}) {
  return api.put(`/events/${key}/enable`, payload);
}


/**
 * Disable toàn bộ event
 */
export function disableEvent() {
  return api.put("/events/disable");
}
