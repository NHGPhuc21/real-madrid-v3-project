<!-- src/components/NavBar.vue -->
<script setup>
import { ref, computed } from 'vue'

import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import cupIcon from '@/assets/cup/cup.png'
function forceOpen() {
  document.body.classList.add("force-open");
}

function forceClose() {
  document.body.classList.remove("force-open");
}

// =========================================
// 🔥 NHẬN THEME TỪ APP.VUE
// =========================================
const props = defineProps({
  theme: { type: String, default: "light" }
})
const forceDropdown = ref(false);

// 🔥 PHÁT SỰ KIỆN ĐỂ APP CHUYỂN THEME
const emit = defineEmits(["toggle-theme"])
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const isLoggedIn = computed(() => !!auth.token)
const isAdmin    = computed(() => auth.user?.role === 'admin')

// đang ở trang login / register?
const isAuthPage = computed(() => ['/login', '/register'].includes(route.path))

// tính chữ viết tắt cho avatar (VD: "Tú Ngọc" -> "TN")
const initials = computed(() => {
  const u = auth.user
  if (!u) return '?'
  const raw =
    u.fullname || u.name || u.username || "User"


  if (!raw) return '?'
  const parts = raw.trim().split(/\s+/)
  const first = parts[0]?.[0] || ''
  const second = parts.length > 1 ? parts[parts.length - 1][0] : ''
  const letters = (first + second).toUpperCase()
  return letters || raw[0].toUpperCase()
})
function toggleAvatarDropdown() {
  forceDropdown.value = !forceDropdown.value;
}

function doLogout () {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <nav
  class="navbar navbar-expand px-3 fixed-top shadow-sm"
  :class="[props.theme === 'dark' ? 'navbar-dark bg-dark' : 'navbar-light bg-white']"
>

    <!-- Logo Real Madrid + Logo Cúp -->
    <div class="brand-group d-flex align-items-center gap-2">

      <RouterLink class="navbar-brand d-flex align-items-center" to="/">
        <img
          src="/assets/logo/real.png"
          alt="Real Madrid"
          style="height:32px;width:32px;object-fit:contain"
        />
      </RouterLink>

      <div class="divider"></div>

      <RouterLink to="/palmares" class="trophy-link d-flex align-items-center">
        <img
          :src="cupIcon"
          alt="Palmarès"
          class="cup-logo"
        />
      </RouterLink>
    </div>

    <!-- Navbar menu -->
    <ul class="navbar-nav me-auto nav-offset">
      <li class="nav-item">
        <RouterLink class="nav-link" to="/">Home</RouterLink>
      </li>
      <li class="nav-item">
        <RouterLink class="nav-link" to="/tickets">Tickets</RouterLink>
      </li>
      <li class="nav-item">
        <RouterLink class="nav-link" to="/shop">Shop</RouterLink>
      </li>

      <li class="nav-item">
        <RouterLink class="nav-link" to="/news">News</RouterLink>
      </li>

      <li class="nav-item">
        <RouterLink class="nav-link" to="/highlights" active-class="active">Highlights</RouterLink>
      </li>

      <li class="nav-item" v-if="isAdmin">
        <RouterLink class="nav-link" to="/admin">Admin</RouterLink>
      </li>
      
    </ul>

    <!-- 🔵 SPONSORS góc phải -->
    <div class="d-none d-lg-flex align-items-center gap-3 me-3 sponsors-block">

      <a href="https://www.emirates.com/es/english/" target="_blank" rel="noopener" class="sponsor-link">
        <img src="/assets/sponsors/emirates-dark.png" alt="Emirates" class="sponsor-logo" />
      </a>

      <a href="https://www.adidas.es/futbol" target="_blank" rel="noopener" class="sponsor-link">
        <img src="/assets/sponsors/adidas-dark.png" alt="Adidas" class="sponsor-logo" />
      </a>

      <button class="btn btn-outline-secondary btn-sm" @click="emit('toggle-theme')">
        <i class="bi" :class="props.theme === 'light' ? 'bi-moon' : 'bi-sun-fill'" style="font-size:18px"></i>
      </button>

      <RouterLink to="/sponsors" class="sponsor-more">
        &#8942;
      </RouterLink>
    </div>

    <!-- Bên phải (avatar / login) -->
    <div class="d-flex align-items-center gap-2">

      <template v-if="isLoggedIn">
        <!-- AVATAR + DROPDOWN CƯỠNG CHẾ -->
<div class="nav-avatar-wrapper" @click="toggleAvatarDropdown">
  <button class="btn btn-primary avatar-btn">
    {{ initials }}
  </button>
</div>

<!-- Dropdown cưỡng chế -->
<div
  class="force-dropdown-menu"
  v-if="forceDropdown"
>
  <RouterLink class="dropdown-item" to="/profile">My Membership</RouterLink>
  <RouterLink class="dropdown-item" to="/orders">My Orders</RouterLink>
  <button class="dropdown-item" @click="doLogout">Logout</button>
</div>


      </template>

      <template v-else>
        <template v-if="!isAuthPage">
          <RouterLink class="btn btn-outline-dark btn-sm" to="/login">Login</RouterLink>
        </template>
      </template>

    </div>

  </nav>
</template>


<style scoped>
.navbar-brand {
  font-weight: 600;
}

/* Link menu */
.nav-link {
  color: #222 !important;
  font-weight: 500;
}

.nav-link:hover,
.nav-link.active {
  color: #0a4ba5 !important;
}

/* Avatar hình tròn */
.avatar-btn {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;

  /* 🔥 FIX 1: bỏ z-index cực lớn */
  z-index: auto !important;
}

/* Cụm sponsors */
/* ⛔ KHÔNG absolute, KHÔNG right: 60px */
.sponsors-block {
  display: flex;
  align-items: center;
  gap: 12px;

  /* ⭐ sponsor nằm gọn, KHÔNG đè avatar */
  position: static !important;

  pointer-events: none;
}

.sponsor-link,
.sponsor-more,
.btn.btn-outline-secondary {
  pointer-events: auto;
}


.sponsor-logo {
  height: 28px;
  object-fit: contain;
}

.sponsor-more {
  color: #000;
  font-size: 20px;
  text-decoration: none;
  padding: 0 4px;
  line-height: 1;
}

.sponsor-more:hover {
  color: #0a4ba5;
}

/* Divider */
.divider {
  width: 1px;
  height: 28px;
  background: rgba(0, 0, 0, 0.2);
  margin: 0 8px;
}

/* Dời logo Real sang phải */
.brand-group {
  margin-left: 100px;
}

/* Dời menu sang phải */
.nav-offset {
  margin-left: 350px !important;
}

/* Logo cup */
.cup-logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
  opacity: 0.85;
  transition: 0.2s;
}

.cup-logo:hover {
  opacity: 1;
  transform: scale(1.05);
}

/* Dropdown */
.dropdown-menu {
  background-color: #fff;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.dropdown-menu-end {
  right: 0;
  left: auto;
}

.dropdown-item {
  color: #222;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
  color: #0a4ba5;
}

.dropdown {
  position: relative;

  /* 🔥 FIX 2: giảm z-index xuống để không che menu */
  z-index: 20 !important;
}
.force-dropdown-menu {
  position: absolute;
  top: 48px;
  right: 10px;
  z-index: 999999 !important;
  background: white;
  border-radius: 10px;
  width: 180px;
  padding: 10px 0;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
}

html[data-bs-theme="dark"] .force-dropdown-menu {
  background: #2c2f33;
  color: #fff;
}

.force-dropdown-menu .dropdown-item {
  padding: 8px 16px;
  font-weight: 500;
  cursor: pointer;
}

.force-dropdown-menu .dropdown-item:hover {
  background: rgba(0,0,0,0.05);
}

</style>
