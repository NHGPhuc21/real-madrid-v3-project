const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || "false") === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

async function sendMail({ to, subject, html }) {
  if (!to) return;
  return transporter.sendMail({
    from: process.env.MAIL_FROM || '"RM Store" <no-reply@rm.local>',
    to,
    subject,
    html,
  });
}

async function sendOrderEmailCreated(order, user) {
  const html = `
    <p>Xin chào ${user?.username || "bạn"},</p>
    <p>Đơn hàng <b>#${order.orderid}</b> của bạn đã được tạo.</p>
    <p>Trạng thái: <b>${order.orderstatus}</b> · Thanh toán: <b>${
    order.paymentstatus
  }</b></p>
    <p>Tổng tiền: <b>${order.totalamount}</b></p>`;
  await sendMail({
    to: user?.email,
    subject: `Đơn #${order.orderid} đã tạo`,
    html,
  });
}

async function sendOrderEmailPaid(order, user) {
  // Tùy ý: gửi mail khi thanh toán thành công
  return Promise.resolve();
}

async function sendOrderEmailCancelled(order, user) {
  const html = `
    <p>Xin chào ${user?.username || "bạn"},</p>
    <p>Đơn hàng <b>#${order.orderid}</b> đã được <b>hủy</b>.</p>
    <p>Trạng thái hiện tại: <b>${order.orderstatus}</b></p>`;
  await sendMail({
    to: user?.email,
    subject: `Đơn #${order.orderid} đã hủy`,
    html,
  });
}

module.exports = {
  sendMail,
  sendOrderEmailCreated,
  sendOrderEmailPaid,
  sendOrderEmailCancelled,
};
