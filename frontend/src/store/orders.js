// frontend/src/store/orders.js
import { defineStore } from "pinia";
import api from "@/services/api";
import { toast } from "@/composables/useToast";

export const useOrdersStore = defineStore("orders", {
  state: () => ({
    items: [],
    total: 0,
    loading: false,
  }),
  actions: {
    async fetchMy() {
      this.loading = true;
      try {
        const r = await api.get("/orders");
        this.items = r.data || [];
        this.total = this.items.length;
      } catch (e) {
        console.error(e);
        toast("Tải danh sách đơn thất bại", "error");
      } finally {
        this.loading = false;
      }
    },
    async payNow(orderId) {
      try {
        const r = await api.post(`/orders/${orderId}/pay`);
        toast(`Đã thanh toán đơn #${orderId}`);
        return r.data;
      } catch (e) {
        console.error(e);
        toast(e?.response?.data?.message || "Thanh toán thất bại", "error");
        throw e;
      }
    },
    async cancel(orderId) {
      try {
        await api.patch(`/orders/${orderId}/cancel`);
        toast(`Đã hủy đơn #${orderId}`);
      } catch (e) {
        console.error(e);
        toast(e?.response?.data?.message || "Hủy đơn thất bại", "error");
        throw e;
      }
    },
  },
});
