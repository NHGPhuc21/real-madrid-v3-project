<!-- frontend/src/pages/admin/ManageNews.vue -->
<template>
  <div class="container py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="mb-0">Manage News</h3>
      <div class="d-flex align-items-center gap-2">
        <small class="text-muted d-none d-md-inline" v-if="!isAdmin">Admin only</small>
        <button class="btn btn-success" @click="openCreate" :disabled="!isAdmin">+ Add Article</button>
      </div>
    </div>

    <!-- Table -->
    <div class="table-responsive">
      <table class="table table-hover align-middle">
        <thead>
          <tr>
            <th style="width:80px">ID</th>
            <th>Title</th>
            <th style="width:140px">Topic</th>
            <th style="width:120px">Published</th>
            <th style="width:190px">Date</th>
            <th style="width:180px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in list" :key="n.newid ?? n.id ?? n.NewsID">
            <td>{{ n.newid ?? n.id ?? n.NewsID }}</td>
            <td class="text-break">{{ n.title }}</td>
            <td>
              <span class="badge text-bg-light text-dark">{{ labelOf((n.topic || 'general').toLowerCase()) }}</span>
            </td>
            <td>
              <span class="badge" :class="n.ispublished ? 'text-bg-success' : 'text-bg-secondary'">
                {{ n.ispublished ? 'Yes' : 'No' }}
              </span>
            </td>
            <td>{{ fmtDate(n.publishdate || n.createdat || n.created_at) }}</td>
            <td>
              <button class="btn btn-sm btn-primary me-2" @click="openEdit(n)" :disabled="!isAdmin">Edit</button>
              <button class="btn btn-sm btn-danger" @click="remove(n)" :disabled="!isAdmin">Delete</button>
            </td>
          </tr>
          <tr v-if="!list?.length">
            <td colspan="6" class="text-center text-muted py-4">No articles yet</td>
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
              <h5 class="modal-title">{{ editingId ? 'Edit Article' : 'Add Article' }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"/>
            </div>

            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-8">
                  <label class="form-label">Title</label>
                  <input v-model.trim="form.title" class="form-control" required />
                </div>

                <div class="col-md-4">
                  <label class="form-label">Image (upload)</label>
                  <input type="file" class="form-control" @change="onFileSelect" />

                  <div v-if="form.imageurl" class="mt-2">
                    <img :src="ABS(form.imageurl)" style="max-width:120px;border-radius:4px;">
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Topic</label>
                  <select v-model="form.topic" class="form-select">
                    <option v-for="t in topicOptions" :key="t" :value="t">
                      {{ labelOf(t) }}
                    </option>
                  </select>
                </div>

                <div class="col-md-6 d-flex align-items-end">
                  <div class="form-check">
                    <input
                      id="isfeatured"
                      v-model="form.is_featured"
                      type="checkbox"
                      class="form-check-input"
                    />
                    <label class="form-check-label" for="isfeatured">
                      Featured news
                    </label>
                  </div>

                  <div class="form-check ms-auto">
                    <input
                      id="ispub"
                      v-model="form.ispublished"
                      type="checkbox"
                      class="form-check-input"
                    />
                    <label class="form-check-label" for="ispub">Published</label>
                  </div>
                </div>

                <div class="col-12">
                  <label class="form-label">Content</label>
                  <textarea v-model.trim="form.content" rows="6" class="form-control"></textarea>
                </div>
              </div>

              <div v-if="error" class="text-danger mt-3">{{ error }}</div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" type="button" data-bs-dismiss="modal">Cancel</button>
              <button class="btn btn-primary" v-if="isAdmin" type="submit">
                {{ editingId ? 'Save changes' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <!-- /Modal -->
  </div>
</template>

<script setup>
import api from '@/services/api'
import { ABS } from '@/services/api'
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.role === 'admin')

const list = ref([])
const modalRef = ref(null)
let bsModal = null

const editingId = ref(null)
const error = ref('')

/* ====== Topics ====== */
const topicOptions = ref(['featured', 'madridistas', 'club', 'academy', 'sponsor', 'general'])
const builtinLabels = {
  featured: 'Special News',
  madridistas: 'Madridistas News',
  club: 'Club News',
  academy: 'Academy News',
  sponsor: 'Sponsor News',
  general: 'General News'
}
function labelOf(t){ return builtinLabels[t] || t }

/* ====== Form ====== */
const form = ref({
  title: '',
  content: '',
  imageurl: '',
  file: null,          // <-- file upload
  ispublished: true,
  topic: 'general',
  is_featured: false
})

function onFileSelect(e) {
  const f = e.target.files?.[0];
  if (f) form.value.file = f;
}

function fmtDate(v) {
  if (!v) return ''
  const d = new Date(v)
  return isNaN(d) ? String(v) : d.toLocaleString()
}

/* ====== CRUD ====== */
async function load() {
  const r = await api.get('/news')
  list.value = r.data || []

  try {
    const tr = await api.get('/news/topics')
    const arr = Array.isArray(tr.data) ? tr.data : []
    if (arr.length) {
      topicOptions.value = Array.from(new Set([...topicOptions.value, ...arr.map(s => (s || '').toLowerCase())]))
    }
  } catch {}
}

function openCreate() {
  editingId.value = null
  error.value = ''
  Object.assign(form.value, {
    title: '',
    content: '',
    imageurl: '',
    file: null,
    ispublished: true,
    topic: 'general',
    is_featured: false 
  })
  bsModal?.show()
}

function openEdit(n) {
  editingId.value = n.newid ?? n.id ?? n.NewsID ?? null
  error.value = ''
  Object.assign(form.value, {
    title: n.title || '',
    content: n.content || '',
    imageurl: n.imageurl || '',
    file: null,
    ispublished: !!n.ispublished,
    topic: (n.topic || 'general').toString().toLowerCase(),
    is_featured: !!n.is_featured  
  })
  bsModal?.show()
}

async function save() {
  try {
    error.value = ''
    let imageUrl = form.value.imageurl

    // Nếu có file mới → upload trước
    if (form.value.file) {
      const fd = new FormData()
      fd.append("image", form.value.file)

      const ur = await api.post("/upload/news", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      })

      imageUrl = ur.data.url
    }

    const payload = {
      title: form.value.title,
      content: form.value.content,
      imageurl: imageUrl,
      ispublished: form.value.ispublished ? 1 : 0,
      topic: form.value.topic,
      is_featured: form.value.is_featured ? 1 : 0
    }

    if (editingId.value) {
      await api.put(`/news/${editingId.value}`, payload)
    } else {
      await api.post('/news', payload)
    }

    bsModal?.hide()
    await load()
  } catch (e) {
    error.value = e?.response?.data?.message || 'Save failed'
    console.error('Save news error:', e)
  }
}

async function remove(n) {
  if (!confirm('Delete this article?')) return
  try {
    const id = n.newid ?? n.id ?? n.NewsID
    await api.delete(`/news/${id}`)
    await load()
  } catch (e) {
    console.error(e)
    alert(e?.response?.data?.message || 'Delete failed')
  }
}

/* ====== Init ====== */
onMounted(async () => {
  await load()
  const Modal = (await import('bootstrap/js/dist/modal')).default
  bsModal = new Modal(modalRef.value)
})
</script>
