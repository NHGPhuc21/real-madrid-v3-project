<!-- frontend/src/pages/CartDetail.vue -->
<template>
  <div class="container py-4 cart-detail">
    <h3 class="mb-4">Cart</h3>

    <div v-if="cart.loading" class="text-muted">Loading…</div>
    <div v-else-if="!cart.items.length" class="text-muted">
      Cart is empty. <RouterLink to="/shop">Continue to buy</RouterLink>
    </div>

    <div v-else class="card">
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th style="width:72px"></th>
              <th>Product</th>
              <th class="text-end">Unit price</th>
              <th style="width:180px" class="text-center">Number</th>
              <th class="text-end">Into money</th>
              <th style="width:80px" class="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="it in cart.items" :key="it.itemid">
              <td>
                <img :src="img({ imageurl: it.imageurl })" class="img-thumb" alt="" />
              </td>
              <td>
                <div class="fw-semibold">{{ it.productname }}</div>
                <!-- Ẩn Mã SP với người dùng; vẫn giữ productid để thao tác -->
              </td>
              <td class="text-end">{{ money(it.unitprice) }}</td>
              <td>
                <div class="qty d-flex justify-content-center">
                  <button class="btn btn-sm btn-outline-secondary" @click="dec(it)">-</button>
                  <input
                    class="form-control form-control-sm text-center mx-2"
                    style="width:64px"
                    :value="it.quantity"
                    @change="onQtyInput(it, $event)"
                  />
                  <button class="btn btn-sm btn-outline-secondary" @click="inc(it)">+</button>
                </div>
              </td>
              <td class="text-end fw-semibold">
                {{ money(Number(it.unitprice) * it.quantity) }}
              </td>
              <td class="text-center">
                <button class="btn btn-link text-danger p-0" @click="remove(it.productid)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card-body d-flex justify-content-end">
        <div class="text-end">
          <div class="mb-2">
            <span class="me-2">Total:</span>
            <span class="h5 mb-0">{{ money(cart.totalAmount) }}</span>
          </div>
          <button class="btn btn-primary" @click="checkout" :disabled="!cart.items.length || placing">
            <span v-if="placing" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Buy
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, nextTick, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useCartStore } from '@/store/cart'
import { getProductImage } from '@/services/assets'
import api from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/composables/useToast'

const router = useRouter()
const cart = useCartStore()
const placing = ref(false)
const auth = useAuthStore()

function img(p){ return getProductImage(p.imageurl) }
function money(v){ return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(v ?? 0) }

// Số lượng: nếu về 0 => store sẽ tự xóa item
async function inc(it){ await cart.setQty(it.productid, it.quantity + 1) }
async function dec(it){ await cart.setQty(it.productid, it.quantity - 1) }
async function onQtyInput(it, e){
  const v = parseInt(e.target.value ?? '0', 10)
  await cart.setQty(it.productid, Number.isFinite(v) ? v : 0)
}
async function remove(productId){ await cart.remove(productId) }

// -- NỐI CHECKOUT: gọi POST /api/orders rồi điều hướng sang /orders/:id
async function checkout(){
  if (!cart.items.length || placing.value) return
  // Guard login lần nữa (phòng trường hợp vào trực tiếp)
  if (!auth.token) {
    return router.push({ name: 'Login', query: { next: '/cart' } })
  }
  try {
    placing.value = true
    const payload = {
      shippingAddress: null,
      paymentMethod: 'cod',
      notes: null
    }
    const r = await api.post('/orders', payload)
    const orderId = r.data?.orderId
    if (!orderId) throw new Error('No orderId returned')

    // clear giỏ: BE đã xóa -> FE refetch lại
    await cart.fetch()
    toast(`Create order already #${orderId}`)

    router.push({ name: 'OrderDetail', params: { id: String(orderId) } })
  } catch (e) {
    console.error('Checkout failed:', e)
    alert(e?.response?.data?.message || 'Checkout failed')
  } finally {
    placing.value = false
  }
}


// --- FIX cuộn: đảm bảo body không bị khóa bởi offcanvas/modal
function unlockBodyScroll() {
  document.body.classList.remove('modal-open')
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
}

onMounted(async () => {
  unlockBodyScroll()
  await cart.fetch().catch(()=>{})
  await nextTick()
  window.scrollTo({ top: 0 })
})

onUnmounted(() => {
  unlockBodyScroll()
})
</script>

<style scoped>
.img-thumb{
  width: 64px; height: 64px; object-fit: contain;
}
.cart-detail .card { overflow: hidden; }
</style>
