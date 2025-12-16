// backend/src/services/payments.js
const pool = require("../../config/db");

/**
 * Đánh dấu session quá hạn -> expired + release freeze nếu có.
 * Trả về số lượng session được cập nhật.
 */
async function expirePendingSessionsAndRelease() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lấy các session pending đã hết hạn
    const rs = await client.query(
      `SELECT id, freeze_id FROM paymentsessions
       WHERE status='pending' AND expire_at <= NOW()
       FOR UPDATE`
    );

    let count = 0;
    for (const row of rs.rows) {
      // mark expired
      await client.query(
        `UPDATE paymentsessions SET status='expired' WHERE id=$1`,
        [row.id]
      );

      // nếu có freeze -> giải phóng (trả tiền về available/bonus)
      if (row.freeze_id) {
        // gọi trực tiếp SQL để release (đúng như wallet.releaseFreeze)
        const fr = await client.query(
          `SELECT * FROM wallet_freeze WHERE id=$1 FOR UPDATE`,
          [row.freeze_id]
        );
        if (fr.rows.length && !fr.rows[0].released_at) {
          const f = fr.rows[0];
          const bq = await client.query(
            `SELECT * FROM wallet_balances WHERE walletid=$1 FOR UPDATE`,
            [f.walletid]
          );
          if (bq.rows.length) {
            const bal = bq.rows[0];
            const amount = Number(f.amount);
            const bonusFrozen = Number(bal.bonus_frozen || 0);
            const giveBackToBonus = Math.min(bonusFrozen, amount);
            const giveBackToAvail = amount - giveBackToBonus;

            const newBonus = Number(bal.bonus || 0) + giveBackToBonus;
            const newBonusFrozen = bonusFrozen - giveBackToBonus;
            const newAvail = Number(bal.available || 0) + giveBackToAvail;
            const newFrozen = Number(bal.frozen || 0) - giveBackToAvail;

            await client.query(
              `UPDATE wallet_balances
                 SET available=$1, frozen=$2, bonus=$3, bonus_frozen=$4, updated_at=NOW()
               WHERE walletid=$5`,
              [newAvail, newFrozen, newBonus, newBonusFrozen, f.walletid]
            );
            await client.query(
              `UPDATE wallet_freeze SET released_at=NOW(), reason='expired' WHERE id=$1`,
              [row.freeze_id]
            );
          }
        }
      }
      count++;
    }

    await client.query("COMMIT");
    return { expired: count };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

module.exports = {
  expirePendingSessionsAndRelease,
};
