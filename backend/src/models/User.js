const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { firstName, lastName, email, password, phone, address } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute(
      'INSERT INTO users (first_name, last_name, email, password, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
      [firstName, lastName, email, hashedPassword, phone, address]
    );
    
    return this.findById(result.insertId);
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async update(id, userData) {
    const { firstName, lastName, phone, address } = userData;
    const safe = v => (v === undefined || v === '' ? null : v);
    await pool.execute(
      'UPDATE users SET first_name = ?, last_name = ?, phone = ?, address = ? WHERE id = ?',
      [safe(firstName), safe(lastName), safe(phone), safe(address), id]
    );
    return this.findById(id);
  }

  static async comparePassword(password, hashedPassword) {
    const result = await bcrypt.compare(password, hashedPassword);
    return result;
  }

  static async updateAvatar(id, avatarUrl) {
    try {
      await pool.execute(
        'UPDATE users SET avatar_url = ? WHERE id = ?',
        [avatarUrl, id]
      );
    } catch (error) {
      console.error('Error updating avatar:', error);
      throw error;
    }
  }

  // OTP methods
  static async saveOtp(userId, otp, expires) {
    await pool.execute(
      'UPDATE users SET reset_otp = ?, reset_otp_expires = ? WHERE id = ?',
      [otp, expires, userId]
    );
  }

  static async clearOtp(userId) {
    await pool.execute(
      'UPDATE users SET reset_otp = NULL, reset_otp_expires = NULL WHERE id = ?',
      [userId]
    );
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      'UPDATE users SET password = ?, reset_otp = NULL, reset_otp_expires = NULL WHERE id = ?',
      [hashedPassword, id]
    );
    console.log('Password updated successfully');
  }
}

module.exports = User;