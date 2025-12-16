// backend/scripts/reconcile.cron.js

//load biến môi trường
require("dotenv").config();

//import business logic liên quan đến thanh toán
const payments = require("../src/services/payments");


// tạo một hàm async tự chạy, gọi logic 
// reconcile để xử lý các phiên thanh toán hết 
// hạn, ghi log kết quả và kết thúc tiến trình 
// với mã trạng thái để hệ thống cron biết job 
// thành công hay thất bại.
(async () => {
  try {
    const r = await payments.expirePendingSessionsAndRelease();
    console.log("[reconcile] expired sessions:", r.expired);
    process.exit(0);
  } catch (e) {
    console.error("[reconcile] error:", e);
    process.exit(1);
  }
})();
