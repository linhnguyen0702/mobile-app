const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Cấu hình multer để lưu file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // giới hạn 5MB
  },
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Chỉ cho phép file ảnh!'), false);
    }
    cb(null, true);
  }
});

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Gửi OTP về email để reset password
router.post('/request-reset-otp', authController.requestOtp);

// Xác thực OTP (chỉ kiểm tra email + otp, không đổi mật khẩu)
router.post('/verify-reset-otp', authController.verifyOtp);

// Đổi mật khẩu (yêu cầu email, otp, newPassword)
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.post('/upload-avatar', auth, upload.single('avatar'), authController.uploadAvatar);

module.exports = router;