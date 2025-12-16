<!-- frontend/src/pages/admin/ManagePlayers.vue -->
<template>
  <div class="container py-4">
    <!-- Header giống Manage Products -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="mb-0">Manage Players</h3>
      <div class="d-flex gap-2">
        <RouterLink class="btn btn-outline-secondary btn-sm" to="/admin">
          ← Dashboard
        </RouterLink>
        <button class="btn btn-success btn-sm" @click="openCreate">
          + Add Player
        </button>
      </div>
    </div>

    <!-- Thông báo lỗi chung -->
    <div v-if="error" class="alert alert-danger py-2">
      {{ error }}
    </div>

    <!-- Card form Add / Edit -->
    <div v-if="showForm" class="card mb-3">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="mb-0">
            {{ editingId ? 'Edit player' : 'Add new player' }}
          </h5>
          <button class="btn btn-sm btn-outline-secondary" @click="cancelForm">
            Close
          </button>
        </div>

        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label">Full name</label>
            <input v-model="form.fullname" class="form-control" />
          </div>

         <div class="mb-3">
  <label class="form-label">Position</label>
  <select v-model="form.position" class="form-select">
    <option value="">-- Select position --</option>
    <option value="GK">GK - Goal Keeper</option>
    <option value="CB">CB - Center Back</option>
    <option value="CM">CM - Midfielder</option>
    <option value="CF">CF - Stricker</option>
  </select>
</div>
 

          <div class="col-md-2">
            <label class="form-label">Age</label>
            <input
              v-model="form.age"
              type="number"
              min="0"
              class="form-control"
            />
          </div>
          <div class="col-md-2">
            <label class="form-label">Shirt number</label>
            <input
              v-model="form.shirtnumber"
              type="number"
    min="0"
    class="form-control"
  />
</div>

<!-- 🔽 THÊM NGÀY SINH -->
<div class="col-md-3">
  <label class="form-label">Date of birth</label>
  <input
    v-model="form.birthdate"
    type="date"
    class="form-control"
  />
</div>

          <div class="col-md-3">
            <label class="form-label">Nationality</label>
            <input v-model="form.nationality" class="form-control" />
          </div>

          <div class="col-md-2">
            <label class="form-label">Height</label>
            <input v-model="form.height" class="form-control" />
          </div>

          <div class="col-md-2">
            <label class="form-label">Weight</label>
            <input v-model="form.weight" class="form-control" />
          </div>

          <!-- THAY TOÀN BỘ khối col-md-8 cũ bằng khối này -->

<div class="col-md-8">
  <label class="form-label">Image (upload from your computer)</label>
  <!-- chỉ còn input file -->
  <input
    type="file"
    class="form-control"
    @change="onSelectFile"
  />
  <div class="form-text">
    Choose file from computer to create / edit player.
  </div>
</div>


          <div class="col-12">
            <label class="form-label">Description / Bio</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="form-control"
            ></textarea>
                    <!-- ================= CAREER STAT MANAGEMENT ================= -->
        <div
          v-if="editingId"
          class="mt-4 pt-3 border-top"
        >
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">Career statistics</h6>
            <select
              v-model="careerFilter"
              class="form-select form-select-sm"
              style="width: auto;"
            >
              <option value="all">All</option>
              <option value="league">Laliga</option>
              <option value="cup">Copa del Rey</option>
              <option value="continental">UEFA Champion League</option>
              <option value="national">National Team</option>
            </select>
          </div>

          <div v-if="careerError" class="text-danger small mb-2">
            {{ careerError }}
          </div>

          <div v-if="careerLoading" class="text-muted small mb-2">
            Loading career…
          </div>

          <div
            v-if="!careerLoading && filteredCareer.length"
            class="table-responsive mb-2"
          >
            <table class="table table-sm align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th style="width:110px">Season</th>
                  <th class="text-end" style="width:80px">Apps</th>
                  <th class="text-end" style="width:80px">Goals</th>
                  <th class="text-end" style="width:80px">Assists</th>
                  <th class="text-end" style="width:80px">Yellow</th>
                  <th class="text-end" style="width:80px">Red</th>

                  <th style="width:130px">Category</th>
                  <th style="width:130px">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in filteredCareer" :key="c.id">
                  <td>{{ c.season }}</td>
                  <td class="text-end">{{ c.appearances }}</td>
                  <td class="text-end">{{ c.goals }}</td>
                  <td class="text-end">{{ c.assists }}</td>
                  <td class="text-end">{{ c.yellowcards ?? 0 }}</td>
                  <td class="text-end">{{ c.redcards ?? 0 }}</td>

                  <td>
                    <span v-if="c.category === 'league'" class="badge bg-success">Laliga</span>
                    <span v-else-if="c.category === 'cup'" class="badge bg-primary">Copa del Rey</span>
                    <span v-else-if="c.category === 'continental'" class="badge bg-info text-dark">UEFA Champion League</span>
                    <span v-else-if="c.category === 'national'" class="badge bg-warning text-dark">National </span>
                    <span v-else class="badge bg-secondary">{{ c.category }}</span>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button
                        type="button"
                        class="btn btn-outline-primary"
                        @click="startCareerEdit(c)"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        class="btn btn-outline-danger"
                        :disabled="deletingCareerId === c.id"
                        @click="deleteCareerRow(c.id)"
                      >
                        <span
                          v-if="deletingCareerId === c.id"
                          class="spinner-border spinner-border-sm me-1"
                        ></span>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else-if="!careerLoading" class="text-muted small mb-2">
            No career stats yet.
          </div>

          <!-- Form add / edit 1 dòng career -->
          <div class="border rounded p-2 bg-light-subtle">
            <div class="row g-2 align-items-end">
              <div class="col-sm-3">
                <label class="form-label form-label-sm mb-1">Season</label>
                <input
                  v-model="careerForm.season"
                  class="form-control form-control-sm"
                  placeholder="2024/2025"
                />
              </div>
              <div class="col-sm-2">
                <label class="form-label form-label-sm mb-1">Apps</label>
                <input
                  v-model="careerForm.appearances"
                  type="number"
                  min="0"
                  class="form-control form-control-sm"
                />
              </div>
              <div class="col-sm-2">
                <label class="form-label form-label-sm mb-1">Goals</label>
                <input
                  v-model="careerForm.goals"
                  type="number"
                  min="0"
                  class="form-control form-control-sm"
                />
              </div>
              <div class="col-sm-2">
                <label class="form-label form-label-sm mb-1">Assists</label>
                <input
                  v-model="careerForm.assists"
                  type="number"
                  min="0"
                  class="form-control form-control-sm"
                />
              </div>
              <div class="col-sm-2">
  <label class="form-label form-label-sm mb-1">Yellow</label>
  <input
    v-model="careerForm.yellowcards"
    type="number"
    min="0"
    class="form-control form-control-sm"
  />
</div>
<div class="col-sm-2">
  <label class="form-label form-label-sm mb-1">Red</label>
  <input
    v-model="careerForm.redcards"
    type="number"
    min="0"
    class="form-control form-control-sm"
  />
</div>

              <div class="col-sm-3">
                <label class="form-label form-label-sm mb-1">Category</label>
                <select
                  v-model="careerForm.category"
                  class="form-select form-select-sm"
                >
                  <option value="league">Laliga</option>
                  <option value="cup">Copa del Rey</option>
                  <option value="continental">UEFA Champion League</option>
                  <option value="national">National Team</option>
                </select>
              </div>
            </div>
            <div class="mt-2 d-flex gap-2">
              <button
                type="button"
                class="btn btn-sm btn-primary"
                :disabled="savingCareer"
                @click="saveCareerRow"
              >
                <span
                  v-if="savingCareer"
                  class="spinner-border spinner-border-sm me-1"
                ></span>
                {{ careerEditingId ? 'Update stat' : 'Add stat' }}
              </button>
              <button
                v-if="careerEditingId"
                type="button"
                class="btn btn-sm btn-outline-secondary"
                @click="cancelCareerEdit"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
                  <!-- ================= TRANSFERS ================= -->
<div class="mt-4 pt-3 border-top" v-if="editingId">
  <div class="d-flex justify-content-between align-items-center mb-2">
    <h6 class="mb-0">Transfers</h6>
  </div>

  <div v-if="transError" class="text-danger small mb-2">{{ transError }}</div>
  <div v-if="transLoading" class="text-muted small mb-2">Loading transfers…</div>

  <div v-if="!transLoading && transfers.length" class="table-responsive mb-2">
    <table class="table table-sm align-middle mb-0">
      <thead class="table-light">
        <tr>
          <th style="width:100px">Year</th>
          <th>From</th>
          <th>To</th>
          <th style="width:130px">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in transfers" :key="t.id">
          <td>{{ t.year }}</td>
          <td>{{ t.fromclub }}</td>
          <td>{{ t.toclub }}</td>
          <td>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-primary" @click="startTransferEdit(t)">Edit</button>
              <button class="btn btn-outline-danger"
                      @click="deleteTransfer(t.id)"
                      :disabled="deletingTransferId === t.id">
                <span v-if="deletingTransferId === t.id" class="spinner-border spinner-border-sm me-1"></span>
                Delete
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="border rounded p-2 bg-light-subtle">
    <div class="row g-2 align-items-end">
      <div class="col-sm-3">
        <label class="form-label form-label-sm mb-1">Year</label>
        <input v-model="transForm.year" class="form-control form-control-sm" placeholder="2023" />
      </div>
      <div class="col-sm-4">
        <label class="form-label form-label-sm mb-1">From</label>
        <input v-model="transForm.fromclub" class="form-control form-control-sm" />
      </div>
      <div class="col-sm-4">
        <label class="form-label form-label-sm mb-1">To</label>
        <input v-model="transForm.toclub" class="form-control form-control-sm" />
      </div>
    </div>

    <div class="mt-2 d-flex gap-2">
      <button class="btn btn-sm btn-primary" @click="saveTransfer" :disabled="savingTransfer">
        <span v-if="savingTransfer" class="spinner-border spinner-border-sm me-1"></span>
        {{ transferEditingId ? "Update" : "Add" }}
      </button>
      <button v-if="transferEditingId" class="btn btn-sm btn-outline-secondary" @click="cancelTransferEdit">
        Cancel
      </button>
    </div>
  </div>
</div>
          <!-- ================= INJURIES ================= -->
<div class="mt-4 pt-3 border-top" v-if="editingId">
  <div class="d-flex justify-content-between align-items-center mb-2">
    <h6 class="mb-0">Injuries</h6>
  </div>

  <div v-if="injError" class="text-danger small mb-2">{{ injError }}</div>
  <div v-if="injLoading" class="text-muted small mb-2">Loading injuries…</div>

  <div v-if="!injLoading && injuries.length" class="table-responsive mb-2">
    <table class="table table-sm align-middle mb-0">
      <thead class="table-light">
        <tr>
          <th>Injury</th>
          <th style="width:150px">From</th>
          <th style="width:150px">To</th>
          <th style="width:130px">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="i in injuries" :key="i.id">
          <td>{{ i.injury }}</td>
          <td>{{ i.startdate }}</td>
          <td>{{ i.enddate }}</td>
          <td>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-primary" @click="startInjuryEdit(i)">Edit</button>
              <button class="btn btn-outline-danger"
                      @click="deleteInjury(i.id)"
                      :disabled="deletingInjuryId === i.id">
                <span v-if="deletingInjuryId === i.id" class="spinner-border spinner-border-sm me-1"></span>
                Delete
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="border rounded p-2 bg-light-subtle">
    <div class="row g-2 align-items-end">
      <div class="col-sm-5">
        <label class="form-label form-label-sm mb-1">Injury</label>
        <input v-model="injForm.injury" class="form-control form-control-sm" />
      </div>
      <div class="col-sm-3">
        <label class="form-label form-label-sm mb-1">From</label>
        <input v-model="injForm.startdate" type="date" class="form-control form-control-sm" />
      </div>
      <div class="col-sm-3">
        <label class="form-label form-label-sm mb-1">To</label>
        <input v-model="injForm.enddate" type="date" class="form-control form-control-sm" />
      </div>
    </div>

    <div class="mt-2 d-flex gap-2">
      <button class="btn btn-sm btn-primary" @click="saveInjury" :disabled="savingInjury">
        <span v-if="savingInjury" class="spinner-border spinner-border-sm me-1"></span>
        {{ injuryEditingId ? "Update" : "Add" }}
      </button>
      <button v-if="injuryEditingId" class="btn btn-sm btn-outline-secondary" @click="cancelInjuryEdit">
        Cancel
      </button>
    </div>
  </div>
</div>

          </div>
        </div>

        <div class="mt-3 d-flex align-items-center gap-2">
          <button
            class="btn btn-primary"
            :disabled="saving"
            @click="savePlayer"
          >
            <span
              v-if="saving"
              class="spinner-border spinner-border-sm me-1"
            ></span>
            {{ editingId ? 'Update' : 'Create' }}
          </button>
          <span v-if="saveError" class="text-danger small">{{ saveError }}</span>
          <span v-if="saveOk" class="text-success small">Saved</span>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-responsive">
      <table class="table align-middle">
        <thead class="table-light">
          <tr>
            <th style="width: 70px">ID</th>
            <th style="width: 72px">Avatar</th>
            <th>Name</th>
            <th style="width: 80px">#</th> <!-- số áo -->
            <th style="width: 140px">Position</th>
            <th style="width: 80px">Age</th>
            <th style="width: 160px">Nationality</th>
            <th style="width: 220px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in players" :key="p.playerid">
            <td>{{ p.playerid }}</td>
            <td>
              <div class="ratio ratio-1x1" style="max-width: 52px">
                <img
                  v-if="p.imageurl"
                  :src="avatarSrc(p.imageurl)"
                  alt=""
                  class="rounded-circle object-fit-cover"
                />
                <div
                  v-else
                  class="bg-light border rounded-circle d-flex align-items-center justify-content-center text-muted"
                >
                  <i class="bi bi-person"></i>
                </div>
              </div>
            </td>
            <td>
              <div class="fw-semibold">{{ p.fullname }}</div>
              <div v-if="p.height || p.weight" class="text-muted small">
                <span v-if="p.height">Height: {{ p.height }}</span>
                <span v-if="p.height && p.weight"> · </span>
                <span v-if="p.weight">Weight: {{ p.weight }}</span>
              </div>
            </td>
            <td>{{ p.shirtnumber ?? '—' }}</td>  <!-- 🔽 -->
            <td>{{ p.position || '—' }}</td>
            <td>{{ p.age ?? '—' }}</td>
            <td>{{ p.nationality || '—' }}</td>
            <td>
              <div class="d-flex flex-wrap gap-2">
                <button
                  class="btn btn-sm btn-primary"
                  @click="openEdit(p)"
                >
                  Edit
                </button>
                
                <button
                  class="btn btn-sm btn-danger"
                  :disabled="deletingId === p.playerid"
                  @click="onDelete(p.playerid)"
                >
                  <span
                    v-if="deletingId === p.playerid"
                    class="spinner-border spinner-border-sm me-1"
                  ></span>
                  Delete
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!loading && !players.length">
            <td colspan="7" class="text-center text-muted">
              No players
            </td>
          </tr>
          <tr v-if="loading">
            <td colspan="7" class="text-center text-muted">
              Loading…
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    
    <!-- ===== /MODAL ===== -->
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import api, { ABS } from '@/services/api'

const players = ref([])
const loading = ref(false)
const error = ref('')

// form state
const showForm = ref(false)
const editingId = ref(null)
const saving = ref(false)
const saveError = ref('')
const saveOk = ref(false)
const deletingId = ref(null)

const emptyForm = () => ({
  fullname: '',
  position: '',
  age: '',
  shirtnumber: '',   // 🔽
  birthdate: '',  
  nationality: '',
  height: '',
  weight: '',
  imageurl: '',
  description: '',
})

const form = ref(emptyForm())

function avatarSrc (filename) {
  if (!filename) return ''

  if (filename.startsWith('http') || filename.startsWith('data:')) {
    return filename
  }

  if (filename.startsWith('/uploads/')) {
    return ABS(filename)
  }

  return new URL(`../assets/players/${filename}`, import.meta.url).href
}

// ================== CAREER STATE (4 loại stat) ==================
const career = ref([])
const careerLoading = ref(false)
const careerError = ref('')
const careerFilter = ref('all') // all / league / cup / continental / national

const emptyCareerForm = () => ({
  season: '',
  appearances: '',
  goals: '',
  assists: '',
  yellowcards: '',
  redcards: '',
  category: 'league',
})

const careerForm = ref(emptyCareerForm())
const careerEditingId = ref(null)
const savingCareer = ref(false)
const deletingCareerId = ref(null)

const filteredCareer = computed(() => {
  if (careerFilter.value === 'all') return career.value
  return career.value.filter((c) => c.category === careerFilter.value)
})

async function onSelectFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const fd = new FormData();
  fd.append("image", file);

  try {
    const r = await api.post("/upload/players", fd, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    form.value.imageurl = r.data.url;  // Lưu đường dẫn trả về từ backend
  } catch (err) {
    alert("Upload failed!");
    console.error(err);
  }
}

// ================== LOAD LIST PLAYERS ==================
async function loadPlayers () {
  loading.value = true
  error.value = ''
  try {
    const r = await api.get('/players')
    players.value = r.data || []
  } catch (e) {
    console.error('loadPlayers error', e)
    error.value =
      e?.response?.data?.message || e?.response?.data?.error || 'Load failed'
  } finally {
    loading.value = false
  }
}

// ================== LOAD CAREER FOR ONE PLAYER ==================
async function loadCareer (playerId) {
  careerLoading.value = true
  careerError.value = ''
  career.value = []
  careerForm.value = emptyCareerForm()
  careerEditingId.value = null
  deletingCareerId.value = null

  try {
    const r = await api.get(`/players/${playerId}/career`)
    career.value = r.data || []
  } catch (e) {
    console.error('loadCareer error', e)
    careerError.value =
      e?.response?.data?.message || e?.response?.data?.error || 'Load career failed'
  } finally {
    careerLoading.value = false
  }
}

// ================== FORM PLAYER ==================
function openCreate () {
  editingId.value = null
  form.value = emptyForm()
  saveError.value = ''
  saveOk.value = false
  showForm.value = true

  // clear career block
  career.value = []
  careerError.value = ''
  careerForm.value = emptyCareerForm()
  careerEditingId.value = null
}

function openEdit (p) {
  editingId.value = p.playerid
  form.value = {
    fullname: p.fullname || '',
    position: p.position || '',
    age: p.age ?? '',
    shirtnumber: p.shirtnumber ?? '',   // 🔽
    birthdate: p.birthdate ? p.birthdate.slice(0, 10) : '',
    nationality: p.nationality || '',
    height: p.height || '',
    weight: p.weight || '',
    imageurl: p.imageurl || '',
    description: p.description || '',
  }
  saveError.value = ''
  saveOk.value = false
  showForm.value = true

  // load career stats cho cầu thủ này
  loadCareer(p.playerid)
  loadTransfers(p.playerid)
  loadInjuries(p.playerid)

}

function cancelForm () {
  showForm.value = false
  editingId.value = null
  saveError.value = ''
  saveOk.value = false

  career.value = []
  careerError.value = ''
  careerForm.value = emptyCareerForm()
  careerEditingId.value = null
}

async function savePlayer () {
  saveError.value = ''
  saveOk.value = false

  if (!form.value.fullname.trim()) {
    saveError.value = 'Full name is required'
    return
  }

  const payload = {
    fullname: form.value.fullname.trim(),
    position: form.value.position || null,
    age: form.value.age === '' ? null : Number(form.value.age),
    shirtnumber:
    form.value.shirtnumber === '' ? null : Number(form.value.shirtnumber), // 🔽
    birthdate: form.value.birthdate || null,
    nationality: form.value.nationality || null,
    height: form.value.height || null,
    weight: form.value.weight || null,
    imageurl: form.value.imageurl || null,
    description: form.value.description || null,
  }

  saving.value = true
  try {
    if (editingId.value) {
      await api.put(`/players/${editingId.value}`, payload)
    } else {
      await api.post('/players', payload)
    }
    saveOk.value = true
    await loadPlayers()
    setTimeout(() => {
      showForm.value = false
      editingId.value = null
      saveOk.value = false
    }, 800)
  } catch (e) {
    console.error('savePlayer error', e)
    saveError.value =
      e?.response?.data?.message || e?.response?.data?.error || 'Save failed'
  } finally {
    saving.value = false
  }
}

async function onDelete (id) {
  if (!confirm('Delete this player?')) return
  deletingId.value = id
  try {
    await api.delete(`/players/${id}`)
    await loadPlayers()
  } catch (e) {
    alert(
      e?.response?.data?.message ||
        e?.response?.data?.error ||
        'Delete failed'
    )
  } finally {
    deletingId.value = null
  }
}

// ================== CRUD CAREER ROWS ==================
function startCareerEdit (row) {
  careerEditingId.value = row.id
  careerForm.value = {
    season: row.season || '',
    appearances: row.appearances ?? '',
    goals: row.goals ?? '',
    assists: row.assists ?? '',
    yellowcards: row.yellowcards ?? '',
    redcards: row.redcards ?? '',
    category: row.category || 'league',
  }
}

function cancelCareerEdit () {
  careerEditingId.value = null
  careerForm.value = emptyCareerForm()
}

async function saveCareerRow () {
  if (!editingId.value) {
    careerError.value = 'Please select a player first.'
    return
  }

  if (!careerForm.value.season.trim()) {
    careerError.value = 'Season is required'
    return
  }

  careerError.value = ''
  savingCareer.value = true

  const payload = {
    season: careerForm.value.season.trim(),
    appearances: careerForm.value.appearances === '' ? null : Number(careerForm.value.appearances),
    goals: careerForm.value.goals === '' ? null : Number(careerForm.value.goals),
    assists: careerForm.value.assists === '' ? null : Number(careerForm.value.assists),
    yellowcards: careerForm.value.yellowcards === '' ? null : Number(careerForm.value.yellowcards),
    redcards: careerForm.value.redcards === '' ? null : Number(careerForm.value.redcards),
    category: careerForm.value.category || 'league',
  }

  try {
    if (careerEditingId.value) {
      await api.put(
        `/players/${editingId.value}/career/${careerEditingId.value}`,
        payload
      )
    } else {
      await api.post(`/players/${editingId.value}/career`, payload)
    }

    await loadCareer(editingId.value)
    careerForm.value = emptyCareerForm()
    careerEditingId.value = null
  } catch (e) {
    console.error('saveCareerRow error', e)
    careerError.value =
      e?.response?.data?.message || e?.response?.data?.error || 'Save career failed'
  } finally {
    savingCareer.value = false
  }
}

async function deleteCareerRow (rowId) {
  if (!editingId.value) return
  if (!confirm('Delete this career row?')) return

  deletingCareerId.value = rowId
  try {
    await api.delete(`/players/${editingId.value}/career/${rowId}`)
    await loadCareer(editingId.value)
  } catch (e) {
    console.error('deleteCareerRow error', e)
    careerError.value =
      e?.response?.data?.message || e?.response?.data?.error || 'Delete career failed'
  } finally {
    deletingCareerId.value = null
  }
}
// ================== TRANSFERS STATE ==================
const transfers = ref([])
const transLoading = ref(false)
const transError = ref('')
const deletingTransferId = ref(null)
const savingTransfer = ref(false)
const transferEditingId = ref(null)

const emptyTransForm = () => ({
  year: '',
  fromclub: '',
  toclub: ''
})
const transForm = ref(emptyTransForm())

// ================== INJURIES STATE ==================
const injuries = ref([])
const injLoading = ref(false)
const injError = ref('')
const deletingInjuryId = ref(null)
const savingInjury = ref(false)
const injuryEditingId = ref(null)

const emptyInjForm = () => ({
  injury: '',
  startdate: '',
  enddate: ''
})
const injForm = ref(emptyInjForm())
async function loadTransfers(playerId) {
  transLoading.value = true
  transError.value = ''
  try {
    const r = await api.get(`/players/${playerId}/transfers`)
    transfers.value = r.data || []
  } catch (e) {
    transError.value = 'Load transfers failed'
  } finally {
    transLoading.value = false
  }
}

async function loadInjuries(playerId) {
  injLoading.value = true
  injError.value = ''
  try {
    const r = await api.get(`/players/${playerId}/injuries`)
    injuries.value = r.data || []
  } catch (e) {
    injError.value = 'Load injuries failed'
  } finally {
    injLoading.value = false
  }
}
function startTransferEdit(t) {
  transferEditingId.value = t.id
  transForm.value = {
    year: t.year || '',
    fromclub: t.fromclub || '',
    toclub: t.toclub || ''
  }
}

function cancelTransferEdit() {
  transferEditingId.value = null
  transForm.value = emptyTransForm()
}

async function saveTransfer() {
  if (!editingId.value) return

  savingTransfer.value = true
  const payload = { ...transForm.value }

  try {
    if (transferEditingId.value) {
      await api.put(`/players/${editingId.value}/transfers/${transferEditingId.value}`, payload)
    } else {
      await api.post(`/players/${editingId.value}/transfers`, payload)
    }
    await loadTransfers(editingId.value)
    cancelTransferEdit()
  } finally {
    savingTransfer.value = false
  }
}

async function deleteTransfer(id) {
  if (!confirm('Delete this transfer?')) return
  deletingTransferId.value = id
  try {
    await api.delete(`/players/${editingId.value}/transfers/${id}`)
    await loadTransfers(editingId.value)
  } finally {
    deletingTransferId.value = null
  }
}
function startInjuryEdit(i) {
  injuryEditingId.value = i.id
  injForm.value = {
    injury: i.injury || '',
    startdate: i.startdate || '',
    enddate: i.enddate || ''
  }
}

function cancelInjuryEdit() {
  injuryEditingId.value = null
  injForm.value = emptyInjForm()
}

async function saveInjury() {
  if (!editingId.value) return

  savingInjury.value = true
  const payload = { ...injForm.value }

  try {
    if (injuryEditingId.value) {
      await api.put(`/players/${editingId.value}/injuries/${injuryEditingId.value}`, payload)
    } else {
      await api.post(`/players/${editingId.value}/injuries`, payload)
    }
    await loadInjuries(editingId.value)
    cancelInjuryEdit()
  } finally {
    savingInjury.value = false
  }
}

async function deleteInjury(id) {
  if (!confirm('Delete this injury?')) return
  deletingInjuryId.value = id
  try {
    await api.delete(`/players/${editingId.value}/injuries/${id}`)
    await loadInjuries(editingId.value)
  } finally {
    deletingInjuryId.value = null
  }
}

onMounted(loadPlayers)
</script>


<style scoped>
.object-fit-cover {
  object-fit: cover;
}

/* Simple modal */
.stats-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.stats-dialog {
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.stats-dialog .card-body {
  overflow: auto;
}

/* fix nav-link buttons in tabs */
.nav-tabs .nav-link {
  cursor: pointer;
}
</style>
