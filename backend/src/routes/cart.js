const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const auth = require('../middleware/auth');

// Lấy giỏ hàng của user
router.get('/', auth, cartController.getCart);
// Thêm sản phẩm vào giỏ
router.post('/', auth, cartController.addToCart);
// Cập nhật số lượng sản phẩm trong giỏ
router.put('/:id', auth, cartController.updateCartItem);
// Xóa 1 sản phẩm khỏi giỏ
router.delete('/:id', auth, cartController.removeCartItem);
// Xóa toàn bộ giỏ hàng
router.delete('/clear/all', auth, cartController.clearCart);

module.exports = router; 