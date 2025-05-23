"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { BASE_URL } from '../config/constants'

// Định nghĩa kiểu dữ liệu cho sản phẩm
export interface Product {
  id: string
  name: string
  description: string
  price: number
  rating: number
  reviews: number
  image: any
  fullDescription: string
  sizes: string[]
}

// Định nghĩa kiểu dữ liệu cho context
interface FavoritesContextType {
  favorites: Product[]
  addToFavorites: (product: Product) => void
  removeFromFavorites: (productId: string) => void
  isFavorite: (productId: string) => boolean
  clearFavorites: () => void
}

// Tạo context
export const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  addToFavorites: () => {},
  removeFromFavorites: () => {},
  isFavorite: () => false,
  clearFavorites: () => {},
})

// Hook để sử dụng context
export const useFavorites = () => useContext(FavoritesContext)

// Provider component
export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Product[]>([])

  // Tải danh sách yêu thích từ AsyncStorage khi component được mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const storedFavorites = await AsyncStorage.getItem("favorites")
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites))
        }
      } catch (error) {
        console.error("Tải mục yêu thích thất bại", error)
      }
    }

    loadFavorites()
  }, [])

  // Lưu danh sách yêu thích vào AsyncStorage khi có thay đổi
  useEffect(() => {
    const saveFavorites = async () => {
      try {
        await AsyncStorage.setItem("favorites", JSON.stringify(favorites))
      } catch (error) {
        console.error("Lưu mục yêu thích thất bại", error)
      }
    }

    saveFavorites()
  }, [favorites])

  // Thêm sản phẩm vào danh sách yêu thích
  const addToFavorites = (product: Product) => {
    let imageUrl = '';
    if (typeof product.image === 'string' && product.image.startsWith('http')) {
      imageUrl = product.image;
    } else if (typeof product.image === 'string' && product.image.length > 0) {
      imageUrl = `${BASE_URL}/uploads/${product.image}`;
    } else {
      imageUrl = `${BASE_URL}/uploads/coffee1.jpg`; // Ảnh mặc định nếu không có ảnh
    }
    setFavorites((prevFavorites) => {
      if (prevFavorites.some((item) => item.id === product.id)) {
        return prevFavorites;
      }
      // Lấy rating và reviews từ nhiều trường
      const rating =
        typeof product.rating === 'number'
          ? product.rating
          : typeof (product as any).averageRating === 'number'
            ? (product as any).averageRating
            : typeof (product as any).rating === 'string'
              ? parseFloat((product as any).rating)
              : typeof (product as any).averageRating === 'string'
                ? parseFloat((product as any).averageRating)
                : 0;
      const reviews =
        typeof product.reviews === 'number'
          ? product.reviews
          : typeof (product as any).reviews_count === 'number'
            ? (product as any).reviews_count
            : 0;
      return [
        ...prevFavorites,
        {
          ...product,
          image: imageUrl,
          rating,
          reviews,
        },
      ];
    });
  }

  // Xóa sản phẩm khỏi danh sách yêu thích
  const removeFromFavorites = (productId: string) => {
    setFavorites((prevFavorites) => prevFavorites.filter((product) => product.id !== productId))
  }

  // Kiểm tra xem sản phẩm có trong danh sách yêu thích không
  const isFavorite = (productId: string) => {
    return favorites.some((product) => product.id === productId)
  }

  // Xóa toàn bộ danh sách yêu thích
  const clearFavorites = () => {
    setFavorites([])
    AsyncStorage.removeItem("favorites")
  }

  return (
    <FavoritesContext.Provider value={{ favorites, addToFavorites, removeFromFavorites, isFavorite, clearFavorites }}>
      {children}
    </FavoritesContext.Provider>
  )
}
