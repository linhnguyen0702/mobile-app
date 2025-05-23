const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Cấu hình nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const otpGenerator = () => Math.floor(100000 + Math.random() * 900000).toString();

const authController = {
  /**
   * Đăng ký tài khoản mới
   */
  async register(req, res) {
    try {
      const { firstName, lastName, email, password, phone, address } = req.body;

      // Validate input
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
      }

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email đã tồn tại' });
      }

      // Create new user
      const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        phone: phone || null, 
        address: address || null
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Đăng ký thành công',
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          address: user.address
        },
        token
      });
    } catch (error) {
      console.error('Lỗi đăng ký:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  /**
   * Đăng nhập hệ thống
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc' });
      }
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
      }
      const isPasswordValid = await User.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Send login success email
      try {
        await transporter.sendMail({
          from: `"Hỗ trợ HAHACafe" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Đăng nhập thành công - HAHACafe',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2d3748;">Đăng nhập thành công</h1>
              <p>Xin chào ${user.first_name} ${user.last_name},</p>
              <p>Tài khoản của bạn vừa được đăng nhập thành công vào HAHACafe.</p>
              <p>Thời gian đăng nhập: ${new Date().toLocaleString('vi-VN')}</p>
              <p>Nếu bạn không thực hiện đăng nhập này, vui lòng liên hệ với chúng tôi ngay lập tức.</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
              <p style="color: #718096;">Trân trọng,</p>
              <p style="color: #718096;">Đội ngũ HAHACafe</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Lỗi gửi email thông báo đăng nhập:', emailError);
        // Continue with login even if email fails
      }

      res.json({
        message: 'Đăng nhập thành công',
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          avatarUrl: user.avatar_url
        },
        token
      });
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  /**
   * Gửi OTP về email
   */
  async requestOtp(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: 'Vui lòng cung cấp email' });
      const user = await User.findByEmail(email);
      if (!user) return res.status(200).json({ message: 'Nếu email tồn tại, bạn sẽ nhận được mã OTP.' });
      const otp = otpGenerator();
      const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 phút
      await User.saveOtp(user.id, otp, expires);
      // Gửi email
      await transporter.sendMail({
        from: `"Hỗ trợ HAHACafe" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Mã OTP đặt lại mật khẩu - HAHACafe',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2d3748;">Mã OTP đặt lại mật khẩu</h1>
            <p>Xin chào ${user.first_name} ${user.last_name},</p>
            <p>Mã OTP của bạn là:</p>
            <div style="font-size: 32px; font-weight: bold; color: #C87D55; margin: 20px 0;">${otp}</div>
            <p>Mã này có hiệu lực trong 5 phút.</p>
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #718096;">Trân trọng,</p>
            <p style="color: #718096;">Đội ngũ HAHACafe</p>
          </div>
        `,
      });
      res.status(200).json({ message: 'Nếu email tồn tại, bạn sẽ nhận được mã OTP.' });
    } catch (error) {
      console.error('Lỗi gửi OTP:', error);
      res.status(500).json({ message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' });
    }
  },

  /**
   * Xác thực OTP và đổi mật khẩu
   */
  async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ message: 'Thiếu thông tin.' });
      }
      const user = await User.findByEmail(email);
      if (!user || !user.reset_otp || !user.reset_otp_expires) {
        return res.status(400).json({ message: 'OTP không hợp lệ.' });
      }
      if (user.reset_otp !== otp) {
        return res.status(400).json({ message: 'Mã OTP không đúng.' });
      }
      if (new Date(user.reset_otp_expires) < new Date()) {
        return res.status(400).json({ message: 'Mã OTP đã hết hạn.' });
      }
      // Không đổi mật khẩu ở đây, chỉ xác thực OTP thành công
      res.json({ message: 'OTP hợp lệ. Bạn có thể đặt lại mật khẩu.' });
    } catch (error) {
      console.error('Lỗi xác thực OTP:', error);
      res.status(500).json({ message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' });
    }
  },

  /**
   * Lấy thông tin profile người dùng
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
      }

      res.json({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatarUrl: user.avatar_url
      });
    } catch (error) {
      console.error('Lỗi lấy thông tin tài khoản:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  /**
   * Cập nhật thông tin profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const { firstName, lastName, phone, address } = req.body;

      if (!firstName || !lastName) {
        return res.status(400).json({ message: 'Họ và tên là bắt buộc' });
      }

      await User.update(userId, { firstName, lastName, phone, address });
      const updatedUser = await User.findById(userId);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
      }

      res.json({
        id: updatedUser.id,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        avatarUrl: updatedUser.avatar_url
      });
    } catch (error) {
      console.error('Lỗi cập nhật thông tin tài khoản:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  /**
   * Tải lên avatar
   */
  async uploadAvatar(req, res) {
    try {
      // Đảm bảo file đã được upload
      if (!req.file) {
        return res.status(400).json({ message: 'Không có file được upload!' });
      }

      const userId = req.user.userId;
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      
      // Cập nhật URL avatar vào database
      await User.updateAvatar(userId, avatarUrl);
      
      console.log('avatarUrl trả về:', avatarUrl);
      res.json({ avatarUrl });
    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({ message: 'Lỗi upload avatar!' });
    }
  },

  /**
   * Đổi mật khẩu
   */
  async resetPassword(req, res) {
    try {
      const { email, otp, newPassword } = req.body;
      console.log('Reset password request:', { email, otp, newPassword });
      if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: 'Thiếu thông tin.' });
      }
      const user = await User.findByEmail(email);
      console.log('Found user:', user);
      if (!user || !user.reset_otp || !user.reset_otp_expires) {
        return res.status(400).json({ message: 'OTP không hợp lệ.' });
      }
      if (user.reset_otp !== otp) {
        return res.status(400).json({ message: 'Mã OTP không đúng.' });
      }
      if (new Date(user.reset_otp_expires) < new Date()) {
        return res.status(400).json({ message: 'Mã OTP đã hết hạn.' });
      }
      await User.updatePassword(user.id, newPassword);
      await User.clearOtp(user.id);
      console.log('Password reset completed for user:', user.id);
      res.json({ message: 'Đổi mật khẩu thành công.' });
    } catch (error) {
      console.error('Lỗi đổi mật khẩu:', error);
      res.status(500).json({ message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' });
    }
  }
};

module.exports = authController;