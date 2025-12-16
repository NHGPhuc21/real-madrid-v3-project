// frontend/src/store/cart.js
import { defineStore } from "pinia";
import api from "@/services/api";
import { toast } from "@/composables/useToast";
import { useAuthStore } from "./auth";

export const useCartStore = defineStore("cart", {
  state: () => ({
    items: [],
    loading: false,
  }),
  getters: {
    totalQty: (s) => s.items.reduce((a, b) => a + (b.quantity || 0), 0),
    totalAmount: (s) =>
      s.items.reduce((a, b) => a + Number(b.unitprice) * b.quantity, 0),
  },
  actions: {
    async fetch() {
      try {
        this.loading = true;
        const r = await api.get("/cart");
        this.items = r.data?.items || [];
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
    async add(product, qty = 1) {
      const auth = useAuthStore();
      if (!auth?.token) {
        toast("Please login to add to cart", "error");
        return;
      }
      try {
        await api.post("/cart", {
          productId: product.productid,
          quantity: qty,
          unitPrice: product.price,
        });
             toast("Product added to cart!");
        await this.fetch();
      } catch (e) {
        console.error(e);
        toast(e?.response?.data?.message || "Add to cart failed", "error");
      }
    },
    async remove(productId) {
      try {
        await api.delete(`/cart/${productId}`);
        toast("Removed from cart");
        await this.fetch();
      } catch {
        toast("Remove failed", "error");
      }
    },
    // ===== CHỈNH SỬA Ở ĐÂY =====
    async setQty(productId, quantity) {
      try {
        const q = Number.isFinite(quantity) ? quantity : 0;
        if (q <= 0) {
          // về 0 thì xóa luôn
          await api.delete(`/cart/${productId}`);
          toast("Removed from cart");
        } else {
          await api.put(`/cart/${productId}`, { quantity: q });
        }
        await this.fetch();
      } catch {
        toast("Update quantity failed", "error");
      }
    },
  },
});
