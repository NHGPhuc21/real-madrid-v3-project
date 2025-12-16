<!-- frontend/src/pages/orders/OrderDetail.vue -->
<template>
  <div class="container py-4">
    <h3 class="mb-3">Order Detail #{{ order?.orderid }}</h3>

    <div v-if="loading" class="text-muted">Loading…</div>
    <div v-else-if="error" class="text-danger">{{ error }}</div>
    <div v-else-if="!order">Order not found.</div>
    <div v-else class="card">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <div class="row g-3 flex-grow-1">
            <div class="col-md-4">
              <div class="text-muted">Date</div>
              <div>{{ formatDate(order.orderdate) }}</div>
            </div>
            <div class="col-md-4">
              <div class="text-muted">State</div>
              <span class="badge text-capitalize" :class="badgeClass(order.orderstatus)">
                {{ order.orderstatus }}
              </span>
            </div>
            <div class="col-md-4">
              <div class="text-muted">Pay</div>
              <span class="badge text-capitalize" :class="payBadgeClass(order.paymentstatus)">
                {{ order.paymentstatus }}
              </span>
            </div>
            <div class="col-12" v-if="order.shippingaddress">
              <div class="text-muted">Delivery address</div>
              <div>{{ order.shippingaddress }}</div>
            </div>
          </div>

          
        </div>
      </div>

      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>Product</th>
              <th class="text-end">Unit price</th>
              <th class="text-center">Number</th>
              <th class="text-end">Into money</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="it in items" :key="it.detailid">
              <td>{{ it.productname }}</td>
              <td class="text-end">{{ money(it.unitprice) }}</td>
              <td class="text-center">{{ it.quantity }}</td>
              <td class="text-end fw-semibold">{{ money(it.subtotal) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card-body d-flex justify-content-end">
        <div class="text-end">
          <div v-if="order.shippingfee" class="mb-1">
            <span class="text-muted me-2">Shipping fee:</span>
            <span>{{ money(order.shippingfee) }}</span>
          </div>
          <div class="h5 mb-0">
            <span class="text-muted me-2">Total:</span>
            <span class="fw-bold">{{ money(order.totalamount) }}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="card-footer d-flex justify-content-between">
        <RouterLink class="btn btn-outline-secondary" to="/shop">← Continue to buy</RouterLink>

        <div class="d-flex gap-2">
          <RouterLink class="btn btn-outline-primary" to="/orders">Watch all orders</RouterLink>

          <button
            v-if="order.paymentstatus==='unpaid' && order.orderstatus==='pending'"
            class="btn btn-primary"
            @click="openPay('qr')"
          >Pay by QR</button>

          <button
            v-if="order.paymentstatus==='unpaid' && order.orderstatus==='pending'"
            class="btn btn-success"
            @click="openPay('wallet')"
          >Pay with Wallet</button>

          <button v-if="order.orderstatus==='pending'" class="btn btn-outline-danger" @click="cancel">
            Cancel order
          </button>

          <button
            v-if="isAdmin && order.paymentstatus==='paid'"
            class="btn btn-outline-warning"
            @click="refund"
          >Refund</button>
        </div>
      </div>

      <!-- Modal QR / Wallet -->
      <div class="modal fade" tabindex="-1" ref="payModalRef">
        <div class="modal-dialog modal-sm">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                {{ paySession?.provider === 'wallet' ? 'Pay by Wallet' : 'Scan QR to pay' }}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body text-center">
              <div v-if="!paySession">Creating session</div>

              <div v-else>
                <template v-if="paySession.provider !== 'wallet'">
                  <img :src="paySession.qr_data || abs(paySession.img_url)" style="width:100%;max-width:280px" alt="QR" />
                  <div class="text-muted small mt-2">Provider: {{ paySession.provider.toUpperCase() }}</div>
                  <div class="mt-2">
                    <a class="btn btn-sm btn-outline-primary" :href="paySession.checkout_url" target="_blank" rel="noopener">
                      Open payment gateway
                    </a>
                  </div>
                  <div class="text-muted small mt-2">The system will automatically update the status…</div>
                </template>

                <template v-else>
                  <div class="mb-2 text-start">
                    <label class="form-label">Enter wallet PIN </label>
                    <input
                      type="password"
                      class="form-control"
                      v-model="pin"
                      placeholder="••••"
                      maxlength="12"
                      @keyup.enter="confirmWalletPay"
                    />
                    <div class="form-text">Expires at: {{ formatDate(paySession.expire_at) }}</div>
                  </div>

                  <button class="btn btn-success w-100" :disabled="charging" @click="confirmWalletPay">
                    {{ charging ? 'Confirming to pay…' : 'Confirm to pay' }}
                  </button>

                  <div class="text-muted small mt-2">The system will automatically update the status…</div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- /Modal -->
    </div>
  </div>
</template>

<script setup>
import { useRoute, RouterLink } from 'vue-router'
import api, { ABS as abs } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { onMounted, ref, onUnmounted, computed, watch } from 'vue'
import { toast } from "@/composables/useToast";

const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.role === 'admin')

const route = useRoute()
const orderId = computed(() => route.params.id)

const payModalRef = ref(null)
let Modal, payModal, pollTimer = null, autoTimer = null
const paySession = ref(null)
const loading = ref(true)
const error = ref('')
const order = ref(null)
const items = ref([])

const pin = ref("")
const charging = ref(false)

function money(v){ return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(v ?? 0) }
function formatDate(s){ try { return new Date(s).toLocaleString('vi-VN') } catch { return s } }

function badgeClass(st){
  switch ((st || '').toLowerCase()) {
    case 'pending':    return 'bg-warning text-dark'
    case 'processing': return 'bg-brown'
    case 'shipped':    return 'bg-primary'
    case 'delivered':  return 'bg-success'
    case 'cancelled':  return 'bg-danger'
    default:           return 'bg-secondary'
  }
}
function payBadgeClass(st){
  switch ((st || '').toLowerCase()) {
    case 'paid':     return 'bg-success'
    case 'unpaid':   return 'bg-secondary'
    case 'refunded': return 'bg-warning text-dark'
    default:         return 'bg-secondary'
  }
}

async function refund(){
  const amt = Number(prompt('Nhập số tiền refund (VND):', order.value?.totalamount || 0))
  if (!amt || amt <= 0) return
  try{
    await api.post(`/admin/orders/${orderId.value}/refund`, { amount: amt, reason: 'Admin refund from OrderDetail' })
    await fetchDetail()
    toast('Real Madrid Club responded that: Refund successfully!', 'success')

  }catch(e){
    toast(e?.response?.data?.message || 'Real Madrid Club responded that: Refund failed', 'error')

  }
}

async function fetchDetail(){
  loading.value = true
  error.value = ''
  try {
    const r = await api.get(`/orders/${orderId.value}`)
    order.value = r.data
    items.value = r.data?.items || []
  } catch (e) {
    console.error(e)
    error.value = e?.response?.data?.message || 'Load đơn hàng thất bại'
  } finally {
    loading.value = false
  }
}

async function cancel(){
  if (!confirm('Hủy đơn này?')) return
  try {
    await api.patch(`/orders/${orderId.value}/cancel`)
    await fetchDetail()
  } catch (e) {
    toast(e?.response?.data?.message || 'Real Madrid Club responded that: Cancel order failed', 'error')

  }
}

async function ensureModal(){
  if(!Modal) Modal = (await import('bootstrap/js/dist/modal')).default
  if (!payModal) {
    payModal = new Modal(payModalRef.value, { backdrop: 'static' })
    payModalRef.value.addEventListener('hidden.bs.modal', async () => {
      stopPolling()
      await fetchDetail()          // ⬅️ đóng modal là refresh ngay
    })
  }
}

async function openPay(provider='qr'){
  if (!order.value || order.value.orderstatus !== 'pending' || order.value.paymentstatus !== 'unpaid') {
    toast('Real Madrid Club responded that: This order cannot be paid.', 'error')

    return
  }

  await ensureModal()
  paySession.value = null
  pin.value = ""
  charging.value = false
  payModal.show()

  try {
    const r = await api.post('/payments/session', { orderId: orderId.value, provider })
    const sid       = r.data?.id
    const providerR = r.data?.provider

    if (providerR === 'wallet') {
      paySession.value = { ...r.data, provider: 'wallet', img_url: null, checkout_url: null, qr_data: null }
    } else {
      const imgUrl   = r.data?.qr_url
      const checkoutUrl = `${location.origin}/pay/${sid}`
      paySession.value = { ...r.data, img_url: imgUrl, checkout_url: checkoutUrl }
      const { default: QR } = await import('qrcode')
      const canvas = document.createElement('canvas')
      await QR.toCanvas(canvas, checkoutUrl, { margin: 1 })
      paySession.value.qr_data = canvas.toDataURL()
    }

    startPolling()
  } catch (e) {
    const msg = e?.response?.data?.message || 'Tạo phiên thanh toán thất bại'
    toast(msg, 'error')

    stopPolling()
    try { payModal.hide() } catch {}
  }
}

function startPolling(){
  stopPolling()
  pollTimer = setInterval(async () => {
    try{
      const r = await api.get(`/payments/session/${paySession.value.id}`)
      if (paySession.value) paySession.value = { ...paySession.value, ...r.data }

      if (r.data.status === 'paid') {
  stopPolling();
  payModal.hide();
  await fetchDetail();
  await auth.refreshUser();



  toast('Real Madrid Club responded that: Payment successfully', 'success')

}



      if(r.data.status === 'failed' || r.data.status === 'expired'){
        stopPolling()
        payModal.hide()
        toast('Real Madrid Club responded that: Payment failed', 'error')

      }
    }catch{}
  }, 2000)
}
function stopPolling(){ if(pollTimer){ clearInterval(pollTimer); pollTimer = null } }

async function confirmWalletPay(){
  if (!pin.value) {
  toast('Please enter your PIN', 'error')
  return
}

  try{
    charging.value = true
    await api.post('/wallet/charge', { sessionId: paySession.value.id, pin: pin.value })
    // Polling sẽ tự phát hiện 'paid'
  }catch(e){
    toast(e?.response?.data?.message || 'Real Madrid Club responded that: Wallet payment failed', 'error')

  }finally{
    charging.value = false
  }
}

/* 🔁 Auto refresh khi còn unpaid */
function startAutoRefresh(){
  stopAutoRefresh()
  autoTimer = setInterval(async () => {
    if (order.value && order.value.paymentstatus !== 'paid') {
      await fetchDetail()
    }
  }, 10000)
}
function stopAutoRefresh(){ if (autoTimer) { clearInterval(autoTimer); autoTimer = null } }

/* 👂 Refetch khi quay lại tab / lấy focus (tránh “đơ” do ở nền) */
function onFocusOrVisible(){
  if (document.visibilityState === 'visible') {
    fetchDetail()
  }
}

onMounted(async () => {
  await fetchDetail()
  startAutoRefresh()
  window.addEventListener('focus', onFocusOrVisible)
  document.addEventListener('visibilitychange', onFocusOrVisible)
})

watch(() => orderId.value, async () => {
  stopPolling()
  await fetchDetail()
  startAutoRefresh()
})

onUnmounted(() => {
  stopPolling()
  stopAutoRefresh()
  window.removeEventListener('focus', onFocusOrVisible)
  document.removeEventListener('visibilitychange', onFocusOrVisible)
})
</script>

<style scoped>
.bg-brown { background-color: #795548 !important; color: #fff !important; }
</style>
