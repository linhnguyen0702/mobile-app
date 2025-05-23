"use client"

import { useState } from "react"
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Image,
  FlatList,
  Linking,
  Clipboard as RNClipboard,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { getImageSource } from "../../src/services/dataService"
import { useCart } from "../../src/context/CartContext"
import { useOrders } from "../../src/context/OrderContext"
import { useAuth } from '../../src/context/AuthContext'
import apiService from '../../src/services/apiService'

export default function PaymentScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const { product, selectedSize, quantity, deliveryMethod, totalPrice, fromCart, address, note } = route.params as any
  const { cartItems, clearCart } = useCart()
  const { addOrder } = useOrders()
  const { token } = useAuth()

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [showBankInfo, setShowBankInfo] = useState(false);

  const handleBack = () => {
    navigation.goBack()
  }

  // Hàm mở MoMo bằng deep link
  const openMomoPayment = (amount: number, orderId: string, description: string) => {
    const partnerCode = 'MOMO'; // Thay bằng mã merchant thật nếu có
    const orderInfo = encodeURIComponent(description || 'Thanh toán đơn hàng');
    const deeplink = `momo://?action=payWithApp&partnerCode=${partnerCode}&amount=${amount}&orderId=${orderId}&orderInfo=${orderInfo}`;
    Linking.openURL(deeplink).catch(() => {
      Alert.alert('Lỗi', 'Không thể mở ứng dụng MoMo trên thiết bị này.');
    });
  };

  // Hàm sao chép clipboard
  const copyToClipboard = (text: string) => {
    if (RNClipboard && RNClipboard.setString) {
      RNClipboard.setString(text);
      Alert.alert('Đã sao chép', text);
    } else {
      Alert.alert('Sao chép thủ công', text);
    }
  };

  const handlePayment = () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn phương thức thanh toán để tiếp tục.');
      return;
    }
    if (selectedPaymentMethod === 'momo') {
      setIsProcessing(true);
      setTimeout(async () => {
        setIsProcessing(false);
        try {
          let orderData;
          if (fromCart) {
            const orderItems = cartItems.map((item) => ({
              id: item.product.id,
              productName: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
              image: typeof item.product.image === "string" ? item.product.image : item.product.image.toString(),
              size: item.size,
            }))
            orderData = {
              items: orderItems,
              totalAmount: totalPrice,
              status: "processing",
              address: address || "136 Hồ Tùng Mậu, Hà Nội",
              note: note || "",
              paymentMethod: selectedPaymentMethod,
            };
          } else {
            orderData = {
              items: [
                {
                  id: product.id,
                  productName: product.name,
                  price: product.price,
                  quantity: quantity,
                  image: typeof product.image === "string" ? product.image : product.image.toString(),
                  size: selectedSize,
                },
              ],
              totalAmount: totalPrice,
              status: "processing",
              address: address || "136 Hồ Tùng Mậu, Hà Nội",
              note: note || "",
              paymentMethod: selectedPaymentMethod,
            };
          }
          await apiService.createOrder(token || '', orderData);
          clearCart();
          Linking.openURL('momo://').catch(() => {
            Alert.alert('Lỗi', 'Không thể mở ứng dụng MoMo trên thiết bị này.');
          });
          Alert.alert("Đặt hàng thành công", "Đơn hàng của bạn đã được đặt thành công!", [
            {
              text: "Xem đơn hàng của tôi",
              onPress: () => navigation.navigate("OrderHistory", { newOrder: true }),
            },
          ]);
        } catch (error) {
          Alert.alert("Lỗi", "Không thể tạo đơn hàng. Vui lòng thử lại.");
        }
      }, 2000);
      return;
    }
    if (selectedPaymentMethod === 'cash') {
      setIsProcessing(true);
      setTimeout(async () => {
        setIsProcessing(false);
        try {
          let orderData;
          if (fromCart) {
            const orderItems = cartItems.map((item) => ({
              id: item.product.id,
              productName: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
              image: typeof item.product.image === "string" ? item.product.image : item.product.image.toString(),
              size: item.size,
            }))
            orderData = {
              items: orderItems,
              totalAmount: totalPrice,
              status: "processing",
              address: address || "136 Hồ Tùng Mậu, Hà Nội",
              note: note || "",
              paymentMethod: selectedPaymentMethod,
            };
          } else {
            orderData = {
              items: [
                {
                  id: product.id,
                  productName: product.name,
                  price: product.price,
                  quantity: quantity,
                  image: typeof product.image === "string" ? product.image : product.image.toString(),
                  size: selectedSize,
                },
              ],
              totalAmount: totalPrice,
              status: "processing",
              address: address || "136 Hồ Tùng Mậu, Hà Nội",
              note: note || "",
              paymentMethod: selectedPaymentMethod,
            };
          }
          await apiService.createOrder(token || '', orderData);
          clearCart();
          Alert.alert("Đặt hàng thành công", "Đơn hàng của bạn đã được đặt thành công!", [
            {
              text: "Xem đơn hàng của tôi",
              onPress: () => navigation.navigate("OrderHistory", { newOrder: true }),
            },
          ]);
        } catch (error) {
          Alert.alert("Lỗi", "Không thể tạo đơn hàng. Vui lòng thử lại.");
        }
      }, 2000);
      return;
    }
  }

  const renderOrderSummary = () => {
    if (fromCart) {
      return (
        <View style={styles.orderSummary}>
          <Text style={styles.sectionTitle}>Tổng kết đơn hàng</Text>

          <FlatList
            data={cartItems}
            renderItem={({ item }) => (
              <View style={styles.cartItemSmall}>
                <Image
                  source={getImageSource(
                    typeof item.product.image === "string" ? item.product.image : item.product.image.toString(),
                  )}
                  style={styles.cartItemImage}
                  resizeMode="cover"
                />
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
            keyExtractor={(item, index) => `${item.product.id}-${index}`}
            scrollEnabled={false}
            style={styles.cartItemsList}
          />

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Tổng số tiền</Text>
            <Text style={styles.totalPrice}>{totalPrice.toLocaleString("vi-VN")} VNĐ</Text>
          </View>
        </View>
      )
    }

    return (
      <View style={styles.orderSummary}>
        <Text style={styles.sectionTitle}>Tổng kết đơn hàng</Text>

        <View style={styles.orderItem}>
          <Image
            source={getImageSource(typeof product.image === "string" ? product.image : product.image.toString())}
            style={styles.productImage}
            resizeMode="cover"
          />
          <View style={styles.orderItemDetails}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDescription}>{product.description}</Text>
            <Text style={styles.productSize}>Kích cỡ: {selectedSize}</Text>
            <View style={styles.quantityPrice}>
              <Text style={styles.quantity}>x{quantity}</Text>
              <Text style={styles.price}>{(product.price * quantity).toLocaleString("vi-VN")} VNĐ</Text>
            </View>
          </View>
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Tổng số tiền</Text>
          <Text style={styles.totalPrice}>{totalPrice.toLocaleString("vi-VN")} VNĐ</Text>
        </View>
      </View>
    )
  }

  // Hiển thị địa chỉ giao hàng
  const renderDeliveryAddress = () => {
    if (deliveryMethod === "deliver") {
      return (
        <View style={styles.deliveryAddressContainer}>
          <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
          <View style={styles.addressBox}>
            <Ionicons name="location-outline" size={20} color="#666" style={styles.addressIcon} />
            <View style={styles.addressDetails}>
              <Text style={styles.addressTitle}>Địa chỉ nhận hàng</Text>
              <Text style={styles.addressText}>{address}</Text>
            </View>
          </View>
        </View>
      )
    }
    return null
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {renderOrderSummary()}

        {renderDeliveryAddress()}

        <View style={styles.paymentMethods}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>

          <TouchableOpacity
            style={[styles.paymentMethod, selectedPaymentMethod === "momo" && styles.selectedPaymentMethod]}
            onPress={() => setSelectedPaymentMethod("momo")}
          >
            <View style={styles.paymentMethodInfo}>
              <Ionicons name="wallet-outline" size={24} color="#666" />
              <Text style={styles.paymentMethodText}>Ví MoMo</Text>
            </View>
            <View style={styles.radioButton}>
              {selectedPaymentMethod === "momo" && <View style={styles.radioButtonInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentMethod, selectedPaymentMethod === "cash" && styles.selectedPaymentMethod]}
            onPress={() => setSelectedPaymentMethod("cash")}
          >
            <View style={styles.paymentMethodInfo}>
              <Ionicons name="cash-outline" size={24} color="#666" />
              <Text style={styles.paymentMethodText}>Thanh toán khi nhận hàng</Text>
            </View>
            <View style={styles.radioButton}>
              {selectedPaymentMethod === "cash" && <View style={styles.radioButtonInner} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Hiển thị thông tin chuyển khoản MB Bank nếu chọn MoMo */}
        {selectedPaymentMethod === 'momo' && (
          <View style={{backgroundColor: '#fff', borderRadius: 8, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#eee'}}>
            <TouchableOpacity style={{alignSelf: 'flex-end', marginBottom: 8}} onPress={() => setShowBankInfo(!showBankInfo)}>
              <Ionicons name={showBankInfo ? 'eye-off-outline' : 'eye-outline'} size={24} color="#A50064" />
            </TouchableOpacity>
            {showBankInfo ? (
              <View>
                <Text style={{color: '#A50064', fontWeight: 'bold', fontSize: 16, marginBottom: 8, textAlign: 'center'}}>Hướng dẫn chuyển khoản qua ngân hàng MB (dùng app MoMo hoặc ngân hàng bất kỳ)</Text>
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                  <Text style={{fontWeight: 'bold', fontSize: 15, flex: 1}}>Số tài khoản:</Text>
                  <Text selectable style={{fontSize: 15, color: '#222', marginRight: 8}}>1965196612004</Text>
                </View>
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                  <Text style={{fontWeight: 'bold', fontSize: 15, flex: 1}}>Chủ tài khoản:</Text>
                  <Text selectable style={{fontSize: 15, color: '#222', marginRight: 8}}>NGUYEN THI HANH AN</Text>
                </View>
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                  <Text style={{fontWeight: 'bold', fontSize: 15, flex: 1}}>Ngân hàng:</Text>
                  <Text selectable style={{fontSize: 15, color: '#222', marginRight: 8}}>MB Bank</Text>
                </View>
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                  <Text style={{fontWeight: 'bold', fontSize: 15, flex: 1}}>Số tiền:</Text>
                  <Text selectable style={{fontSize: 15, color: '#222', marginRight: 8}}>{totalPrice?.toLocaleString('vi-VN')} đ</Text>
                </View>
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                  <Text style={{fontWeight: 'bold', fontSize: 15, flex: 1}}>Nội dung:</Text>
                  <Text selectable style={{fontSize: 15, color: '#222', marginRight: 8}}>{`Thanh toan don hang #${product?.id || ''}`}</Text>
                </View>
                <Text style={{color: '#A50064', fontSize: 13, marginTop: 8, textAlign: 'center'}}>Sau khi chuyển khoản, vui lòng chờ xác nhận đơn hàng!</Text>
              </View>
            ) : (
              <Text style={{color: '#A50064', fontSize: 15, textAlign: 'center'}}>Bấm vào <Ionicons name="eye-outline" size={18} color="#A50064" /> để xem thông tin chuyển khoản</Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Text style={styles.payButtonText}>Đang xử lý...</Text>
          ) : selectedPaymentMethod === "momo" ? (
            <Text style={styles.payButtonText}>
              Thanh toán với MoMo {totalPrice.toLocaleString("vi-VN")} VNĐ
            </Text>
          ) : selectedPaymentMethod === "cash" ? (
            <Text style={styles.payButtonText}>Đặt hàng</Text>
          ) : (
            <Text style={styles.payButtonText}>Thanh toán</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  orderSummary: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
  },
  orderItem: {
    flexDirection: "row",
    marginBottom: 15,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  orderItemDetails: {
    flex: 1,
    marginLeft: 15,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  productDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  productSize: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  quantityPrice: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantity: {
    fontSize: 14,
    color: "#666",
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#C87D55",
  },
  deliveryAddressContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  addressBox: {
    flexDirection: "row",
    backgroundColor: "#F8F8F8",
    padding: 12,
    borderRadius: 10,
  },
  addressIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  addressDetails: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
  },
  addressText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  paymentMethods: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  selectedPaymentMethod: {
    backgroundColor: "rgba(200, 125, 85, 0.1)",
  },
  paymentMethodInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentMethodText: {
    fontSize: 16,
    marginLeft: 15,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#C87D55",
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#C87D55",
  },
  payButton: {
    backgroundColor: "#C87D55",
    margin: 15,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 30,
  },
  payButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  payButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  cartItemsList: {
    marginBottom: 15,
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
})
