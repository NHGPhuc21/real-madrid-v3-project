<template>
  <div class="modal fade show d-block" tabindex="-1" v-if="show">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">

        <!-- Header -->
        <div class="modal-header">
          <h5 class="modal-title">
            Edit Event — {{ localEvent.name }}
          </h5>
          <button type="button" class="btn-close" @click="close"></button>
        </div>

        <!-- Body -->
        <div class="modal-body">

          <!-- Date -->
          <div class="row mb-3">
            <div class="col">
              <label class="form-label">Start date</label>
              <input type="date" class="form-control" v-model="localEvent.startDate" />
            </div>
            <div class="col">
              <label class="form-label">End date</label>
              <input type="date" class="form-control" v-model="localEvent.endDate" />
            </div>
          </div>

          <hr />

          <!-- Effects -->
          <h6 class="mb-3">Effects</h6>

          <div class="form-check form-switch mb-2">
            <input class="form-check-input" type="checkbox" v-model="localEvent.config.snow" />
            <label class="form-check-label">Snow effect</label>
          </div>

          <div class="form-check form-switch mb-2">
            <input class="form-check-input" type="checkbox" v-model="localEvent.config.banner" />
            <label class="form-check-label">Banner</label>
          </div>

          <div class="mb-3">
            <label class="form-label">Theme</label>
            <select class="form-select" v-model="localEvent.config.theme">
              <option value="default">Default</option>
              <option value="christmas">Christmas</option>
            </select>
          </div>

        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="close">Cancel</button>
          <button class="btn btn-primary" @click="save">Save changes</button>
        </div>

      </div>
    </div>

    <!-- backdrop -->
    <div class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup>
import { reactive, watch } from "vue";

const props = defineProps({
  show: Boolean,
  event: Object,
});

const emit = defineEmits(["close", "save"]);

const localEvent = reactive({});

watch(
  () => props.event,
  (val) => {
    if (val) {
      Object.assign(localEvent, JSON.parse(JSON.stringify(val)));
    }
  },
  { immediate: true }
);

function close() {
  emit("close");
}

function save() {
  emit("save", localEvent);
}
</script>
