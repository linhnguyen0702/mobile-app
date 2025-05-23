const Order = require('../models/Order');

const orderController = {
  async createOrder(req, res) {
    try {
      const userId = req.user.userId;
      const { items, totalAmount, status, address, note, paymentMethod } = req.body;
      
      // Lấy thông tin người dùng từ request body nếu có, nếu không thì lấy từ user
      const customerName = req.body.customerName || (req.user.firstName && req.user.lastName ? 
        `${req.user.firstName} ${req.user.lastName}` : 'Khách hàng');
      const customerPhone = req.body.customerPhone || req.user.phone || '';

      const orderId = await Order.create({
        userId,
        items,
        totalAmount,
        status,
        address,
        note,
        paymentMethod,
        customerName,
        customerPhone,
      });
      res.status(201).json({ message: 'Đơn hàng đã được tạo thành công', orderId });
    } catch (error) {
      console.error('Lỗi tạo đơn hàng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  // Thêm hàm này để lấy lịch sử đơn hàng
  async getOrderHistory(req, res) {
    try {
      const userId = req.user.userId;
      const orders = await Order.findByUserId(userId);
      res.json(orders);
    } catch (error) {
      console.error('Lỗi lấy lịch sử đơn hàng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      const userId = req.user.userId;

      // Kiểm tra xem đơn hàng có thuộc về user này không
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }

      // Sửa so sánh user_id để tránh lỗi kiểu dữ liệu
      if (String(order.user_id) !== String(userId)) {
        return res.status(403).json({ message: 'Không có quyền cập nhật đơn hàng này' });
      }

      // Kiểm tra trạng thái hiện tại
      if (order.status === 'delivered') {
        return res.status(400).json({ message: 'Không thể cập nhật trạng thái của đơn hàng đã giao' });
      }

      if (order.status === 'pending' && status === 'cancelled') {
        return res.status(400).json({ message: 'Không thể hủy đơn hàng đang được giao' });
      }

      // Cập nhật trạng thái
      await Order.updateStatus(orderId, status);
      res.json({ message: 'Trạng thái đơn hàng đã được cập nhật thành công' });
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái đơn hàng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async confirmUserTransfer(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.userId;

      // Kiểm tra quyền
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      if (String(order.user_id) !== String(userId)) {
        return res.status(403).json({ message: 'Không có quyền' });
      }

      await Order.confirmUserTransfer(orderId);
      await Order.updateStatus(orderId, 'pending');
      res.json({ message: 'Người dùng đã xác nhận chuyển khoản' });
    } catch (error) {
      console.error('Lỗi xác nhận chuyển khoản:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },
};

module.exports = orderController;