<template>
  <div class="container py-5">
    <div class="auth-card mx-auto shadow rounded-3 overflow-hidden">
      <!-- Banner -->
      <div class="left d-none d-md-flex align-items-end p-4">
        <div class="left-inner text-white small">
          <h4 class="fw-bold mb-3">Welcome to Real Madrid</h4>
          <p class="mb-2">Become a Madridista and enjoy exclusive benefits.</p>
          <p class="mb-0">🏆 15 Champions League · ⚽ 36 La Liga</p>
        </div>
      </div>

      <div class="right p-4 p-md-5">
        <ul class="nav nav-tabs justify-content-center mb-4">
          <li class="nav-item">
            <RouterLink to="/login" class="nav-link">Login</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink to="/register" class="nav-link active">Register</RouterLink>
          </li>
        </ul>

        <form @submit.prevent="doRegister" class="mt-3">
          <div class="mb-3">
            <label class="form-label">Username</label>
            <input v-model="username" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input v-model="email" type="email" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input v-model="password" type="password" class="form-control" required />
          </div>
          <button class="btn btn-gold w-100">Register</button>
          <div v-if="message" class="text-success mt-2 text-center">{{ message }}</div>
          <div v-if="error" class="text-danger mt-2 text-center">{{ error }}</div>
        </form>
      </div>
    </div>

    <footer class="text-center text-muted small mt-4">
      © 2025 Real Madrid C.F. All rights reserved.
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/services/api'
import { useRouter } from 'vue-router'

const username = ref('')
const email = ref('')
const password = ref('')
const message = ref('')
const error = ref('')
const router = useRouter()

async function doRegister () {
  try {
    await api.post('/auth/register', { username: username.value, email: email.value, password: password.value })
    message.value = 'Registration successful! Redirecting to login...'
    setTimeout(() => router.push('/login'), 1000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Register failed'
  }
}
</script>

<style scoped>
.auth-card{
  max-width: 960px;
  display: grid;
  grid-template-columns: 0.85fr 1fr;
  background:#fff;
}

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

.right{ background:#fff; }
.btn-gold{ background:#b79a43; border-color:#b79a43; color:#fff; }
.btn-gold:hover{ filter:brightness(.95); }

@media (min-width:1200px){
  .left{ min-height: 420px; background-position: center 42%; }
}
@media (max-width: 767.98px){
  .auth-card{ grid-template-columns: 1fr; }
  .left{ min-height: 200px; }
}
</style>
