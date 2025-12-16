<template>
  <div class="match-form">
    <h3 class="mb-3">{{ isEdit ? 'Edit Match' : 'Create Match' }}</h3>

    <form @submit.prevent="onSubmit" novalidate>
      <div class="row g-3">
        <!-- Opponent -->
        <div class="col-md-6">
          <label class="form-label fw-semibold">Opponent Team <span class="text-danger">*</span></label>
          <input
            type="text"
            class="form-control"
            v-model.trim="form.opponentteam"
            placeholder="e.g. Sevilla"
            required
          />
        </div>

        <!-- Opponent logo URL -->
        <div class="col-md-6">
          <label class="form-label fw-semibold">Opponent Logo URL</label>
          <input
            type="text"
            class="form-control"
            v-model.trim="form.opponentteamlogourl"
            placeholder="/assets/logo/sevilla.png"
          />
        </div>

        <!-- Date time (optional now) -->
        <div class="col-md-6">
          <label class="form-label fw-semibold">
            Match Date & Time <small class="text-muted">(optional)</small>
          </label>
          <input
            type="datetime-local"
            class="form-control"
            v-model="localDateTime"
            :max="maxDateConstraint"
            placeholder="Leave empty if TBD"
          />
          <div class="form-text">Bạn có thể bỏ trống nếu chưa chốt giờ (TBD).</div>
        </div>

        <!-- Stadium -->
        <div class="col-md-6">
          <label class="form-label fw-semibold">Stadium</label>
          <input
            type="text"
            class="form-control"
            v-model.trim="form.stadium"
            placeholder="Santiago Bernabéu"
          />
        </div>

        <!-- Competition -->
        <div class="col-md-6">
          <label class="form-label fw-semibold">Competition</label>
          <input
            type="text"
            class="form-control"
            v-model.trim="form.competition"
            placeholder="La Liga / UCL / Copa del Rey"
          />
        </div>

        <!-- isHomeMatch -->
        <div class="col-md-6 d-flex align-items-end">
          <div class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              id="isHome"
              v-model="form.ishomematch"
            />
            <label class="form-check-label" for="isHome">
              Home match (Real Madrid as home)
            </label>
          </div>
        </div>

        <!-- Description -->
        <div class="col-12">
          <label class="form-label fw-semibold">Description</label>
          <textarea
            class="form-control"
            v-model.trim="form.description"
            rows="3"
            placeholder="Round 8 / Leg 1..."
          ></textarea>
        </div>

        <!-- Initial score (optional, mostly for edits) -->
        <div class="col-md-6">
          <label class="form-label fw-semibold">Home Score</label>
          <input
            type="number"
            min="0"
            class="form-control"
            v-model.number="form.homescore"
          />
        </div>
        <div class="col-md-6">
          <label class="form-label fw-semibold">Away Score</label>
          <input
            type="number"
            min="0"
            class="form-control"
            v-model.number="form.awayscore"
          />
        </div>

        <!-- Status -->
        <div class="col-md-6">
          <label class="form-label fw-semibold">Status</label>
          <select class="form-select" v-model="form.status">
            <option value="upcoming">upcoming</option>
            <option value="live">live</option>
            <option value="finished">finished</option>
          </select>
          <div class="form-text">Dùng <b>live</b> để bật bảng tỉ số.</div>
        </div>
      </div>

      <div class="d-flex gap-2 mt-4">
        <button class="btn btn-primary" type="submit" :disabled="saving">
          {{ saving ? 'Saving...' : (isEdit ? 'Update' : 'Create') }}
        </button>
        <button class="btn btn-outline-secondary" type="button" @click="onCancel" :disabled="saving">
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

/**
 * Props:
 *  - match (optional): khi edit, nhận object match
 */
const props = defineProps({
  match: { type: Object, default: null }
})

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!(props.match?.matchid || route.params?.id))

const form = reactive({
  opponentteam: props.match?.opponentteam || '',
  opponentteamlogourl: props.match?.opponentteamlogourl || '',
  matchdatetime: props.match?.matchdatetime || null, // backend cho phép null
  stadium: props.match?.stadium || '',
  competition: props.match?.competition || '',
  ishomematch: props.match?.ishomematch ?? true,
  description: props.match?.description || '',
  homescore: props.match?.homescore ?? 0,
  awayscore: props.match?.awayscore ?? 0,
  status: props.match?.status || 'upcoming'
})

/**
 * Ô input type=datetime-local cần string local "YYYY-MM-DDTHH:mm"
 * - Khi submit, nếu trống => gửi null
 * - Nếu có => convert sang ISO string (UTC) hoặc gửi nguyên local tuỳ backend.
 * Ở đây ta sẽ gửi ISO để đồng nhất.
 */
const localDateTime = ref('')

onMounted(() => {
  if (form.matchdatetime) {
    try {
      const d = new Date(form.matchdatetime)
      if (!isNaN(d)) {
        // chuyển thành local 'YYYY-MM-DDTHH:mm'
        const pad = (n) => String(n).padStart(2, '0')
        const yyyy = d.getFullYear()
        const mm = pad(d.getMonth() + 1)
        const dd = pad(d.getDate())
        const hh = pad(d.getHours())
        const mi = pad(d.getMinutes())
        localDateTime.value = `${yyyy}-${mm}-${dd}T${hh}:${mi}`
      }
    } catch {}
  }
})

watch(localDateTime, (val) => {
  // Không ép buộc; khi submit mới chuẩn hoá
})

const saving = ref(false)

const maxDateConstraint = computed(() => {
  // Không bắt buộc; có thể return undefined hoặc 1 năm tới cho friendly UX
  return undefined
})

async function onSubmit () {
  if (!form.opponentteam) {
    alert('Opponent Team is required')
    return
  }

  saving.value = true
  try {
    // Chuẩn hóa matchdatetime:
    // - Rỗng => null
    // - Có giá trị => ISO string (UTC)
    let toSendDateTime = null
    if (localDateTime.value && localDateTime.value.trim() !== '') {
      const d = new Date(localDateTime.value)
      if (!isNaN(d)) {
        toSendDateTime = d.toISOString()
      }
    }

    const payload = {
      opponentteam: form.opponentteam,
      opponentteamlogourl: form.opponentteamlogourl || null,
      matchdatetime: toSendDateTime,        // <- cho phép null
      stadium: form.stadium || null,
      competition: form.competition || null,
      ishomematch: !!form.ishomematch,
      description: form.description || null,
      homescore: Number(form.homescore) || 0,
      awayscore: Number(form.awayscore) || 0,
      status: form.status || 'upcoming'
    }

    if (isEdit.value) {
      const id = props.match?.matchid || Number(route.params.id)
      await api.put(`/matches/${id}`, payload)
      alert('Updated!')
    } else {
      await api.post('/matches', payload)
      alert('Created!')
    }
    router.back()
  } catch (err) {
    console.error('onSubmit error', err)
    alert('Error: ' + (err?.response?.data?.message || err.message))
  } finally {
    saving.value = false
  }
}

function onCancel () {
  router.back()
}
</script>

<style scoped>
.match-form {
  max-width: 900px;
}
</style>
