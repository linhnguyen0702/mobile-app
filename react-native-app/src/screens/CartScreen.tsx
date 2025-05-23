"use client"
import React from "react"
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image, SafeAreaView, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useCart } from "../../src/context/CartContext"
import type { StackNavigationProp } from "@react-navigation/stack"
import { ProductImage } from '../components/ProductImageComponent'
import { useAuth } from '../../src/context/AuthContext'
import apiService from '../services/apiService'

// Định nghĩa kiểu cho navigation params
type RootStackParamList = {
  Order: {
    totalPrice: number
    fromCart: boolean
  }
  Payment: {
    totalPrice: number
    fromCart: boolean
  }
  Home: undefined
  // ... thêm các màn hình khác nếu cần
}

export default function CartScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart()
  const { token, logout } = useAuth();

  const fetchCartData = async () => {
    if (!token) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
      logout();
      return;
    }

    try {
      const cartItems = await apiService.getCartItems(token);
      // ... xử lý dữ liệu
    } catch (error: any) {
      if (error.response?.status === 401) {
        Alert.alert('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại');
        logout();
      } else {
        Alert.alert('Lỗi', error.message || 'Không thể tải giỏ hàng');
      }
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert("Giỏ hàng của bạn hiện đang trống. Vui lòng thêm sản phẩm trước khi tiến hành thanh toán.")
      return
    }

    // Chuyển đến màn hình Order với tổng giá trị giỏ hàng
    navigation.navigate("Order", {
      totalPrice: getCartTotal(),
      fromCart: true,
    })
  }

  const handleClearCart = () => {
    if (cartItems.length === 0) return

    Alert.alert("Xóa giỏ hàng", "Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng của mình không?", [
      {
        text: "Hủy bỏ",
        style: "cancel",
      },
      {
        text: "Xóa",
        onPress: () => clearCart(),
        style: "destructive",
      },
    ])
  }

  const handleRemoveItem = (cartItemId: string) => {
    Alert.alert("Xóa sản phẩm", "Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng của mình không?", [
      {
        text: "Hủy bỏ",
        style: "cancel",
      },
      {
        text: "Xóa",
        onPress: () => removeFromCart(cartItemId),
        style: "destructive",
      },
    ])
  }

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <ProductImage image={item.product.image} style={styles.productImage} />
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{item.product.name}</Text>
          <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
            <Ionicons name="close-circle" size={22} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
        <Text style={styles.productSize}>Kích cỡ: {item.size}</Text>
        <View style={styles.productFooter}>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Ionicons name="remove" size={16} color={item.quantity <= 1 ? "#CCC" : "#C87D55"} />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, item.quantity + 1)}
            >
              <Ionicons name="add" size={16} color="#C87D55" />
            </TouchableOpacity>
          </View>
          <Text style={styles.productPrice}>{(item.product.price * item.quantity).toLocaleString("vi-VN")} VNĐ</Text>
        </View>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Giỏ hàng của tôi</Text>
        {cartItems.length > 0 && (
          <TouchableOpacity onPress={handleClearCart}>
            <Text style={styles.clearCartText}>Xóa tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {cartItems.length > 0 ? (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item, index) => `${item.product.id}-${item.size}-${index}`}
            contentContainerStyle={styles.cartList}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.cartSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tạm tính</Text>
              <Text style={styles.summaryValue}>{getCartTotal().toLocaleString("vi-VN")} VNĐ</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí giao hàng</Text>
              <Text style={styles.summaryValue}>20.000 VNĐ</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>{(getCartTotal() + 20000).toLocaleString("vi-VN")}</Text>
            </View>

            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutButtonText}>Tiến hành thanh toán</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyCartContainer}>
          <Ionicons name="cart-outline" size={80} color="#DDD" />
          <Text style={styles.emptyCartText}>Giỏ hàng của bạn đang trống</Text>
          <Text style={styles.emptyCartSubtext}>Thêm một vài sản phẩm vào giỏ hàng để bắt đầu</Text>
          <TouchableOpacity style={styles.continueShopping} onPress={() => navigation.navigate("Home")}>
            <Text style={styles.continueShoppingText}>Tiếp tục mua sắm</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  clearCartText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "500",
  },
  cartList: {
    padding: 15,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 15,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  productInfo: {
    flex: 1,
    marginLeft: 15,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
  },
  productSize: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 5,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "600",
    marginHorizontal: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#C87D55",
  },
  cartSummary: {
    backgroundColor: "white",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalRow: {
    marginTop: 5,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#C87D55",
  },
  checkoutButton: {
    backgroundColor: "#C87D55",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyCartText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
  },
  emptyCartSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
  },
  continueShopping: {
    marginTop: 20,
    backgroundColor: "#C87D55",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  continueShoppingText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
})
