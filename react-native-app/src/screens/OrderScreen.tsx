"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  FlatList,
  TextInput,
  Modal,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RouteProp } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useCart } from "../../src/context/CartContext"
import { useAuth } from "../../src/context/AuthContext"
import { ProductImage } from '../components/ProductImage'

// Define your navigation types
type RootStackParamList = {
  Order: {
    product?: any
    selectedSize?: string
    quantity?: number
    totalPrice?: number
    fromCart?: boolean
  }
  Payment: {
    product?: any
    selectedSize?: string
    quantity?: number
    deliveryMethod: string
    totalPrice: number
    fromCart?: boolean
    address: string
    note: string
  }
  // Add other screens as needed
}

type OrderScreenNavigationProp = StackNavigationProp<RootStackParamList, "Order">
type OrderScreenRouteProp = RouteProp<RootStackParamList, "Order">

export default function OrderScreen() {
  const navigation = useNavigation<OrderScreenNavigationProp>()
  const route = useRoute<OrderScreenRouteProp>()
  const { product, selectedSize, quantity: initialQuantity, fromCart } = route.params || {}
  const { cartItems, getCartTotal } = useCart()
  const { user } = useAuth()

  const [quantity, setQuantity] = useState<number>(initialQuantity || 1)
  const [deliveryMethod, setDeliveryMethod] = useState<"deliver" | "pickup">("deliver")
  const [discountApplied, setDiscountApplied] = useState<boolean>(true)
  const [address, setAddress] = useState<string>(user?.address || "")
  const [addressModalVisible, setAddressModalVisible] = useState(false)
  const [noteModalVisible, setNoteModalVisible] = useState(false)
  const [tempAddress, setTempAddress] = useState(address)
  const [note, setNote] = useState("")
  const [tempNote, setTempNote] = useState(note)

  // Synchronize address when user changes it in profile
  useEffect(() => {
    if (user?.address && user.address.trim() !== "" && user.address !== address) {
      setAddress(user.address)
      setTempAddress(user.address)
    }
  }, [user?.address])

  const handleBack = () => {
    navigation.goBack()
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const increaseQuantity = () => {
    setQuantity(quantity + 1)
  }

  const handleEditAddress = () => {
    setTempAddress(address)
    setAddressModalVisible(true)
  }

  const handleAddNote = () => {
    setTempNote(note)
    setNoteModalVisible(true)
  }

  const handleDiscountDetails = () => {
    // Show discount details
    Alert.alert("Chi tiết khuyến mãi", "Giảm giá 10% cho đơn hàng của bạn")
  }

  const handlePayment = () => {
    if (deliveryMethod === "deliver" && (!address || address.trim() === "")) {
      Alert.alert("Thiếu địa chỉ", "Vui lòng nhập địa chỉ giao hàng để tiếp tục thanh toán.")
      return
    }
    
    try {
      if (fromCart) {
        navigation.navigate("Payment", {
          deliveryMethod,
          totalPrice: calculateTotal(),
          fromCart: true,
          address: address,
          note,
        })
      } else if (product) {
        // Safe handling of product image to avoid serialization issues
        const productToSend = {
          ...product,
          image: typeof product.image === "string" ? product.image : 
                  product.image && product.image.toString ? product.image.toString() : "",
        }
        navigation.navigate("Payment", {
          product: productToSend,
          selectedSize,
          quantity,
          deliveryMethod,
          totalPrice: calculateTotal(),
          address: address,
          note,
        })
      } else {
        throw new Error("Missing product data")
      }
    } catch (error) {
      console.error("Payment navigation error", error)
      Alert.alert("Lỗi", "Không thể tiếp tục thanh toán. Vui lòng thử lại.")
    }
  }

  const calculateSubtotal = (): number => {
    if (fromCart) {
      return getCartTotal()
    }
    return (product?.price || 0) * quantity
  }

  const calculateDeliveryFee = (): number => {
    return deliveryMethod === "deliver" ? 20000 : 0
  }

  const calculateDiscount = (): number => {
    return discountApplied ? calculateSubtotal() * 0.1 : 0
  }

  const calculateTotal = (): number => {
    return calculateSubtotal() + calculateDeliveryFee() - calculateDiscount()
  }

  const renderCartItems = () => {
    if (!fromCart || !cartItems || cartItems.length === 0) return null

    return (
      <View style={styles.cartItemsContainer}>
        <Text style={styles.sectionTitle}>Sản phẩm trong giỏ hàng</Text>
        <FlatList
          data={cartItems}
          renderItem={({ item }) => (
            <View style={styles.cartItemSmall}>
              <ProductImage image={item.product.image} style={styles.cartItemImage} />
              <View style={styles.cartItemDetails}>
                <Text style={styles.cartItemName} numberOfLines={1}>
                  {item.product.name}
                </Text>
                <Text style={styles.cartItemSize}>Kích cỡ: {item.size}</Text>
                <View style={styles.cartItemFooter}>
                  <Text style={styles.cartItemQuantity}>x{item.quantity}</Text>
                  <Text style={styles.cartItemPrice}>
                    {(item.product.price * item.quantity).toLocaleString("vi-VN")} VNĐ
                  </Text>
                </View>
              </View>
            </View>
          )}
          keyExtractor={(item, index) => `${item.product.id || index}-${item.size}-${index}`}
          scrollEnabled={false}
        />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Delivery Options */}
        <View style={styles.deliveryOptions}>
          <TouchableOpacity
            style={[styles.deliveryOption, deliveryMethod === "deliver" && styles.activeDeliveryOption]}
            onPress={() => setDeliveryMethod("deliver")}
          >
            <Text style={[styles.deliveryOptionText, deliveryMethod === "deliver" && styles.activeDeliveryOptionText]}>
              Giao hàng
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deliveryOption, deliveryMethod === "pickup" && styles.activeDeliveryOption]}
            onPress={() => setDeliveryMethod("pickup")}
          >
            <Text style={[styles.deliveryOptionText, deliveryMethod === "pickup" && styles.activeDeliveryOptionText]}>
              Tự lấy
            </Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Address Section */}
        {deliveryMethod === "deliver" && (
          <View style={styles.addressContainer}>
            <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
            <Text style={styles.addressText}>
              {user?.firstName || ""} {user?.lastName || ""}{user?.phone ? ` - ${user.phone}` : ""}
            </Text>
            <Text style={styles.addressDetails}>{address}</Text>
            <View style={styles.addressActions}>
              <TouchableOpacity style={styles.addressAction} onPress={handleEditAddress}>
                <Ionicons name="create-outline" size={16} color="#666" />
                <Text style={styles.addressActionText}>Sửa địa chỉ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addressAction} onPress={handleAddNote}>
                <Ionicons name="document-text-outline" size={16} color="#666" />
                <Text style={styles.addressActionText}>Thêm ghi chú</Text>
              </TouchableOpacity>
            </View>
            {note ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 13, color: '#C87D55' }}>Ghi chú: {note}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Order Items */}
        {fromCart ? (
          renderCartItems()
        ) : product ? (
          <View style={styles.orderItemContainer}>
            <ProductImage image={product?.image} style={styles.productImage} />
            <View style={styles.orderItemDetails}>
              <View>
                <Text style={styles.productName}>{product?.name}</Text>
                <Text style={styles.productDescription}>{product?.description}</Text>
              </View>
              <View style={styles.quantityControls}>
                <TouchableOpacity style={styles.quantityButton} onPress={decreaseQuantity}>
                  <Ionicons name="remove" size={18} color="#C87D55" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity style={styles.quantityButton} onPress={increaseQuantity}>
                  <Ionicons name="add" size={18} color="#C87D55" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* Discount Section */}
        {discountApplied && (
          <TouchableOpacity style={styles.discountContainer} onPress={handleDiscountDetails}>
            <View style={styles.discountInfo}>
              <Ionicons name="pricetag-outline" size={20} color="#FF6B6B" />
              <Text style={styles.discountText}>Đã áp dụng 1 khuyến mãi</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        )}

        {/* Payment Summary */}
        <View style={styles.paymentSummary}>
          <Text style={styles.summaryTitle}>Tổng kết thanh toán</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính</Text>
            <Text style={styles.summaryValue}>{calculateSubtotal().toLocaleString("vi-VN")} VNĐ</Text>
          </View>
          {deliveryMethod === "deliver" && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí giao hàng</Text>
              <Text style={styles.summaryValue}>{calculateDeliveryFee().toLocaleString("vi-VN")} VNĐ</Text>
            </View>
          )}
          {discountApplied && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giảm giá</Text>
              <Text style={styles.summaryValue}>-{calculateDiscount().toLocaleString("vi-VN")} VNĐ</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{calculateTotal().toLocaleString("vi-VN")} VNĐ</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentMethod}>
          <View style={styles.paymentMethodHeader}>
            <Ionicons name="wallet-outline" size={20} color="#666" />
            <Text style={styles.paymentMethodText}>E-Wallet/Cash</Text>
            <Text style={styles.paymentAmount}>{calculateTotal().toLocaleString("vi-VN")} VNĐ</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </View>

        {/* Order Button */}
        <TouchableOpacity style={styles.orderButton} onPress={handlePayment}>
          <Text style={styles.orderButtonText}>Tiếp tục thanh toán</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal for editing address - Using Modal component for better performance */}
      <Modal
        visible={addressModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sửa địa chỉ giao hàng</Text>
            <TextInput
              style={styles.modalInput}
              value={tempAddress}
              onChangeText={setTempAddress}
              placeholder="Nhập địa chỉ mới"
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)} style={styles.modalButton}>
                <Text>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setAddress(tempAddress);
                  setAddressModalVisible(false);
                }}
                style={[styles.modalButton, { backgroundColor: "#C87D55" }]}
              >
                <Text style={{ color: "#fff" }}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for adding note - Using Modal component for better performance */}
      <Modal
        visible={noteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm ghi chú cho đơn hàng</Text>
            <TextInput
              style={styles.modalInput}
              value={tempNote}
              onChangeText={setTempNote}
              placeholder="Nhập ghi chú"
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setNoteModalVisible(false)} style={styles.modalButton}>
                <Text>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setNote(tempNote);
                  setNoteModalVisible(false);
                }}
                style={[styles.modalButton, { backgroundColor: "#C87D55" }]}
              >
                <Text style={{ color: "#fff" }}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  deliveryOptions: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#F5F5F5",
  },
  deliveryOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    marginHorizontal: 5,
  },
  activeDeliveryOption: {
    backgroundColor: "#C87D55",
  },
  deliveryOptionText: {
    fontWeight: "600",
    color: "#666",
  },
  activeDeliveryOptionText: {
    color: "white",
  },
  addressContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  addressText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 5,
  },
  addressDetails: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
  },
  addressActions: {
    flexDirection: "row",
    marginTop: 5,
  },
  addressAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginRight: 10,
  },
  addressActionText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 5,
  },
  orderItemContainer: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  orderItemDetails: {
    flex: 1,
    marginLeft: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  productDescription: {
    fontSize: 12,
    color: "#666",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#C87D55",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 10,
  },
  discountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  discountInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  discountText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
  },
  paymentSummary: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
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
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#C87D55",
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  paymentMethodHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 10,
    marginRight: 15,
  },
  paymentAmount: {
    fontSize: 14,
    color: "#666",
  },
  orderButton: {
    backgroundColor: "#C87D55",
    margin: 15,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 30,
  },
  orderButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  cartItemsContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  cartItemSmall: {
    flexDirection: "row",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  cartItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  cartItemDetails: {
    flex: 1,
    marginLeft: 10,
    justifyContent: "space-between",
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: "600",
  },
  cartItemSize: {
    fontSize: 12,
    color: "#666",
  },
  cartItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cartItemQuantity: {
    fontSize: 12,
    color: "#666",
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#C87D55",
  },
  modalOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "85%",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 6,
    padding: 10,
    minHeight: 40,
    marginBottom: 15,
    fontSize: 15,
    color: "#333",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 10,
    backgroundColor: "#f0f0f0",
  },
})