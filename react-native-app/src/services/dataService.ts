import AsyncStorage from "@react-native-async-storage/async-storage"
import apiService from './apiService'
import { BASE_URL } from '../config/constants'

// Định nghĩa các kiểu dữ liệu
export interface Category {
  id: string
  name: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  rating: number
  reviews: number
  image: string | { toString(): string }
  fullDescription: string
  sizes: string[]
  categoryId: string
}

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  password?: string
  phone?: string
  address?: string
  avatarUrl?: string
}

export interface CartItem {
  product: Product
  quantity: number
  size: string
  base_price?: number // Giá gốc từ backend nếu có
}

// Các khóa lưu trữ trong AsyncStorage
const USERS_STORAGE_KEY = "users"
const USER_KEY = "currentUser"
const CART_STORAGE_KEY = "cart"

// Hàm lấy danh sách danh mục
export const getCategories = async (): Promise<Category[]> => {
  try {
    return await apiService.getCategories()
  } catch (error) {
    console.error("Lỗi lấy danh mục:", error)
    return []
  }
}

// Hàm lấy danh sách sản phẩm
export const getProducts = async (): Promise<Product[]> => {
  try {
    return await apiService.getProducts()
  } catch (error) {
    console.error("Lỗi lấy sản phẩm:", error)
    return []
  }
}

// Hàm lấy sản phẩm theo ID
export const getProductById = async (id: string): Promise<Product | undefined> => {
  try {
    return await apiService.getProductById(id)
  } catch (error) {
    console.error("Lỗi lấy sản phẩm theo ID:", error)
    return undefined
  }
}

// Hàm lấy danh sách người dùng từ AsyncStorage
export const getUsers = async (): Promise<User[]> => {
  try {
    const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY)
    if (usersJson) {
      return JSON.parse(usersJson)
    }
    return []
  } catch (error) {
    console.error("Lỗi lấy người dùng:", error)
    return []
  }
}

// Hàm lưu danh sách người dùng vào AsyncStorage
export const saveUsers = async (users: User[]): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
    return true
  } catch (error) {
    console.error("Lỗi lưu người dùng:", error)
    return false
  }
}

// Hàm lấy người dùng hiện tại từ AsyncStorage
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userJson = await AsyncStorage.getItem(USER_KEY)
    if (userJson) {
      return JSON.parse(userJson)
    }
    return null
  } catch (error) {
    console.error("Lỗi lấy người dùng hiện tại:", error)
    return null
  }
}

// Hàm lưu người dùng hiện tại vào AsyncStorage
export const saveCurrentUser = async (user: User | null): Promise<boolean> => {
  try {
    if (user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      await AsyncStorage.removeItem(USER_KEY)
    }
    return true
  } catch (error) {
    console.error("Lỗi lưu người dùng hiện tại:", error)
    return false
  }
}

// Hàm lấy giỏ hàng từ AsyncStorage
export const getCart = async (): Promise<CartItem[]> => {
  try {
    const cartJson = await AsyncStorage.getItem(CART_STORAGE_KEY)
    if (cartJson) {
      return JSON.parse(cartJson)
    }
    return []
  } catch (error) {
    console.error("Lỗi lấy giỏ hàng:", error)
    return []
  }
}

// Hàm lưu giỏ hàng vào AsyncStorage
export const saveCart = async (cart: CartItem[]): Promise<boolean> => {
  try {
    // Đảm bảo dữ liệu có thể được JSON.stringify
    const safeCart = cart.map((item) => ({
      ...item,
      product: {
        ...item.product,
        // Đảm bảo image là string
        image: typeof item.product.image === "string" ? item.product.image : String(item.product.image),
      },
    }))

    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(safeCart))
    return true
  } catch (error) {
    console.error("Lỗi lưu giỏ hàng:", error)
    return false
  }
}

// Hàm xử lý nguồn hình ảnh
export const getImageSource = (imageUrl: string) => {
  if (!imageUrl) return { uri: `${BASE_URL}/uploads/default.jpg` };
  if (imageUrl.startsWith('http')) return { uri: imageUrl };
  return { uri: `${BASE_URL}/uploads/${imageUrl}` };
};
