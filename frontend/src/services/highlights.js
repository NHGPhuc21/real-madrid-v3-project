// frontend/src/services/highlights.js
import api from "./api";

/**
 * Lấy danh sách highlight (có filter/paging/sort)
 * @param {Object} params { q?, status?, page?, limit?, sort?, excludeId? }
 *  - sort: 'recent' | 'views_desc'
 *  - excludeId: loại trừ 1 videoId (để show gợi ý)
 */
export function listHighlights(params = {}) {
  return api.get("/highlights", { params }).then((r) => r.data);
}

/** Lấy chi tiết 1 highlight */
export function getHighlight(id) {
  return api.get(`/highlights/${id}`).then((r) => r.data);
}

/** Tăng view cho highlight (public) */
export function addHighlightView(id) {
  return api.post(`/highlights/${id}/view`).then((r) => r.data);
}

/** XÓA highlight (admin) — sẽ xoá cả HLS/MP4/thumbnail trên server */
export function deleteHighlight(id) {
  return api.delete(`/highlights/${id}`).then((r) => r.data);
}

export default {
  listHighlights,
  getHighlight,
  addHighlightView,
  deleteHighlight,
};
