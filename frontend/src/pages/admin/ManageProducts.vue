<!--  -->
<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="mb-0">Manage Products</h3>
      <button class="btn btn-success" v-if="isAdmin" @click="openCreate">+ Add Product</button>
    </div>

    <div class="table-responsive">
      <table class="table table-striped align-middle">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th style="width:150px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p.productid">
            <td>{{ p.productid }}</td>
            <td>{{ p.productname }}</td>
            <td>{{ p.categoryname }}</td>
            <td>{{ formatCurrency(p.price) }}</td>
            <td>{{ p.stock }}</td>
            <td>
              <button class="btn btn-sm btn-primary me-2" v-if="isAdmin" @click="openEdit(p)">Edit</button>
              <button class="btn btn-sm btn-danger" v-if="isAdmin" @click="remove(p.productid)">Delete</button>
            </td>
          </tr>
          <tr v-if="!products.length">
            <td colspan="6" class="text-center">No products found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div class="modal fade" ref="modalRef" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <form @submit.prevent="save">
            <div class="modal-header">
              <h5 class="modal-title">{{ editingId ? 'Edit Product' : 'Add Product' }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"/>
            </div>

            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Name</label>
                  <input v-model.trim="form.productname" class="form-control" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Category</label>
                  <select v-model="form.categoryid" class="form-select" required>
                    <option disabled value="">-- Select category --</option>
                    <option v-for="c in categories" :key="c.categoryid" :value="c.categoryid">
                      {{ c.categoryname }}
                    </option>
                  </select>
                </div>

                <div class="col-12">
                  <label class="form-label">Description</label>
                  <textarea v-model.trim="form.description" rows="3" class="form-control"></textarea>
                </div>

                <div class="col-md-4">
                  <label class="form-label">Price</label>
                  <input v-model.number="form.price" type="number" step="0.01" min="0" class="form-control" required />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Discount Price (optional)</label>
                  <input v-model.number="form.discountprice" type="number" step="0.01" min="0" class="form-control" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Stock</label>
                  <input v-model.number="form.stock" type="number" min="0" class="form-control" />
                </div>

                <div class="col-md-6">
                  <label class="form-label">Image base name</label>
                  <input v-model.trim="form.imageurl" class="form-control" placeholder="e.g. home_kit_24" />
                </div>
                <div class="col-md-6 d-flex align-items-end">
                  <div class="form-check">
                    <input id="isvisible" v-model="form.isvisible" type="checkbox" class="form-check-input" />
                    <label for="isvisible" class="form-check-label">Visible</label>
                  </div>
                </div>
              </div>

              <div v-if="error" class="text-danger mt-3">{{ error }}</div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" type="button" data-bs-dismiss="modal">Cancel</button>
              <button class="btn btn-primary" v-if="isAdmin" type="submit">{{ editingId ? 'Save changes' : 'Create' }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <!-- /Modal -->
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../../services/api'
import { useAuthStore } from '../../store/auth'

const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.role === 'admin')

const products = ref([])
const categories = ref([])

const modalRef = ref(null)
let bsModal = null

const editingId = ref(null)
const error = ref('')

const form = ref({
  productname: '',
  description: '',
  price: 0,
  discountprice: 0,
  stock: 0,
  isvisible: true,
  imageurl: '',
  categoryid: ''
})

function formatCurrency(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0)
}

async function load() {
  try {
    const [pR, cR] = await Promise.all([
      // ĐỌC THEO FORMAT MỚI: lấy items từ /products
      api.get('/products', { params: { page: 1, limit: 100, sort: 'new' } }),
      api.get('/productcategories')
    ])
    products.value = pR.data?.items || []
    categories.value = cR.data
  } catch (e) {
    console.error(e)
    alert('Load error')
  }
}

function openCreate() {
  editingId.value = null
  error.value = ''
  Object.assign(form.value, {
    productname: '',
    description: '',
    price: 0,
    discountprice: 0,
    stock: 0,
    isvisible: true,
    imageurl: '',
    categoryid: ''
  })
  bsModal?.show()
}

function openEdit(p) {
  editingId.value = p.productid
  error.value = ''
  Object.assign(form.value, {
    productname: p.productname || '',
    description: p.description || '',
    price: Number(p.price) || 0,
    discountprice: Number(p.discountprice) || 0,
    stock: Number(p.stock) || 0,
    isvisible: !!p.isvisible,
    imageurl: p.imageurl || '',
    categoryid: p.categoryid ?? ''
  })
  bsModal?.show()
}

async function save() {
  try {
    error.value = ''
    const payload = {
      productname: form.value.productname,
      description: form.value.description,
      price: Number(form.value.price),
      discountprice: Number(form.value.discountprice) || 0,
      stock: Number(form.value.stock) || 0,
      isvisible: !!form.value.isvisible,
      imageurl: form.value.imageurl,
      categoryid: Number(form.value.categoryid)
    }

    if (editingId.value) {
      await api.put(`/products/${editingId.value}`, payload)
    } else {
      await api.post('/products', payload)
    }
    bsModal?.hide()
    await load()
  } catch (e) {
    error.value = e.response?.data?.message || 'Save failed'
    console.error('Save product error:', e)
  }
}

async function remove(id) {
  if (!confirm('Delete product?')) return
  try {
    await api.delete(`/products/${id}`)
    await load()
  } catch (e) {
    console.error(e)
    alert('Delete failed')
  }
}

onMounted(async () => {
  await load()
  // Khởi tạo Bootstrap Modal theo cách giống Tickets.vue
  const Modal = (await import('bootstrap/js/dist/modal')).default
  bsModal = new Modal(modalRef.value)
})
</script>
