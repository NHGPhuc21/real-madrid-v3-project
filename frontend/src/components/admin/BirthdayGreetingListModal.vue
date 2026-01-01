<template>
  <div class="modal-backdrop">
    <div class="modal-card">

      <!-- ===== HEADER BAR ===== -->
      <div class="greeting-header">
        <!-- Back -->
        <button
          class="btn btn-outline-secondary btn-sm"
          @click="$emit('close')"
        >
          ← Back
        </button>

        <!-- Title -->
        <h5 class="title">🎂 Birthday Greetings</h5>

        <!-- Add Greeting -->
        <button
          class="btn btn-success btn-sm"
          @click="showAdd = true"
        >
          + Add Greeting
        </button>
      </div>

      <!-- ===== TABLE ===== -->
      <table class="table table-hover table-sm align-middle mt-3">
        <thead class="table-light">
          <tr>
            <th>Message</th>
            <th width="90" class="text-center">%</th>
            <th width="70" class="text-center">Enable</th>
            <th width="60"></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="g in greetings" :key="g.id">
            <td>{{ g.message }}</td>

            <!-- Weight -->
            <td class="text-center">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                class="form-control form-control-sm text-center mx-auto"
                style="width: 70px"
                v-model.number="g.weight"
                @change="update(g)"
              />
            </td>

            <!-- Enable -->
            <td class="text-center">
              <input
                type="checkbox"
                v-model="g.enabled"
                @change="update(g)"
              />
            </td>

            <!-- Delete -->
            <td class="text-center">
              <button
                class="btn btn-outline-danger btn-sm"
                @click="removeGreeting(g)"
                title="Delete"
              >
                ✕
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- ===== TOTAL CHECK ===== -->
      <div class="text-end mt-2 small">
        Total: <strong>{{ totalPercent }}%</strong>
        <span
          v-if="totalPercent !== 100"
          class="text-danger ms-2"
        >
          (should be 100%)
        </span>
      </div>

      <!-- ===== ADD MODAL ===== -->
      <AddGreetingModal
        v-if="showAdd"
        eventKey="birthday"
        @added="reload"
        @close="showAdd = false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
  getGreetings,
  updateGreeting,
  deleteGreeting,
} from "@/api/eventGreetings.api";
import AddGreetingModal from "./AddGreetingModal.vue";

const greetings = ref([]);
const showAdd = ref(false);

const totalPercent = computed(() =>
  greetings.value
    .filter(g => g.enabled)
    .reduce((sum, g) => sum + g.weight, 0)
);

async function reload() {
  const res = await getGreetings("birthday");
  greetings.value = res.data;
}

async function update(g) {
  await updateGreeting(g.id, {
    weight: g.weight,
    enabled: g.enabled,
  });
}

async function removeGreeting(g) {
  if (!confirm("Delete this greeting?")) return;

  await deleteGreeting(g.id);
  await reload();
}

onMounted(reload);
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.modal-card {
  background: #fff;
  padding: 20px 24px;
  border-radius: 12px;
  width: 800px;
  max-width: 95vw;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
}

.greeting-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
}

.greeting-header .title {
  text-align: center;
  margin: 0;
  font-weight: 600;
}
</style>
