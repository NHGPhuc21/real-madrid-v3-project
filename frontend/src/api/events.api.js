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
export function uploadChristmasMusic(formData) {
  return api.post("/events/admin/christmas/music", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}


/**
 * Disable toàn bộ event
 */
export function disableEvent() {
  return api.put("/events/disable");
}
