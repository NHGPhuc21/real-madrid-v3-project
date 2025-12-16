<template>
  <div class="container py-4">
    <h3>Manage Users</h3>

    <table class="table">
      <thead>
        <tr>
          <th style="width:80px">ID</th>
          <th>Username</th>
          <th>Email</th>
          <th style="width:120px">Role</th>
          <th style="width:160px">Membership</th>
          <th style="width:160px">Actions</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="u in users" :key="uid(u)">
          <td>{{ uid(u) }}</td>
          <td>{{ val(u.username, u.Username) }}</td>
          <td>{{ val(u.email, u.Email) }}</td>
          <td>{{ val(u.userrole, u.Userrole) }}</td>

          <!-- ⭐ FIXED: Dropdown không còn tự reset Basic -->
          <td>
            <select
              class="form-select form-select-sm"
              v-model="u.membershiptier"
              :value="u.membershiptier"
              @change="updateMembership(u)"
            >
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
          </td>

          <td>
            <button class="btn btn-sm btn-danger" @click="remove(uid(u))">
              Delete
            </button>
          </td>
        </tr>

        <tr v-if="!users.length">
          <td colspan="6" class="text-center">No data</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/composables/useToast";

const auth = useAuthStore();
const users = ref([]);

// Helper
const val = (a, b) => a ?? b ?? "";
const uid = (u) => u?.userid ?? u?.UserID;

/* ============================================================
   ⭐ FIX QUAN TRỌNG NHẤT:
   Luôn chuẩn hoá dữ liệu membershiptier khi load users
   Không để undefined làm dropdown reset về Basic
   ============================================================ */
async function load() {
  try {
    const res = await api.get("/users");

    users.value = (res.data || []).map((u) => ({
      ...u,
      membershiptier:
        u.membershiptier ||
        u.MembershipTier ||
        u.membership ||
        "basic", // fallback chỉ khi database thật sự không có
    }));
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Load users failed");
  }
}

/* ============================================================
   ⭐ FIX 2: Không cho gửi giá trị membership sai
   ============================================================ */
async function updateMembership(u) {
  const valid = ["basic", "premium"];
  if (!valid.includes(u.membershiptier)) {
    alert("Invalid membership tier!");
    return;
  }

  try {
    await api.put(`/users/${uid(u)}/membership`, {
      membershiptier: u.membershiptier,
    });
    toast.success("Real Madrid Club responded that: Updated successfully!");
  } catch (err) {
    console.error(err);
    toast.error(err.response?.data?.message || "Real Madrid Club responded that: Update membership failed");
  }
}

async function remove(id) {
  if (!confirm("Delete user?")) return;

  try {
    await api.delete(`/users/${id}`);
    await load();
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Delete failed");
  }
}

onMounted(() => {
  if (!auth.isLoggedIn || auth.user?.role !== "admin") {
    alert("Admin only");
    return;
  }
  load();
});
</script>
