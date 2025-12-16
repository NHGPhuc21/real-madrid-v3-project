<!-- frontend/src/pages/user/Profile.vue -->
<template>
  <div class="membership-wrapper">
    <h3 class="mb-3 text-center text-md-start container-title">My Membership</h3>

    <div v-if="loading" class="text-muted text-center">Loading…</div>

    <div v-else class="membership-card-container" :class="planClass">
      <!-- ===== Header ===== -->
      <div class="header-section">
        <div class="club-logo-wrap">
          <img src="/assets/logo/real.png" alt="Real Madrid" />
        </div>

        <div class="user-info">
          <h4 class="username">
            {{ user?.fullname || user?.name || user?.username }}
          </h4>
          <p class="since">
            Madridista since {{ madridistaSince || '-' }}
          </p>
        </div>

        <div class="plan-pill">
          {{ planLabel }}
        </div>
      </div>

      <!-- ===== Body ===== -->
      <div class="content-section">
        <RouterLink class="btn btn-outline-light btn-sm mb-3" to="/user/edit-profile">
          Your Profile
        </RouterLink>

        <div class="d-flex flex-column flex-md-row justify-content-between mb-3 gap-3">
          <div>
            <div class="fw-semibold">
              Current package:
              <span class="text-capitalize">{{ planCode }}</span>
            </div>

            <div class="small text-light opacity-75">
              <span>Start: {{ premiumStart || "-" }}</span>


            </div>
          </div>

          <!-- ⭐ Only show if BASIC -->
          <div class="text-md-end">
            <button
              v-if="planCode === 'basic'"
              class="btn btn-warning text-dark fw-semibold"
              @click="upgrade"
            >
              Up to Premium
            </button>
          </div>
        </div>

        <!-- Premium benefits -->
        <div class="card bg-transparent border-light">
          <div class="card-header text-white fw-bold">
            Premium benefits
          </div>
          <div class="card-body text-white">
            <ul class="mb-0">
              <li>Priority in booking tickets & Reduced ticket prices</li>
              <li>Store discounts (10%)</li>
              <li>Exclusive content (Behind the scenes)</li>
              <li>VIP events with players</li>
              <li>Card Digital Premium Madridista</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal fade" tabindex="-1" ref="modalRef">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Upgrade order created</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p>Order #{{ createdOrderId }} has been created. Click below to pay.</p>
          </div>
          <div class="modal-footer">
            <RouterLink class="btn btn-primary" :to="`/orders/${createdOrderId}`">
              Go to pay
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import api from "@/services/api";
import { ref, onMounted, computed } from "vue";
import { RouterLink } from "vue-router";
import { useAuthStore } from "@/store/auth";

const auth = useAuthStore();
const premiumStart = ref("");

const loading = ref(true);
const user = ref(null);
const membership = ref(null);
const madridistaSince = ref("");
const createdOrderId = ref(null);

let Modal,
  modalRef = ref(null),
  modal;

function dt(s) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleDateString("vi-VN");
  } catch {
    return s;
  }
}

/* ============================================================
   ⭐ FIX 1: Lấy planCode từ membership (API), không dùng auth.user
   ============================================================ */
const planCode = computed(() =>
  (membership.value?.plan_code || "basic").toLowerCase()
);

/* ⭐ FIX 2 */
const planLabel = computed(() =>
  planCode.value === "premium" ? "PREMIUM" : "BASIC"
);

/* ⭐ FIX 3 */
const planClass = computed(() =>
  planCode.value === "premium" ? "is-premium" : "is-basic"
);

/* ============================================================
   Load dữ liệu từ API — nguồn SỰ THẬT
   ============================================================ */
async function fetchAll() {
  loading.value = true;
  try {
    const me = await api.get("/users/me");

    user.value = me.data;

    /* ⭐ FIX 4 — membership lấy từ API */
   // Lấy thông tin membership
membership.value = {
  plan_code: (me.data.membershiptier || "basic").toLowerCase(),
  started_at: me.data.premium_start || null,
  created_at: me.data.create_at
};

// Madridista since = ngày tạo tài khoản
madridistaSince.value = dt(me.data.create_at);

// Premium start = ngày nâng cấp Premium
premiumStart.value = dt(me.data.premium_start);

  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function ensureModal() {
  if (!Modal) Modal = (await import("bootstrap/js/dist/modal")).default;
  if (!modal) modal = new Modal(modalRef.value, { backdrop: "static" });
}

async function upgrade() {
  try {
    const r = await api.post("/memberships/upgrade");
    createdOrderId.value = r.data?.orderId;
    await ensureModal();
    modal.show();
  } catch (e) {
    alert(e?.response?.data?.message || "Không tạo được đơn nâng cấp");
  }
}

onMounted(fetchAll);
</script>
<style scoped>
.membership-wrapper {
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.container-title {
  width: 90%;
  max-width: 1100px;
}

/* ===== CARD WRAPPER ===== */
.membership-card-container {
  width: 90%;
  max-width: 1100px;
  border-radius: 28px;
  padding: 32px 40px 36px;
  color: #fff;
  box-shadow: 0 12px 40px rgba(5, 11, 36, 0.55);
  background: radial-gradient(
    circle at top left,
    #3a6cff 0,
    #141852 55%,
    #050b24 100%
  );
  position: relative;
  overflow: hidden;
}

.membership-card-container::before {
  content: "";
  position: absolute;
  inset: -40%;
  background-image: radial-gradient(
      circle at 0 0,
      rgba(255, 255, 255, 0.25) 0,
      transparent 55%
    ),
    radial-gradient(
      circle at 100% 100%,
      rgba(255, 255, 255, 0.12) 0,
      transparent 55%
    );
  opacity: 0.15;
  mix-blend-mode: screen;
}

/* ===== HEADER ===== */
.header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  position: relative;
  z-index: 1;
}

.club-logo-wrap {
  width: 72px;
  height: 72px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.25);
}

.club-logo-wrap img {
  width: 52px;
  height: 52px;
  object-fit: contain;
}

.user-info {
  flex: 1;
  margin-left: 20px;
}

.username {
  font-weight: 700;
  font-size: 1.6rem;
  margin: 0;
}

.since {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.85;
}

.plan-pill {
  padding: 8px 18px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.25);
}

/* ===== CONTENT ===== */
.content-section {
  position: relative;
  z-index: 1;
}

/* ===== PREMIUM THEMING ===== */
.is-premium {
  background: radial-gradient(
    circle at top left,
    #7b2cff 0,
    #4330ff 40%,
    #050b24 100%
  );
}

/* ===== SMALL SCREENS ===== */
@media (max-width: 768px) {
  .membership-card-container {
    padding: 24px 20px 28px;
    border-radius: 20px;
  }

  .club-logo-wrap {
    width: 60px;
    height: 60px;
  }

  .club-logo-wrap img {
    width: 44px;
    height: 44px;
  }

  .username {
    font-size: 1.3rem;
  }
}
</style>
