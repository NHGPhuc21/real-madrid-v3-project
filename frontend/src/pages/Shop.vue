<template>
  <div class="container py-4 shop-page">
    <h2 class="mb-4">Shop</h2>

    <!-- Search + sort + CATEGORY select -->
    <div class="row g-2 align-items-center mb-3">
      <div class="col-md-6">
        <input
          v-model="keyword"
          @input="onType"
          type="search"
          class="form-control"
          placeholder="Search products..."
        />
      </div>

      <div class="col-md-3">
        <select v-model="sort" class="form-select" @change="reload">
          <option value="new">Newest</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>
      </div>

      <!-- ▼ Category dropdown -->
      <div class="col-md-3">
        <select
          class="form-select"
          :value="categoryId"
          @change="setCategory($event.target.value)"
        >
          <option value="">All categories</option>
          <option
            v-for="c in visibleCategories"
            :key="c.categoryid"
            :value="c.categoryid"
          >
            {{ c.categoryname }}
          </option>
        </select>
      </div>
    </div>

    <!-- Category title -->
    <div class="section-title mb-3">
      <div class="d-flex align-items-center gap-2">
        <span class="tag-icon" aria-hidden="true">🏷</span>
        <h4 class="m-0 fw-bold">{{ currentCategoryName }}</h4>
      </div>
      <div class="gold-line mt-2"></div>
    </div>

    <!-- ================================================================= -->
    <!--            PRICE FILTER + PRODUCT GRID (NEW BLOCK)                -->
    <!-- ================================================================= -->

    <div class="row">
      <!-- LEFT: PRICE FILTER -->
      <div class="col-lg-3 col-md-4 mb-4">
        <h5 class="fw-bold mb-3">Khoảng giá</h5>

        <div class="vstack gap-2 filter-box">
          <label class="d-flex align-items-center gap-2">
            <input type="checkbox" value="0-100"
                   v-model="priceRanges"
                   @change="applyPriceFilter" />
            Dưới 100k
          </label>

          <label class="d-flex align-items-center gap-2">
            <input type="checkbox" value="100-200"
                   v-model="priceRanges"
                   @change="applyPriceFilter" />
            100k - 200k
          </label>

          <label class="d-flex align-items-center gap-2">
            <input type="checkbox" value="200-300"
                   v-model="priceRanges"
                   @change="applyPriceFilter" />
            200k - 300k
          </label>

          <label class="d-flex align-items-center gap-2">
            <input type="checkbox" value="300-500"
                   v-model="priceRanges"
                   @change="applyPriceFilter" />
            300k - 500k
          </label>

          <label class="d-flex align-items-center gap-2">
            <input type="checkbox" value="500-1000"
                   v-model="priceRanges"
                   @change="applyPriceFilter" />
            500k - 1,000k
          </label>

          <label class="d-flex align-items-center gap-2">
            <input type="checkbox" value="1000+"
                   v-model="priceRanges"
                   @change="applyPriceFilter" />
            Trên 1,000,000 VND
          </label>
        </div>
      </div>

      <!-- RIGHT: PRODUCT LIST -->
      <div class="col-lg-9 col-md-8">

        <div v-if="loading" class="text-muted">Loading…</div>
        <div v-else-if="!filteredItems.length" class="text-muted">No products found.</div>

        <div v-else class="row g-4">
          <div
            class="col-12 col-sm-6 col-lg-4"
            v-for="p in paginatedFilteredItems"
            :key="p.productid"
          >
            <!-- CLICK card => mở Quick View (trừ nút Add to Cart) -->
            <div
              class="card h-100 product-card"
              @click="openQuickView(p)"
            >
              <div class="product-media">
                <img :src="img(p)" alt="" />
              </div>

              <div class="card-body d-flex flex-column">
                <h5 class="card-title">{{ p.productname }}</h5>
                <p class="card-text text-muted">
                  {{ (p.description || '').slice(0, 120) }}...
                </p>

                <div class="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <span class="fw-bold text-danger">
                      {{
                        formatCurrency(
                          Number(p.discountprice) > 0
                            ? Math.max(0, Number(p.price) - Number(p.discountprice))
                            : Number(p.price)
                        )
                      }}
                    </span>
                    <span
                      v-if="Number(p.discountprice) > 0"
                      class="text-muted text-decoration-line-through ms-2"
                    >
                      {{ formatCurrency(Number(p.price)) }}
                    </span>
                  </div>

                  <span
                    class="stock-chip"
                    :class="{ oos: Number(p.stock) === 0 }"
                  >
                    {{ Number(p.stock) === 0 ? 'Out of stock' : ` ${p.stock}` }}
                  </span>
                </div>

                <!-- Nút Add to Cart: STOP propagation để không bật modal -->
                <button
                  class="btn btn-primary mt-auto d-flex justify-content-center align-items-center gap-2"
                  @click.stop="add(p)"
                >
                  <svg
                    class="icon"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 7A.5.5 0 0 1 13 11H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM5 12.5A1.5 1.5 0 1 0 5 15a1.5 1.5 0 0 0 0-2.5m7 0A1.5 1.5 0 1 0 12 15a1.5 1.5 0 0 0 0-2.5"
                    />
                    <path
                      d="M12 4.5a.5.5 0 0 0-1 0V6H9.5a.5.5 0 0 0 0 1H11v1.5a.5.5 0 0 0 1 0V7h1.5a.5.5 0 0 0 0-1H12z"
                    />
                  </svg>
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Pagination -->
    <div v-if="total > limit" class="d-flex justify-content-center mt-4">
      <nav>
        <ul class="pagination mb-0">
          <li :class="['page-item', { disabled: page === 1 }]">
            <button class="page-link" @click="goto(page - 1)">«</button>
          </li>
          <li
            v-for="n in pages"
            :key="n"
            :class="['page-item', { active: page === n }]"
          >
            <button class="page-link" @click="goto(n)">{{ n }}</button>
          </li>
          <li :class="['page-item', { disabled: page === pages }]">
            <button class="page-link" @click="goto(page + 1)">»</button>
          </li>
        </ul>
      </nav>
    </div>

    <!-- === FLOATING CART BUTTON + BADGE === -->
    <button
  v-if="!cartOpen"
  class="floating-cart"
  @click="openCart"
  title="Open cart"
>

      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path
          d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 7A.5.5 0 0 1 13 11H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM5 12.5A1.5 1.5 0 1 0 5 15a1.5 1.5 0 0 0 0-2.5m7 0A1.5 1.5 0 1 0 12 15a1.5 1.5 0 0 0 0-2.5"
        />
      </svg>
      <span class="badge" v-if="cart.totalQty">{{ cart.totalQty }}</span>
    </button>

    <!-- === OFFCANVAS CART === -->
    <div class="offcanvas offcanvas-end" tabindex="-1" ref="offcanvasRef">
      <div class="offcanvas-header">
        <h5 class="offcanvas-title">My Cart</h5>
        <button
          type="button"
          class="btn-close"
          @click="closeCart"
          aria-label="Close"
        ></button>
      </div>
      <div class="offcanvas-body">
        <div v-if="cart.loading" class="text-muted">Loading…</div>
        <div v-else-if="!cart.items.length" class="text-muted">
          Your cart is empty.
        </div>

        <div v-else class="list-group">
          <div
            class="list-group-item d-flex align-items-center"
            v-for="it in cart.items"
            :key="it.itemid"
          >
            <img
              :src="img({ imageurl: it.imageurl })"
              style="width: 56px; height: 56px; object-fit: contain"
              class="me-3"
            />
            <div class="flex-fill">
              <div class="fw-semibold">{{ it.productname }}</div>
              <div class="small text-muted">
                {{ formatCurrency(it.unitprice) }}
              </div>
              <div class="d-flex align-items-center mt-1">
                <button
                  class="btn btn-sm btn-outline-secondary"
                  @click="dec(it)"
                >
                  -
                </button>
                <input
                  class="form-control form-control-sm mx-2 text-center"
                  style="width: 64px"
                  :value="it.quantity"
                  @change="onQtyInput(it, $event)"
                />
                <button
                  class="btn btn-sm btn-outline-secondary"
                  @click="inc(it)"
                >
                  +
                </button>
              </div>
            </div>
            <div class="text-end">
              <div class="fw-bold">
                {{ formatCurrency(it.unitprice * it.quantity) }}
              </div>
              <button
                class="btn btn-sm btn-link text-danger p-0 mt-1"
                @click="remove(it.productid)"
              >
                Remove
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="cart.items.length"
          class="mt-3 d-flex justify-content-between align-items-center"
        >
          <div class="fw-semibold">Total:</div>
          <div class="fw-bold">{{ formatCurrency(cart.totalAmount) }}</div>
        </div>

        <div v-if="cart.items.length" class="d-grid mt-3">
          <button class="btn btn-primary" @click="goCheckout">Checkout</button>
        </div>
      </div>
    </div>

    <!-- === QUICK VIEW MODAL === -->
    <div
      v-if="quickProduct"
      class="quickview-backdrop"
      @click.self="closeQuickView"
    >
      <div class="quickview-modal">
        <button
          type="button"
          class="btn-close quickview-close"
          aria-label="Close"
          @click="closeQuickView"
        ></button>

        <div class="quickview-image">
          <img :src="img(quickProduct)" alt="" />
        </div>

        <div class="quickview-content">
          <h3 class="quickview-title">
            {{ quickProduct.productname }}
          </h3>

          <div class="mb-2 text-muted small">
            Mã sản phẩm: {{ quickProduct.productid }}
          </div>

          <div class="quickview-price mb-3">
            <div class="d-flex align-items-baseline gap-2">
              <span class="final-price">
                {{
                  quickPrices
                    ? formatCurrency(quickPrices.final)
                    : formatCurrency(0)
                }}
              </span>
              <span
                v-if="quickPrices && quickPrices.discount > 0"
                class="original-price"
              >
                {{ formatCurrency(quickPrices.price) }}
              </span>
            </div>

            <div
              v-if="quickPrices && quickPrices.discount > 0"
              class="save-tag"
            >
              Tiết kiệm:
              {{ formatCurrency(quickPrices.discount) }}
            </div>
          </div>

          <div class="quickview-description mb-4">
            {{ quickProduct.description }}
          </div>

          <div class="d-grid">
            <button
              class="btn btn-primary btn-lg"
              @click.stop="addFromQuickView"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- === END QUICK VIEW MODAL === -->

  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import { getProductImage } from '@/services/assets'
import { useCartStore } from '@/store/cart'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const cart = useCartStore()
const cartOpen = ref(false)

const keyword = ref('')
const sort = ref('new')
const categoryId = ref('')
const page = ref(1)
const limit = ref(12)

const loading = ref(false)
const items = ref([])
const total = ref(0)
const categories = ref([])

// ================================
// 🔥 PRICE FILTER
// ================================
const priceRanges = ref([])

// ================================
// QUICK VIEW
// ================================
const quickProduct = ref(null)
const quickPrices = computed(() => {
  const p = quickProduct.value
  if (!p) return null
  const price = Number(p.price) || 0
  const discount = Number(p.discountprice) || 0
  const final = discount > 0 ? Math.max(0, price - discount) : price
  return { price, discount, final }
})

// Ẩn category Membership khỏi UI Shop
const visibleCategories = computed(() =>
  categories.value.filter((c) => c.categoryname !== 'Membership')
)

// Ẩn sản phẩm Membership
const visibleItems = computed(() =>
  items.value.filter((p) => p.categoryname !== 'Membership')
)

// ========================================
// 🔥 FILTERED ITEMS THEO GIÁ (NEW)
// ========================================
const filteredItems = computed(() => {
  if (!priceRanges.value.length) return visibleItems.value

  return visibleItems.value.filter((p) => {
    const price = Number(p.discountprice) > 0
      ? Math.max(0, Number(p.price) - Number(p.discountprice))
      : Number(p.price)

    return priceRanges.value.some((r) => {
      if (r === "0-100") return price < 100000
      if (r === "100-200") return price >= 100000 && price < 200000
      if (r === "200-300") return price >= 200000 && price < 300000
      if (r === "300-500") return price >= 300000 && price < 500000
      if (r === "500-1000") return price >= 500000 && price < 1000000
      if (r === "1000+") return price >= 1000000
    })
  })
})

// ========================================
// 🔥 PAGINATION CHO FILTERED ITEMS (NEW)
// ========================================
const paginatedFilteredItems = computed(() => {
  const start = (page.value - 1) * limit.value
  return filteredItems.value.slice(start, start + limit.value)
})

// Số trang
const pages = computed(() =>
  Math.max(1, Math.ceil(total.value / limit.value))
)

// Category title
const currentCategoryName = computed(() => {
  if (!categoryId.value) return 'All Products'
  const found = visibleCategories.value.find(
    (c) => String(c.categoryid) === String(categoryId.value)
  )
  return found?.categoryname || 'Products'
})

let timer = null
function onType() {
  clearTimeout(timer)
  timer = setTimeout(() => {
    page.value = 1
    reload()
  }, 300)
}

function goCheckout() {
  if (!authStore.token) {
    router.push({ name: 'Login', query: { next: '/cart' } })
  } else {
    router.push({ name: 'CartDetail' })
  }
}

async function fetchCategories() {
  const r = await api.get('/productcategories')
  categories.value = Array.isArray(r.data) ? r.data : []
}

async function fetchProducts() {
  loading.value = true
  try {
    const r = await api.get('/products', {
      params: {
        q: keyword.value,
        page: page.value,
        limit: limit.value,
        categoryId: categoryId.value || undefined,
        sort: sort.value,
      },
    })
    items.value = r.data?.items || []
    total.value = r.data?.total || 0
  } finally {
    loading.value = false
  }
}

function goto(n) {
  if (n < 1 || n > pages.value) return
  page.value = n
  fetchProducts()
}

function reload() {
  page.value = 1
  fetchProducts()
}

function setCategory(id) {
  categoryId.value = id
  reload()
}

function img(p) {
  return getProductImage(p.imageurl)
}

function formatCurrency(v) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(v ?? 0)
}

async function add(p) {
  await cart.add(p, 1)
}

// ================================
// QUICK VIEW handlers
// ================================
function openQuickView(p) {
  quickProduct.value = p
}

function closeQuickView() {
  quickProduct.value = null
}

async function addFromQuickView() {
  if (!quickProduct.value) return
  await add(quickProduct.value)
}

// ================================
// OFFCANVAS CART
// ================================
const offcanvasRef = ref(null)
let OffcanvasCtor = null
let offcanvasInst = null

async function ensureOffcanvas() {
  if (!OffcanvasCtor) {
    OffcanvasCtor = (await import('bootstrap/js/dist/offcanvas')).default
  }
  if (!offcanvasInst) {
    offcanvasInst = new OffcanvasCtor(offcanvasRef.value, { backdrop: true })
  }
}

async function openCart() {
  await cart.fetch()
  await ensureOffcanvas()
  offcanvasInst.show()
  cartOpen.value = true   // 🔥 Ẩn icon cart
  // 🔥 Cho phép cuộn toàn trang
  document.body.style.overflow = 'auto'
}

function closeCart() {
  offcanvasInst?.hide()
  cartOpen.value = false  // 🔥 Hiện icon cart lại
    // 🔥 FIX SCROLL BỊ KHÓA
  document.body.style.overflow = ''
  document.body.classList.remove('offcanvas-backdrop', 'modal-open')
}

// Quantity helpers
async function inc(it) {
  await cart.setQty(it.productid, it.quantity + 1)
}

async function dec(it) {
  await cart.setQty(it.productid, it.quantity - 1)
}

async function onQtyInput(it, e) {
  const v = parseInt(e.target.value ?? '0', 10)
  await cart.setQty(it.productid, Number.isFinite(v) ? v : 0)
}

async function remove(productId) {
  await cart.remove(productId)
}

// ========================================
// 🔥 APPLY PRICE FILTER (NEW)
// ========================================
function applyPriceFilter() {
  page.value = 1
}

// ON MOUNT
onMounted(async () => {
  await Promise.all([fetchCategories(), fetchProducts()])
  cart.fetch().catch(() => {})
})
</script>
<style scoped>
.product-media {
  width: 100%;
  height: 220px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.product-media img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
}

/* card hover để gợi ý có thể click */
.product-card {
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

/* Section title + gold underline */
.section-title .tag-icon {
  font-size: 1.4rem;
  line-height: 1;
}

.section-title .gold-line {
  height: 3px;
  width: 100%;
  background: linear-gradient(
    90deg,
    #f0c100 0%,
    #d4a500 60%,
    rgba(212, 165, 0, 0.3) 60%,
    rgba(212, 165, 0, 0.3) 100%
  );
  border-radius: 2px;
}

.btn-chip {
  --gold: #f0c100;
  background: #fff;
  border: 1px solid var(--gold);
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
}

.btn-chip.active {
  background: var(--gold);
  border-color: var(--gold);
  color: #0b0b0b;
  box-shadow: 0 2px 6px rgba(212, 165, 0, 0.3);
}

.btn-chip:hover {
  filter: brightness(0.98);
}

.icon {
  width: 1.1rem;
  height: 1.1rem;
  display: inline-block;
}

/* Stock chip */
.stock-chip {
  padding: 2px 8px;
  font-size: 0.8rem;
  line-height: 1.2;
  background: #f8f9fa;
  color: #0b0b0b;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 999px;
  font-weight: 700;
  white-space: nowrap;
}

.stock-chip.oos {
  background: #fee2e2;
  border-color: #fecaca;
  color: #b91c1c;
}

/* ==================================================== */
/*     ⭐ FIX CART ICON BỊ CHE — UPDATED VERSION ⭐      */
/* ==================================================== */

.floating-cart {
  position: fixed;
  right: 24px;
  bottom: 500px;  /* 🔥 Đưa icon lên vị trí mũi tên trong hình */
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #f0c100;
  display: grid;
  place-items: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
  z-index: 2000;
  cursor: pointer;
}


.floating-cart svg {
  width: 22px;
  height: 22px;
  color: #0b1a3a;
}

.floating-cart .badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #e11;
  color: #fff;
  border: 2px solid #fff;
  min-width: 22px;
  height: 22px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 0.75rem;
}

/* Offcanvas width */
.offcanvas-end {
  width: 360px;
}

/* ===== QUICK VIEW MODAL ===== */
.quickview-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1050;
}

.quickview-modal {
  background: #ffffff;
  border-radius: 18px;
  max-width: 920px;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  overflow: hidden;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.25);
  position: relative;
}

.quickview-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
}

.quickview-image {
  flex: 1 1 45%;
  min-width: 260px;
  background: #f7f7f7;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.quickview-image img {
  max-width: 100%;
  max-height: 380px;
  object-fit: contain;
}

.quickview-content {
  flex: 1 1 55%;
  padding: 28px 28px 24px;
}

.quickview-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 0.35rem;
}

.quickview-price .final-price {
  font-size: 1.6rem;
  font-weight: 800;
  color: #e11d48;
}

.quickview-price .original-price {
  font-size: 0.95rem;
  text-decoration: line-through;
  color: #9ca3af;
}

.quickview-price .save-tag {
  margin-top: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #059669;
}

.quickview-description {
  max-height: 160px;
  overflow-y: auto;
  font-size: 0.95rem;
  line-height: 1.5;
}

/* responsive */
@media (max-width: 767.98px) {
  .quickview-modal {
    flex-direction: column;
  }
  .quickview-content {
    padding: 20px 16px 16px;
  }
}

/* ================================
   DARK MODE — QUICK VIEW MODAL
================================= */

html[data-bs-theme="dark"] .quickview-modal {
  background: #ffffff !important;
  color: #000000 !important;
}

html[data-bs-theme="dark"] .quickview-modal * {
  color: #000000 !important;
}

html[data-bs-theme="dark"] .quickview-modal .final-price {
  color: #e11d48 !important;
}

html[data-bs-theme="dark"] .quickview-modal .original-price {
  color: #777 !important;
}

html[data-bs-theme="dark"] .quickview-modal .save-tag {
  color: #059669 !important;
}

html[data-bs-theme="dark"] .quickview-description {
  color: #000 !important;
}

html[data-bs-theme="dark"] .quickview-image {
  background: #f7f7f7 !important;
}

html[data-bs-theme="dark"] .quickview-modal .btn-primary {
  color: #fff !important;
}
</style>
