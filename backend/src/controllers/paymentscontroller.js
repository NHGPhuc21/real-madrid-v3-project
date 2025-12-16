// backend/src/controllers/paymentscontroller.js
const membership = require("../services/membership"); // ✅ NEW
const pool = require("../../config/db");
const wallet = require("../services/wallet"); // <--- THÊM DÒNG NÀY

async function getActiveCashbackRule() {
  const r = await pool.query(
    `SELECT * FROM cashback_rules WHERE active=true ORDER BY id DESC LIMIT 1`
  );
  return r.rows[0] || null;
}

async function applyCashbackIfAny(client, { userId, orderId, totalAmount }) {
  const rule = await getActiveCashbackRule();
  if (!rule) return;

  const percent = Number(rule.percent || 0);
  if (percent <= 0) return;

  let bonus = (percent / 100) * Number(totalAmount);
  const cap = rule.max_amount != null ? Number(rule.max_amount) : null;
  if (cap != null && bonus > cap) bonus = cap;

  if (bonus > 0) {
    await wallet.addBonus({
      userId,
      amount: bonus,
      reason: "cashback_order_paid",
      meta: {
        orderId,
        ruleId: rule.id,
        percent: rule.percent,
        cap: rule.max_amount,
      },
    });
  }
}

// helper: đánh dấu đơn đã “paid”
async function markOrderPaid(orderId, client = pool) {
  const r = await client.query(
    `UPDATE productorders
       SET paymentstatus='paid',
           orderstatus = CASE WHEN orderstatus='pending' THEN 'processing' ELSE orderstatus END
     WHERE orderid=$1 AND paymentstatus<>'paid'
     RETURNING orderid, userid, paymentstatus, orderstatus`,
    [orderId]
  );
  return r.rows[0] || null;
}

async function createSession(req, res) {
  try {
    const userId = req.user.userId;
    const { orderId, provider = "qr" } = req.body || {};
    if (!orderId) return res.status(400).json({ message: "Missing orderId" });

    // chỉ cho chủ đơn
    const ord = await pool.query(
      `SELECT orderid, userid, paymentstatus, totalamount 
       FROM productorders WHERE orderid=$1`,
      [orderId]
    );
    if (!ord.rows.length)
      return res.status(404).json({ message: "Order not found" });
    const order = ord.rows[0];
    if (order.userid !== userId)
      return res.status(403).json({ message: "Forbidden" });
    if (order.paymentstatus === "paid")
      return res.status(400).json({ message: "Already paid" });

    // ===== Case 1: provider = wallet =====
    if (provider === "wallet") {
      const ins = await pool.query(
        `INSERT INTO paymentsessions(orderid, provider, status, qr_url, expire_at, userid)
         VALUES($1,'wallet','pending',NULL,(CURRENT_TIMESTAMP + INTERVAL '10 minutes'), $2)
         RETURNING *`,
        [orderId, userId]
      );
      const session = ins.rows[0];

      try {
        const { freezeId } = await wallet.freezeAmount({
          userId,
          orderId,
          amount: order.totalamount,
          reason: "checkout_wallet",
          expireAt: session.expire_at,
        });

        await pool.query(
          `UPDATE paymentsessions SET freeze_id=$1 WHERE id=$2`,
          [freezeId, session.id]
        );

        return res.status(201).json({
          id: session.id,
          orderid: session.orderid,
          provider: "wallet",
          status: session.status,
          qr_url: null,
          expire_at: session.expire_at,
        });
      } catch (e) {
        console.error(
          "[wallet.freezeAmount] order",
          orderId,
          "user",
          userId,
          "err:",
          e?.message
        );
        await pool.query(`DELETE FROM paymentsessions WHERE id=$1`, [
          session.id,
        ]);
        const msg =
          e?.message === "INSUFFICIENT_FUNDS"
            ? "Số dư ví không đủ"
            : e?.message || "Không thể freeze số dư";
        return res.status(400).json({ message: msg });
      }
    }

    // ===== Case 2: provider khác (qr/vnpay/stripe) =====
    const mapQR = {
      qr: "/uploads/mockqr/qr_generic.png",
      vnpay: "/uploads/mockqr/qr_vnpay.png",
      stripe: "/uploads/mockqr/qr_stripe.png",
    };
    const qrUrl = mapQR[provider] || mapQR.qr;

    const ins = await pool.query(
      `INSERT INTO paymentsessions(orderid, provider, qr_url, userid)
       VALUES($1,$2,$3,$4)
       RETURNING *`,
      [orderId, provider, qrUrl, userId]
    );
    return res.status(201).json(ins.rows[0]);
  } catch (e) {
    console.error("createSession error:", e);
    res.status(500).json({ message: "Server error" });
  }
}

async function getSession(req, res) {
  try {
    const userId = req.user.userId;
    const id = Number(req.params.id);
    const r = await pool.query(
      `SELECT ps.*, po.userid AS owner_userid
         FROM paymentsessions ps
         JOIN productorders po ON po.orderid = ps.orderid
        WHERE ps.id=$1`,
      [id]
    );
    if (!r.rows.length) return res.status(404).json({ message: "Not found" });
    const s = r.rows[0];
    if (s.owner_userid !== userId)
      return res.status(403).json({ message: "Forbidden" });
    res.json({
      id: s.id,
      orderid: s.orderid,
      provider: s.provider,
      status: s.status,
      qr_url: s.qr_url,
      expire_at: s.expire_at,
    });
  } catch (e) {
    console.error("getSession error:", e);
    res.status(500).json({ message: "Server error" });
  }
}

/** Mock “callback” từ cổng thanh toán: FE sẽ gọi để đóng tiền */
async function mockCallback(req, res) {
  const client = await pool.connect();
  try {
    const { sessionId, success = true } = req.body || {};
    await client.query("BEGIN");

    const rs = await client.query(
      `SELECT * FROM paymentsessions WHERE id=$1 FOR UPDATE`,
      [sessionId]
    );
    if (!rs.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Session not found" });
    }
    const s = rs.rows[0];
    if (s.status !== "pending") {
      await client.query("ROLLBACK");
      return res.json(s); // đã xử lý rồi
    }

    let newStatus = success ? "paid" : "failed";
    await client.query(`UPDATE paymentsessions SET status=$1 WHERE id=$2`, [
      newStatus,
      sessionId,
    ]);

    if (success) {
      const paid = await markOrderPaid(s.orderid, client);
      if (paid) {
        // ✅ NEW: nếu đơn có sản phẩm hội viên -> kích hoạt membership
        try {
          await membership.activateFromPaidOrder(
            { orderId: paid.orderid },
            client
          );
          /* ======================================================
   ⭐ FIX MEMBERSHIP: Update users.membershiptier
   ====================================================== */
          try {
            const check = await client.query(
              `SELECT p.productid
FROM productorderdetails d
JOIN products p ON p.productid = d.productid
WHERE d.orderid = $1
  AND p.is_membership = true
`,
              [paid.orderid]
            );

            if (check.rows.length > 0) {
              console.log(
                "[Membership] Upgrading user to PREMIUM:",
                paid.userid
              );

              await client.query(
                `UPDATE users
         SET membershiptier='premium',
             update_at = NOW()
       WHERE userid=$1`,
                [paid.userid]
              );
            }
          } catch (err) {
            console.error("[Membership upgrade error]", err);
          }

          // ✅ Nếu đơn có vé, sinh QR code
          try {
            const { generateTicketForOrder } = require("../services/ticket");
            await generateTicketForOrder(paid.orderid, client);
          } catch (e) {
            console.warn("generateTicketForOrder warn:", e.message);
          }
        } catch (e) {
          console.warn("activateFromPaidOrder warn:", e?.message);
        }

        await client.query(
          `INSERT INTO notifications(userid, title, message)
           VALUES($1,$2,$3)`,
          [
            paid.userid,
            "Thanh toán thành công",
            `Đơn #${paid.orderid} đã được thanh toán.`,
          ]
        );

        const ord = await pool.query(
          `SELECT totalamount FROM productorders WHERE orderid=$1`,
          [paid.orderid]
        );
        await applyCashbackIfAny(client, {
          userId: paid.userid,
          orderId: paid.orderid,
          totalAmount: ord.rows[0]?.totalamount || 0,
        });
        // ====================================================
        //  WALLET: nếu thanh toán bằng ví → consume freeze
        // ====================================================
        // ====================================================
        // WALLET FIXED: xử lý freeze đúng logic
        // ====================================================
        if (s.provider === "wallet" && s.freeze_id) {
          const fr = await client.query(
            `SELECT walletid, amount FROM wallet_freeze WHERE id=$1`,
            [s.freeze_id]
          );

          if (fr.rows.length) {
            const { walletid, amount } = fr.rows[0];

            if (success) {
              // SUCCESS → tiêu tiền thật
              await client.query(
                `UPDATE wallet_balances
           SET frozen = frozen - $2,
               updated_at = NOW()
         WHERE walletid = $1`,
                [walletid, amount]
              );

              await client.query(
                `UPDATE wallet_freeze
           SET consumed_at = NOW()
         WHERE id = $1`,
                [s.freeze_id]
              );
            } else {
              // FAIL → hoàn tiền về ví
              await client.query(
                `UPDATE wallet_balances
           SET available = available + $2,
               frozen = frozen - $2,
               updated_at = NOW()
         WHERE walletid = $1`,
                [walletid, amount]
              );

              await client.query(
                `UPDATE wallet_freeze
           SET released_at = NOW()
         WHERE id = $1`,
                [s.freeze_id]
              );
            }
          }
        }
      }
    }

    await client.query("COMMIT");
    const ret = await pool.query(`SELECT * FROM paymentsessions WHERE id=$1`, [
      sessionId,
    ]);
    res.json(ret.rows[0]);
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("mockCallback error:", e);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
}

async function webhook(req, res) {
  try {
    const secret = req.headers["x-webhook-secret"];
    if (
      String(secret || "") !== String(process.env.PAYMENT_WEBHOOK_SECRET || "")
    ) {
      return res.status(401).send("unauthorized");
    }

    let payload;
    if (Buffer.isBuffer(req.body)) {
      try {
        payload = JSON.parse(req.body.toString("utf8"));
      } catch {
        payload = null;
      }
    } else if (typeof req.body === "string") {
      payload = JSON.parse(req.body);
    } else {
      payload = req.body;
    }

    if (payload?.type === "topup.succeeded") {
      const d = payload.data || {};
      const tq = await pool.query(
        `SELECT userid FROM wallet_topups WHERE id=$1`,
        [Number(d.topupId)]
      );
      if (!tq.rows.length) return res.status(404).send("topup not found");
      const userId = tq.rows[0].userid;
      await wallet.topupApplyWebhook({
        userId,
        topupId: Number(d.topupId),
        provider: String(d.provider || "mock"),
        providerTxnId: String(d.providerTxnId || ""),
        amount: Number(d.amount),
      });
      return res.status(200).send("ok");
    }

    return res.status(200).send("ignored");
  } catch (e) {
    console.error("webhook error:", e);
    return res.status(400).send("bad request");
  }
}

module.exports = { createSession, getSession, mockCallback, webhook };
