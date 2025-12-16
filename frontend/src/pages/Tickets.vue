<template>
  <div class="container py-4">

    <!-- HEADER -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0 fw-bold page-title">Upcoming Matches & Tickets</h2>
      <button class="btn btn-outline-primary" @click="goMyTickets">
        My Tickets
      </button>
    </div>

    <!-- MONTH FILTER -->
    <div class="month-filter mb-4">
      <button
        v-for="(m, idx) in months"
        :key="idx"
        class="month-btn"
        :class="{ active: selectedMonth === idx + 1 }"
        @click="selectedMonth = idx + 1"
      >
        {{ m }}
      </button>
    </div>

    <!-- ===================== MATCH GRID ===================== -->
    <div v-if="filteredMatches.length" class="match-grid">

      <div v-for="item in filteredMatches" :key="item.match.matchid" class="ticket-card shadow-sm">

        <!-- Header -->
        <div class="card-top">
          <div class="team-block">
            <img class="team-logo-big" :src="rmLogo" />
            <p class="team-name">Real Madrid</p>
          </div>

          <!-- COMPETITION LOGO -->
          <img 
            class="card-vs"
            :src="competitionLogo(item.match.competition)"
            alt="comp"
          />

          <div class="team-block">
            <img class="team-logo-big" :src="matchLogo(item.match)" />
            <p class="team-name">{{ item.match.opponentteam }}</p>
          </div>
        </div>

        <!-- Body -->
        <div class="card-bottom">

          <p class="competition small fw-semibold mb-1 text-uppercase">
            {{ item.match.competition }}
          </p>

          <p class="match-time mb-1">
            🕒 Date: {{ formatDate(item.match.matchdatetime) }}
          </p>

          <p class="stadium mb-2">
            📍 Stadium: {{ item.match.stadium || "TBA" }}
          </p>

          <p class="ticket-count mb-3 text-muted">
            {{ item.tickets.length }} ticket types available
          </p>

          <button class="btn buy-btn w-100" @click="openBuyModal(item.match)">
            Buy Tickets
          </button>

        </div>

      </div>

    </div>

    <!-- No matches -->
    <div v-else class="text-center text-muted py-5">
      No matches available for this month.
    </div>


    <!-- ===================== MODAL ===================== -->
    <div class="modal fade" id="ticketBuyModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">

          <div class="modal-header">
            <h5 class="modal-title">Buy Ticket - {{ modalMatch?.opponentteam }}</h5>
            <button class="btn-close" @click="closeModal"></button>
          </div>

          <div class="modal-body">
            <label class="form-label fw-semibold">Ticket Category</label>
            <select class="form-select mb-3" v-model="selectedCategoryId">
              <option disabled value="">Select category...</option>
              <option
                v-for="c in modalCategories"
                :key="c.categoryid"
                :value="c.categoryid"
              >
                {{ c.categoryname }} — {{ formatCurrency(c.price) }}
                (Available: {{ c.availablequantity }})
              </option>
            </select>

            <label class="form-label fw-semibold">Quantity</label>
            <input type="number" min="1" class="form-control" v-model.number="selectedQuantity" />
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeModal">Cancel</button>
            <button class="btn btn-primary" @click="confirmBuy">Buy Now</button>
          </div>

        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import api, { ABS } from "@/services/api";
import { toast } from "@/composables/useToast";
import { getOpponentLogo } from "@/services/assets";
import { Modal } from "bootstrap";

const rmLogo = "/assets/logo/real.png";

/* ------------------------------------------------ */
/* STATE */
let ticketModal = null;
const router = useRouter();
const auth = useAuthStore();

const matchCards = ref([]);

const modalMatch = ref(null);
const modalCategories = ref([]);
const selectedCategoryId = ref("");
const selectedQuantity = ref(1);

/* ------------------------------------------------ */
/* MONTH FILTER */
const months = [
  "Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
  "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"
];

const selectedMonth = ref(new Date().getMonth() + 1);

/* FILTER MATCHES OF MONTH */
const filteredMatches = computed(() => {
  return matchCards.value.filter(item => {
    const dt = new Date(item.match.matchdatetime.replace(" ", "T"));
    return dt.getMonth() + 1 === selectedMonth.value;
  });
});

/* ------------------------------------------------ */
/* COMPETITION LOGO */
function competitionLogo(comp) {
  const name = comp?.toUpperCase() || "";
  if (name.includes("CHAMPION")) return "/assets/logo/c1.png";
  if (name.includes("LALIGA")) return "/assets/logo/laliga.png";
  if (name.includes("COPA")) return "/assets/logo/copa.png";
  return "/assets/logo/default-comp.png";
}

/* TEAM LOGO */
function matchLogo(m) {
  const u = m.opponentteamlogourl;
  if (u && u.startsWith("/uploads/")) return ABS(u);
  return getOpponentLogo(m.opponentteam);
}

function formatDate(dt) {
  if (!dt) return "";
  const formatted = dt.includes(" ") ? dt.replace(" ", "T") : dt;
  return new Date(formatted).toLocaleString("vi-VN");
}

function formatCurrency(v) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND"
  }).format(v || 0);
}

/* ------------------------------------------------ */
/* LOAD MATCHES FROM API */
async function load() {
  try {
    const [mR, tR] = await Promise.all([
      api.get("/matches"),
      api.get("/tickets/upcoming")
    ]);

    const matches = mR.data || [];
    const tickets = tR.data || [];

    const grouped = {};
    tickets.forEach(t => {
      if (!grouped[t.matchid]) grouped[t.matchid] = [];
      grouped[t.matchid].push(t);
    });

    matchCards.value = matches
      .filter(m => grouped[m.matchid])
      .map(m => ({
        match: m,
        tickets: grouped[m.matchid]
      }));
  } catch (e) {
    console.error(e);
  }
}

/* ------------------------------------------------ */
/* MODAL HANDLING */
function cleanModal() {
  document.body.classList.remove("modal-open");
  document.body.style.overflow = "";
  document.querySelectorAll(".modal-backdrop").forEach(b => b.remove());
}

async function openBuyModal(match) {
  if (!auth.isLoggedIn)
    return router.push({ name: "Login", query: { next: "/tickets" } });

  modalMatch.value = match;
  selectedCategoryId.value = "";
  selectedQuantity.value = 1;

  const r = await api.get(`/tickets/by-match/${match.matchid}`);
  modalCategories.value = r.data;

  ticketModal = new Modal(document.getElementById("ticketBuyModal"));
  ticketModal.show();
}

function closeModal() {
  if (ticketModal) ticketModal.hide();
  cleanModal();
}

async function confirmBuy() {
  if (!selectedCategoryId.value)
    return toast("Please select ticket category", "error");

  try {
    const r = await api.post("/ticket-orders/quick-buy", {
      matchId: modalMatch.value.matchid,
      categoryId: selectedCategoryId.value,
      quantity: selectedQuantity.value
    });

    router.push({ name: "TicketOrderDetail", params: { id: r.data.orderid } });
  } catch {
    toast("Failed to buy ticket", "error");
  }
}

function goMyTickets() {
  router.push({ name: "MyTickets" });
}

onMounted(load);
</script>

<style scoped>
.page-title {
  font-size: 1.9rem;
  font-weight: 700;
}

/* ------------------------------------------------ */
/* MONTH FILTER */
.month-filter {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 6px;
}
.month-btn {
  border: none;
  background: #f1f3f5;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 0.9rem;
  transition: 0.2s;
}
.month-btn.active {
  background: #4169e1;
  color: white;
  font-weight: 600;
}

/* ------------------------------------------------ */
/* GRID: EXACT 4 CARDS PER ROW */
.match-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

@media (max-width: 1200px) {
  .match-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 991px) {
  .match-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .match-grid {
    grid-template-columns: repeat(1, 1fr);
  }
}

/* ------------------------------------------------ */
/* CARD STYLE */
.ticket-card {
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid #e6e6e6;
}

/* Header */
.card-top {
  background: linear-gradient(135deg, #071a3d, #0b2f73);
  padding: 20px 10px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  color: white;
}

.team-block {
  text-align: center;
}
.team-logo-big {
  width: 55px;
  height: 55px;
  object-fit: contain;
}
.team-name {
  margin-top: 6px;
  font-size: 0.95rem;
  font-weight: 600;
}

/* COMPETITION CENTER LOGO */
.card-vs {
  width: 70px;
  height: 70px;
  image-rendering: crisp-edges;
  opacity: 0.95;
}

/* Body */
.card-bottom {
  padding: 18px;
}

.buy-btn {
  background: linear-gradient(135deg, #2f5aff, #6b5bff);
  border: none;
  color: white;
  padding: 10px;
  border-radius: 10px;
  font-weight: 600;
}
.buy-btn:hover {
  opacity: 0.85;
}
</style>
