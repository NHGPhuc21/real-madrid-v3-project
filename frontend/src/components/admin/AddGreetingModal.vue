<template>
  <div class="modal-backdrop">
    <div class="modal-card">
      <h5>Add Greeting</h5>

      <textarea v-model="message" class="form-control mb-2" rows="3" />

      <input
        type="number"
        v-model.number="weight"
        class="form-control"
        placeholder="Weight (%)"
      />

      <div class="text-end mt-3">
        <button class="btn btn-secondary me-2" @click="$emit('close')">
          Cancel
        </button>
        <button class="btn btn-primary" @click="add">
          Add
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { addGreeting } from "@/api/eventGreetings.api";

const props = defineProps({ eventKey: String });
const emit = defineEmits(["close", "added"]);

const message = ref("");
const weight = ref(1);

async function add() {
  await addGreeting(props.eventKey, {
    message: message.value,
    weight: weight.value,
  });
  emit("added");
  emit("close");
}
</script>
