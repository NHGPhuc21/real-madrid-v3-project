// backend/src/controllers/cartcontroller.js
const pool = require("../../config/db");

// Khi backend start, đảm bảo bảng ShoppingCartItems tồn tại
async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ShoppingCartItems (
      ItemID SERIAL PRIMARY KEY,
      CartID INT NOT NULL,
      ProductID INT NOT NULL,
      Quantity INT NOT NULL DEFAULT 1,
      UnitPrice NUMERIC(10,2) NOT NULL,
      CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(CartID, ProductID),
      FOREIGN KEY (CartID) REFERENCES ShoppingCart(CartID) ON DELETE CASCADE,
      FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE
    )
  `);
}
ensureSchema().catch(console.error);

// Lấy CartID theo UserID
async function getCartIdByUser(userId) {
  const r = await pool.query(
    `SELECT cartid FROM shoppingcart WHERE userid=$1`,
    [userId]
  );
  if (!r.rows.length) {
    const ins = await pool.query(
      `INSERT INTO shoppingcart(userid) VALUES($1) RETURNING cartid`,
      [userId]
    );
    return ins.rows[0].cartid;
  }
  return r.rows[0].cartid;
}

// Lấy giỏ hàng của user
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cartId = await getCartIdByUser(userId);
    const items = await pool.query(
      `SELECT sci.itemid, sci.productid, sci.quantity, sci.unitprice, p.productname, p.imageurl
       FROM shoppingcartitems sci
       JOIN products p ON sci.productid = p.productid
       WHERE sci.cartid=$1`,
      [cartId]
    );
    res.json({ cartId, items: items.rows });
  } catch (err) {
    console.error("getCart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Thêm/cập nhật sản phẩm trong giỏ
// Thay addToCart & updateQuantity bằng bản dưới (giữ getCart, remove như cũ)
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity = 1 } = req.body;
    if (!productId || Number(quantity) <= 0) {
      return res.status(400).json({ message: "Missing fields" });
    }
    const cartId = await getCartIdByUser(userId);

    // Lấy SP + giá server
    const pR = await pool.query(
      `SELECT productid, productname, price, discountprice, stock, isvisible
       FROM products WHERE productid=$1`,
      [productId]
    );
    if (!pR.rows.length) return res.status(404).json({ message: "Product not found" });
    const p = pR.rows[0];
    if (!p.isvisible) return res.status(400).json({ message: "Sản phẩm hiện không bán" });

    // Số lượng hiện có trong giỏ (nếu có) để không vượt stock
    const curR = await pool.query(
      `SELECT quantity FROM shoppingcartitems WHERE cartid=$1 AND productid=$2`,
      [cartId, productId]
    );
    const currentQty = curR.rows[0]?.quantity || 0;
    const newQty = currentQty + Number(quantity);
    if (newQty > Number(p.stock)) {
      return res.status(400).json({ message: `The product is out of stock (${p.stock})` });
    }

    const basePrice = Number(p.price) || 0;
    const discount = Number(p.discountprice) || 0; // discountprice = số tiền giảm
    const unitPrice = Math.max(0, basePrice - discount);


    const up = await pool.query(
      `INSERT INTO shoppingcartitems(cartid, productid, quantity, unitprice)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (cartid, productid)
       DO UPDATE SET quantity = shoppingcartitems.quantity + EXCLUDED.quantity,
                     unitprice = EXCLUDED.unitprice,  -- đồng bộ giá hiện tại
                     updatedat = NOW()
       RETURNING *`,
      [cartId, productId, quantity, unitPrice]
    );

    res.status(201).json(up.rows[0]);
  } catch (err) {
    console.error("addToCart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Xoá sản phẩm khỏi giỏ
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;
    const cartId = await getCartIdByUser(userId);

    const del = await pool.query(
      `DELETE FROM shoppingcartitems WHERE cartid=$1 AND productid=$2`,
      [cartId, productId]
    );
    if (del.rowCount === 0)
      return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("removeFromCart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Cập nhật số lượng
exports.updateQuantity = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;
    const { quantity } = req.body;
    const q = Math.max(0, parseInt(quantity, 10) || 0);
    const cartId = await getCartIdByUser(userId);

    if (q === 0) {
      await pool.query(
        `DELETE FROM shoppingcartitems WHERE cartid=$1 AND productid=$2`,
        [cartId, productId]
      );
      return res.json({ success: true, removed: true });
    }

    // check stock
    const pR = await pool.query(
      `SELECT stock, price, discountprice FROM products WHERE productid=$1`,
      [productId]
    );
    if (!pR.rows.length)
      return res.status(404).json({ message: "Product not found" });
    const p = pR.rows[0];
    if (q > Number(p.stock)) {
      return res.status(400).json({ message: `The product is out of stock (${p.stock})` });
    }

    const basePrice = Number(p.price) || 0;
    const discount = Number(p.discountprice) || 0;
    const unitPrice = Math.max(0, basePrice - discount);

    const upd = await pool.query(
      `UPDATE shoppingcartitems
         SET quantity=$1, unitprice=$2, updatedat=NOW()
       WHERE cartid=$3 AND productid=$4
       RETURNING *`,
      [q, unitPrice, cartId, productId]
    );
    if (upd.rows.length === 0)
      return res.status(404).json({ message: "Not found" });
    res.json(upd.rows[0]);
  } catch (err) {
    console.error("updateQuantity error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
