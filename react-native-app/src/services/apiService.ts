import axios from 'axios';
import { Product, Category, User, CartItem } from './dataService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, BASE_URL } from '../config/constants';

// HƯỚNG DẪN KIỂM TRA IP LAN:
// 1. Mở Command Prompt (cmd) trên máy tính chạy backend.
// 2. Gõ lệnh: ipconfig
// 3. Tìm dòng IPv4 Address (thường dạng 192.168.x.x hoặc 10.x.x.x)
// 4. Dùng địa chỉ này thay cho baseURL bên dưới.
// 5. Đảm bảo thiết bị thật/simulator và máy tính cùng mạng WiFi/LAN.

const API_TIMEOUT = __DEV__ ? 30000 : 10000; // 30s cho dev, 10s cho production

// Cấu hình axios
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Cải thiện interceptor để xử lý lỗi network, timeout, và lỗi từ server
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Clear invalid token
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        
        // Redirect to login or handle as needed
        throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } catch (e) {
        return Promise.reject(e);
      }
    }
    
    // Handle other errors
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Vui lòng kiểm tra kết nối internet.');
    }
    if (error.message === 'Network Error') {
      throw new Error('Network error. Vui lòng kiểm tra kết nối.');
    }
    
    const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';
    throw new Error(errorMessage);
  }
);
const apiService = {
  // Auth endpoints
  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }, maxRetries = 3): Promise<{ user: User; token: string }> {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        const response = await axiosInstance.post('/auth/register', userData);
        return response.data;
      } catch (error) {
        attempts++;
        if (attempts === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
    throw new Error('Đăng ký thất bại sau nhiều lần thử');
  },

  async login(credentials: { email: string; password: string }): Promise<{ user: User; token: string }> {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },

  async getProfile(token: string): Promise<User> {
    const response = await axiosInstance.get('/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async updateProfile(token: string, data: { firstName: string; lastName: string; phone?: string; address?: string }): Promise<User> {
    const response = await axiosInstance.put('/auth/profile', data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Product endpoints
  async getProducts(): Promise<Product[]> {
    const response = await axiosInstance.get('/products');
    return response.data;
  },

  async getProductById(id: string): Promise<Product> {
    const response = await axiosInstance.get(`/products/${id}`);
    return response.data;
  },

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const response = await axiosInstance.get(`/products/category/${categoryId}`);
    return response.data;
  },

  async getCategories(): Promise<Category[]> {
    const response = await axiosInstance.get('/products/categories');
    return response.data;
  },

  // Search endpoint
  async search(query: string): Promise<{ products: Product[], categories: any[] }> {
    try {
      console.log('Searching with query:', query);
      console.log('Full URL:', `${API_URL}/search?q=${encodeURIComponent(query)}`);
      const response = await axiosInstance.get(`/search?q=${encodeURIComponent(query)}`);
      console.log('Search response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Search error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      throw error;
    }
  },

  // Cart endpoints
  async getCartItems(token: string): Promise<CartItem[]> {
    const response = await axiosInstance.get('/cart', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async addToCart(token: string, item: { productId: string; quantity: number; size: string }): Promise<CartItem> {
    const response = await axiosInstance.post('/cart', item, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async updateCartItem(token: string, itemId: string, quantity: number): Promise<CartItem> {
    const response = await axiosInstance.put(`/cart/${itemId}`, { quantity }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async removeFromCart(token: string, itemId: string): Promise<void> {
    await axiosInstance.delete(`/cart/${itemId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  async clearCart(token: string): Promise<void> {
    await axiosInstance.delete('/cart/clear/all', {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Order endpoints
  async createOrder(token: string, orderData: any): Promise<any> {
    const response = await axiosInstance.post('/orders', orderData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async getOrderHistory(token: string): Promise<any[]> {
    const response = await axiosInstance.get('/orders', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async updateOrderStatus(token: string, orderId: string, status: string): Promise<any> {
    const response = await axiosInstance.put(`/orders/${orderId}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Favorites endpoints
  async getFavorites(token: string): Promise<Product[]> {
    const response = await axiosInstance.get('/favorites', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async addToFavorites(token: string, productId: string): Promise<void> {
    await axiosInstance.post('/favorites', { productId }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  async removeFromFavorites(token: string, productId: string): Promise<void> {
    await axiosInstance.delete(`/favorites/${productId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  async confirmUserTransfer(token: string, orderId: string): Promise<any> {
    const response = await axiosInstance.put(`/orders/${orderId}/confirm-transfer`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

async uploadAvatar(token: string, imageUri: string): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || `avatar-${Date.now()}.jpg`;
    const type = imageUri.endsWith('.png') ? 'image/png' : 'image/jpeg';

    // @ts-ignore
    formData.append('avatar', {
      uri: imageUri,
      name: filename,
      type
    });

    try {
      const response = await axiosInstance.post('/auth/upload-avatar', formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        transformRequest: () => formData
      });
      
      console.log('Server response:', response.data);
      let avatarUrl = response.data.avatarUrl;
      console.log('Original avatarUrl:', avatarUrl);
      
      if (!avatarUrl.startsWith('http')) {
        avatarUrl = `${BASE_URL}${avatarUrl}`;
        console.log('Modified avatarUrl:', avatarUrl);
      }
      
      return { avatarUrl };
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw new Error('Không thể tải lên ảnh đại diện');
    }
  },
};

export default apiService;