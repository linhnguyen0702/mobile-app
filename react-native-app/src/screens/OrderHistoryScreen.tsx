"use client"

import { useState, useEffect } from "react"
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  RefreshControl, 
  ActivityIndicator, 
  Alert 
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useOrders, type Order, type OrderItem } from "../../src/context/OrderContext"
import { ProductImage } from '../components/ProductImageComponent'

export default function OrderHistoryScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const { orders, refreshOrders, cancelOrder } = useOrders()

  const [refreshing, setRefreshing] = useState(false)
  const [selectedTab, setSelectedTab] = useState<"all" | "processing" | "delivered" | "cancelled" | "pending">("all")
  const [isLoading, setIsLoading] = useState(true)

  // Load orders when screen mounts or when coming back to this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadOrders()
    })
    
    // Initial load
    loadOrders()
    
    // Cleanup listener on unmount
    return unsubscribe
  }, [navigation])

  // Check for new order passed via route params
  useEffect(() => {
    if (route.params?.newOrder) {
      // If there's a new order, refresh orders and show processing tab
      refreshOrders()
      setSelectedTab("processing")
      
      // Clear the param to prevent reloading on subsequent renders
      navigation.setParams({ newOrder: null })
    }
  }, [route.params?.newOrder])

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      await refreshOrders()
    } catch (error) {
      console.error("Lỗi tải danh sách đơn hàng:", error)
      Alert.alert("Lỗi", "Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.")
    } finally {
      setIsLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshOrders()
    } catch (error) {
      console.error("Lỗi cập nhật danh sách đơn hàng:", error)
      Alert.alert("Lỗi", "Không thể cập nhật danh sách đơn hàng. Vui lòng thử lại sau.")
    } finally {
      setRefreshing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processing":
        return "#3498db" // Xanh dương
      case "pending":
        return "#f39c12" // Cam
      case "delivered":
        return "#2ecc71" // Xanh lá
      case "cancelled":
        return "#e74c3c" // Đỏ
      default:
        return "#7f8c8d" // Xám
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "processing":
        return "Đang xử lý"
      case "pending":
        return "Đang giao"
      case "delivered":
        return "Đã giao"
      case "cancelled":
        return "Đã hủy"
      default:
        return "Không xác định"
    }
  }

  const filteredOrders = selectedTab === "all" 
    ? orders 
    : orders.filter((order) => order.status === selectedTab)

  const handleCancelOrder = async (order: Order) => {
    if (order.status === "pending") {
      Alert.alert(
        "Không thể hủy đơn hàng",
        "Đơn hàng đang trong quá trình giao, không thể hủy.",
        [{ text: "OK" }]
      )
      return
    }

    if (order.status === "delivered") {
      Alert.alert(
        "Không thể hủy đơn hàng",
        "Đơn hàng đã được giao, không thể hủy.",
        [{ text: "OK" }]
      )
      return
    }

    if (order.status === "cancelled") {
      Alert.alert(
        "Đơn hàng đã hủy",
        "Đơn hàng này đã được hủy trước đó.",
        [{ text: "OK" }]
      )
      return
    }

    Alert.alert(
      "Xác nhận hủy đơn hàng",
      "Bạn có chắc chắn muốn hủy đơn hàng này?",
      [
        {
          text: "Không",
          style: "cancel"
        },
        {
          text: "Có",
          onPress: async () => {
            try {
              await cancelOrder(order.id)
              await refreshOrders() // Refresh để cập nhật trạng thái mới nhất
              Alert.alert("Thành công", "Đơn hàng đã được hủy")
              // Không tự động chuyển tab, để người dùng chủ động chọn
            } catch (error) {
              console.error("Lỗi hủy đơn hàng:", error)
              Alert.alert("Lỗi", "Không thể hủy đơn hàng. Vui lòng thử lại sau.")
            }
          }
        }
      ]
    )
  }

  // Helper function for price formatting
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderDate}>Đơn hàng ngày {new Date(item.date).toLocaleDateString('vi-VN')}</Text>
          <Text style={styles.orderId}>#{item.id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {item.items && item.items.length > 0 ? (
          item.items.map((orderItem: OrderItem) => (
          <View key={orderItem.id} style={styles.orderItemRow}>
              <ProductImage image={orderItem.image} style={styles.itemImage} />
            <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">
                  {orderItem.productName}
                </Text>
                <Text style={styles.itemSize}>Kích cỡ: {orderItem.size || 'Mặc định'}</Text>
              <View style={styles.itemPriceRow}>
                <Text style={styles.itemQuantity}>x{orderItem.quantity}</Text>
                  <Text style={styles.itemPrice}>{formatPrice(orderItem.price)} VNĐ</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noItemsText}>Không có sản phẩm</Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.addressContainer}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">
            {item.address || 'Không có địa chỉ'}
          </Text>
        </View>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalAmount}>{formatPrice(item.totalAmount)} VNĐ</Text>
        </View>
      </View>

      <View style={styles.orderActions}>
        {item.status === "processing" && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancelOrder(item)}
          >
            <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.actionButton, item.status !== "processing" && styles.fullWidthButton]} 
          onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
        >
          <Text style={styles.actionButtonText}>Chi tiết đơn hàng</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderTabItem = (tabName: "all" | "processing" | "delivered" | "cancelled" | "pending", label: string) => {
    const count = tabName === "all" 
      ? orders.length 
      : orders.filter(order => order.status === tabName).length
      
    return (
      <TouchableOpacity
        style={[styles.tab, selectedTab === tabName && styles.activeTab]}
        onPress={() => setSelectedTab(tabName)}
      >
        <Text style={[styles.tabText, selectedTab === tabName && styles.activeTabText]}>
          {label} {count > 0 && `(${count})`}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Main", { screen: "Home" })}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử đơn hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabScrollContainer}>
      <View style={styles.tabContainer}>
          {renderTabItem("all", "Tất cả")}
          {renderTabItem("processing", "Đang xử lý")}
          {renderTabItem("pending", "Đang giao")}
          {renderTabItem("delivered", "Đã giao")}
          {renderTabItem("cancelled", "Đã hủy")}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C87D55" />
        </View>
      ) : filteredOrders.length > 0 ? (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#C87D55"]} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={60} color="#DDD" />
          <Text style={styles.emptyText}>Không có đơn hàng nào</Text>
          <Text style={styles.emptySubtext}>Các đơn hàng của bạn sẽ hiển thị tại đây</Text>
          <TouchableOpacity 
            style={styles.shopButton} 
            onPress={() => navigation.navigate("Main", { screen: "Home" })}
          >
            <Text style={styles.shopButtonText}>Mua sắm ngay</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "white",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  tabScrollContainer: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    marginHorizontal: 2,
    borderRadius: 5,
    minWidth: 70,
  },
  activeTab: {
    backgroundColor: "#C87D55",
  },
  tabText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  activeTabText: {
    color: "white",
    fontWeight: "bold",
  },
  ordersList: {
    padding: 15,
    paddingBottom: 30,
  },
  orderCard: {
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingBottom: 10,
  },
  orderInfo: {
    flex: 1,
  },
  orderDate: {
    fontSize: 14,
    fontWeight: "bold",
  },
  orderId: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  orderItems: {
    marginBottom: 15,
  },
  orderItemRow: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "center",
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 5,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
  },
  itemSize: {
    fontSize: 12,
    color: "#666",
  },
  itemPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  itemQuantity: {
    fontSize: 12,
    color: "#666",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#C87D55",
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 10,
    marginBottom: 15,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  addressText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 5,
    flex: 1,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 5,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#C87D55",
  },
  orderActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C87D55",
    borderRadius: 5,
    marginHorizontal: 5,
  },
  fullWidthButton: {
    marginHorizontal: 0,
  },
  actionButtonText: {
    color: "#C87D55",
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#FFF0F0",
    borderColor: "#FF6B6B",
  },
  cancelButtonText: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: "#C87D55",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noItemsText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    padding: 10,
  },
})