<template>
  <div class="container py-4">

    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="mb-0">Manage Wallet</h3>
      <button class="btn btn-outline-primary" @click="load">
        <i class="bi bi-arrow-repeat"></i> Refresh
      </button>
    </div>

    <div v-if="loading" class="text-muted">Loading...</div>

    <div v-else class="table-responsive">
      <table class="table table-striped align-middle">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Balance</th>
            <th>Freeze</th>
            <th>Session Lock</th>
            <th style="width:140px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="w in wallets" :key="w.userid">
            <td>{{ w.fullname }}</td>
            <td>{{ w.email }}</td>

            <td class="fw-semibold text-primary">
              {{ formatMoney(w.balance) }}
            </td>

            <td class="text-danger">
              {{ formatMoney(w.freeze_balance) }}
            </td>

            <td>
              <span v-if="w.session_lock" class="badge bg-danger">
                LOCKED
              </span>
              <span v-else class="badge bg-success">OK</span>
            </td>

            <td>
              <button
                class="btn btn-sm btn-warning"
                @click="unfreeze(w.userid)"
              >
                Unfreeze
              </button>
            </td>

          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "@/services/api";
import { toast } from "@/composables/useToast";

const wallets = ref([]);
const loading = ref(false);

function formatMoney(v) {
  return new Intl.NumberFormat("vi-VN").format(v || 0) + " đ";
}

async function load() {
  loading.value = true;
  try {
    const r = await api.get("/wallet/admin/");

    wallets.value = r.data || [];
  } catch (e) {
    toast("Không load được danh sách wallet", "error");
  } finally {
    loading.value = false;
  }
}

async function unfreeze(userId) {
  if (!confirm("Unfreeze this user's wallet?")) return;

  try {
    await api.put(`/wallet/admin/unfreeze/${userId}`);

    toast("Đã unfreeze!", "success");
    load();
  } catch {
    toast("Unfreeze thất bại", "error");
  }
}

onMounted(load);
</script>

<style scoped>
.table td,
.table th {
  vertical-align: middle;
}
</style>
