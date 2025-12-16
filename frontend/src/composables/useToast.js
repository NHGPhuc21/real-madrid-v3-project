// frontend/src/composables/useToast.js
import { reactive } from "vue";

export const toasts = reactive([]);
let id = 1;

export function toast(message, type = "success", duration = 2500) {
  const t = { id: id++, message, type };
  toasts.push(t);
  setTimeout(() => {
    const i = toasts.findIndex((x) => x.id === t.id);
    if (i >= 0) toasts.splice(i, 1);
  }, duration);
}
toast.success = (msg, duration) => toast(msg, "success", duration);
toast.error = (msg, duration) => toast(msg, "error", duration);
