const Cart = require('../models/Cart');

const cartController = {
  async getCart(req, res) {
    try {
      const userId = req.user.userId;
      const cart = await Cart.getCartByUser(userId);
      res.json(cart);
    } catch (error) {
      console.error('Lỗi lấy giỏ hàng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async addToCart(req, res) {
    try {
      const userId = req.user.userId;
      const { productId, quantity, size } = req.body;
      if (!productId || !quantity || !size) {
        return res.status(400).json({ message: 'Thiếu trường bắt buộc' });
      }
      const id = await Cart.addToCart(userId, productId, quantity, size);
      res.status(201).json({ id });
    } catch (error) {
      console.error('Lỗi thêm vào giỏ hàng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async updateCartItem(req, res) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      if (!quantity) {
        return res.status(400).json({ message: 'Thiếu số lượng' });
      }
      await Cart.updateCartItem(id, quantity);
      res.json({ message: 'Giỏ hàng đã được cập nhật' });
    } catch (error) {
      console.error('Lỗi cập nhật giỏ hàng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async removeCartItem(req, res) {
    try {
      const { id } = req.params;
      await Cart.removeCartItem(id);
      res.json({ message: 'Giỏ hàng đã được xóa' });
    } catch (error) {
      console.error('Lỗi xóa giỏ hàng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async clearCart(req, res) {
    try {
      const userId = req.user.userId;
      await Cart.clearCart(userId);
      res.json({ message: 'Giỏ hàng đã được xóa' });
    } catch (error) {
      console.error('Lỗi xóa giỏ hàng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  }
};

module.exports = cartController; 