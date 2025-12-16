<template>
  <div class="container py-4">
    <h3 class="mb-3">Edit profile</h3>

    <div v-if="loading" class="text-muted">Loading…</div>
    <div v-else>
      <form class="card" @submit.prevent="save">
        <div class="card-body row g-3">
          <div class="col-md-6">
            <label class="form-label">Username</label>
            <input v-model="form.username" type="text" class="form-control" required />
          </div>

          <div class="col-md-6">
            <label class="form-label">Email</label>
            <input v-model="form.email" type="email" class="form-control" disabled />
            <div class="form-text">Email cannot be edited.</div>
          </div>

          <div class="col-md-6">
            <label class="form-label">Phone</label>
            <input v-model="form.phonenumber" type="text" class="form-control" />
          </div>

          <div class="col-md-6">
            <label class="form-label">Date of birth</label>
            <!-- BẮT BUỘC type="date" + v-model="form.dateofbirth" -->
            <input
              v-model="form.dateofbirth"
              type="date"
              class="form-control"
            />
          </div>

          <div class="col-md-12">
            <label class="form-label">Address</label>
            <input v-model="form.address" type="text" class="form-control" />
          </div>
        </div>

        <div class="card-footer d-flex justify-content-between">
          <RouterLink class="btn btn-outline-secondary" to="/profile">
            ← Back to Membership
          </RouterLink>
          <button class="btn btn-primary" type="submit" :disabled="saving">
            {{ saving ? "Saving…" : "Save changes" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { RouterLink, useRouter } from "vue-router";
import api from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/composables/useToast";
const router = useRouter();
const auth = useAuthStore();

const loading = ref(true);
const saving = ref(false);

const form = ref({
  username: "",
  email: "",
  phonenumber: "",
  address: "",
  // dạng yyyy-mm-dd cho input[type=date]
  dateofbirth: "",
});

async function fetchMe() {
  loading.value = true;
  try {
    const r = await api.get("/users/me");
    const u = r.data || {};

    form.value.username = u.username || "";
    form.value.email = u.email || "";
    form.value.phonenumber = u.phonenumber || "";
    form.value.address = u.address || "";

    // cắt 10 ký tự đầu: '2025-11-03T00:00:00.000Z' -> '2025-11-03'
    form.value.dateofbirth = u.dateofbirth ? u.dateofbirth.substring(0, 10) : "";
  } catch (e) {
    console.error(e);
    toast.error(e?.response?.data?.message || "Không tải được thông tin user");

    router.push("/profile");
  } finally {
    loading.value = false;
  }
}

async function save() {
  try {
    saving.value = true;

    const payload = {
      username: form.value.username,
      phonenumber: form.value.phonenumber,
      address: form.value.address,
      dateofbirth: form.value.dateofbirth || null,
    };

    console.log("PUT /users/me payload =", payload);

    const r = await api.put("/users/me", payload);
    console.log("PUT /users/me response =", r.data);

    // nếu backend trả user mới, cập nhật lại store từ đó
    if (r.data && r.data.user) {
      auth.updateUser(r.data.user);
    } else {
      auth.updateUser(payload);
    }

    toast.success("Real Madrid Club responded that: Profile updated successfully!");
    // đợi 400ms cho toast xuất hiện rồi mới chuyển trang
setTimeout(() => {
  router.push("/profile");
}, 400);
    
  } catch (e) {
    console.error(e);
    toast.error(e?.response?.data?.message || "Real Madrid Club responded that: Save information failed");
  } finally {
    saving.value = false;
  }
}



onMounted(fetchMe);
</script>

<style scoped>
.card {
  max-width: 720px;
  margin: 0 auto;
}
</style>
