const pool = require('../config/database');

class Product {
  static async getAll() {
    const [rows] = await pool.execute(`
      SELECT p.*, c.name as category_name 
      FROM products p
      JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `);
    return rows;
  }

  static async getById(id) {
    const [rows] = await pool.execute(`
      SELECT p.*, c.name as category_name 
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id]);
    return rows[0];
  }

  static async getByCategory(categoryId) {
    const [rows] = await pool.execute(`
      SELECT p.*, c.name as category_name 
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ?
      ORDER BY p.created_at DESC
    `, [categoryId]);
    return rows;
  }

  static async getSizes(productId) {
    const [rows] = await pool.execute(`
      SELECT size, price_modifier 
      FROM product_sizes 
      WHERE product_id = ?
    `, [productId]);
    return rows;
  }

  static async getCategories() {
    const [rows] = await pool.execute('SELECT * FROM categories ORDER BY name');
    return rows;
  }
}

module.exports = Product; 