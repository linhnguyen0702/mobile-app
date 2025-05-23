import axios from 'axios';
import { API_URL } from '../config/constants';

export const forgotPassword = async (email: string) => {
  try {
    console.log('Bắt đầu gửi quên mật khẩu với email:', email);
    const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
    console.log('Đã gọi xong API quên mật khẩu');
    return response.data;
  } catch (error: any) {
    if (error.response) {
      // Lỗi từ server
      throw new Error(error.response.data.error || error.response.data.message || 'Lỗi không xác định');
    } else if (error.request) {
      // Không nhận được phản hồi từ server
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
    } else {
      // Lỗi khi thiết lập request
      throw new Error('Có lỗi xảy ra khi gửi yêu cầu.');
    }
  }
};

export const resetPassword = async (token: string, newPassword: string) => {
  try {
    const response = await axios.post(`${API_URL}/auth/reset-password`, {
      token,
      newPassword,
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.error || error.response.data.message || 'Lỗi không xác định');
    } else if (error.request) {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
    } else {
      throw new Error('Có lỗi xảy ra khi gửi yêu cầu.');
    }
  }
};

// Hàm gửi yêu cầu đặt lại mật khẩu và nhận OTP
export const requestResetOtp = async (email: string) => {
  try {
    const response = await axios.post(`${API_URL}/auth/request-reset-otp`, { email });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Hàm xác thực OTP và đặt lại mật khẩu
export const verifyResetOtp = async (email: string, otp: string, newPassword: string) => {
  try {
    const response = await axios.post(`${API_URL}/auth/verify-reset-otp`, {
      email,
      otp,
      newPassword
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}; 