const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Cart {
  static async getCartByUser(userId) {
    const [rows] = await pool.execute(
      `SELECT c.*, 
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.full_description as product_fullDescription,
        p.price as product_price,
        p.image as product_image,
        p.category_id as product_categoryId,
        p.rating as product_rating,
        p.reviews_count as product_reviews,
        ps.size as product_size,
        ps.price_modifier as product_priceModifier
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       LEFT JOIN product_sizes ps ON p.id = ps.product_id AND c.size = ps.size
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async addToCart(userId, productId, quantity, size) {
    const id = uuidv4();
    // Kiểm tra nếu đã có sản phẩm này với size này trong giỏ thì tăng số lượng
    const [exist] = await pool.execute(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ?',
      [userId, productId, size]
    );
    if (exist.length > 0) {
      await pool.execute(
        'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
        [quantity, exist[0].id]
      );
      return exist[0].id;
    }
    await pool.execute(
      'INSERT INTO cart_items (id, user_id, product_id, quantity, size) VALUES (?, ?, ?, ?, ?)',
      [id, userId, productId, quantity, size]
    );
    return id;
  }

  static async updateCartItem(id, quantity) {
    await pool.execute(
      'UPDATE cart_items SET quantity = ? WHERE id = ?',
      [quantity, id]
    );
  }

  static async removeCartItem(id) {
    await pool.execute(
      'DELETE FROM cart_items WHERE id = ?', [id]
    );
  }

  static async clearCart(userId) {
    await pool.execute(
      'DELETE FROM cart_items WHERE user_id = ?', [userId]
    );
  }
}

module.exports = Cart; 