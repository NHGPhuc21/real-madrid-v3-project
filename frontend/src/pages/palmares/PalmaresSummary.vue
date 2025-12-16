<!-- frontend/src/pages/palmares/PalmaresSummary.vue -->
<template>
  <div class="row g-4 align-items-stretch">
    <div class="col-lg-8">
      <div class="card h-100 border-0">
        <img
          class="card-img-top rounded"
          src="/src/assets/cup/hinhnen.webp"
          alt="Trophy wall"
        />
      </div>
    </div>

    <div class="col-lg-4">
      <div class="card h-100 border-0 p-3">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="h5 mb-0 fw-bold">Bóng đá</div>
          <router-link class="gradient-btn" to="/palmares">
  Watch More
</router-link>

        </div>

        <ul class="list-unstyled mb-3">
          <li
            v-for="(t, i) in topStats"
            :key="i"
            class="d-flex align-items-center py-2"
          >
            <div class="me-3 fs-4">🏆</div>
            <div class="flex-fill">
              <div class="d-flex justify-content-between">
                <span class="fw-semibold">{{ t.title }}</span>
                <span class="fw-bold">{{ t.count }}</span>
              </div>
              <div class="progress mt-2" style="height: 6px;">
                <div
                  class="progress-bar"
                  role="progressbar"
                  :style="{ width: t.progress + '%' }"
                />
              </div>
            </div>
          </li>
        </ul>

        
      </div>
    </div>
  </div>
</template>

<script>
import data from "@/assets/data/palmares.json";

export default {
  name: "PalmaresSummary",
  computed: {
  topStats() {
    const picks = ["The best club of the 20th century","UEFA Champion League", "FIFA Club World Cup", "UEFA Super Cup", "La Liga", "UEFA Cup", "Copa Del Rey", "Spanish Super Cup"];
    const list = data.football || [];

    // Hàm chuẩn hoá tên để so khớp "gần như tuyệt đối"
    const norm = (s) =>
      (s || "")
        .toString()
        .normalize("NFC")            // chuẩn unicode
        .trim()
        .replace(/\s+/g, " ")        // gộp khoảng trắng
        .toLowerCase();

    const byName = new Map(list.map((t) => [norm(t.name), t]));

    // Duy trì đúng thứ tự theo picks, chỉ lấy mục có thật
    const chosen = picks
      .map((name) => byName.get(norm(name)))
      .filter(Boolean);

    if (!chosen.length) return [];

    const max = Math.max(...chosen.map((t) => t.count || 0), 1);

    return chosen.map((t) => ({
      title: t.name,
      count: t.count,
      progress: Math.round((t.count / max) * 100),
    }));
  },
},

};
</script>
<style scoped>
.gradient-btn {
  display: inline-block;
  padding: 8px 22px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffffff !important;
  text-decoration: none;
  border-radius: 999px;
  border: none;
  background: linear-gradient(90deg, #3b39f2, #9b6dfc);
  box-shadow: 0 4px 12px rgba(59, 57, 242, 0.35);
  transition: 0.15s ease;
}

.gradient-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(59, 57, 242, 0.45);
}

.gradient-btn:active {
  transform: scale(0.98);
}
</style>
