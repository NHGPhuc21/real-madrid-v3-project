// backend/src/controllers/productscontroller.js
const pool = require("../../config/db");

const productsController = {
   // NEW: GET /api/products?q=&page=&limit=&categoryId=&sort=
  searchAndList: async (req, res) => {
    try {
      const {
        q = "",
        page = 1,
        limit = 12,
        categoryId = null,
        sort = "new", // new | price_asc | price_desc
      } = req.query;

      const pageNum  = Math.max(1, parseInt(page, 10)  || 1);
      const pageSize = Math.min(60, Math.max(1, parseInt(limit, 10) || 12));
      const offset   = (pageNum - 1) * pageSize;

      const params = [];
      const where = ["p.isvisible = true"];

  if (q) {
    params.push(`%${q}%`);
    // chỉ search theo tên:
    where.push(`p.productname ILIKE $${params.length}`);
  }

      if (categoryId) {
        params.push(Number(categoryId));
        where.push(`p.categoryid = $${params.length}`);
      }
      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

      let orderBy = "p.productid DESC";
      if (sort === "price_asc")  orderBy = "p.price ASC";
      if (sort === "price_desc") orderBy = "p.price DESC";

      // count
      const countSql = `SELECT COUNT(*)::INT AS total FROM products p ${whereSql}`;
      const countR   = await pool.query(countSql, params);
      const total    = countR.rows[0]?.total || 0;

      // items
      params.push(pageSize);
      params.push(offset);
      const itemsSql = `
        SELECT p.productid, p.productname, p.description, p.price, p.discountprice, p.stock, p.isvisible, p.imageurl, p.categoryid,
               pc.categoryname
        FROM products p
        LEFT JOIN productcategories pc ON p.categoryid = pc.categoryid
        ${whereSql}
        ORDER BY ${orderBy}
        LIMIT $${params.length-1} OFFSET $${params.length}
      `;
      const itemsR = await pool.query(itemsSql, params);

      return res.json({
        items: itemsR.rows,
        total,
        page: pageNum,
        limit: pageSize,
      });
    } catch (err) {
      console.error("searchAndList error:", err);
      res.status(500).json({ error: err.message });
    }
  },
  getAllProducts: async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT p.productid, p.productname, p.description, p.price, p.discountprice, p.stock, p.isvisible, p.imageurl, p.categoryid,
               pc.categoryname
        FROM products p
        LEFT JOIN productcategories pc ON p.categoryid = pc.categoryid
        ORDER BY p.productid ASC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error("getAllProducts error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  getProductById: async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM products WHERE productid=$1",
        [req.params.id]
      );
      if (result.rows.length === 0)
        return res.status(404).json({ message: "Product not found" });
      res.json(result.rows[0]);
    } catch (err) {
      console.error("getProductById error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  createProduct: async (req, res) => {
    try {
      const {
        productname,
        description,
        price,
        discountprice = 0,
        stock = 0,
        isvisible = true,
        imageurl = null,
        categoryid = null,
      } = req.body;

      const result = await pool.query(
        `INSERT INTO products (productname, description, price, discountprice, stock, isvisible, imageurl, categoryid)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [
          productname,
          description,
          price,
          discountprice,
          stock,
          isvisible,
          imageurl,
          categoryid,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("createProduct error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  updateProduct: async (req, res) => {
    try {
      const {
        productname,
        description,
        price,
        discountprice,
        stock,
        isvisible,
        imageurl,
        categoryid,
      } = req.body;
      const result = await pool.query(
        `UPDATE products
         SET productname=$1, description=$2, price=$3, discountprice=$4, stock=$5, isvisible=$6, imageurl=$7, categoryid=$8
         WHERE productid=$9 RETURNING *`,
        [
          productname,
          description,
          price,
          discountprice,
          stock,
          isvisible,
          imageurl,
          categoryid,
          req.params.id,
        ]
      );
      if (result.rows.length === 0)
        return res.status(404).json({ message: "Product not found" });
      res.json(result.rows[0]);
    } catch (err) {
      console.error("updateProduct error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  deleteProduct: async (req, res) => {
    try {
      const result = await pool.query(
        "DELETE FROM products WHERE productid=$1",
        [req.params.id]
      );
      if (result.rowCount === 0)
        return res.status(404).json({ message: "Product not found" });
      res.json({ message: "Product deleted" });
    } catch (err) {
      console.error("deleteProduct error:", err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = productsController;
