<template>
  <div class="container py-4">
    <h3 class="mb-3">Membership</h3>

    <div v-if="loading" class="text-muted">Loading...</div>
    <div v-else>
      <div v-if="current">
        <p>
          Current package:
          <span class="fw-bold text-primary">{{ current.plan_code }}</span>
        </p>
        <p>Hiệu lực đến: {{ formatDate(current.expires_at) }}</p>
      </div>
      <div v-else>
        <p>Bạn đang là thành viên Basic.</p>
        <button class="btn btn-primary" @click="upgrade">
          Up to Premium
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import api from "@/services/api";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { toast } from "@/composables/useToast";
import { useAuthStore } from "@/store/auth";

const router = useRouter();
const loading = ref(true);
const current = ref(null);

function formatDate(s) {
  try {
    return new Date(s).toLocaleDateString("vi-VN");
  } catch {
    return s;
  }
}

async function load() {
  loading.value = true;
  try {
    const r = await api.get("/users/me");

    current.value = {
      plan_code: (r.data.membershiptier || "basic").toLowerCase(),
      started_at: r.data.create_at,
      expires_at: null
    };

    // 👇 NEW — đồng bộ vào store
    const auth = useAuthStore();
    auth.updateUser({ membershiptier: r.data.membershiptier });

  } catch (e) {
    toast("Không tải được dữ liệu hội viên", "error");
  } finally {
    loading.value = false;
  }
}



async function upgrade() {
  try {
    // 1) Add Premium product (productid = 14 hoặc 13)
    const PREMIUM_PRODUCT_ID = 14; // hoặc 13 tùy database bạn

    await api.post(`/products/${PREMIUM_PRODUCT_ID}/add-to-cart`, {
      quantity: 1,
    });

    // 2) Tạo order
    const orderRes = await api.post(`/orders`, {
      shippingAddress: null,
      paymentMethod: "online",
      notes: "Membership upgrade",
      shippingFee: 0,
    });

    const orderId = orderRes.data.orderId;

    // 3) Chuyển trang thanh toán
    router.push({ name: "OrderDetail", params: { id: orderId } });

    toast("Đã tạo đơn nâng cấp, vui lòng thanh toán");

  } catch (e) {
    toast(e?.response?.data?.message || "Không thể nâng cấp", "error");
  }
}


onMounted(load);
</script>
