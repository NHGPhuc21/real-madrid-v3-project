import { defineStore } from "pinia";
import api from "@/services/api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token") || null,
    user: JSON.parse(localStorage.getItem("user") || "null"),
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
  },

  actions: {
    // ---------------------
    // LOGIN (setAuth)
    // ---------------------
    setAuth(token, user) {
      this.token = token;

      this.user = {
        id: user.userid || user.id,
        username: user.username || "",
        role: user.userrole || user.role || "user",
        membershiptier: user.membershiptier || "basic",
      };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(this.user));

      // Dùng API instance, không dùng axios
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    },

    logout() {
      this.token = null;
      this.user = {
        id: null,
        username: "",
        role: "user",
        membershiptier: "basic",
      };

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      delete api.defaults.headers.common["Authorization"];
    },

    // ---------------------
    // UPDATE USER LOCAL
    // ---------------------
    updateUser(partial) {
      this.user = { ...this.user, ...partial };
      localStorage.setItem("user", JSON.stringify(this.user));
    },

    // ---------------------
    // REFRESH (/users/me)
    // ---------------------
    async refreshUser() {
      try {
        const r = await api.get("/users/me");

        this.user = {
          ...this.user,
          id: r.data.userid,
          username: r.data.username || this.user.username,
          role: r.data.userrole || this.user.role,
          membershiptier: r.data.membershiptier || this.user.membershiptier,
          email: r.data.email ?? this.user.email,
          phonenumber: r.data.phonenumber ?? this.user.phonenumber,
          address: r.data.address ?? this.user.address,
          dateofbirth: r.data.dateofbirth ?? this.user.dateofbirth,
        };

        localStorage.setItem("user", JSON.stringify(this.user));
      } catch (err) {
        console.error("refreshUser error", err);
      }
    },
  },
});
