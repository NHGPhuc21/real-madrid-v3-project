<!-- frontend/src/pages/Login.vue -->
<template> 
  <div class="container py-5">
    <div class="auth-card mx-auto shadow rounded-3 overflow-hidden">
      <!-- Cột trái: banner -->
      <div class="left d-none d-md-flex align-items-end p-4">
        <div class="left-inner text-white small">
          <h4 class="fw-bold mb-3">Welcome to Real Madrid</h4>
          <p class="mb-2">Become a Madridista and enjoy exclusive benefits.</p>
          <p class="mb-0">🏆 15 Champions League · ⚽ 36 La Liga</p>
        </div>
      </div>

      <!-- Cột phải: form -->
      <div class="right p-4 p-md-5">
        <ul class="nav nav-tabs justify-content-center mb-4">
          <li class="nav-item">
            <RouterLink to="/login" class="nav-link active">Login</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink to="/register" class="nav-link">Register</RouterLink>
          </li>
        </ul>

        <form @submit.prevent="doLogin" class="mt-3">
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input v-model="email" type="email" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input v-model="password" type="password" class="form-control" required />
          </div>
          <button class="btn btn-gold w-100" type="submit">Login</button>
          <div v-if="error" class="text-danger mt-2 text-center">{{ error }}</div>
        </form>

        <div class="text-center text-muted small mt-4">Or login with</div>
        <div class="d-flex justify-content-center gap-3 mt-2">
          <a href="https://facebook.com" target="_blank" rel="noopener">
            <i class="bi bi-facebook fs-4"></i>
          </a>
          <a href="https://accounts.google.com" target="_blank" rel="noopener">
            <i class="bi bi-google fs-4"></i>
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener">
            <i class="bi bi-twitter-x fs-4"></i>
          </a>
        </div>
      </div>
    </div>

    <footer class="text-center text-muted small mt-4">
      © 2025 Real Madrid C.F. All rights reserved.
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/api'
import { useAuthStore } from '@/store/auth'
const route = useRoute();
const email = ref('')
const password = ref('')
const error = ref(null)
const auth = useAuthStore()
const router = useRouter()

async function doLogin () {
  try {
    const res = await api.post('/auth/login', { email: email.value, password: password.value })
    auth.setAuth(res.data.token, res.data.user)
    // Trả về trang trước đó (hoặc '/')
    const next = route.query.next || '/'
    router.replace(String(next))
  } catch (err) {
    error.value = err.response?.data?.message || 'Login failed'
  }
}
</script>

<style scoped>
/* Card cân hơn, banner không bị quá lớn */
.auth-card{
  max-width: 960px;
  display: grid;
  grid-template-columns: 0.85fr 1fr;
  background: #fff;
}

/* Banner */
.left{
  position: relative;
  min-height: 360px;
  background:
    linear-gradient( to bottom right, rgba(0,27,58,.65), rgba(0,27,58,.65) ),
    url('/assets/logo/realmadrid.png') center 38% / cover no-repeat;
}
.left-inner{ z-index: 1; }
.left::after{
  content:'';
  position:absolute; inset:0;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.02);
}

/* Form */
.right{ background:#fff; }
.btn-gold{ background:#b79a43; border-color:#b79a43; color:#fff; }
.btn-gold:hover{ filter:brightness(.95); }

/* Responsive */
@media (min-width: 1200px){
  .left{ min-height: 420px; background-position: center 42%; }
}
@media (max-width: 767.98px){
  .auth-card{ grid-template-columns: 1fr; }
  .left{ min-height: 200px; }
}
</style>
