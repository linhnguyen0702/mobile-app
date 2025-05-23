"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import apiService from "../services/apiService"
import { useAuth } from "./AuthContext"

// Định nghĩa kiểu dữ liệu cho đơn hàng
export interface OrderItem {
  id: string
  productName: string
  price: number
  quantity: number
  image: string
  size: string
}

export interface Order {
  id: string
  date: string
  items: OrderItem[]
  totalAmount: number
  status: "pending" | "delivered" | "cancelled" | "processing"
  address: string
  note?: string
}

interface OrderContextType {
  orders: Order[]
  addOrder: (order: Omit<Order, "id" | "date">) => Promise<void>
  updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<void>
  cancelOrder: (orderId: string) => Promise<void>
  getOrderById: (orderId: string) => Order | undefined
  refreshOrders: () => Promise<void>
  confirmUserTransfer: (orderId: string) => Promise<void>
}

const OrderContext = createContext<OrderContextType>({
  orders: [],
  addOrder: async () => {},
  updateOrderStatus: async () => {},
  cancelOrder: async () => {},
  getOrderById: () => undefined,
  refreshOrders: async () => {},
  confirmUserTransfer: async () => {},
})

export const useOrders = () => useContext(OrderContext)

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([])
  const { token } = useAuth()

  // Tải danh sách đơn hàng khi component được mount hoặc token thay đổi
  const refreshOrders = async () => {
    if (!token) {
      setOrders([])
      return
    }

    try {
      const orderHistory = await apiService.getOrderHistory(token)
      
      if (Array.isArray(orderHistory)) {
        setOrders(orderHistory)
      } else {
        setOrders([])
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status) {
          console.error("Mã trạng thái:", error.response.status)
        }
        if (error.response.data) {
          console.error("Dữ liệu trả về:", error.response.data)
        }
      }
      setOrders([])
    }
  }

  useEffect(() => {
    if (token) {
      refreshOrders()
    } else {
      setOrders([])
    }
  }, [token])

  // Thêm đơn hàng mới
  const addOrder = async (orderData: Omit<Order, "id" | "date">) => {
    if (!token) return
    try {
      await apiService.createOrder(token, orderData)
      await refreshOrders() // Refresh lại danh sách đơn hàng sau khi tạo mới
    } catch (error) {
      throw error // Ném lỗi để component gọi có thể xử lý
    }
  }

  // Cập nhật trạng thái đơn hàng
  const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
    if (!token) return
    try {
      await apiService.updateOrderStatus(token, orderId, status)
      await refreshOrders() // Refresh lại danh sách đơn hàng sau khi cập nhật
    } catch (error) {
      throw error
    }
  }

  // Hủy đơn hàng
  const cancelOrder = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, "cancelled")
    } catch (error) {
      throw error
    }
  }

  // Lấy đơn hàng theo ID
  const getOrderById = (orderId: string) => {
    return orders.find((order) => order.id === orderId)
  }

  const confirmUserTransfer = async (orderId: string) => {
    if (!token) return;
    try {
      await apiService.confirmUserTransfer(token, orderId);
      await refreshOrders();
    } catch (error) {
      throw error;
    }
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        addOrder,
        updateOrderStatus,
        cancelOrder,
        getOrderById,
        refreshOrders,
        confirmUserTransfer,
      }}
    >
      {children}
    </OrderContext.Provider>
  )
}
