const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const orderController = require('../controllers/orderController');

router.post('/orders', auth, orderController.createOrder);
router.get('/orders', auth, orderController.getOrderHistory);
router.put('/orders/:orderId/status', auth, orderController.updateOrderStatus);
router.put('/orders/:orderId/confirm-transfer', auth, orderController.confirmUserTransfer);

module.exports = router;