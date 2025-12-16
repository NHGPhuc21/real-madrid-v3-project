<!-- frontend/src/components/FooterBar.vue -->
<template>
  <footer class="site-footer text-light pt-5 pb-3 mt-5">
    <div class="container">

      <div class="row gy-4">
        <!-- About + Social -->
        <div class="col-lg-4">
          <div class="d-flex align-items-center mb-3">
            <img src="/assets/logo/logo.png" alt="Real Madrid" class="me-2 footer-logo" />

            <h5 class="mb-0 fw-bold">Real Madrid</h5>
          </div>

          <p class="small opacity-75 mb-3">
            Real Madrid Club de Fútbol, commonly referred to as Real Madrid,
            is a Spanish professional football club based in Madrid.
          </p>

          <!-- Social icons -->
          <div class="social-icons mt-3">
            <a v-for="i in social" :key="i.icon" :href="i.href" target="_blank" rel="noopener"
               class="btn btn-icon me-2" :aria-label="i.label">
              <i :class="i.icon"></i>
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="col-6 col-lg-2">
          <h6 class="fw-bold mb-3">Quick Links</h6>
          <ul class="list-unstyled small mb-0">
            <li v-for="l in quick" :key="l.label" class="mb-2">
              <RouterLink class="link-light link-opacity-75-hover" :to="l.to">{{ l.label }}</RouterLink>
            </li>
          </ul>
        </div>

        <!-- Useful Links -->
        <div class="col-6 col-lg-3">
          <h6 class="fw-bold mb-3">Useful Links</h6>
          <ul class="list-unstyled small mb-0">
            <li v-for="l in useful" :key="l.label" class="mb-2">
              <RouterLink v-if="l.to" class="link-light link-opacity-75-hover" :to="l.to">{{ l.label }}</RouterLink>
              <a v-else :href="l.href" target="_blank" class="link-light link-opacity-75-hover">{{ l.label }}</a>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div class="col-lg-3">
          <h6 class="fw-bold mb-3">Contact Us</h6>
          <ul class="list-unstyled small mb-0">
            <li class="mb-2"><i class="bi bi-geo-alt me-2"></i>Av. de Concha Espina, 1, 28036 Madrid, Spain</li>
            <li class="mb-2"><i class="bi bi-telephone me-2"></i>+34 91 398 43 00</li>
            <li class="mb-2"><i class="bi bi-envelope me-2"></i>info@realmadrid.com</li>
          </ul>
        </div>
      </div>

      <hr class="border-secondary border-opacity-25 my-4" />

      <div class="d-flex flex-column flex-md-row justify-content-between small opacity-75">
        <div>© {{ year }} Real Madrid C.F. All rights reserved.</div>
        <div class="d-flex gap-3">
          <RouterLink to="/privacy" class="link-light link-opacity-75-hover">Privacy</RouterLink>
          <RouterLink to="/terms" class="link-light link-opacity-75-hover">Terms</RouterLink>
        </div>
      </div>

    </div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()

const social = [
  { label: 'Facebook',   icon: 'bi bi-facebook',   href: '#' },
  { label: 'Twitter/X',  icon: 'bi bi-twitter-x',  href: '#' },
  { label: 'Instagram',  icon: 'bi bi-instagram',  href: '#' },
  { label: 'YouTube',    icon: 'bi bi-youtube',    href: '#' },
  { label: 'TikTok',     icon: 'bi bi-tiktok',     href: '#' },
]

const quick = [
  { label: 'First Team',   to: '/' },
  { label: 'Matches',      to: '/tickets' },
  { label: 'News',         to: '/news' },
  { label: 'Club Info',    to: '/about' },
  { label: 'Tickets',      to: '/tickets' },
  { label: 'Foundation',   to: '/foundation' },
]

const useful = [
  { label: 'Official Store',   to: '/shop' },
  { label: 'Stadium Tour',     to: '/tour' },
  { label: 'Real Madrid TV',   href: '#' },
  { label: 'Membership',       to: '/membership' },
  { label: 'Madridista Card',  to: '/card' },
  { label: 'Academy',          to: '/academy' },
]
</script>

<style scoped>
.site-footer { background: #081624; }

.btn.btn-icon {
  width:36px; height:36px; border-radius:50%;
  display:inline-flex; align-items:center; justify-content:center;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.12);
  transition: all .2s ease;
  color: #fff;
  font-size: 1rem;
}
.btn.btn-icon:hover {
  background: rgba(255,255,255,.2);
  color: #ffd700;
}
.footer-logo{
  width: 96px;   /* gấp đôi 48px; muốn lớn nữa thì tăng, ví dụ 120px/160px */
  height: auto;  /* RẤT QUAN TRỌNG: giữ đúng tỉ lệ, không tạo ô vuông */
  display: block; /* tránh khoảng trống do baseline */
}

</style>
