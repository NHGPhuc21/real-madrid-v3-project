<!-- frontend/src/pages/admin/HighlightsUpload.vue -->
<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="mb-0">Upload Highlight</h3>
      <div class="d-flex gap-2">
        <RouterLink class="btn btn-outline-secondary btn-sm" to="/admin">← Dashboard</RouterLink>
        <RouterLink class="btn btn-outline-primary btn-sm" to="/admin/highlights/manage">Manage Highlights</RouterLink>
      </div>
    </div>

    <div class="card">
      <form class="card-body" @submit.prevent="submit">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Title <span class="text-danger">*</span></label>
            <input v-model.trim="form.title" class="form-control" placeholder="VD: RM vs ATL - 10’ highlights" required />
          </div>

          <div class="col-md-3">
            <label class="form-label">Match (optional)</label>
            <select v-model="form.matchId" class="form-select">
              <option :value="null">— Link to Match —</option>
              <option v-for="m in matches" :key="m.matchid" :value="m.matchid">
                {{ m.opponentteam }} — {{ fmt(m.matchdatetime) }}
              </option>
            </select>
          </div>

          <div class="col-md-3">
            <label class="form-label">State</label>
            <select v-model="form.status" class="form-select">
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </div>

          <div class="col-12">
            <label class="form-label">Description (optional)</label>
            <textarea v-model.trim="form.description" rows="3" class="form-control" placeholder="Content of Video…"/>
          </div>

          <div class="col-md-6">
            <label class="form-label">Video MP4 <span class="text-danger">*</span></label>
            <input ref="videoRef" type="file" accept="video/mp4" class="form-control" @change="onPick('video')" required />
            <div class="form-text">Just use MP4. FFmpeg will transcode to HLS after upload.</div>
          </div>

          <div class="col-md-6">
            <label class="form-label">Thumbnail (JPG/PNG) (optional)</label>
            <input ref="thumbRef" type="file" accept="image/png,image/jpeg" class="form-control" @change="onPick('thumb')" />
            <div class="mt-2" v-if="thumbPreview">
              <img :src="thumbPreview" alt="thumb" class="rounded" style="max-height: 120px" />
            </div>
          </div>

          <div class="col-12">
            <button class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Upload
            </button>
          </div>

          <div class="col-12" v-if="error">
            <div class="alert alert-danger my-0 mt-2">{{ error }}</div>
          </div>
          <div class="col-12" v-if="success">
            <div class="alert alert-success my-0 mt-2">
              {{ success }} —
              <RouterLink class="alert-link" :to="{ path: '/admin/highlights/manage' }">Xem trong Manage</RouterLink>
            </div>
          </div>

          <div class="col-12" v-if="serverResp" >
            <pre class="bg-light p-2 rounded small mb-0">{{ serverResp }}</pre>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/services/api'

const matches = ref([])
const loading = ref(false)
const error = ref('')
const success = ref('')
const serverResp = ref('')

const form = ref({
  title: '',
  matchId: null,
  description: '',
  status: 'draft'
})

const videoRef = ref(null)
const thumbRef = ref(null)
const picked = ref({ video: null, thumb: null })
const thumbPreview = ref('')

function onPick(which){
  const f = which === 'video' ? videoRef.value?.files?.[0] : thumbRef.value?.files?.[0]
  picked.value[which] = f || null
  if (which === 'thumb' && f) {
    const reader = new FileReader()
    reader.onload = e => thumbPreview.value = String(e.target.result)
    reader.readAsDataURL(f)
  }
}

function fmt(d){ try { return new Date(d).toLocaleString('vi-VN') } catch { return d } }

async function loadMatches(){
  // Tải vài trận gần đây cho dropdown (có thể thay bằng endpoint riêng nếu muốn)
  try {
    const r = await api.get('/matches', { params: { upcoming: '0' } })
    matches.value = Array.isArray(r.data) ? r.data.slice(0, 50) : []
  } catch { matches.value = [] }
}

async function submit(){
  error.value = ''; success.value = ''; serverResp.value = ''
  if (!form.value.title) { error.value = 'Vui lòng nhập tiêu đề'; return }
  if (!picked.value.video) { error.value = 'Vui lòng chọn file MP4'; return }

  try {
    loading.value = true
    const fd = new FormData()
    if (form.value.matchId !== null) fd.append('matchId', String(form.value.matchId))
    fd.append('title', form.value.title)
    if (form.value.description) fd.append('description', form.value.description)
    if (form.value.status) fd.append('status', form.value.status)
    fd.append('video', picked.value.video)
    if (picked.value.thumb) fd.append('thumb', picked.value.thumb)

    const r = await api.post('/highlights/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    success.value = 'Upload thành công. Hệ thống đang transcode HLS.'
    serverResp.value = JSON.stringify(r.data, null, 2)

    // reset file inputs
    videoRef.value.value = ''
    thumbRef.value.value = ''
    picked.value = { video: null, thumb: null }
    thumbPreview.value = ''
  } catch (e) {
    error.value = e?.response?.data?.message || 'Upload failed'
  } finally {
    loading.value = false
  }
}

onMounted(loadMatches)
</script>
