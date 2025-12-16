// frontend/src/services/api.js
//file cấu hình cho axios để có thể mở localhost hoặc tên miền đều được

import axios from "axios";
import { useAuthStore } from "@/store/auth";

// =============================
// BASE URL DÙNG CHUNG
// =============================
export const API_BASE =
  import.meta.env.VITE_API_BASE || "https://api.minato4.id.vn/api";

// Gốc phục vụ file tĩnh (/uploads)
export const FILE_BASE =
  import.meta.env.VITE_FILE_BASE || API_BASE.replace(/\/api\/?$/, "");

// Helper build URL tuyệt đối
export function ABS(p) {
  if (!p) return "";
  return /^https?:\/\//i.test(p) ? p : `${FILE_BASE}${p}`;
}

// =============================
// TẠO API INSTANCE DUY NHẤT
// =============================
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

// =============================
// GẮN TOKEN KHI RELOAD TRANG
// =============================
const savedToken = localStorage.getItem("token");
if (savedToken) {
  api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
}

console.log("[api] baseURL =", api.defaults.baseURL);

// =============================
// INTERCEPTOR: ATTACH TOKEN
// =============================
api.interceptors.request.use((config) => {
  try {
    const store = useAuthStore();
    if (store?.token) {
      config.headers.Authorization = `Bearer ${store.token}`;
    }
  } catch {}
  return config;
});

// =============================
// INTERCEPTOR: HANDLE 401/403
// =============================
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const hadAuthHeader =
      !!error?.config?.headers?.Authorization ||
      !!api.defaults.headers.common["Authorization"];

    if ((status === 401 || status === 403) && hadAuthHeader) {
      let store = null;
      try {
        store = useAuthStore();
      } catch {}

      if (store?.token) {
        try {
          store.logout();
        } catch {}

        if (typeof window !== "undefined") {
          const onLogin = window.location.pathname.includes("/login");
          if (!onLogin) {
            window.alert(
              "Phiên đăng nhập hết hạn hoặc không đủ quyền. Vui lòng đăng nhập lại."
            );
            window.location.href = "/login";
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
