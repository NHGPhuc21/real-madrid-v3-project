// backend/src/services/wallet.js
// P1: Triển khai ví core: create wallet, set/verify PIN, getBalance, transfer (QA)
// Yêu cầu: đã có các bảng P0 (wallet_accounts, wallet_balances, wallet_ledger, wallet_transfers, wallet_freeze, audit_logs, idempotency_keys)

const pool = require("../../config/db");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const CURRENCY = "VND";
const SALT_ROUNDS = 10;
const membership = require("./membership");
const { generateTicketForOrder } = require("./ticket");

function ensureAmount(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x <= 0) throw new Error("INVALID_AMOUNT");
  // làm tròn 2 chữ số cho VND theo schema
  return Math.round(x * 100) / 100;
}

async function auditLog(client, { userid, actor = "user", action, data = {} }) {
  await client.query(
    `INSERT INTO audit_logs(userid, actor, action, data)
     VALUES($1,$2,$3,$4)`,
    [userid || null, actor, action, data]
  );
}

/** Lấy (hoặc tạo) ví + số dư (chỉ dùng createWallet để tạo mới). */
async function getWalletByUser(client, userId, { forUpdate = false } = {}) {
  const wq = await client.query(
    `SELECT * FROM wallet_accounts WHERE userid=$1`,
    [userId]
  );
  const wallet = wq.rows[0] || null;

  if (!wallet) return null;

  const balSql =
    `SELECT * FROM wallet_balances WHERE walletid=$1` +
    (forUpdate ? " FOR UPDATE" : "");
  const bq = await client.query(balSql, [wallet.id]);
  const balance = bq.rows[0] || null;

  return { wallet, balance };
}

/** Tính số dư sau: nếu ta vừa UPDATE balances, dùng available mới; để tối giản, ghi balance_after = available hiện tại. */
function computeBalanceAfterRow(balanceRow) {
  return Number(balanceRow.available || 0);
}

/** Ghi 1 dòng ledger (đÃ có balance mới) */
async function insertLedger(
  client,
  { walletid, ref_type, ref_id, entry, amount, currency, balance_after, meta }
) {
  await client.query(
    `INSERT INTO wallet_ledger(walletid, ref_type, ref_id, entry, amount, currency, balance_after, meta)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      walletid,
      ref_type,
      ref_id,
      entry,
      amount,
      currency,
      balance_after,
      meta || {},
    ]
  );
}

/** Đảm bảo luôn lock theo thứ tự walletid tăng dần để tránh deadlock khi chuyển tiền giữa 2 ví. */
function orderPairById(a, b) {
  return a < b ? [a, b] : [b, a];
}

module.exports = {
  /**
   * Refund một đơn hàng đã 'paid' (ví wallet):
   * - Debit ví merchant, credit ví user
   * - Ghi ledger 2 bút với ref_type='refund', ref_id='order:{orderId}'
   * - Mark ProductOrders.paymentstatus='refunded', set refundedAt/amount
   * - Ghi product_order_refunds & payment_refunds
   * Yêu cầu: MERCHANT_USER_ID đã có ví & đủ available (hoặc cho phép âm tuỳ chính sách).
   */
  async refundOrder({ adminUserId, orderId, amount, reason = "admin_refund" }) {
    amount = ensureAmount(amount);

    const MERCHANT_USER_ID = Number(process.env.MERCHANT_USER_ID || 1);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // lấy order
      const oq = await client.query(
        `SELECT orderid, userid, totalamount, paymentstatus FROM productorders WHERE orderid=$1 FOR UPDATE`,
        [orderId]
      );
      if (!oq.rows.length) throw new Error("ORDER_NOT_FOUND");
      const ord = oq.rows[0];
      if (ord.paymentstatus !== "paid") throw new Error("ORDER_NOT_PAID");
      if (amount > Number(ord.totalamount)) throw new Error("AMOUNT_TOO_LARGE");

      // ví user
      const uw = await client.query(
        `SELECT id FROM wallet_accounts WHERE userid=$1`,
        [ord.userid]
      );
      if (!uw.rows.length) throw new Error("WALLET_NOT_FOUND");
      const userWalletId = uw.rows[0].id;

      // ví merchant
      const mw = await client.query(
        `SELECT id FROM wallet_accounts WHERE userid=$1`,
        [MERCHANT_USER_ID]
      );
      if (!mw.rows.length) throw new Error("MERCHANT_WALLET_NOT_FOUND");
      const merchantWalletId = mw.rows[0].id;

      // lock balances theo thứ tự
      const [a, b] =
        merchantWalletId < userWalletId
          ? [merchantWalletId, userWalletId]
          : [userWalletId, merchantWalletId];

      const q1 = await client.query(
        `SELECT * FROM wallet_balances WHERE walletid=$1 FOR UPDATE`,
        [a]
      );
      const q2 = await client.query(
        `SELECT * FROM wallet_balances WHERE walletid=$1 FOR UPDATE`,
        [b]
      );

      const mBal = merchantWalletId === a ? q1.rows[0] : q2.rows[0];
      const uBal = userWalletId === b ? q2.rows[0] : q1.rows[0];
      if (!mBal || !uBal) throw new Error("BALANCE_NOT_FOUND");

      // Chính sách: cho phép merchant available âm (nếu muốn). Nếu không, check:
      if (
        Number(mBal.available) < amount &&
        String(process.env.MERCHANT_ALLOW_NEGATIVE || "false") !== "true"
      ) {
        throw new Error("MERCHANT_FUNDS_NOT_ENOUGH");
      }

      const newMerchantAvail = Number(mBal.available) - amount;
      const newUserAvail = Number(uBal.available) + amount;

      await client.query(
        `UPDATE wallet_balances SET available=$1, updated_at=NOW() WHERE walletid=$2`,
        [newMerchantAvail, merchantWalletId]
      );
      await client.query(
        `UPDATE wallet_balances SET available=$1, updated_at=NOW() WHERE walletid=$2`,
        [newUserAvail, userWalletId]
      );

      // Ledger 2 bút
      const refId = `order:${orderId}`;
      await client.query(
        `INSERT INTO wallet_ledger(walletid, ref_type, ref_id, entry, amount, currency, balance_after, meta)
         VALUES
         ($1,'refund',$2,'debit',$3,'VND',$4,$5),
         ($6,'refund',$2,'credit',$3,'VND',$7,$8)`,
        [
          merchantWalletId,
          refId,
          amount,
          newMerchantAvail,
          { orderId, reason },
          userWalletId,
          refId,
          amount,
          newUserAvail,
          { orderId, reason },
        ]
      );

      // Lưu refunds
      await client.query(
        `INSERT INTO product_order_refunds(orderid, amount, reason, created_by, status, meta)
         VALUES($1,$2,$3,$4,'succeeded',$5)`,
        [orderId, amount, reason, adminUserId || null, {}]
      );

      const sess = await client.query(
        `SELECT id FROM paymentsessions WHERE orderid=$1 AND provider='wallet' AND status='paid' ORDER BY id DESC LIMIT 1`,
        [orderId]
      );
      const sid = sess.rows[0]?.id || null;
      await client.query(
        `INSERT INTO payment_refunds(session_id, orderid, amount, provider, status, created_by, meta)
         VALUES($1,$2,$3,'wallet','succeeded',$4,$5)`,
        [sid, orderId, amount, adminUserId || null, {}]
      );

      // Mark order refunded (đơn giản P6: set refunded toàn bộ amount bạn truyền vào)
      await client.query(
        `UPDATE productorders
            SET paymentstatus='refunded',
                refundamount=COALESCE(refundamount,0)+$2,
                refundedat=NOW(),
                orderstatus = CASE WHEN orderstatus IN ('pending','processing') THEN 'cancelled' ELSE orderstatus END
          WHERE orderid=$1`,
        [orderId, amount]
      );

      await auditLog(client, {
        userid: adminUserId || null,
        actor: "admin",
        action: "wallet.refund.order",
        data: { orderId, amount, reason },
      });

      await client.query("COMMIT");
      return { ok: true };
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  },

  /**
   * Khởi tạo top-up (redirect/checkout thật sẽ làm ở FE hoặc trả URL; P3 dùng mock).
   * Tạo record wallet_topups (initiated) + trả về topupId để FE mở trang thanh toán mock.
   */
  async topupInit({ userId, amount, provider = "mock", idempotencyKey }) {
    amount = ensureAmount(amount);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Idempotency (tuỳ chọn)
      if (idempotencyKey) {
        const ins = await client.query(
          `INSERT INTO idempotency_keys(key, scope, userid)
           VALUES($1,$2,$3)
           ON CONFLICT DO NOTHING
           RETURNING key`,
          [idempotencyKey, "wallet.topup.init", userId]
        );
        if (!ins.rows.length) {
          await client.query("ROLLBACK");
          throw new Error("IDEMPOTENT_REPLAY");
        }
      }

      // đảm bảo ví tồn tại
      const w = await client.query(
        `SELECT id FROM wallet_accounts WHERE userid=$1`,
        [userId]
      );
      if (!w.rows.length) throw new Error("WALLET_NOT_FOUND");

      const r = await client.query(
        `INSERT INTO wallet_topups(userid, provider, amount, status, idempotency_key)
         VALUES($1,$2,$3,'initiated',$4)
         RETURNING id, provider, amount, status, created_at`,
        [userId, provider, amount, idempotencyKey || null]
      );

      await auditLog(client, {
        userid: userId,
        action: "wallet.topup.init",
        data: { topupId: r.rows[0].id, amount, provider },
      });
      await client.query("COMMIT");
      return r.rows[0];
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  },

  /**
   * Áp dụng kết quả top-up từ webhook/provider:
   * - Kiểm tra idempotency theo provider_txn_id
   * - Đổi status -> success
   * - Ghi ledger: credit vào ví user; đối ứng debit từ ví 'topup_clear'
   */
  async topupApplyWebhook({
    userId,
    topupId,
    provider,
    providerTxnId,
    amount,
  }) {
    amount = ensureAmount(amount);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // lock record topup
      const tq = await client.query(
        `SELECT * FROM wallet_topups WHERE id=$1 FOR UPDATE`,
        [topupId]
      );
      if (!tq.rows.length) throw new Error("TOPUP_NOT_FOUND");
      const t = tq.rows[0];
      if (t.status === "success") {
        await client.query("ROLLBACK");
        return { alreadyApplied: true };
      }
      if (t.userid !== userId) throw new Error("FORBIDDEN");
      if (t.provider !== provider) throw new Error("INVALID_PROVIDER");

      // chống ghi trùng theo provider_txn_id
      if (providerTxnId) {
        const uq = await client.query(
          `SELECT id FROM wallet_topups WHERE provider=$1 AND provider_txn_id=$2`,
          [provider, providerTxnId]
        );
        if (uq.rows.length && uq.rows[0].id !== topupId) {
          throw new Error("DUP_PROVIDER_TXN");
        }
      }

      // ví user
      const uw = await client.query(
        `SELECT id FROM wallet_accounts WHERE userid=$1`,
        [userId]
      );
      if (!uw.rows.length) throw new Error("WALLET_NOT_FOUND");
      const userWalletId = uw.rows[0].id;

      // ví topup clearing
      const clearRow = await client.query(
        `SELECT userid FROM wallet_clearing_accounts WHERE key='topup_clear'`
      );
      if (!clearRow.rows.length) throw new Error("CLEARING_NOT_SET");
      const clearUserId = clearRow.rows[0].userid;

      const cw = await client.query(
        `SELECT id FROM wallet_accounts WHERE userid=$1`,
        [clearUserId]
      );
      if (!cw.rows.length) throw new Error("CLEARING_WALLET_NOT_FOUND");
      const clearWalletId = cw.rows[0].id;

      // lock balances theo thứ tự
      const [a, b] =
        userWalletId < clearWalletId
          ? [userWalletId, clearWalletId]
          : [clearWalletId, userWalletId];
      const q1 = await client.query(
        `SELECT * FROM wallet_balances WHERE walletid=$1 FOR UPDATE`,
        [a]
      );
      const q2 = await client.query(
        `SELECT * FROM wallet_balances WHERE walletid=$1 FOR UPDATE`,
        [b]
      );
      const uBal = userWalletId === a ? q1.rows[0] : q2.rows[0];
      const cBal = clearWalletId === b ? q2.rows[0] : q1.rows[0];
      if (!uBal || !cBal) throw new Error("BALANCE_NOT_FOUND");

      // cập nhật số dư: user +available, clearing -available (có thể âm nếu bạn không nạp trước; với clearing account có thể cho âm)
      const newUserAvail = Number(uBal.available) + amount;
      const newClearAvail = Number(cBal.available) - amount;

      await client.query(
        `UPDATE wallet_balances SET available=$1, updated_at=NOW() WHERE walletid=$2`,
        [newUserAvail, userWalletId]
      );
      await client.query(
        `UPDATE wallet_balances SET available=$1, updated_at=NOW() WHERE walletid=$2`,
        [newClearAvail, clearWalletId]
      );

      // ledger 2 bút
      const refId = `topup:${topupId}`;
      await client.query(
        `INSERT INTO wallet_ledger(walletid, ref_type, ref_id, entry, amount, currency, balance_after, meta)
         VALUES
         ($1,'topup',$2,'credit',$3,'VND',$4,$5),
         ($6,'topup',$2,'debit',$3,'VND',$7,$8)`,
        [
          userWalletId,
          refId,
          amount,
          newUserAvail,
          { provider, providerTxnId },
          clearWalletId,
          newClearAvail,
          { provider, providerTxnId },
        ]
      );

      // cập nhật record topup
      await client.query(
        `UPDATE wallet_topups
           SET status='success', provider_txn_id=$1, processed_at=NOW()
         WHERE id=$2`,
        [providerTxnId || null, topupId]
      );

      await auditLog(client, {
        userid: userId,
        actor: "system",
        action: "wallet.topup.success",
        data: { topupId, amount, providerTxnId },
      });
      await client.query("COMMIT");
      return { ok: true };
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  },

  /**
   * Tạo yêu cầu rút tiền:
   * - Kiểm tra min, kiểm tra available
   * - Hold ngay bằng cách trừ available (đơn giản P3), khi admin/cron “complete” sẽ ghi ledger
   */
  async withdrawRequest({ userId, amount, destInfo, idempotencyKey }) {
    amount = ensureAmount(amount);
    const MIN = Number(process.env.WITHDRAW_MIN_AMOUNT || 10000);
    if (amount < MIN) throw new Error("WITHDRAW_TOO_SMALL");

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (idempotencyKey) {
        const ins = await client.query(
          `INSERT INTO idempotency_keys(key, scope, userid)
           VALUES($1,$2,$3)
           ON CONFLICT DO NOTHING
           RETURNING key`,
          [idempotencyKey, "wallet.withdraw.req", userId]
        );
        if (!ins.rows.length) {
          await client.query("ROLLBACK");
          throw new Error("IDEMPOTENT_REPLAY");
        }
      }

      // lock balance user
      const w = await client.query(
        `SELECT id FROM wallet_accounts WHERE userid=$1`,
        [userId]
      );
      if (!w.rows.length) throw new Error("WALLET_NOT_FOUND");
      const walletId = w.rows[0].id;

      const bq = await client.query(
        `SELECT * FROM wallet_balances WHERE walletid=$1 FOR UPDATE`,
        [walletId]
      );
      const bal = bq.rows[0];
      if (!bal) throw new Error("BALANCE_NOT_FOUND");
      if (Number(bal.available) < amount) throw new Error("INSUFFICIENT_FUNDS");

      // trừ available tạm thời (coi như hold đơn giản ở P3)
      const newAvail = Number(bal.available) - amount;
      await client.query(
        `UPDATE wallet_balances SET available=$1, updated_at=NOW() WHERE walletid=$2`,
        [newAvail, walletId]
      );

      const fee = Number(process.env.WITHDRAW_FEE_FIXED || 0);
      const r = await client.query(
        `INSERT INTO wallet_withdrawals(userid, amount, fee, dest_info, status)
         VALUES($1,$2,$3,$4,'pending')
         RETURNING id, status`,
        [userId, amount, fee, destInfo || {}]
      );

      await auditLog(client, {
        userid: userId,
        action: "wallet.withdraw.request",
        data: { withdrawalId: r.rows[0].id, amount, fee },
      });
      await client.query("COMMIT");
      return { withdrawalId: r.rows[0].id };
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  },

  /**
   * Hoàn tất rút tiền (do admin/worker gọi sau khi chuyển khoản thành công):
   * - Debit ví user (ledger) + Credit ví payout_clear (đối ứng)
   * - Mark withdrawal=success
   */
  async withdrawComplete({ adminUserId, withdrawalId }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const wq = await client.query(
        `SELECT * FROM wallet_withdrawals WHERE id=$1 FOR UPDATE`,
        [withdrawalId]
      );
      if (!wq.rows.length) throw new Error("WITHDRAW_NOT_FOUND");
      const wd = wq.rows[0];
      if (wd.status === "success") {
        await client.query("ROLLBACK");
        return { alreadyDone: true };
      }
      if (
        wd.status !== "pending" &&
        wd.status !== "approved" &&
        wd.status !== "processing"
      )
        throw new Error("WITHDRAW_BAD_STATE");

      const userId = wd.userid;
      const amount = Number(wd.amount);
      const fee = Number(wd.fee || 0);

      // ví user
      const uw = await client.query(
        `SELECT id FROM wallet_accounts WHERE userid=$1`,
        [userId]
      );
      if (!uw.rows.length) throw new Error("WALLET_NOT_FOUND");
      const userWalletId = uw.rows[0].id;

      // ví payout clearing
      const clearRow = await client.query(
        `SELECT userid FROM wallet_clearing_accounts WHERE key='payout_clear'`
      );
      if (!clearRow.rows.length) throw new Error("CLEARING_NOT_SET");
      const clearUserId = clearRow.rows[0].userid;
      const cw = await client.query(
        `SELECT id FROM wallet_accounts WHERE userid=$1`,
        [clearUserId]
      );
      if (!cw.rows.length) throw new Error("CLEARING_WALLET_NOT_FOUND");
      const clearWalletId = cw.rows[0].id;

      // lock theo thứ tự
      const [a, b] =
        userWalletId < clearWalletId
          ? [userWalletId, clearWalletId]
          : [clearWalletId, userWalletId];
      const q1 = await client.query(
        `SELECT * FROM wallet_balances WHERE walletid=$1 FOR UPDATE`,
        [a]
      );
      const q2 = await client.query(
        `SELECT * FROM wallet_balances WHERE walletid=$1 FOR UPDATE`,
        [b]
      );
      const uBal = userWalletId === a ? q1.rows[0] : q2.rows[0];
      const pBal = clearWalletId === b ? q2.rows[0] : q1.rows[0];
      if (!uBal || !pBal) throw new Error("BALANCE_NOT_FOUND");

      // Ở bước request, đã trừ available user = hold thô sơ; giờ ghi ledger dòng tiền thực.
      const newClearAvail = Number(pBal.available) + amount;
      await client.query(
        `UPDATE wallet_balances SET available=$1, updated_at=NOW() WHERE walletid=$2`,
        [newClearAvail, clearWalletId]
      );

      const refId = `withdraw:${withdrawalId}`;
      // ledger: user debit (tiền ra), payout_clear credit (tiền vào)
      await client.query(
        `INSERT INTO wallet_ledger(walletid, ref_type, ref_id, entry, amount, currency, balance_after, meta)
         VALUES
         ($1,'withdraw',$2,'debit',$3,'VND',$4,$5),
         ($6,'withdraw',$2,'credit',$3,'VND',$7,$8)`,
        [
          userWalletId,
          refId,
          amount,
          Number(uBal.available),
          { fee },
          clearWalletId,
          newClearAvail,
          { fee },
        ]
      );

      await client.query(
        `UPDATE wallet_withdrawals
           SET status='success', updated_at=NOW()
         WHERE id=$1`,
        [withdrawalId]
      );

      await auditLog(client, {
        userid: adminUserId || null,
        actor: "admin",
        action: "wallet.withdraw.success",
        data: { withdrawalId },
      });
      await client.query("COMMIT");
      return { ok: true };
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  },
  /** Cộng thưởng vào ví (bonus) – dùng cho cashback, không cho rút. */
  async addBonus({ userId, amount, reason = "cashback", meta = {} }) {
    amount = ensureAmount(amount);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const w = await client.query(
        `SELECT id FROM wallet_accounts WHERE userid=$1`,
        [userId]
      );
      if (!w.rows.length) throw new Error("WALLET_NOT_FOUND");
      const walletId = w.rows[0].id;

      const bq = await client.query(
        `SELECT * FROM wallet_balances WHERE walletid=$1 FOR UPDATE`,
        [walletId]
      );
      const bal = bq.rows[0];
      if (!bal) throw new Error("BALANCE_NOT_FOUND");

      const newBonus = Number(bal.bonus || 0) + amount;
      await client.query(
        `UPDATE wallet_balances SET bonus=$1, updated_at=NOW() WHERE walletid=$2`,
        [newBonus, walletId]
      );

      // Ghi ledger "credit" nhưng đánh dấu meta.is_bonus để phân biệt
      const refId = `bonus:${Date.now()}`;
      await client.query(
        `INSERT INTO wallet_ledger(walletid, ref_type, ref_id, entry, amount, currency, balance_after, meta)
         VALUES ($1,'bonus',$2,'credit',$3,'VND',$4,$5)`,
        [
          walletId,
          refId,
          amount,
          Number(bal.available),
          { reason, is_bonus: true, ...meta },
        ]
      );

      await auditLog(client, {
        userid: userId,
        actor: "system",
        action: "wallet.bonus.add",
        data: { amount, reason },
      });

      await client.query("COMMIT");
      return { ok: true };
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  },

  /** Tạo ví cho user nếu chưa có. Idempotent theo userId. */
  async createWallet({ userId }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // check tồn tại
      const ex = await client.query(
        `SELECT wa.id, wb.available, wb.frozen
           FROM wallet_accounts wa
           LEFT JOIN wallet_balances wb ON wb.walletid = wa.id
          WHERE wa.userid=$1`,
        [userId]
      );
      if (ex.rows.length) {
        await client.query("COMMIT");
        return {
          walletId: ex.rows[0].id,
          created: false,
          balance: {
            available: ex.rows[0].available || 0,
            frozen: ex.rows[0].frozen || 0,
            currency: CURRENCY,
          },
        };
      }

      const insW = await client.query(
        `INSERT INTO wallet_accounts(userid, status, level)
         VALUES($1,'active','basic') RETURNING id`,
        [userId]
      );
      const walletId = insW.rows[0].id;

      await client.query(
        `INSERT INTO wallet_balances(walletid, available, frozen)
         VALUES($1, 0, 0)`,
        [walletId]
      );

      await auditLog(client, {
        userid: userId,
        action: "wallet.create",
        data: { walletId },
      });
      await client.query("COMMIT");

      return {
        walletId,
        created: true,
        balance: { available: 0, frozen: 0, currency: CURRENCY },
      };
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  },

  /** Lưu PIN (hash) — ghi đè nếu đã có (đổi PIN). */
  async setPin({ userId, pin }) {
    if (!pin || String(pin).length < 4) throw new Error("INVALID_PIN");
    const hash = await bcrypt.hash(String(pin), SALT_ROUNDS);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const r = await client.query(
        `UPDATE wallet_accounts SET pin_hash=$1 WHERE userid=$2 RETURNING id`,
        [hash, userId]
      );
      if (!r.rows.length) throw new Error("WALLET_NOT_FOUND");
      await auditLog(client, { userid: userId, action: "wallet.set_pin" });
      await client.query("COMMIT");
      return true;
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  },

  /** Verify PIN: trả true/false. */
  async verifyPin({ userId, pin }) {
    const client = await pool.connect();
    try {
      const r = await client.query(
        `SELECT pin_hash FROM wallet_accounts WHERE userid=$1`,
        [userId]
      );
      if (!r.rows.length || !r.rows[0].pin_hash) return false;
      return await bcrypt.compare(String(pin || ""), r.rows[0].pin_hash);
    } finally {
      client.release();
    }
  },

  /** Lấy số dư. */
  async getBalance({ userId }) {
    const client = await pool.connect();
    try {
      const w = await client.query(
        `   SELECT wa.id AS walletid, wb.available, wb.frozen, wb.bonus, wb.bonus_frozen
           FROM wallet_accounts wa
           LEFT JOIN wallet_balances wb ON wb.walletid = wa.id
          WHERE wa.userid=$1`,
        [userId]
      );
      if (!w.rows.length) throw new Error("WALLET_NOT_FOUND");

      const row = w.rows[0];
      return {
        walletId: row.walletid,
        available: Number(row.available || 0),
        frozen: Number(row.frozen || 0),
        bonus: Number(row.bonus || 0),
        bonus_frozen: Number(row.bonus_frozen || 0),
        currency: CURRENCY,
      };
    } finally {
      client.release();
    }
  },

  /**
   * Chuyển nội bộ giữa 2 user (QA): fromUserId -> toUserId
   * - Transaction
   * - Lock both balances FOR UPDATE theo thứ tự walletid tăng dần
   * - Double-entry ledger
   * - Ghi vào wallet_transfers
   * - IdempotencyKey (tuỳ chọn): truyền qua params.idempotencyKey
   */
  async transfer({
    fromUserId,
    toUserId,
    amount,
    reason = "internal_transfer",
    idempotencyKey,
  }) {
    amount = ensureAmount(amount);
    if (fromUserId === toUserId) throw new Error("SAME_WALLET");

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Idempotency (tuỳ chọn)
      if (idempotencyKey) {
        const ins = await client.query(
          `INSERT INTO idempotency_keys(key, scope, userid)
           VALUES($1,$2,$3)
           ON CONFLICT DO NOTHING
           RETURNING key`,
          [idempotencyKey, "wallet.transfer", fromUserId]
        );
        if (!ins.rows.length) {
          // Đã xử lý trước đó
          await client.query("ROLLBACK");
          throw new Error("IDEMPOTENT_REPLAY");
        }
      }

      // Lấy 2 ví
      const fw = await client.query(
        `SELECT id, userid FROM wallet_accounts WHERE userid=$1`,
        [fromUserId]
      );
      const tw = await client.query(
        `SELECT id, userid FROM wallet_accounts WHERE userid=$1`,
        [toUserId]
      );
      if (!fw.rows.length || !tw.rows.length)
        throw new Error("WALLET_NOT_FOUND");

      const fromWalletId = fw.rows[0].id;
      const toWalletId = tw.rows[0].id;

      // Lock balances theo thứ tự tăng dần để tránh deadlock
      const [a, b] = orderPairById(fromWalletId, toWalletId);
      const q1 = await client.query(
        `SELECT * FROM wallet_balances WHERE walletid=$1 FOR UPDATE`,
        [a]
      );
      const q2 = await client.query(
        `SELECT * FROM wallet_balances WHERE walletid=$1 FOR UPDATE`,
        [b]
      );

      // Sau khi lock, đọc lại balances theo id thực tế
      const fromBal = fromWalletId === a ? q1.rows[0] : q2.rows[0];
      const toBal = toWalletId === b ? q2.rows[0] : q1.rows[0];

      if (!fromBal || !toBal) throw new Error("BALANCE_NOT_FOUND");
      if (Number(fromBal.available) < amount)
        throw new Error("INSUFFICIENT_FUNDS");

      // Cập nhật available
      const newFromAvail = Number(fromBal.available) - amount;
      const newToAvail = Number(toBal.available) + amount;

      await client.query(
        `UPDATE wallet_balances SET available=$1, updated_at=NOW() WHERE walletid=$2`,
        [newFromAvail, fromWalletId]
      );
      await client.query(
        `UPDATE wallet_balances SET available=$1, updated_at=NOW() WHERE walletid=$2`,
        [newToAvail, toWalletId]
      );

      // Ghi ledger 2 bút
      const refId = uuidv4();
      await insertLedger(client, {
        walletid: fromWalletId,
        ref_type: "transfer",
        ref_id: refId,
        entry: "debit", // tiền ra
        amount,
        currency: CURRENCY,
        balance_after: newFromAvail,
        meta: { toWalletId, reason },
      });
      await insertLedger(client, {
        walletid: toWalletId,
        ref_type: "transfer",
        ref_id: refId,
        entry: "credit", // tiền vào
        amount,
        currency: CURRENCY,
        balance_after: newToAvail,
        meta: { fromWalletId, reason },
      });

      // Ghi bảng transfers
      const tr = await client.query(
        `INSERT INTO wallet_transfers(from_wallet, to_wallet, amount, status, reason, processed_at)
         VALUES($1,$2,$3,'success',$4,NOW())
         RETURNING id`,
        [fromWalletId, toWalletId, amount, reason]
      );

      await auditLog(client, {
        userid: fromUserId,
        action: "wallet.transfer",
        data: { toUserId, amount, transferId: tr.rows[0].id },
      });
      await client.query("COMMIT");

      return { ok: true, transferId: tr.rows[0].id, refId };
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  },

  // Chuẩn bị cho P2 (freeze/unfreeze) — chưa expose route ở P1
  async freezeAmount({
    userId,
    orderId,
    amount,
    reason = "checkout_freeze",
    expireAt,
  }) {
    amount = ensureAmount(amount);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Lấy ví & lock balance
      const w = await client.query(
        `SELECT id FROM wallet_accounts WHERE userid=$1`,
        [userId]
      );
      if (!w.rows.length) throw new Error("WALLET_NOT_FOUND");
      const walletId = w.rows[0].id;

      const bq = await client.query(
        `SELECT * FROM wallet_balances WHERE walletid=$1 FOR UPDATE`,
        [walletId]
      );
      const bal = bq.rows[0];
      if (!bal) throw new Error("BALANCE_NOT_FOUND");

      const avail = Number(bal.available || 0);
      const bonus = Number(bal.bonus || 0);
      if (avail + bonus < amount) throw new Error("INSUFFICIENT_FUNDS");

      // Ưu tiên trích từ bonus trước
      const takeFromBonus = Math.min(bonus, amount);
      const remain = amount - takeFromBonus;

      const newBonus = bonus - takeFromBonus;
      const newBonusFrozen = Number(bal.bonus_frozen || 0) + takeFromBonus;
      const newAvail = avail - remain;
      const newFrozen = Number(bal.frozen || 0) + remain;

      await client.query(
        `UPDATE wallet_balances
          SET available=$1, frozen=$2, bonus=$3, bonus_frozen=$4, updated_at=NOW()
        WHERE walletid=$5`,
        [newAvail, newFrozen, newBonus, newBonusFrozen, walletId]
      );

      const fr = await client.query(
        `INSERT INTO wallet_freeze(walletid, amount, reason, orderid, expire_at)
         VALUES($1,$2,$3,$4,$5)
         RETURNING id`,
        [walletId, amount, reason, orderId || null, expireAt || null]
      );

      await auditLog(client, {
        userid: userId,
        action: "wallet.freeze",
        data: {
          amount,
          orderId,
          freezeId: fr.rows[0].id,
          split: { bonus: takeFromBonus, cash: remain },
        },
      });
      await client.query("COMMIT");
      return { freezeId: fr.rows[0].id };
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  },

  async releaseFreeze({ freezeId, reason = "release" }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const fr = await client.query(
        `SELECT * FROM wallet_freeze WHERE id=$1 FOR UPDATE`,
        [freezeId]
      );
      if (!fr.rows.length) throw new Error("FREEZE_NOT_FOUND");
      const f = fr.rows[0];
      if (f.released_at) {
        await client.query("ROLLBACK");
        return { alreadyReleased: true };
      }

      const bq = await client.query(
        `SELECT * FROM wallet_balances WHERE walletid=$1 FOR UPDATE`,
        [f.walletid]
      );
      const bal = bq.rows[0];
      if (!bal) throw new Error("BALANCE_NOT_FOUND");

      const amount = Number(f.amount);
      // Trả vào bonus trước (giảm bonus_frozen), phần dư trả vào available (giảm frozen)
      const bonusFrozen = Number(bal.bonus_frozen || 0);
      const giveBackToBonus = Math.min(bonusFrozen, amount);
      const giveBackToAvail = amount - giveBackToBonus;

      const newBonus = Number(bal.bonus || 0) + giveBackToBonus;
      const newBonusFrozen = bonusFrozen - giveBackToBonus;
      const newAvail = Number(bal.available || 0) + giveBackToAvail;
      const newFrozen = Number(bal.frozen || 0) - giveBackToAvail;
      if (newBonusFrozen < 0 || newFrozen < 0)
        throw new Error("INTERNAL_STATE_ERROR");

      await client.query(
        `UPDATE wallet_balances
      SET available=$1, frozen=$2, bonus=$3, bonus_frozen=$4, updated_at=NOW()
    WHERE walletid=$5`,
        [newAvail, newFrozen, newBonus, newBonusFrozen, f.walletid]
      );
      await client.query(
        `UPDATE wallet_freeze SET released_at=NOW(), reason=$1 WHERE id=$2`,
        [reason, freezeId]
      );

      await auditLog(client, {
        userid: null,
        actor: "system",
        action: "wallet.freeze.release",
        data: { freezeId },
      });
      await client.query("COMMIT");
      return { ok: true };
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  },
  /**
   * P2: Charge một phiên thanh toán ví.
   * - Kiểm tra PIN
   * - Kiểm tra session (provider=wallet, pending, thuộc về user)
   * - Ghi ledger 2 bút: user (debit) -> merchant (credit)
   * - Giảm frozen của user (tiền đã đóng)
   * - Mark paymentsessions = 'paid', productorders.paymentstatus='paid' + orderstatus chuyển 'processing' nếu đang 'pending'
   */
  async chargePaymentSession({ userId, sessionId, pin }) {
    const MERCHANT_USER_ID = Number(process.env.MERCHANT_USER_ID || 1);
    if (!pin || String(pin).length < 4) throw new Error("INVALID_PIN");

    const client = await pool.connect();

    // Các biến trả ra sau COMMIT
    let orderId = null;
    let orderType = null;

    try {
      await client.query("BEGIN");

      // Verify PIN
      const hasPin = await client.query(
        `SELECT pin_hash FROM wallet_accounts WHERE userid=$1`,
        [userId]
      );
      if (!hasPin.rows.length || !hasPin.rows[0].pin_hash)
        throw new Error("PIN_NOT_SET");
      const ok = await bcrypt.compare(String(pin), hasPin.rows[0].pin_hash);
      if (!ok) throw new Error("PIN_INCORRECT");

      // =====================================================
      //   ⭐ LẤY SESSION — FIX KHÔNG DÙNG UNION ALL
      // =====================================================

      let sessionRow = null;

      // Check product order trước
      let rs = await client.query(
        `SELECT ps.*, po.totalamount, po.userid AS owner_user_id,
              'product' AS type
       FROM paymentsessions ps
       JOIN productorders po ON po.orderid = ps.orderid
       WHERE ps.id=$1 FOR UPDATE`,
        [sessionId]
      );

      if (rs.rows.length) {
        sessionRow = rs.rows[0];
        orderType = "product";
        orderId = sessionRow.orderid;
      } else {
        // Check ticket order
        rs = await client.query(
          `SELECT ps.*, t.totalamount, t.userid AS owner_user_id,
                'ticket' AS type
         FROM paymentsessions ps
         JOIN ticketorders t ON t.orderid = ps.orderid
         WHERE ps.id=$1 FOR UPDATE`,
          [sessionId]
        );

        if (!rs.rows.length) throw new Error("SESSION_NOT_FOUND");

        sessionRow = rs.rows[0];
        orderType = "ticket";
        orderId = sessionRow.orderid;
      }

      // Validate session
      if (sessionRow.provider !== "wallet") throw new Error("INVALID_PROVIDER");
      if (sessionRow.userid !== userId) throw new Error("FORBIDDEN");
      if (sessionRow.status !== "pending")
        throw new Error("SESSION_NOT_PENDING");

      // =====================================================
      //   ⭐ LẤY 2 VÍ + LOCK SỐ DƯ
      // =====================================================

      const uw = await client.query(
        `SELECT id FROM wallet_accounts WHERE userid=$1`,
        [userId]
      );
      if (!uw.rows.length) throw new Error("WALLET_NOT_FOUND");
      const userWalletId = uw.rows[0].id;

      const mw = await client.query(
        `SELECT id FROM wallet_accounts WHERE userid=$1`,
        [MERCHANT_USER_ID]
      );
      if (!mw.rows.length) throw new Error("MERCHANT_WALLET_NOT_FOUND");
      const merchantWalletId = mw.rows[0].id;

      const [a, b] =
        userWalletId < merchantWalletId
          ? [userWalletId, merchantWalletId]
          : [merchantWalletId, userWalletId];

      const q1 = await client.query(
        `SELECT * FROM wallet_balances WHERE walletid=$1 FOR UPDATE`,
        [a]
      );
      const q2 = await client.query(
        `SELECT * FROM wallet_balances WHERE walletid=$1 FOR UPDATE`,
        [b]
      );

      const uBal = userWalletId === a ? q1.rows[0] : q2.rows[0];
      const mBal = merchantWalletId === b ? q2.rows[0] : q1.rows[0];
      if (!uBal || !mBal) throw new Error("BALANCE_NOT_FOUND");

      const amount = Number(sessionRow.totalamount);
      if (!Number.isFinite(amount) || amount <= 0)
        throw new Error("INVALID_AMOUNT");

      const totalFrozen =
        Number(uBal.bonus_frozen || 0) + Number(uBal.frozen || 0);
      if (totalFrozen < amount) throw new Error("FREEZE_NOT_ENOUGH");

      // Ưu tiên bonus_frozen
      const useBonusFrozen = Math.min(Number(uBal.bonus_frozen || 0), amount);
      const useFrozen = amount - useBonusFrozen;

      const newBonusFrozen = Number(uBal.bonus_frozen) - useBonusFrozen;
      const newFrozen = Number(uBal.frozen) - useFrozen;

      await client.query(
        `UPDATE wallet_balances
       SET bonus_frozen=$1, frozen=$2, updated_at=NOW()
       WHERE walletid=$3`,
        [newBonusFrozen, newFrozen, userWalletId]
      );

      const newMerchantAvail = Number(mBal.available) + amount;
      await client.query(
        `UPDATE wallet_balances SET available=$1, updated_at=NOW() WHERE walletid=$2`,
        [newMerchantAvail, merchantWalletId]
      );

      // Ledger
      const refId = `sess:${sessionId}`;
      await client.query(
        `INSERT INTO wallet_ledger(walletid, ref_type, ref_id, entry, amount, currency, balance_after, meta)
       VALUES
       ($1,'order',$2,'debit',$3,'VND',$4,$5),
       ($6,'order',$2,'credit',$3,'VND',$7,$8)`,
        [
          userWalletId,
          refId,
          amount,
          Number(uBal.available),
          { orderid: orderId, sessionId, split: { useBonusFrozen, useFrozen } },
          merchantWalletId,
          newMerchantAvail,
          { orderid: orderId, sessionId },
        ]
      );

      // Mark session paid
      await client.query(
        `UPDATE paymentsessions SET status='paid' WHERE id=$1`,
        [sessionId]
      );

      if (orderType === "product") {
        await client.query(
          `UPDATE productorders
         SET paymentstatus='paid',
             orderstatus = CASE WHEN orderstatus='pending' THEN 'processing' ELSE orderstatus END
         WHERE orderid=$1`,
          [orderId]
        );
      } else {
        await client.query(
          `UPDATE ticketorders SET paymentstatus='paid' WHERE orderid=$1`,
          [orderId]
        );
      }

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }

    // =====================================================
    //  ⭐ HẬU THANH TOÁN (ngoài transaction)
    // =====================================================

    if (orderType === "product") {
      try {
        const memQ = await pool.query(
          `SELECT po.userid, p.is_membership
         FROM productorders po
         JOIN productorderdetails d ON d.orderid = po.orderid
         JOIN products p ON p.productid = d.productid
         WHERE po.orderid=$1 LIMIT 1`,
          [orderId]
        );

        if (memQ.rows.length && memQ.rows[0].is_membership === true) {
          const uid = memQ.rows[0].userid;

          await pool.query(
            `UPDATE users
           SET premium_start = NOW(),
               membershiptier = 'premium'
           WHERE userid=$1`,
            [uid]
          );
        }

        await membership.activateFromPaidOrder({ orderId });
      } catch {}
    }

    if (orderType === "ticket") {
      try {
        await generateTicketForOrder(orderId);
      } catch {}
    }

    return { ok: true, orderId };
  },
};
