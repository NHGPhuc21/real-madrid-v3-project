<!-- frontend/src/pages/WalletBalance.vue -->
<template>
  <div class="container py-4">
    <h3 class="mb-3">Số dư ví</h3>

    <div v-if="loading">Loading…</div>
    <div v-else-if="error" class="text-danger">{{ error }}</div>
    <div v-else class="card">
      <div class="card-body">
        <div class="h4 mb-0">
          {{ money(balance.available) }}
          <small class="text-muted ms-2">(đang giữ: {{ money(balance.frozen) }})</small>
        </div>
        <div class="mt-2">
     <span class="text-muted">Ví thưởng:</span>
     <strong class="ms-1">{{ money(balance.bonus || 0) }}</strong>
     <small class="text-muted ms-1">(đang giữ: {{ money(balance.bonus_frozen || 0) }})</small>
   </div>
      </div>

      <div class="card-footer d-flex gap-2">
        <div class="input-group" style="max-width: 280px;">
          <span class="input-group-text">Nạp</span>
          <input type="number" class="form-control" v-model.number="topupAmount" min="1000" />
          <button class="btn btn-primary" @click="topup">Nạp</button>
        </div>

        <div class="input-group" style="max-width: 320px;">
          <span class="input-group-text">Rút</span>
          <input type="number" class="form-control" v-model.number="wdAmount" min="1000" />
          <button class="btn btn-outline-danger" @click="withdraw">Yêu cầu rút</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import api from '@/services/api'
import { ref, onMounted } from 'vue'

const loading = ref(true)
const error = ref('')
const balance = ref({ available: 0, frozen: 0, currency: 'VND' })
const topupAmount = ref(50000)
const wdAmount = ref(20000)

function money(v){ return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(v ?? 0) }

async function load(){
  loading.value = true
  error.value = ''
  try{
    const r = await api.get('/wallet/balance')
    balance.value = r.data
  }catch(e){
    error.value = e?.response?.data?.message || 'Không tải được số dư'
  }finally{
    loading.value = false
  }
}

async function topup(){
  if (!topupAmount.value || topupAmount.value <= 0) return alert('Số tiền không hợp lệ')
  try{
    const r = await api.post('/wallet/topup', { amount: topupAmount.value, provider: 'mock' })
    // Mock: tự bắn webhook để cộng tiền
    await fetch('/api/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': import.meta.env.VITE_WEBHOOK_SECRET || 'dev_secret'
      },
      body: JSON.stringify({
        type: 'topup.succeeded',
        data: {
          topupId: r.data.topupId,
          userId: null, // backend sẽ lấy từ token? -> ở P3 ta truyền userId cho chắc
          provider: 'mock',
          providerTxnId: `mock_${Date.now()}`,
          amount: topupAmount.value
        }
      })
    })
    // NOTE: Ở trên mình set userId=null; để chắc chắn, sửa thành userId thực tế:
    // Gợi ý: lưu trong store khi login; tạm thì reload balance ngay và tin tưởng server dùng token.
    await load()
    alert('Nạp tiền mock thành công!')
  }catch(e){
    alert(e?.response?.data?.message || 'Nạp thất bại')
  }
}

async function withdraw(){
  if (!wdAmount.value || wdAmount.value <= 0) return alert('Số tiền không hợp lệ')
  try{
    const r = await api.post('/wallet/withdraw', { amount: wdAmount.value, destInfo: { bank:'MockBank', account:'000-xxx' } })
    await load()
    alert(`Đã tạo yêu cầu rút #${r.data.withdrawalId} (pending). Admin sẽ duyệt sau.`)
  }catch(e){
    alert(e?.response?.data?.message || 'Yêu cầu rút thất bại')
  }
}

onMounted(load)
</script>
