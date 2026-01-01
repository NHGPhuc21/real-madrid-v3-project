// backend/src/app.js
const express = require("express");
const cors = require("cors");
const path = require("path");

const paymentsRoutes = require("./routes/payments");
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const newsRoutes = require("./routes/news");
const matchesRoutes = require("./routes/matches");
const ticketsRoutes = require("./routes/tickets");
const productsRoutes = require("./routes/products");
const ordersRoutes = require("./routes/orders");
const miscRoutes = require("./routes/misc");
const cartRoutes = require("./routes/cart");
const highlightsRoutes = require("./routes/highlights");
const ticketOrdersRoutes = require("./routes/ticketorders");
const playersRoutes = require("./routes/players");
const uploadRoutes = require("./routes/upload");
const eventGreetingRoutes = require("./routes/eventGreeting.routes");

// ---------- Swagger UI ----------
const fs = require("fs");
const swaggerUi = require("swagger-ui-express");

const app = express();



/** 2) BẬT CORS + JSON SỚM cho toàn bộ API còn lại */
app.use(cors());
app.use(express.json());



app.use("/api/upload", uploadRoutes);
/** 3) Static /uploads (không đổi) */
const uploadsAbs = path.join(__dirname, "../uploads");
app.use(
  "/uploads",
  express.static(uploadsAbs, {
    setHeaders: (res, filePath) => {
      // Cho phép CORS để hls.js/HTMLVideo tải m3u8/ts khi front/back khác origin/port
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Expose-Headers",
        "Content-Length,Content-Range"
      );
      // MIME types cho HLS/Video
      if (filePath.endsWith(".m3u8")) {
        res.setHeader("Content-Type", "application/vnd.apple.mpegURL");
      } else if (filePath.endsWith(".ts")) {
        res.setHeader("Content-Type", "video/MP2T");
      } else if (filePath.endsWith(".mp4")) {
        res.setHeader("Content-Type", "video/mp4");
      }
    },
  })
);

/** Swagger */
const specPath = path.join(__dirname, "../docs/openapiSpec.json");
const openapiSpec = JSON.parse(fs.readFileSync(specPath, "utf8"));
console.log("[Swagger] spec path:", specPath);
console.log(
  "[Swagger] has requestBody for /api/admin/register?",
  !!openapiSpec.paths?.["/api/admin/register"]?.post?.requestBody
);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec, {
    explorer: true,
    swaggerOptions: { persistAuthorization: true },
  })
);
app.use("/uploads", express.static("uploads"));

app.use("/api/events", eventGreetingRoutes);

/** 4) Mount ROUTES sau khi đã có CORS/JSON */
app.use("/api/memberships", require("./routes/memberships"));
app.use("/api/payments", paymentsRoutes);
/** 1) Webhook cần raw body cho đúng route DUY NHẤT */
app.use("/api/payments/webhook", express.raw({ type: "*/*", limit: "2mb" }));
//các chức năng của players
app.use("/api/players", require("./routes/players"));
app.use("/api/auth", authRoutes);
app.use("/api/events", require("./routes/event.routes"));

app.use("/api/users", usersRoutes);
app.use("/api/my-tickets", require("./routes/mytickets"));
app.use("/api/ticket-orders", ticketOrdersRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/matches", matchesRoutes);
app.use("/api/tickets", ticketsRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api", miscRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/highlights", highlightsRoutes);
app.use("/api/wallet/admin", require("./routes/wallet.admin"));


app.use("/api/wallet", require("./routes/wallet.freeze"));

app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/admin/wallet", require("./routes/admin.wallet"));
app.use("/api/admin", require("./routes/admin.cashback"));
app.use("/api/admin", require("./routes/admin.refund"));
app.use("/api/admin", require("./routes/admin.reconcile"));
app.use("/api", require("./routes/orders.admin"));

/** Wallet API: chỉ mount khi bật flag */
const WALLET_ENABLED =
  String(process.env.WALLET_ENABLED || "false").toLowerCase() === "true";
if (WALLET_ENABLED) {
  app.use("/api/wallet", require("./routes/wallet"));
  console.log("[Wallet] Mounted /api/wallet (WALLET_ENABLED=true)");
} else {
  console.log("[Wallet] Skipped (WALLET_ENABLED=false)");
}

/** health */
app.get("/api/health", (req, res) => res.json({ ok: true }));

module.exports = app;
