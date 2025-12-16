// backend/src/services/ticket.js
const pool = require("../../config/db");
const { randomUUID } = require("crypto");

exports.generateTicketForOrder = async (orderId, client = pool) => {
  const items = await client.query(
    `SELECT od.detailid, od.ticketid, od.quantity
     FROM ticketorderdetails od
     JOIN ticketorders o ON o.orderid = od.orderid
     WHERE o.orderid=$1`,
    [orderId]
  );

  if (!items.rows.length) return;

  for (const it of items.rows) {
    const qrCode = `TCK-${orderId}-${it.ticketid}-${randomUUID().slice(0, 8)}`;
    await client.query(
      `UPDATE ticketorderdetails
       SET qrcode=$1
       WHERE detailid=$2`,
      [qrCode, it.detailid]
    );
  }
};
