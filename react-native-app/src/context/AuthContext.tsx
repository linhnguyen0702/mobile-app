"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../src/services/apiService';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }) => Promise<boolean>;
  logout: () => void;
  getProfile: () => Promise<User>;
  updateProfile: (data: { firstName: string; lastName: string; phone?: string; address?: string }) => Promise<User>;
  uploadAvatar: (imageUri: string) => Promise<{ avatarUrl: string }>;
  reloadUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredCredentials();
  }, []);

  const loadStoredCredentials = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user')
      ]);

      if (storedToken) {
        // Kiểm tra token hết hạn
        const decoded: { exp: number } = jwtDecode(storedToken);
        if (decoded.exp * 1000 < Date.now()) {
          throw new Error('Token expired');
        }

        setToken(storedToken);
        if (storedUser) setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Load credentials error:', error);
      await AsyncStorage.multiRemove(['token', 'user']);
    } finally {
      setIsLoading(false);
    }
  };

  const getProfile = async (): Promise<User> => {
    try {
      if (!token) throw new Error('Không tìm thấy token xác thực');
      const user = await apiService.getProfile(token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return user;
    } catch (error) {
      console.error('Lỗi lấy thông tin hồ sơ người dùng:', error);
      throw error;
    }
  };

  const updateProfile = async (data: { firstName: string; lastName: string; phone?: string; address?: string }): Promise<User> => {
    try {
      if (!token) throw new Error('Không tìm thấy token xác thực');
      const user = await apiService.updateProfile(token, data);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return user;
    } catch (error) {
      console.error('Lỗi cập nhật thông tin hồ sơ người dùng:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });

      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));

      setToken(response.token);
      setUser(response.user);

      return true;
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      return false;
    }
  };

  const register = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }) => {
    try {
      const response = await apiService.register(userData);

      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));

      setToken(response.token);
      setUser(response.user);

      return true;
    } catch (error) {
      console.error('Lỗi đăng ký:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    try {
      if (!token) throw new Error('Không tìm thấy token xác thực');
      const result = await apiService.uploadAvatar(token, imageUri);
      if (user) {
        const updatedUser = { ...user, avatarUrl: result.avatarUrl };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
      return result;
    } catch (error) {
      console.error('Lỗi tải ảnh đại diện:', error);
      throw error;
    }
  };

  const reloadUserProfile = async () => {
    try {
      if (token) {
        const updatedUser = await getProfile();
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Lỗi reload user profile:', error);
      if (error instanceof Error && error.message.includes('401')) {
        await logout();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        getProfile,
        updateProfile,
        uploadAvatar,
        reloadUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};

export default AuthProvider;