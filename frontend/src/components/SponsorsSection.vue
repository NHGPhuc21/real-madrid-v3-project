<template>
  <section class="container py-5">
    <h3 class="mb-4 fw-bold text-center">Football Sponsor</h3>

    <!-- Nhà tài trợ chính -->
    <h5 class="mb-3 text-muted">Main Sponsor</h5>
    <div class="row g-3 mb-5 justify-content-center">
      <div class="col-6 col-md-3 text-center" v-for="main in mainSponsors" :key="main.name">
        <div class="p-3 bg-white shadow-sm rounded-4 hover-scale">
          <img :src="main.logo" :alt="main.name" class="img-fluid sponsor-logo" />
        </div>
      </div>
    </div>

    <!-- Nhà tài trợ hàng đầu -->
    <h5 class="mb-3 text-muted">Other Main Sponsor</h5>
    <div class="row g-3 justify-content-center">
      <div class="col-6 col-md-3 text-center" v-for="top in topSponsors" :key="top.name">
        <div class="p-3 bg-white shadow-sm rounded-4 hover-scale">
          <img :src="top.logo" :alt="top.name" class="img-fluid sponsor-logo" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const mainSponsors = [
  {
    name: "Emirates",
    logo: "https://upload.wikimedia.org/wikipedia/commons/d/d7/Emirates_logo.svg",
  },
  {
    name: "Adidas",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg",
  },
];

const topSponsors = [
  {
    name: "HP",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/3a/HP_logo_2012.svg",
  },
  {
    name: "Audi",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Audi_logo_detail.svg",
  },
  {
    name: "Nivea Men",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/35/Nivea_logo.svg",
  },
];
</script>

<style scoped>
.sponsor-logo {
  max-height: 70px;
  object-fit: contain;
}
.hover-scale {
  transition: transform 0.3s ease;
}
.hover-scale:hover {
  transform: scale(1.05);
}
</style>
