"use client"

import React, { createContext, useState, useContext, useEffect } from "react"
import { type Product, type CartItem } from "../services/dataService"
import apiService from "../services/apiService"
import { useAuth } from "./AuthContext"
import { BASE_URL } from '../config/constants'

interface CartContextType {
  cartItems: CartItem[]
  addToCart: (product: Product, quantity: number, size: string) => Promise<void>
  removeFromCart: (cartItemId: string) => Promise<void>
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  getCartTotal: () => number
  getCartItemCount: () => number
}

export const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: async () => {},
  removeFromCart: async () => {},
  updateQuantity: async () => {},
  clearCart: async () => {},
  getCartTotal: () => 0,
  getCartItemCount: () => 0,
})

export const useCart = () => useContext(CartContext)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  // Lấy giỏ hàng từ backend khi component mount hoặc khi token thay đổi
  useEffect(() => {
    if (token) fetchCartFromBackend()
  }, [token])

  const fetchCartFromBackend = async () => {
    if (!token) return
    try {
      const items = await apiService.getCartItems(token)
      // Map lại dữ liệu về đúng định dạng CartItem
      const mapped = items.map((item: any) => {
        let imageUrl = '';
        if (typeof item.product_image === 'string' && item.product_image.startsWith('http')) {
          imageUrl = item.product_image;
        } else if (typeof item.product_image === 'string' && item.product_image.length > 0) {
          imageUrl = `${BASE_URL}/uploads/${item.product_image}`;
        } else {
          imageUrl = `${BASE_URL}/uploads/default.jpg`;
        }
        return {
          product: {
            id: item.product_id,
            name: item.product_name,
            description: item.product_description,
            fullDescription: item.product_fullDescription,
            price: item.product_price,
            image: imageUrl,
            categoryId: item.product_categoryId,
            rating: item.product_rating,
            reviews: item.product_reviews,
            sizes: [item.size], // chỉ size đã chọn, nếu muốn lấy tất cả size thì cần query thêm
          },
          quantity: item.quantity,
          size: item.size,
          base_price: item.product_price,
          id: item.id,
        };
      })
      setCartItems(mapped)
    } catch (error) {
      console.error("Lỗi lấy giỏ hàng từ backend:", error)
    }
  }

  // Thêm sản phẩm vào giỏ hàng (gọi API backend)
  const addToCart = async (product: Product, quantity: number, size: string) => {
    if (!token) {
      console.warn('Token không tồn tại khi thêm vào giỏ hàng!');
      alert('Bạn cần đăng nhập để thêm vào giỏ hàng!');
      return;
    }
    try {
      await apiService.addToCart(token, { productId: product.id, quantity, size })
      await fetchCartFromBackend()
    } catch (error: any) {
      console.error("Lỗi thêm vào giỏ hàng (backend):", error, error?.response?.data);
      alert("Không thể thêm vào giỏ hàng: " + (error?.message || 'Lỗi không xác định'));
    }
  }

  // Xóa sản phẩm khỏi giỏ hàng (gọi API backend)
  const removeFromCart = async (cartItemId: string) => {
    if (!token) return
    try {
      await apiService.removeFromCart(token, cartItemId)
      await fetchCartFromBackend()
    } catch (error) {
      console.error("Lỗi xóa khỏi giỏ hàng (backend):", error)
    }
  }

  // Cập nhật số lượng sản phẩm trong giỏ hàng (gọi API backend)
  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (!token) return
    try {
      await apiService.updateCartItem(token, cartItemId, quantity)
      await fetchCartFromBackend()
    } catch (error) {
      console.error("Lỗi cập nhật sản phẩm trong giỏ hàng (backend):", error)
    }
  }

  // Xóa toàn bộ giỏ hàng (gọi API backend)
  const clearCart = async () => {
    if (!token) return
    try {
      await apiService.clearCart(token)
      setCartItems([])
    } catch (error) {
      console.error("Lỗi xóa toàn bộ giỏ hàng (backend):", error)
    }
  }

  // Tính tổng giá trị giỏ hàng
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.base_price || item.product.price) * item.quantity, 0)
  }

  // Đếm số lượng sản phẩm trong giỏ hàng
  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}