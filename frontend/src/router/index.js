// frontend/src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import Home from "../pages/Home.vue";
import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import Shop from "../pages/Shop.vue";
import Tickets from "../pages/Tickets.vue";
import MyTickets from "../pages/MyTickets.vue";
import HighlightsUpload from "../pages/admin/HighlightsUpload.vue"; // NEW
import AdminDashboard from "../pages/admin/AdminDashboard.vue";
import ManageUsers from "../pages/admin/ManageUsers.vue";
import ManageMatches from "../pages/admin/ManageMatches.vue";
import ManageTickets from "../pages/admin/ManageTickets.vue";
import ManageProducts from "../pages/admin/ManageProducts.vue";
import ManageNews from "../pages/admin/ManageNews.vue";
import MatchForm from "../pages/admin/MatchForm.vue";
import { useAuthStore } from "../store/auth";
import ManageOrders from "../pages/admin/ManageOrders.vue";
import ManageHighlights from "../pages/admin/ManageHighlights.vue"; // NEW
import TicketOrderDetail from "@/pages/tickets/TicketOrderDetail.vue";

// ĐÃ có: chi tiết giỏ & đơn
import CartDetail from "../pages/CartDetail.vue";
// MỚI: danh sách đơn của tôi
import MyOrders from "../pages/orders/MyOrders.vue";

// Public highlights
import HighlightsList from "@/pages/highlights/HighlightsList.vue";

// ✅ NEW: trang News (list tất cả bài viết)
import News from "../pages/News.vue";

const routes = [
  { path: "/", name: "Home", component: Home },
  { path: "/login", name: "Login", component: Login },
  { path: "/register", name: "Register", component: Register },
  { path: "/shop", name: "Shop", component: Shop },
  { path: "/tickets", name: "Tickets", component: Tickets },
  { path: "/my-tickets", name: "MyTickets", component: MyTickets },
  { path: "/tickets", name: "Tickets", component: Tickets },
  { path: "/my-tickets", name: "MyTickets", component: MyTickets },

  // NEW: chi tiết đơn vé
  {
    path: "/ticket-orders/:id",
    name: "TicketOrderDetail",
    component: TicketOrderDetail,
    meta: { requiresAuth: true },
  },
  {
    path: "/sponsors",
    name: "Sponsors",
    component: () => import("@/pages/partners/Sponsors.vue"),
  },
  {
    path: "/membership",
    name: "Membership",
    component: () => import("@/pages/user/Membership.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/matches",
    name: "Matches",
    component: () => import("@/pages/Matches.vue"),
  },
  {
    path: "/admin/wallet",
    name: "AdminWallet",
    component: () => import("@/pages/admin/WalletAdmin.vue"),
    meta: { requiresAuth: true, adminOnly: true },
  },

  // ✅ Trang "Xem thêm" thành tích CLB
  {
    path: "/palmares",
    name: "Palmares",
    component: () => import("@/pages/palmares/Palmares.vue"),
  },
  {
    path: "/pay/:sid",
    name: "SandboxPay",
    component: () => import("@/pages/pay/ProviderSandbox.vue"),
  },
  // Giỏ hàng
  {
    path: "/cart",
    name: "CartDetail",
    component: CartDetail,
    meta: { requiresAuth: true },
  },

  // Admin highlights manage
  {
    path: "/admin/highlights/manage",
    name: "ManageHighlights",
    component: ManageHighlights,
    meta: { requiresAuth: true, admin: true },
  },

  // ✅ Public Highlights
  { path: "/highlights", name: "HighlightsList", component: HighlightsList },
  {
    path: "/highlights/:id",
    name: "HighlightDetail",
    component: () => import("@/pages/highlights/HighlightDetail.vue"),
    props: true,
  },

  // Chi tiết đơn hàng
  {
    path: "/orders/:id",
    name: "OrderDetail",
    component: () => import("@/pages/orders/OrderDetail.vue"),
    meta: { requiresAuth: true },
  },

  // Danh sách đơn hàng của tôi
  {
    path: "/orders",
    name: "MyOrders",
    component: MyOrders,
    meta: { requiresAuth: true },
  },

  // Admin
  {
    path: "/admin",
    name: "AdminDashboard",
    component: AdminDashboard,
    meta: { requiresAuth: true, admin: true },
  },
  {
    path: "/admin/users",
    component: ManageUsers,
    meta: { requiresAuth: true, admin: true },
  },
  {
    path: "/admin/matches",
    name: "AdminMatches",
    component: ManageMatches,
    meta: { requiresAuth: true, admin: true },
  },
  {
    path: "/admin/matches/add",
    name: "AdminAddMatch",
    component: MatchForm,
    meta: { requiresAuth: true, admin: true },
  },
  {
    path: "/admin/matches/edit/:id",
    name: "AdminEditMatch",
    component: MatchForm,
    meta: { requiresAuth: true, admin: true },
    props: true,
  },
  {
    path: "/admin/highlights",
    component: HighlightsUpload,
    meta: { requiresAuth: true, admin: true },
  },
  {
    path: "/admin/tickets",
    component: ManageTickets,
    meta: { requiresAuth: true, admin: true },
  },
  {
    path: "/admin/products",
    component: ManageProducts,
    meta: { requiresAuth: true, admin: true },
  },
  {
    path: "/admin/news",
    component: ManageNews,
    meta: { requiresAuth: true, admin: true },
  },
  {
    path: "/admin/orders",
    component: ManageOrders,
    meta: { requiresAuth: true, admin: true },
  },
  {
    path: "/profile",
    component: () => import("@/pages/user/Profile.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/user/edit-profile",
    name: "UserEditProfile",
    component: () => import("@/pages/user/EditProfile.vue"),
    meta: { requiresAuth: true },
  },
  // ✅ NEW: Trang list tin tức
  { path: "/news", name: "News", component: News },

  // Chi tiết bài viết
  {
    path: "/news/:id",
    name: "NewsDetail",
    component: () => import("@/pages/NewsDetail.vue"),
  },
  //Players
  {
    path: "/players",
    name: "Players",
    component: () => import("@/pages/players/Players.vue"),
  },
  {
    path: "/players/:id",
    name: "PlayerDetail",
    component: () => import("@/pages/players/PlayerDetail.vue"),
    props: true,
  },
  {
    path: "/admin/players",
    name: "ManagePlayers",
    component: () => import("@/pages/admin/ManagePlayers.vue"),
    meta: { requiresAuth: true, admin: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

// Navigation guard
router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  // cần đăng nhập mà chưa có → đẩy sang login kèm next
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return next({ name: "Login", query: { next: to.fullPath } });
  }
  // cần admin
  if (to.meta.admin && auth.user?.role !== "admin") {
    return next({ name: "Home" });
  }
  next();
});


export default router;
