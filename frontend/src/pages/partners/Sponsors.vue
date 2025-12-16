<template>
  <div class="container py-5">
    <h1 class="mb-4">Sponsor</h1>

    <!-- ===== Nhà tài trợ chính ===== -->
    <section class="mb-5">
      <h3 class="mb-3">Main Sponsor</h3>
      <div class="row g-4">
        <div class="col-12 col-md-6">
          <a
            href="https://www.emirates.com/es/english/"
            target="_blank"
            rel="noopener"
            class="card sponsor-card"
          >
            <div class="card-body d-flex align-items-center justify-content-center">
              <img
                src="/assets/sponsors/emirates-dark.png"
                alt="Emirates"
                class="img-fluid"
                style="max-height: 120px"
              />
            </div>
          </a>
        </div>

        <div class="col-12 col-md-6">
          <a
            href="https://www.adidas.es/futbol"
            target="_blank"
            rel="noopener"
            class="card sponsor-card"
          >
            <div class="card-body d-flex align-items-center justify-content-center">
              <img
                src="/assets/sponsors/adidas-dark.png"
                alt="Adidas"
                class="img-fluid"
                style="max-height: 120px"
              />
            </div>
          </a>
        </div>
      </div>
    </section>

    <!-- ===== Nhà tài trợ hàng đầu ===== -->
    <section class="mb-5">
      <h3 class="mb-3">Other Main Sponsor</h3>
      <div class="row g-4">
        <div class="col-12 col-md-6">
          <a
            href="https://www.google.com/url?sa=i&url=https%3A%2F%2Fcommons.wikimedia.org%2Fwiki%2FFile%3AHP_logo_2012.svg&psig=AOvVaw3Lpk7T1OgiLLwceCu3UGkx&ust=1762615446935000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCMCg7a6s4JADFQAAAAAdAAAAABAE"
            target="_blank"
            rel="noopener"
            class="card sponsor-card"
          >
            <div class="card-body d-flex align-items-center justify-content-center">
              <img
                src="/assets/sponsors/hp.png"
                alt="Emirates"
                class="img-fluid"
                style="max-height: 120px"
              />
            </div>
          </a>
        </div>
      </div>
    </section>

    <!-- ===== Nhà tài trợ toàn cầu ===== -->
    <section class="mb-5">
      <h3 class="mb-3">Global Sponsor</h3>

      <!-- thêm sponsor-global-grid để áp CSS riêng -->
      <div class="row g-4 sponsor-global-grid">
        <div class="col-6 col-md-4 col-lg-3 col-xl-2">
          <a
            href="https://www.emirates.com/es/english/"
            target="_blank"
            rel="noopener"
            class="card sponsor-card"
          >
            <div class="card-body d-flex align-items-center justify-content-center">
              <img
                src="/assets/sponsors/mahou.png"
                alt="Emirates"
                class="img-fluid"
              />
            </div>
          </a>
        </div>

        <div class="col-6 col-md-4 col-lg-3 col-xl-2">
          <a
            href="https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.creativebloq.com%2Fnews%2Fdubai-logo&psig=AOvVaw1M4w_Gxu-5n-x0-OvXSiBM&ust=1762616034147000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCIiRusau4JADFQAAAAAdAAAAABAE"
            target="_blank"
            rel="noopener"
            class="card sponsor-card"
          >
            <div class="card-body d-flex align-items-center justify-content-center">
              <img
                src="/assets/sponsors/dubai.png"
                alt="Adidas"
                class="img-fluid"
              />
            </div>
          </a>
        </div>

        <div class="col-6 col-md-4 col-lg-3 col-xl-2">
          <a
            href="https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.creativebloq.com%2Fnews%2Fdubai-logo&psig=AOvVaw1M4w_Gxu-5n-x0-OvXSiBM&ust=1762616034147000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCIiRusau4JADFQAAAAAdAAAAABAE"
            target="_blank"
            rel="noopener"
            class="card sponsor-card"
          >
            <div class="card-body d-flex align-items-center justify-content-center">
              <img
                src="/assets/sponsors/bmw.png"
                alt="Adidas"
                class="img-fluid"
              />
            </div>
          </a>
        </div>

        <div class="col-6 col-md-4 col-lg-3 col-xl-2">
          <a
            href="https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.creativebloq.com%2Fnews%2Fdubai-logo&psig=AOvVaw1M4w_Gxu-5n-x0-OvXSiBM&ust=1762616034147000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCIiRusau4JADFQAAAAAdAAAAABAE"
            target="_blank"
            rel="noopener"
            class="card sponsor-card"
          >
            <div class="card-body d-flex align-items-center justify-content-center">
              <img
                src="/assets/sponsors/lou.png"
                alt="Adidas"
                class="img-fluid"
              />
            </div>
          </a>
        </div>

      </div>
    </section>
  </div>
</template>

<script setup>
// không cần logic JS phức tạp lúc này
</script>

<style scoped>
.sponsor-card {
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  border: none;
}

.sponsor-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

/* Grid global sponsors: thẻ card đều nhau giống hình 1 */
.sponsor-global-grid .sponsor-card {
  height: 180px;              /* chiều cao cố định cho tất cả box */
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.sponsor-global-grid .card-body {
  height: 100%;
  padding: 32px;
}

.sponsor-global-grid img {
  max-width: 80%;
  max-height: 80px;
  object-fit: contain;
}
</style>
