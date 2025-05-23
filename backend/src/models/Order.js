const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Map status string to status_id
const getStatusId = (status) => {
  const statusMap = {
    'processing': '1',
    'pending': '2',
    'delivered': '3',
    'cancelled': '4'
  };
  return statusMap[status] || '1'; // Default to 'processing' if status not found
};

// Map payment method string to payment_method_id
const getPaymentMethodId = (paymentMethod) => {
  const paymentMethodMap = {
    'momo': '2',
    'cash': '3'
  };
  return paymentMethodMap[paymentMethod] || '3'; // Default to 'cash' if payment method not found
};

class Order {
  static async create({ userId, items, totalAmount, status, address, note, paymentMethod, customerName, customerPhone }) {
    const orderId = uuidv4();
    const statusId = getStatusId(status);
    const paymentMethodId = getPaymentMethodId(paymentMethod);
    
    await pool.execute(
      'INSERT INTO orders (id, user_id, total_amount, status_id, delivery_address, notes, payment_method_id, delivery_method, customer_name, customer_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        orderId,
        userId,
        totalAmount,
        statusId,
        address || null,
        note || null,
        paymentMethodId,
        'deliver',
        customerName || null,
        customerPhone || null
      ]
    );
    for (const item of items) {
      await pool.execute(
        'INSERT INTO order_items (id, order_id, product_id, quantity, size, price) VALUES (?, ?, ?, ?, ?, ?)',
        [
          uuidv4(),
          orderId,
          item.id,
          item.quantity,
          item.size,
          item.price,
        ]
      );
    }
    return orderId;
  }

  // Thêm hàm này để lấy lịch sử đơn hàng của user
  static async findByUserId(userId) {
    // Lấy danh sách đơn hàng của user
    const [orders] = await pool.execute(
      'SELECT o.id, o.total_amount, o.status_id, o.delivery_address, o.notes, o.payment_method_id, o.created_at, o.customer_name, o.customer_phone FROM orders o WHERE o.user_id = ? ORDER BY o.created_at DESC',
      [userId]
    );

    // Lấy items cho từng đơn hàng
    for (const order of orders) {
      const [items] = await pool.execute(
        'SELECT oi.id, oi.product_id, p.name as productName, oi.price, oi.quantity, oi.size, p.image FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
        [order.id]
      );
      order.items = items;
      // Map status_id về status string
      const statusMap = { 1: 'processing', 2: 'pending', 3: 'delivered', 4: 'cancelled' };
      order.status = statusMap[order.status_id] || 'processing';
      order.date = order.created_at;
      order.address = order.delivery_address;
      order.note = order.notes;
      order.totalAmount = order.total_amount;
      order.customerName = order.customer_name;
      order.customerPhone = order.customer_phone;
    }

    return orders;
  }

  static async findById(orderId) {
    const [orders] = await pool.execute(
      'SELECT o.id, o.user_id, o.total_amount, o.status_id, o.delivery_address, o.notes, o.payment_method_id, o.created_at, o.customer_name, o.customer_phone FROM orders o WHERE o.id = ?',
      [orderId]
    );

    if (orders.length === 0) {
      return null;
    }

    const order = orders[0];
    // Map status_id về status string
    const statusMap = { 1: 'processing', 2: 'pending', 3: 'delivered', 4: 'cancelled' };
    order.status = statusMap[order.status_id] || 'processing';
    order.customerName = order.customer_name;
    order.customerPhone = order.customer_phone;
    return order;
  }

  static async updateStatus(orderId, status) {
    const statusId = getStatusId(status);
    await pool.execute(
      'UPDATE orders SET status_id = ? WHERE id = ?',
      [statusId, orderId]
    );
  }

  static async confirmUserTransfer(orderId) {
    await pool.execute(
      'UPDATE orders SET user_confirmed_transfer = TRUE, user_confirmed_transfer_at = NOW() WHERE id = ?',
      [orderId]
    );
  }
}

module.exports = Order;