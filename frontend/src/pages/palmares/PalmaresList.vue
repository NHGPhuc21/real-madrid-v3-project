<template>
  <div class="vstack gap-3">
    <div
      v-for="(item, idx) in items"
      :key="idx"
      class="card border-0 shadow-sm p-3"
    >
      <!-- Hàng chính: Cúp + Số  |  (Tên + Năm)  |  Ảnh -->
      <div class="row g-4 align-items-center">
        <!-- Cột trái: Cúp + Số (ngang hàng, cùng baseline & cùng kích thước) -->
<<!-- Cột trái -->
<div class="col-auto">
  <div class="trophy-unit d-flex align-items-baseline">
    <i class="fas fa-trophy cup-fa text-primary"></i>
    <span class="count text-primary">{{ item.count }}</span>
  </div>
</div>



        <!-- Cột giữa: Tên + Năm (nằm cùng HÀNG với cúp + số) -->
        <div class="col">
          <div class="h5 mb-1 title">{{ item.name }}</div>
          <div class="text-muted small years">
            {{ formattedYears(item.years) }}
          </div>
        </div>

        <!-- Cột phải: Ảnh minh hoạ -->
        <div class="col-md-4 d-none d-md-block">
          <div class="ratio ratio-16x9">
            <img
              :src="item.image"
              class="rounded object-fit-cover"
              :alt="item.name"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: { type: Array, required: true }
});

function formattedYears(years) {
  if (!years || !years.length) return "";
  return years.join(" ");
}
</script>

<style scoped>
/* Đặt chiều cao CÙNG THAM CHIẾU cho cúp và số để khớp hàng với khối chữ */
.cup {
  height: 64px;             /* cùng “độ cao nhìn” với số */
  width: auto;
  object-fit: contain;
}
.cup-fallback {             /* khi dùng Font Awesome */
  font-size: 32px;
  line-height: 1;
  color: var(--bs-primary);
}

/* Số to nhưng cùng baseline với icon nhờ line-height:1 và align-items-center */


/* Đảm bảo ảnh cover đẹp */
.object-fit-cover {
  object-fit: cover;
}

/* Giữ khoảng cách/typo gọn gàng */
.title { line-height: 1.25; }
.years { line-height: 1.3; }

/* Nếu muốn cúp + số “cân” đúng tầm với khối chữ, để row căn giữa theo trục dọc */
.trophy-wrap { min-height: 56px; } /* ~ chiều cao block chữ (title + years) */
@media (min-width: 992px) {
  .trophy-wrap { min-height: 64px; }
}
/* === KÍCH THƯỚC DÙNG CHUNG ===
   Chỉnh 1 chỗ là icon & số đều đổi theo */
/* Kích thước gốc chung */
.trophy-unit{
  --trophy-size: 64px;      /* đổi 56/60/64 nếu muốn to/nhỏ toàn bộ */
  --cup-scale: 0.92;        /* ✅ tỉ lệ icon so với số (0.90–0.96) */
  font-size: var(--trophy-size);
  line-height: 1;
  gap: .5rem;
}

/* Icon FA thường “to mắt” hơn số → scale nhẹ xuống */
.cup-fa{
  font-size: calc(1em * var(--cup-scale)); /* = 0.92em mặc định */
  line-height: 1;
  display: inline-block;
  transform: translateY(0.04em);           /* nhích baseline cho phẳng hàng */
}

/* Số lấy đúng 1em = --trophy-size */
.count{
  font-size: 1em;
  line-height: 1;
  font-weight: 800;
}


</style>
