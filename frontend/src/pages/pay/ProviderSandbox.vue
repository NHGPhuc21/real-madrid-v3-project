<!-- frontend/src/pages/pay/ProviderSandbox.vue -->
<template>
  <div class="container py-5" style="max-width:520px">
    <div class="card shadow-sm">
      <div class="card-body">
        <h5 class="mb-3">Order payment</h5>

        <div class="mb-2 text-muted small">Session code: {{ sid }}</div>

        <div v-if="loading" class="text-muted">Processing…</div>
        <template v-else>
          <div class="mb-3">
            <div class="form-text">Please confirm the transaction results:</div>
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-success flex-fill" @click="done(true)">Pay</button>
            <button class="btn btn-outline-secondary flex-fill" @click="done(false)">Cancel</button>
          </div>

          <div v-if="message" class="alert mt-3" :class="ok ? 'alert-success':'alert-danger'">
            {{ message }}
          </div>

          <div class="text-end mt-2">
            <button class="btn btn-link" @click="goBack">Close</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const sid = route.params.sid

const loading = ref(false)
const ok = ref(false)
const message = ref('')

async function done(success){
  loading.value = true
  message.value = ''
  try{
    await api.post('/payments/callback', { sessionId: sid, success })
    ok.value = !!success
    message.value = success ? 'Pay successfully.' : 'Transaction has been canceled.'
  }catch(e){
    ok.value = false
    message.value = e?.response?.data?.message || 'Có lỗi xảy ra.'
  }finally{
    loading.value = false
  }
}

function goBack(){
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>
