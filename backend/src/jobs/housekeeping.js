// node src/jobs/housekeeping.js
require("dotenv").config({
  path: require("path").join(__dirname, "../../.env"),
});
const pool = require("../../config/db");

async function expirePaymentSessions() {
  // quá hạn → failed (hoặc expired, tuỳ bạn quyết)
  await pool.query(`
    UPDATE paymentsessions
       SET status='expired'
     WHERE status='pending' AND expire_at IS NOT NULL AND expire_at < NOW()
  `);
}

async function releaseExpiredFreezes() {
  // FREEZE có expire_at < now và chưa release → release
  const r = await pool.query(`
    SELECT id FROM wallet_freeze
     WHERE released_at IS NULL AND expire_at IS NOT NULL AND expire_at < NOW()
     ORDER BY id ASC
     LIMIT 500
  `);
  const wallet = require("../services/wallet");
  for (const row of r.rows) {
    try {
      await wallet.releaseFreeze({ freezeId: row.id, reason: "expired" });
    } catch (e) {
      /* log nếu cần */
    }
  }
}

async function main() {
  await expirePaymentSessions();
  await releaseExpiredFreezes();
  console.log("[housekeeping] done");
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
