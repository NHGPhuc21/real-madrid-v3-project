<!-- frontend/src/pages/admin/ManageMatches.vue -->
<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">

  <!-- BACK BUTTON (left) -->
  <RouterLink to="/admin" class="btn-back">
    ← Back
  </RouterLink>

  <!-- CENTER TITLE -->
  <h2 class="page-title text-center flex-grow-1 m-0">
    Manage Matches
  </h2>

  <!-- ADD MATCH (right) -->
  <button
    v-if="isAdmin"
    class="btn btn-success ms-3"
    @click="openCreate"
  >
    + Add Match
  </button>

</div>


    <div class="mb-3">
      <input v-model="q" @input="load" class="form-control" placeholder="Search opponent or stadium..." />
    </div>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>ID</th>
          <th>Opponent</th>
          <th>DateTime</th>
          <th>Stadium</th>
          <th>Competition</th>
          <th>Home?</th>
          <th>Score</th>
          <th>Status</th>
          <th style="width:320px">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in matches" :key="m.matchid">
          <td>{{ m.matchid }}</td>
          <td>{{ m.opponentteam }}</td>
          <td>{{ formatDate(m.matchdatetime) }}</td>
          <td>{{ m.stadium }}</td>
          <td>{{ m.competition }}</td>
          <td>{{ m.ishomematch ? 'Yes' : 'No' }}</td>
          <td>{{ m.homescore }} - {{ m.awayscore }}</td>
          <td><span class="badge bg-secondary text-uppercase">{{ m.status || 'upcoming' }}</span></td>

          <td class="d-flex flex-wrap align-items-center gap-2">
            <button v-if="isAdmin" class="btn btn-sm btn-primary me-2" @click="openEdit(m)">Edit</button>

            <div class="input-group input-group-sm me-2" style="width:180px">
              <input type="number" min="0" class="form-control" v-model.number="patch[m.matchid].homescore" placeholder="H" />
              <input type="number" min="0" class="form-control" v-model.number="patch[m.matchid].awayscore" placeholder="A" />
            </div>

            <select class="form-select form-select-sm me-2" style="width:110px" v-model="patch[m.matchid].status">
              <option value="live">Live</option>
              <option value="finished">Finished</option>
            </select>

            <button class="btn btn-sm btn-success me-2" @click="patchScore(m.matchid)">Apply</button>
            <button v-if="isAdmin" class="btn btn-sm btn-outline-danger" @click="del(m.matchid)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal -->
    <div class="modal fade" tabindex="-1" ref="modalRef">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">{{ editingId ? 'Edit Match' : 'Add Match' }}</h5></div>
          <div class="modal-body">
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Opponent</label>
                <input v-model="form.opponentteam" class="form-control" />
              </div>

              <div class="col-md-6">
                <label class="form-label">Opponent Logo</label>

                <div v-if="form.opponentteamlogourl" class="mb-2">
                  <img :src="ABS(form.opponentteamlogourl)" style="width:80px;height:80px;object-fit:contain" />
                </div>

                <input type="file" class="form-control" @change="uploadOpponentLogo" />
              </div>

              <div class="col-md-6">
                <label class="form-label">Stadium</label>
                <input v-model="form.stadium" class="form-control" />
              </div>

              <div class="col-md-6">
  <label class="form-label">Competition</label>
  <select v-model="form.competition" class="form-select">
    <option v-for="c in COMPETITIONS" :key="c" :value="c">
      {{ c }}
    </option>
  </select>
</div>


              <div class="col-md-6">
                <label class="form-label">Date & Time</label>
                <input v-model="form.matchdatetime_local" type="datetime-local" class="form-control" />
              </div>

              <div class="col-md-6 d-flex align-items-end">
                <div class="form-check">
                  <input class="form-check-input" id="hm" type="checkbox" v-model="form.ishomematch" />
                  <label class="form-check-label" for="hm">Home (Real Madrid)</label>
                </div>
              </div>

              <div class="col-12">
                <label class="form-label">Description</label>
                <textarea v-model="form.description" rows="2" class="form-control"></textarea>
              </div>

              <div class="col-md-4">
                <label class="form-label">Home score</label>
                <input v-model.number="form.homescore" type="number" min="0" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Away score</label>
                <input v-model.number="form.awayscore" type="number" min="0" class="form-control" />
              </div>

              <div class="col-md-4">
                <label class="form-label">Status</label>
                <select v-model="form.status" class="form-select">
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="finished">Finished</option>
                </select>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button class="btn btn-primary" @click="save">Save</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api, { ABS } from '@/services/api'
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.role === 'admin')

const matches = ref([])
const q = ref('')
const patch = ref({})
const modalRef = ref(null)
let bsModal = null

const editingId = ref(null)
const error = ref('')
const COMPETITIONS = [
  'LALIGA',
  'UEFA CHAMPION LEAGUE',
  'COPA DEL REY',
  'SUPER CUP OF SPAIN',
  'UEFA SUPER CUP',
  'FIFA CLUB WORLD CUP',
  'FIFA INTERCONTINENTAL CUP'
];

const form = ref({
  matchid: null,
  opponentteam: '',
  opponentteamlogourl: null,
  matchdatetime_local: '',
  stadium: '',
  competition: '',
  ishomematch: false,
  description: '',
  homescore: 0,
  awayscore: 0,
  status: 'upcoming'
})

async function uploadOpponentLogo(e) {
  const file = e.target.files?.[0]
  if (!file) return

  const fd = new FormData()
  fd.append("image", file)

  const r = await api.post("/upload/opponents", fd, {
    headers: { "Content-Type": "multipart/form-data" }
  })

  form.value.opponentteamlogourl = r.data.url
}

function formatDate(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleString()
}

function toServerDateTime(localDT) {
  if (!localDT) return null
  return localDT.replace('T', ' ') + ':00'
}

function toLocalInput(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function load() {
  const res = await api.get('/matches')
  const all = res.data || []

  matches.value = all.filter(m => {
    if (!q.value) return true
    const s = q.value.toLowerCase()
    return (m.opponentteam || '').toLowerCase().includes(s) || (m.stadium || '').toLowerCase().includes(s)
  })

  patch.value = {}
  for (const m of all) {
    patch.value[m.matchid] = {
      homescore: m.homescore ?? 0,
      awayscore: m.awayscore ?? 0,
      status: m.status || 'upcoming'
    }
  }
}

function openCreate() {
  editingId.value = null
  error.value = ''

  Object.assign(form.value, {
    matchid: null,
    opponentteam: '',
    opponentteamlogourl: null,
    matchdatetime_local: '',
    stadium: '',
    competition: '',
    ishomematch: false,
    description: '',
    homescore: 0,
    awayscore: 0,
    status: 'upcoming'
  })

  bsModal?.show()
}

function openEdit(m) {
  editingId.value = m.matchid
  error.value = ''

  Object.assign(form.value, {
    matchid: m.matchid,
    opponentteam: m.opponentteam || '',
    opponentteamlogourl: m.opponentteamlogourl ?? null,
    matchdatetime_local: toLocalInput(m.matchdatetime),
    stadium: m.stadium || '',

    // ⭐ SỬA TẠI ĐÂY
    competition: COMPETITIONS.includes(m.competition)
      ? m.competition
      : COMPETITIONS[0],

    ishomematch: !!m.ishomematch,
    description: m.description || '',
    homescore: m.homescore ?? 0,
    awayscore: m.awayscore ?? 0,
    status: m.status || 'upcoming'
  })

  bsModal?.show()
}


async function save() {
  try {
    error.value = ''

    const payload = {
      opponentteam: form.value.opponentteam,
      opponentteamlogourl: form.value.opponentteamlogourl ?? null,
      matchdatetime: toServerDateTime(form.value.matchdatetime_local),
      stadium: form.value.stadium,
      competition: form.value.competition,
      ishomematch: !!form.value.ishomematch,
      description: form.value.description,
      homescore: form.value.homescore ?? 0,
      awayscore: form.value.awayscore ?? 0,
      status: form.value.status || 'upcoming'
    }

    if (editingId.value)
      await api.put(`/matches/${editingId.value}`, payload)
    else
      await api.post('/matches', payload)

    bsModal?.hide()
    await load()

  } catch (e) {
    error.value = e.response?.data?.message || 'Save failed'
  }
}

async function patchScore(id) {
  try {
    await api.patch(`/matches/${id}/score`, patch.value[id])
    await load()
  } catch (e) {
    alert(e.response?.data?.message || 'Update score failed')
  }
}

async function del(id) {
  if (!confirm('Delete this match?')) return
  try {
    await api.delete('/matches/' + id)
    await load()
  } catch (e) {
    alert(e.response?.data?.message || 'Delete failed')
  }
}

onMounted(async () => {
  await load()
  const Modal = (await import('bootstrap/js/dist/modal')).default
  bsModal = new Modal(modalRef.value)
})
</script>
<style scoped>
.page-title {
  font-weight: 700;
}

.btn-back {
  padding: 8px 18px;
  border-radius: 25px;
  font-weight: 500;
  background: linear-gradient(135deg, #4f46e5, #8b5cf6);
  color: white;
  border: none;
  text-decoration: none;
  box-shadow: 0 3px 12px rgba(0,0,0,0.15);
  transition: transform .15s ease, box-shadow .15s ease;
}

.btn-back:hover {
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.25);
}
</style>
