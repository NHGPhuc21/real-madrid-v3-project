--database.sql
-- Xoá database cũ nếu có
DROP DATABASE IF EXISTS "FOOTBALLCLUBDB";

-- Tạo database mới
CREATE DATABASE "FOOTBALLCLUBDB"
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TEMPLATE template0;



-- Bảng Users
CREATE TABLE Users (
    UserID SERIAL PRIMARY KEY,
    Username VARCHAR(50) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Phonenumber VARCHAR(20),
    Address VARCHAR(255),
    Userrole VARCHAR(10) CHECK (Userrole IN ('admin', 'user')) DEFAULT 'user',
    Create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    Update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng ProductCategories
CREATE TABLE ProductCategories (
    CategoryID SERIAL PRIMARY KEY,
    CategoryName VARCHAR(100) NOT NULL,
    Description TEXT,
    Create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Products
CREATE TABLE Products (
    ProductID SERIAL PRIMARY KEY,
    ProductName VARCHAR(255) NOT NULL,
    Description TEXT,
    Price NUMERIC(10,2) NOT NULL,
    DiscountPrice NUMERIC(10,2) DEFAULT 0.00,
    Stock INT DEFAULT 0,
    IsVisible BOOLEAN DEFAULT TRUE,
    ImageURL VARCHAR(255),
    CategoryID INT,
    FOREIGN KEY (CategoryID) REFERENCES ProductCategories(CategoryID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Bảng ProductOptions
CREATE TABLE ProductOptions (
    OptionID SERIAL PRIMARY KEY,
    ProductID INT NOT NULL,
    OptionName VARCHAR(100),
    AdditionalPrice NUMERIC(10,2) DEFAULT 0.00,
    Stock INT DEFAULT 0,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
        ON DELETE CASCADE
);

-- Bảng News
CREATE TABLE News (
    NewID SERIAL PRIMARY KEY,
    Title VARCHAR(200) NOT NULL,
    Content TEXT,
    ImageURL VARCHAR(255),
    AuthorID INT,
    Ispublished BOOLEAN DEFAULT TRUE,
    PublishDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (AuthorID) REFERENCES Users(UserID) ON DELETE SET NULL
);

-- Bảng Matches
CREATE TABLE Matches (
    MatchID SERIAL PRIMARY KEY,
    OpponentTeam VARCHAR(100) NOT NULL,
    OpponentTeamLogoURL VARCHAR(255),
    MatchDateTime TIMESTAMP NOT NULL,
    Stadium VARCHAR(100),
    Competition VARCHAR(100),
    IsHomeMatch BOOLEAN DEFAULT TRUE,
	HomeScore INT DEFAULT 0,
    AwayScore INT DEFAULT 0,

    Result VARCHAR(20),
    Description TEXT,
    Create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng TicketCategories
CREATE TABLE TicketCategories (
    CategoryID SERIAL PRIMARY KEY,
    CategoryName VARCHAR(100) NOT NULL,
    Description TEXT,
    Price NUMERIC(10,2) NOT NULL,
    Create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Tickets
CREATE TABLE Tickets (
    TicketID SERIAL PRIMARY KEY,
    MatchID INT NOT NULL,
    CategoryID INT NOT NULL,
    TotalQuantity INT NOT NULL,
    AvailableQuantity INT NOT NULL,
    SaleStartDate TIMESTAMP,
    SaleEndDate TIMESTAMP,
    Create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MatchID) REFERENCES Matches(MatchID),
    FOREIGN KEY (CategoryID) REFERENCES TicketCategories(CategoryID)
);

-- Bảng TicketOrders
CREATE TABLE TicketOrders (
    OrderID SERIAL PRIMARY KEY,
    UserID INT NOT NULL,
    OrderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    TotalAmount NUMERIC(10,2) NOT NULL,
    OrderStatus VARCHAR(20) CHECK (OrderStatus IN ('pending','confirmed','cancelled')) DEFAULT 'pending',
    PaymentMethod VARCHAR(50),
    PaymentStatus VARCHAR(20) CHECK (PaymentStatus IN ('unpaid','paid','refunded')) DEFAULT 'unpaid',
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- Bảng TicketOrderDetails
CREATE TABLE TicketOrderDetails (
    DetailID SERIAL PRIMARY KEY,
    OrderID INT NOT NULL,
    TicketID INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice NUMERIC(10,2) NOT NULL,
    Subtotal NUMERIC(10,2) NOT NULL,
    QRCodeURL VARCHAR(255),
    FOREIGN KEY (OrderID) REFERENCES TicketOrders(OrderID),
    FOREIGN KEY (TicketID) REFERENCES Tickets(TicketID)
);

-- Bảng ProductOrders
CREATE TABLE ProductOrders (
    OrderID SERIAL PRIMARY KEY,
    UserID INT NOT NULL,
    OrderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    TotalAmount NUMERIC(10, 2) NOT NULL,
    ShippingAddress VARCHAR(255),
    ShippingFee NUMERIC(10,2) DEFAULT 0,
    OrderStatus VARCHAR(20) CHECK (OrderStatus IN ('pending','processing','shipped','delivered','cancelled')) DEFAULT 'pending',
    PaymentMethod VARCHAR(50),
    PaymentStatus VARCHAR(20) CHECK (PaymentStatus IN ('unpaid','paid','refunded')) DEFAULT 'unpaid',
    Notes TEXT,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- Bảng ProductOrderDetails
CREATE TABLE ProductOrderDetails (
    DetailID SERIAL PRIMARY KEY,
    OrderID INT NOT NULL,
    ProductID INT NOT NULL,
    OptionID INT,
    Quantity INT NOT NULL,
    UnitPrice NUMERIC(10,2) NOT NULL,
    Subtotal NUMERIC(10,2) NOT NULL,
    FOREIGN KEY (OrderID) REFERENCES ProductOrders(OrderID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    FOREIGN KEY (OptionID) REFERENCES ProductOptions(OptionID)
);

-- Bảng ShoppingCart
CREATE TABLE ShoppingCart (
    CartID SERIAL PRIMARY KEY,
    UserID INT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- Trigger: tạo giỏ hàng khi user đăng ký
CREATE OR REPLACE FUNCTION CreateCartAfterUserInsert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.Userrole = 'user' THEN
        INSERT INTO ShoppingCart(UserID) VALUES (NEW.UserID);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_CreateCartAfterUserInsert
AFTER INSERT ON Users
FOR EACH ROW
EXECUTE FUNCTION CreateCartAfterUserInsert();

-- Trigger: cập nhật vé sau khi order detail
CREATE OR REPLACE FUNCTION UpdateTicketQuantityAfterOrderDetail()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE Tickets 
    SET AvailableQuantity = AvailableQuantity - NEW.Quantity
    WHERE TicketID = NEW.TicketID;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_UpdateTicketQuantityAfterOrderDetail
AFTER INSERT ON TicketOrderDetails
FOR EACH ROW
EXECUTE FUNCTION UpdateTicketQuantityAfterOrderDetail();

-- Trigger: cập nhật stock sản phẩm sau khi có order detail
CREATE OR REPLACE FUNCTION UpdateProductStockAfterOrderDetail()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.OptionID IS NOT NULL THEN
        UPDATE ProductOptions
        SET Stock = Stock - NEW.Quantity
        WHERE OptionID = NEW.OptionID;
    ELSE
        UPDATE Products
        SET Stock = Stock - NEW.Quantity
        WHERE ProductID = NEW.ProductID;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_UpdateProductStockAfterOrderDetail
AFTER INSERT ON ProductOrderDetails
FOR EACH ROW
EXECUTE FUNCTION UpdateProductStockAfterOrderDetail();


-- 2025_10_add_highlight_videos.sql
-- Tạo bảng lưu video highlight + chỉ mục

-- Bảng HighlightVideos
-- Status: draft / published / archived
CREATE TABLE IF NOT EXISTS HighlightVideos (
  VideoID        SERIAL PRIMARY KEY,
  MatchID        INT,
  Title          VARCHAR(200) NOT NULL,
  Description    TEXT,
  Status         VARCHAR(20) NOT NULL CHECK (Status IN ('draft','published','archived')) DEFAULT 'draft',
  ThumbURL       VARCHAR(255),           -- ảnh poster/thumbnail
  SourceMP4      VARCHAR(255),           -- đường dẫn file mp4 gốc (sau upload)
  HlsPath        VARCHAR(255),           -- thư mục chứa m3u8/ts sau khi transcode
  DurationSec    INT DEFAULT 0,          -- thời lượng (giây) nếu biết
  Views          INT DEFAULT 0,
  CreatedAt      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PublishedAt    TIMESTAMP,

  CONSTRAINT fk_highlight_match
    FOREIGN KEY (MatchID) REFERENCES Matches(MatchID)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

-- Chỉ mục giúp list/paging theo trạng thái + thời gian
CREATE INDEX IF NOT EXISTS idx_highlight_status_created
  ON HighlightVideos (Status, CreatedAt DESC);

-- (Tuỳ chọn) seed vài mẫu để test FE/Admin ngay:
-- INSERT INTO HighlightVideos (Title, Description, Status, ThumbURL, SourceMP4, HlsPath, DurationSec)
-- VALUES
-- ('RM vs ATL - Highlights', 'Góc nhìn nhanh 10 phút', 'draft', '/uploads/videos/posters/rm_atl.jpg', NULL, NULL, 600),
-- ('RM Training Reel', 'Khoảnh khắc tập luyện', 'published', '/uploads/videos/posters/training.jpg', NULL, '/uploads/hls/training_001', 120);

-- Sample admin user (password should be hashed in real app; here put placeholder)
INSERT INTO users (username, email, password, userrole) VALUES

('john', 'john@example.com', 'johnpassword', 'user');

INSERT INTO users (username, email, password, userrole) VALUES
('admin', 'admin@example.com', 'adminpassword', 'admin');
-- Ticket categories
INSERT INTO ticketcategories (categoryname, description, price) VALUES
('Normal', 'Vé thường', 50.00),
('Medium', 'Vé trung cấp',100.00),
('High-Class', 'Vé VIP',200.00);
-- Product categories
INSERT INTO productcategories (categoryname, description) VALUES
('Sport Shoes','Shoes'),('Jersey','Official jersey'),('Gloves','Goalkeeper gloves');

-- Matches
INSERT INTO matches (opponentteam, matchdatetime, stadium, competition, ishomematch) VALUES
('Liverpool','2025-05-10 20:00:00+01','Santiago Bernabéu','Champions League', true),
('Manchester City','2025-05-18 21:00:00+01','Etihad','Premier League', false);
-- Tickets (for matches)
INSERT INTO tickets (matchid, categoryid, totalquantity, availablequantity, salestartdate, saleenddate) VALUES
(1,1,5000,5000,'2025-03-01 00:00:00+01','2025-05-09 23:59:59+01'),
(1,2,2000,2000,'2025-03-01 00:00:00+01','2025-05-09 23:59:59+01'),
(2,1,6000,6000,'2025-03-01 00:00:00+01','2025-05-17 23:59:59+01');
-- Products
INSERT INTO products (productname, description, price, stock, imageurl, categoryid) VALUES
('Home Jersey 2025','Official home jersey',89.99,150,'home_jersey_2025',2),
('Training Shoes','Training shoes',120.00,80,'train_shoes',1);
-- News
INSERT INTO news (title, content, ispublished) VALUES
('Pre-match notes','Team training and analysis...', true),
('Transfer news','Club signs new promising player', true);

UPDATE users
SET userrole = 'admin'
WHERE email = 'admin@gmail.com';

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS homescore INTEGER NOT NULL DEFAULT 0;

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS awayscore INTEGER NOT NULL DEFAULT 0;

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'upcoming'
  CHECK (status IN ('upcoming','live','finished'));

--làm chức năng datematch có thể trống
ALTER TABLE Matches ALTER COLUMN MatchDateTime DROP NOT NULL;
WHERE (matchdatetime IS NULL OR matchdatetime >= NOW())
ORDER BY matchdatetime ASC NULLS LAST

select * from News
-- 2025_10_add_news_topic.sql
ALTER TABLE News
  ADD COLUMN IF NOT EXISTS Topic VARCHAR(50) NOT NULL DEFAULT 'general';

-- Tối ưu lọc theo topic
CREATE INDEX IF NOT EXISTS idx_news_topic ON News (LOWER(Topic));

-- 2025_10_payments_mock.sql
CREATE TABLE IF NOT EXISTS PaymentSessions (
  id           SERIAL PRIMARY KEY,
  orderid      INT NOT NULL REFERENCES ProductOrders(OrderID) ON DELETE CASCADE,
  provider     VARCHAR(20) NOT NULL,                -- 'qr' | 'vnpay' | 'stripe'
  status       VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'paid' | 'expired' | 'failed'
  qr_url       TEXT,                                 -- đường dẫn ảnh QR giả lập
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expire_at    TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes')
);

ALTER TABLE PaymentSessions
  ADD COLUMN IF NOT EXISTS freeze_id BIGINT; -- tham chiếu tới wallet_freeze.id
CREATE INDEX IF NOT EXISTS idx_payment_sessions_order ON PaymentSessions(orderid);


--chuc nang thanh toan
-- =========================
-- P0 Wallet schema (DDL)
-- =========================

-- Tài khoản ví
CREATE TABLE IF NOT EXISTS wallet_accounts (
  id          SERIAL PRIMARY KEY,
  userid      INT NOT NULL REFERENCES Users(UserID) ON DELETE CASCADE,
  status      VARCHAR(20) NOT NULL DEFAULT 'active', -- active|locked|closed
  level       VARCHAR(20) NOT NULL DEFAULT 'basic',
  pin_hash    TEXT,                                  -- sẽ mã hoá ở P1
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_accounts_userid ON wallet_accounts(userid);

-- Số dư (tách bảng cho đơn giản hoá lock)
CREATE TABLE IF NOT EXISTS wallet_balances (
  walletid    INT PRIMARY KEY REFERENCES wallet_accounts(id) ON DELETE CASCADE,
  available   NUMERIC(14,2) NOT NULL DEFAULT 0,
  frozen      NUMERIC(14,2) NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sổ cái 2 bút (double-entry)
CREATE TABLE IF NOT EXISTS wallet_ledger (
  id             BIGSERIAL PRIMARY KEY,
  walletid       INT NOT NULL REFERENCES wallet_accounts(id) ON DELETE CASCADE,
  ref_type       VARCHAR(50) NOT NULL,               -- e.g. 'order','topup','refund'
  ref_id         VARCHAR(64) NOT NULL,
  entry          VARCHAR(10) NOT NULL CHECK (entry IN ('debit','credit')),
  amount         NUMERIC(14,2) NOT NULL,
  currency       VARCHAR(8) NOT NULL DEFAULT 'VND',
  balance_after  NUMERIC(14,2) NOT NULL,
  meta           JSONB,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_wallet_created ON wallet_ledger(walletid, created_at);

-- Chuyển nội bộ (QA/test)
CREATE TABLE IF NOT EXISTS wallet_transfers (
  id            BIGSERIAL PRIMARY KEY,
  from_wallet   INT REFERENCES wallet_accounts(id) ON DELETE SET NULL,
  to_wallet     INT REFERENCES wallet_accounts(id) ON DELETE SET NULL,
  amount        NUMERIC(14,2) NOT NULL,
  status        VARCHAR(10) NOT NULL DEFAULT 'pending', -- pending|success|failed
  reason        TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at  TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_wallet_transfers_status ON wallet_transfers(status);

-- Giữ tiền khi checkout
CREATE TABLE IF NOT EXISTS wallet_freeze (
  id          BIGSERIAL PRIMARY KEY,
  walletid    INT NOT NULL REFERENCES wallet_accounts(id) ON DELETE CASCADE,
  amount      NUMERIC(14,2) NOT NULL,
  reason      TEXT,
  orderid     INT,
  expire_at   TIMESTAMP,
  released_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_wallet_freeze_wallet ON wallet_freeze(walletid);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  userid      INT,
  actor       VARCHAR(50) NOT NULL,     -- 'user' | 'admin' | 'system'
  action      VARCHAR(50) NOT NULL,     -- e.g. 'wallet.create','wallet.set_pin'
  data        JSONB,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Idempotency keys (chống double-submit)
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key         VARCHAR(128) PRIMARY KEY,
  scope       VARCHAR(64) NOT NULL,     -- e.g. 'wallet.charge'
  userid      INT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


--new
-- =========================
-- P3: Funding sources
-- =========================

-- Tài khoản “clearing” dùng đối ứng kế toán
-- (topup_clear và payout_clear là ví kỹ thuật, không cho user thường dùng)
CREATE TABLE IF NOT EXISTS wallet_clearing_accounts (
  key        VARCHAR(32) PRIMARY KEY, -- 'topup_clear' | 'payout_clear'
  userid     INT NOT NULL REFERENCES Users(UserID) ON DELETE CASCADE
);

-- Lưu giao dịch top-up đi qua cổng (VNPay/MoMo/Stripe...)
CREATE TABLE IF NOT EXISTS wallet_topups (
  id              BIGSERIAL PRIMARY KEY,
  userid          INT NOT NULL REFERENCES Users(UserID) ON DELETE CASCADE,
  provider        VARCHAR(20) NOT NULL,                -- 'mock' | 'vnpay' | 'momo' | 'stripe'
  amount          NUMERIC(14,2) NOT NULL,
  currency       VARCHAR(8) NOT NULL DEFAULT 'VND',
  status          VARCHAR(20) NOT NULL DEFAULT 'initiated', -- initiated|success|failed
  provider_txn_id VARCHAR(128),                         -- id giao dịch do provider trả
  idempotency_key VARCHAR(128),
  meta            JSONB,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at    TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_topups_idemp ON wallet_topups(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_topups_ptxn ON wallet_topups(provider, provider_txn_id) WHERE provider_txn_id IS NOT NULL;

-- Yêu cầu rút tiền
CREATE TABLE IF NOT EXISTS wallet_withdrawals (
  id              BIGSERIAL PRIMARY KEY,
  userid          INT NOT NULL REFERENCES Users(UserID) ON DELETE CASCADE,
  amount          NUMERIC(14,2) NOT NULL,
  currency        VARCHAR(8) NOT NULL DEFAULT 'VND',
  status          VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending|approved|processing|success|failed|rejected
  fee             NUMERIC(14,2) NOT NULL DEFAULT 0,
  dest_info       JSONB,                                  -- thông tin tài khoản nhận
  idempotency_key VARCHAR(128),
  admin_note      TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_withdraw_idemp ON wallet_withdrawals(idempotency_key) WHERE idempotency_key IS NOT NULL;





SELECT * FROM wallet_balances;
-- P4: thêm số dư thưởng + frozen thưởng (để không phá logic freeze P2)
ALTER TABLE wallet_balances
  ADD COLUMN IF NOT EXISTS bonus NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_frozen NUMERIC(14,2) NOT NULL DEFAULT 0;

-- Rule hoàn tiền
CREATE TABLE IF NOT EXISTS cashback_rules (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  percent     NUMERIC(5,2) NOT NULL,   -- vd 5.00 (%)
  max_amount  NUMERIC(14,2),           -- vd 50000
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 2025_11_refunds.sql

-- Lưu refund ở mức Order (đơn hàng sản phẩm)
CREATE TABLE IF NOT EXISTS product_order_refunds (
  id            BIGSERIAL PRIMARY KEY,
  orderid       INT NOT NULL REFERENCES ProductOrders(OrderID) ON DELETE CASCADE,
  amount        NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  reason        TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'succeeded', -- (đơn giản P6) succeeded|failed|pending
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by    INT,                                      -- admin userId
  meta          JSONB
);
CREATE INDEX IF NOT EXISTS idx_refunds_order ON product_order_refunds(orderid);

-- (Tùy chọn) Lưu “refund theo payment session” để audit sâu hơn
CREATE TABLE IF NOT EXISTS payment_refunds (
  id            BIGSERIAL PRIMARY KEY,
  session_id    INT REFERENCES PaymentSessions(id) ON DELETE SET NULL,
  orderid       INT NOT NULL REFERENCES ProductOrders(OrderID) ON DELETE CASCADE,
  amount        NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  provider      VARCHAR(20) NOT NULL DEFAULT 'wallet',
  status        VARCHAR(20) NOT NULL DEFAULT 'succeeded',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by    INT,
  meta          JSONB
);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_order ON payment_refunds(orderid);

-- Đánh chỉ mục thêm cho tra cứu ledger theo ref
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_ref ON wallet_ledger(ref_type, ref_id);

-- Bổ sung cột đánh dấu refund vào ProductOrders (đã có PaymentStatus='refunded' rồi)
ALTER TABLE ProductOrders
  ADD COLUMN IF NOT EXISTS RefundedAt TIMESTAMP,
  ADD COLUMN IF NOT EXISTS RefundAmount NUMERIC(14,2);

-- Cho phép PaymentSessions lưu userId (giúp reconcile/pin)
ALTER TABLE PaymentSessions
  ADD COLUMN IF NOT EXISTS userId INT REFERENCES Users(UserID);

-- Tự động “hết hạn” session quá hạn và giải phóng freeze (nếu có)
-- (Reconcile service sẽ chạy logic này; ở DB chỉ bổ sung cột cần thiết)
-- 1) Bổ sung cột userid (chữ thường) cho paymentsessions


select * from paymentsessions;
UPDATE paymentsessions ps
SET userid = po.userid
FROM productorders po
WHERE ps.orderid = po.orderid
  AND ps.userid IS NULL;

  --test chi nap vi
  --cho acc phuc co vi mua product
  -- 1) Gán clearing account cho topup: dùng luôn MERCHANT_USER_ID (trong .env là 1)
INSERT INTO wallet_clearing_accounts("key", userid)
VALUES ('topup_clear', 7)
ON CONFLICT ("key") DO UPDATE SET userid = EXCLUDED.userid;

-- 2) Đảm bảo user = 3 có ví
INSERT INTO wallet_accounts(userid, status, level)
SELECT 7, 'active', 'basic'
WHERE NOT EXISTS (SELECT 1 FROM wallet_accounts WHERE userid = 7);

-- 3) Đảm bảo có bản ghi số dư cho ví vừa tạo
INSERT INTO wallet_balances(walletid, available, frozen, bonus, bonus_frozen)
SELECT wa.id, 0, 0, 0, 0
FROM wallet_accounts wa
LEFT JOIN wallet_balances wb ON wb.walletid = wa.id
WHERE wa.userid = 1 AND wb.walletid IS NULL;
select * from Users
WHERE userid = 7;
ROLLBACK;
select * from users;
--thay vi dung devtool



--Cac lenh giup cho acc phuc co vi dien tu de thanh toan
BEGIN;

-- ========== 0) Đảm bảo MERCHANT_USER_ID=1 tồn tại ==========
INSERT INTO users(userid, username, email, password, userrole)
VALUES (1, 'merchant', 'merchant@local', 'dummy', 'admin')
ON CONFLICT (userid) DO NOTHING;

-- ========== 1) Đảm bảo merchant có ví ==========
INSERT INTO wallet_accounts(userid, status, level)
SELECT 1, 'active', 'basic'
WHERE NOT EXISTS (SELECT 1 FROM wallet_accounts WHERE userid = 1);

INSERT INTO wallet_balances(walletid, available, frozen, bonus, bonus_frozen)
SELECT wa.id, 0, 0, 0, 0
FROM wallet_accounts wa
LEFT JOIN wallet_balances wb ON wb.walletid = wa.id
WHERE wa.userid = 1 AND wb.walletid IS NULL;

-- ========== 2) Clearing accounts cho merchant ==========
INSERT INTO wallet_clearing_accounts("key", userid)
VALUES ('topup_clear', 1)
ON CONFLICT ("key") DO UPDATE SET userid = EXCLUDED.userid;

INSERT INTO wallet_clearing_accounts("key", userid)
VALUES ('payout_clear', 1)
ON CONFLICT ("key") DO UPDATE SET userid = EXCLUDED.userid;

-- ========== 3) Đảm bảo user PHUC (id=7) có ví ==========


-- Ví cho user 7
INSERT INTO wallet_accounts(userid, status, level)
SELECT 14, 'active', 'basic'
WHERE NOT EXISTS (SELECT 1 FROM wallet_accounts WHERE userid = 14);



-- Balances cho user 7
INSERT INTO wallet_balances(walletid, available, frozen, bonus, bonus_frozen)
SELECT wa.id, 0, 0, 0, 0
FROM wallet_accounts wa
LEFT JOIN wallet_balances wb ON wb.walletid = wa.id
WHERE wa.userid = 14 AND wb.walletid IS NULL;


-- ========== 4) Backfill userid cho paymentsessions ==========
UPDATE paymentsessions ps
SET userid = po.userid
FROM productorders po
WHERE ps.orderid = po.orderid
  AND ps.userid IS NULL;

COMMIT;
--test xem acc phuc co vi chua
SELECT wa.userid, wa.id AS walletid, wb.*
FROM wallet_accounts wa
JOIN wallet_balances wb ON wb.walletid = wa.id
WHERE wa.userid IN (3, 2);

--nap tien cho acc phuc
UPDATE wallet_balances wb
SET available = available + 1000000000   -- số tiền bạn muốn nạp 
FROM wallet_accounts wa
WHERE wb.walletid = wa.id
  AND wa.userid = 11;
  --reset tien trong acc phuc
UPDATE wallet_balances
SET available = 0, frozen = 0
WHERE walletid = 3;
--check xem acc phuc co bao nhieu tien
SELECT u.userid, u.username,
       wa.id AS walletid,
       wb.available,   -- số dư khả dụng
       wb.frozen,      -- số tiền đang bị khóa (đã freeze khi tạo đơn hàng)
       wb.bonus,       -- tiền thưởng (cashback)
       wb.bonus_frozen -- tiền thưởng bị khóa
FROM users u
JOIN wallet_accounts wa ON wa.userid = u.userid
JOIN wallet_balances wb ON wb.walletid = wa.id
WHERE u.userid = 7;







--check xem ma pin la bao nhieu(mat khau khi thanh toan dien tu)
SELECT wa.userid, wa.id AS walletid, wa.pin_hash, wa.status, wa.level
FROM wallet_accounts wa
WHERE wa.userid = 12;
--check wallet id là bao nhieu vi wallet_id khác với user_id
SELECT wa.userid, wa.id AS walletid
FROM wallet_accounts wa
WHERE wa.userid = 3;

--cài cục này mới có pin được
CREATE EXTENSION IF NOT EXISTS pgcrypto;

--update pin cho acc phuc
UPDATE wallet_accounts
SET pin_hash = crypt('2709', gen_salt('bf'))
WHERE userid = 14;



--Chức năng gói hội viên
-- ========== Membership core ==========
CREATE TABLE IF NOT EXISTS membership_plans (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(32) UNIQUE NOT NULL,  -- 'basic' | 'premium'
  name            VARCHAR(100) NOT NULL,
  price           NUMERIC(12,2) NOT NULL DEFAULT 0,     -- VND
  duration_months INT NOT NULL DEFAULT 12,              -- premium: 12 tháng
  perks           JSONB,                                -- mô tả quyền lợi
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_memberships (
  id            BIGSERIAL PRIMARY KEY,
  userid        INT NOT NULL REFERENCES Users(UserID) ON DELETE CASCADE,
  plan_code     VARCHAR(32) NOT NULL,                  -- basic/premium
  started_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    TIMESTAMP,                             -- basic có thể NULL
  status        VARCHAR(20) NOT NULL DEFAULT 'active', -- active/expired/cancelled
  source_orderid INT,                                  -- ProductOrders.OrderID nếu mua
  meta          JSONB,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- TABLE: Players
-- ==========================
CREATE TABLE IF NOT EXISTS Players (
  playerid SERIAL PRIMARY KEY,
  fullname VARCHAR(100) NOT NULL,
  age INT,
  position VARCHAR(50),
  nationality VARCHAR(80),
  height VARCHAR(20),
  weight VARCHAR(20),
  imageurl TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==========================
-- TABLE: PlayerCareer
-- ==========================
CREATE TABLE IF NOT EXISTS PlayerCareer (
  id SERIAL PRIMARY KEY,
  playerid INT NOT NULL REFERENCES Players(playerid) ON DELETE CASCADE,
  season VARCHAR(20),
  appearances INT,
  goals INT,
  assists INT
);
ALTER TABLE PlayerCareer
ADD COLUMN category VARCHAR(20) NOT NULL DEFAULT 'league';
SELECT * FROM PlayerCareer;
-- ==========================
-- TABLE: PlayerTransfers
-- ==========================
CREATE TABLE IF NOT EXISTS PlayerTransfers (
  id SERIAL PRIMARY KEY,
  playerid INT NOT NULL REFERENCES Players(playerid) ON DELETE CASCADE,
  year VARCHAR(10),
  fromclub VARCHAR(100),
  toclub VARCHAR(100)
);

-- ==========================
-- TABLE: PlayerInjuries
-- ==========================
CREATE TABLE IF NOT EXISTS PlayerInjuries (
  id SERIAL PRIMARY KEY,
  playerid INT NOT NULL REFERENCES Players(playerid) ON DELETE CASCADE,
  injury VARCHAR(200),
  startdate DATE,
  enddate DATE
);

CREATE INDEX IF NOT EXISTS idx_user_memberships_user ON user_memberships(userid, status);

-- Flag sản phẩm hội viên để nhận diện đơn "membership"
ALTER TABLE Products
  ADD COLUMN IF NOT EXISTS is_membership BOOLEAN NOT NULL DEFAULT FALSE;

-- Seed plans
INSERT INTO membership_plans(code, name, price, duration_months, perks, active)
VALUES
('basic','Basic Member',0, 0, '{"newsletter":true}', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO membership_plans(code, name, price, duration_months, perks, active)
VALUES
('premium','Premium Member (12m)', 1200000, 12, '{
  "ticket_priority": true,
  "shop_discount_percent": 10,
  "exclusive_content": true,
  "vip_events": true,
  "digital_card": true
}', true)
ON CONFLICT (code) DO NOTHING;

-- Tạo 1 sản phẩm ứng với plan Premium để đi qua luồng Shop hiện có
-- (đơn giản, có thể ẩn khỏi listing nếu muốn)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM Products WHERE ProductName = 'Membership Premium (12m)') THEN
    INSERT INTO Products (ProductName, Description, Price, DiscountPrice, Stock, IsVisible, ImageURL, CategoryID, is_membership)
    VALUES ('Membership Premium (12m)',
            'Nâng cấp hội viên Premium 12 tháng',
            1200000, 0, 999999, FALSE, NULL, NULL, TRUE);
  END IF;
END$$;

-- productcategories (nếu cần)
INSERT INTO productcategories(categoryname) VALUES ('Membership')
ON CONFLICT DO NOTHING;

-- products: tạo sản phẩm hội viên Premium (giá ví dụ 199000)
INSERT INTO products(productname, description, price, discountprice, stock, isvisible, imageurl, categoryid)
VALUES ('Membership Premium', '1 năm hội viên Premium', 199000, 0, 999999, true, NULL,
        (SELECT categoryid FROM productcategories WHERE categoryname='Membership' LIMIT 1))
RETURNING productid;

  ALTER TABLE Users
  ADD COLUMN IF NOT EXISTS DateOfBirth DATE;

  ALTER TABLE "Users"
  ADD COLUMN IF NOT EXISTS "DateOfBirth" DATE;
select * from users

ALTER TABLE "Users"
  RENAME COLUMN "DateOfBirth" TO "dateofbirth";
-- hoặc nếu chưa có gì:
ALTER TABLE "Users"
  ADD COLUMN IF NOT EXISTS "dateofbirth" DATE;





ALTER TABLE users
  ADD COLUMN IF NOT EXISTS dateofbirth DATE;

ALTER TABLE news ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE news
  ADD COLUMN IF NOT EXISTS topic       VARCHAR(50)  DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN      DEFAULT FALSE;
ALTER TABLE PlayerCareer
ADD COLUMN yellowcards INT DEFAULT 0;

ALTER TABLE PlayerCareer
ADD COLUMN redcards INT DEFAULT 0;
ALTER TABLE players
  ADD COLUMN shirtnumber INT NULL,
  ADD COLUMN birthdate   DATE NULL;


SELECT *
FROM user_memberships
WHERE userid = 7
ORDER BY id;


SELECT d.orderid, d.productid, p.productname, p.is_membership,
       d.quantity, d.unitprice, d.subtotal
FROM productorderdetails d
JOIN products p ON p.productid = d.productid
WHERE d.orderid = 88;


SELECT productid, productname, is_membership, price
FROM products
ORDER BY productid;
SELECT * FROM user_memberships;
SELECT * FROM user_memberships ORDER BY id DESC;



-- Tài khoản ví
CREATE TABLE IF NOT EXISTS wallet_accounts (
  id          SERIAL PRIMARY KEY,
  userid      INT NOT NULL REFERENCES Users(UserID) ON DELETE CASCADE,
  status      VARCHAR(20) NOT NULL DEFAULT 'active',
  level       VARCHAR(20) NOT NULL DEFAULT 'basic',
  pin_hash    TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Số dư ví
CREATE TABLE IF NOT EXISTS wallet_balances (
  walletid    INT PRIMARY KEY REFERENCES wallet_accounts(id) ON DELETE CASCADE,
  available   NUMERIC(14,2) NOT NULL DEFAULT 0,
  frozen      NUMERIC(14,2) NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Freeze tiền
CREATE TABLE IF NOT EXISTS wallet_freeze (
  id          BIGSERIAL PRIMARY KEY,
  walletid    INT NOT NULL REFERENCES wallet_accounts(id) ON DELETE CASCADE,
  amount      NUMERIC(14,2) NOT NULL,
  reason      TEXT,
  orderid     INT,
  expire_at   TIMESTAMP,
  released_at TIMESTAMP
);

-- Tạo ví cho admin (id=?) tùy bạn
INSERT INTO wallet_accounts(userid) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM wallet_accounts WHERE userid=1);
INSERT INTO wallet_balances(walletid) SELECT id FROM wallet_accounts WHERE userid=1 ON CONFLICT DO NOTHING;

-- Tạo ví cho user thứ 2
INSERT INTO wallet_accounts(userid) SELECT 2 WHERE NOT EXISTS (SELECT 1 FROM wallet_accounts WHERE userid=2);
INSERT INTO wallet_balances(walletid) SELECT id FROM wallet_accounts WHERE userid=2 ON CONFLICT DO NOTHING;




ALTER TABLE Users ADD COLUMN MembershipTier VARCHAR(20) CHECK (MembershipTier IN ('basic', 'premium')) DEFAULT 'basic';
UPDATE products
SET is_membership = true
WHERE LOWER(productname) LIKE '%premium%';


SELECT userid, username, membershiptier 
FROM users 
WHERE userid = 3;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';


SELECT * FROM wallet_accounts WHERE userid = 7;
SELECT * FROM wallet_balances WHERE walletid IN
  (SELECT id FROM wallet_accounts WHERE userid = 7);


SELECT * FROM wallet_freeze WHERE walletid IN
  (SELECT id FROM wallet_accounts WHERE userid = 7)
ORDER BY id DESC LIMIT 10;
UPDATE wallet_balances
SET frozen = 0, bonus_frozen = 0
WHERE walletid = 3;



ALTER TABLE users
ADD COLUMN premium_start TIMESTAMP NULL;












CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  key VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  start_date DATE,
  end_date DATE,
  enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO events (key, name, start_date, end_date, enabled, config)
VALUES
(
  'christmas',
  'Christmas',
  '2025-12-24',
  '2025-12-25',
  false,
  '{"snow": true, "banner": true, "theme": "christmas"}'
),
(
  'newyear',
  'New Year',
  '2025-12-31',
  '2026-01-01',
  false,
  '{"snow": false, "banner": true, "theme": "default"}'
);


CREATE TABLE event_greetings (
  id SERIAL PRIMARY KEY,

  event_key VARCHAR(50) NOT NULL,

  message TEXT NOT NULL,
  weight INT NOT NULL DEFAULT 1,      -- trọng số / tỉ lệ xuất hiện
  enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_event_greetings_event
    FOREIGN KEY (event_key)
    REFERENCES events(key)
    ON DELETE CASCADE
);
INSERT INTO event_greetings (event_key, message, weight)
VALUES
('christmas', 'Chúc mừng Giáng Sinh 🎄', 50),
('christmas', 'Merry Christmas – Hala Madrid 🎅', 50);


INSERT INTO event_greetings (event_key, message, weight)
VALUES
('newyear', 'Chúc mừng năm mới – An khang thịnh vượng 🧧', 60),
('newyear', 'Xuân mới thắng lợi mới – Hala Madrid ⚽', 40);





select * from audit_logs;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name ASC;





