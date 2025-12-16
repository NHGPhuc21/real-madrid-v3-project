// backend/src/routes/wallet.js
const express = require("express");
const { authMiddleware } = require("../middleware/authmiddleware");
const wallet = require("../services/wallet");

const router = express.Router();

// File này CHỈ được mount khi WALLET_ENABLED=true (guard ở app.js).

// Middleware idempotency đơn giản qua header Idempotency-Key cho các POST nhạy cảm
function extractIdemKey(req) {
  return (
    req.headers["idempotency-key"] || req.headers["x-idempotency-key"] || null
  );
}

router.post("/create", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const data = await wallet.createWallet({ userId });
    res.status(201).json(data);
  } catch (e) {
    if (e.message === "WALLET_NOT_FOUND")
      return res.status(404).json({ message: e.message });
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/set-pin", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { pin } = req.body || {};
    await wallet.setPin({ userId, pin });
    res.json({ ok: true });
  } catch (e) {
    if (e.message === "INVALID_PIN")
      return res.status(400).json({ message: "PIN phải >= 4 ký tự" });
    if (e.message === "WALLET_NOT_FOUND")
      return res.status(404).json({ message: "Wallet chưa tồn tại" });
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/verify-pin", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { pin } = req.body || {};
    const ok = await wallet.verifyPin({ userId, pin });
    res.json({ ok });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/balance", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const bal = await wallet.getBalance({ userId });
    res.json(bal);
  } catch (e) {
    if (e.message === "WALLET_NOT_FOUND")
      return res.status(404).json({ message: "Wallet chưa tồn tại" });
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/transfer", authMiddleware, async (req, res) => {
  try {
    const fromUserId = req.user.userId;
    const { toUserId, amount, reason } = req.body || {};
    const idempotencyKey = extractIdemKey(req);

    const r = await wallet.transfer({
      fromUserId,
      toUserId,
      amount,
      reason,
      idempotencyKey,
    });
    res.json(r);
  } catch (e) {
    if (e.message === "INVALID_AMOUNT")
      return res.status(400).json({ message: "Số tiền không hợp lệ (>0)" });
    if (e.message === "SAME_WALLET")
      return res
        .status(400)
        .json({ message: "Không thể chuyển cho chính mình" });
    if (e.message === "WALLET_NOT_FOUND" || e.message === "BALANCE_NOT_FOUND")
      return res.status(404).json({ message: "Wallet không tồn tại" });
    if (e.message === "INSUFFICIENT_FUNDS")
      return res.status(400).json({ message: "Số dư không đủ" });
    if (e.message === "IDEMPOTENT_REPLAY")
      return res
        .status(409)
        .json({ message: "Yêu cầu trùng (Idempotency-Key)" });
    res.status(500).json({ message: "Server error" });
  }
});
// Xác nhận thanh toán ví cho 1 session
router.post("/charge", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sessionId, pin } = req.body || {};
    const r = await wallet.chargePaymentSession({ userId, sessionId, pin });
    res.json(r);
  } catch (e) {
    const map = {
      INVALID_PIN: 400,
      PIN_NOT_SET: 400,
      PIN_INCORRECT: 400,
      SESSION_NOT_FOUND: 404,
      INVALID_PROVIDER: 400,
      FORBIDDEN: 403,
      SESSION_NOT_PENDING: 400,
      WALLET_NOT_FOUND: 404,
      MERCHANT_WALLET_NOT_FOUND: 500,
      BALANCE_NOT_FOUND: 500,
      INVALID_AMOUNT: 400,
      FREEZE_NOT_ENOUGH: 400,
    };
    const code = map[e.message] || 500;
    return res.status(code).json({ message: e.message || "Server error" });
  }
});
// Khởi tạo top-up (mock)
router.post("/topup", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount, provider = "mock" } = req.body || {};
    const idempotencyKey = extractIdemKey(req);
    const r = await wallet.topupInit({ userId, amount, provider, idempotencyKey });
    // Với mock: FE sẽ tự mở trang giả theo r.id; thực tế trả checkout_url/redirect_url
    res.status(201).json({ topupId: r.id, provider: r.provider, amount: r.amount });
  } catch (e) {
    const map = { INVALID_AMOUNT: 400, WALLET_NOT_FOUND: 404, IDEMPOTENT_REPLAY: 409 };
    res.status(map[e.message] || 500).json({ message: e.message || "Server error" });
  }
});

// Yêu cầu rút tiền (pending)
router.post("/withdraw", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount, destInfo } = req.body || {};
    const idempotencyKey = extractIdemKey(req);
    const r = await wallet.withdrawRequest({ userId, amount, destInfo, idempotencyKey });
    res.status(201).json(r);
  } catch (e) {
    const map = {
      INVALID_AMOUNT: 400,
      WITHDRAW_TOO_SMALL: 400,
      WALLET_NOT_FOUND: 404,
      BALANCE_NOT_FOUND: 404,
      INSUFFICIENT_FUNDS: 400,
      IDEMPOTENT_REPLAY: 409,
    };
    res.status(map[e.message] || 500).json({ message: e.message || "Server error" });
  }
});

// =======================
// ADMIN: Unfreeze toàn bộ frozen của user
// =======================
router.put("/admin/unfreeze/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const r = await wallet.adminUnfreeze({ userId });
    res.json(r);
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
});

module.exports = router;
