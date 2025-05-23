"use client"

import React from "react"
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useFavorites } from '../context/FavoritesContext'
import { Swipeable } from 'react-native-gesture-handler';

// Define Product interface directly in this file
// Later you can move this to a types.ts file
interface Product {
  id: string
  name: string
  description: string
  price: number
  rating: number
  image: string
  reviews: number
  fullDescription: string
  sizes: string[]
}

export default function FavoritesScreen() {
  // Use any type for navigation temporarily
  const navigation = useNavigation<any>()
  const { favorites, removeFromFavorites, isFavorite, clearFavorites } = useFavorites()
  const [isLoading, setIsLoading] = React.useState(false)
  const [refreshing, setRefreshing] = React.useState(false)

  const handleProductPress = (product: Product) => {
    navigation.navigate("ProductDetail", { productId: product.id })
  }

  const handleRemoveFavorite = (productId: string) => {
    removeFromFavorites(productId)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    // Simulate a refresh - in a real app, you might refetch data here
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }

  const renderRightActions = (item: Product) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => handleRemoveFavorite(item.id)}
    >
      <Ionicons name="trash" size={24} color="#fff" />
      <Text style={styles.deleteButtonText}>Xoá</Text>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <Swipeable renderRightActions={() => renderRightActions(item)}>
    <TouchableOpacity style={styles.productItem} onPress={() => handleProductPress(item)} activeOpacity={0.7}>
      <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
          <View style={styles.sizesContainer}>
            {item.sizes.map((size, index) => (
              <View key={index} style={styles.sizeTag}>
                <Text style={styles.sizeText}>{size}</Text>
              </View>
            ))}
          </View>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>{item.price.toLocaleString("vi-VN")} VNĐ</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{(typeof item.rating === 'number' ? item.rating : 0).toFixed(1)}</Text>
              <Text style={styles.reviewsText}>({typeof item.reviews === 'number' ? item.reviews : 0})</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => handleRemoveFavorite(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="heart" size={24} color="#FF6B6B" />
      </TouchableOpacity>
    </TouchableOpacity>
    </Swipeable>
  )

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={60} color="#DDD" />
      <Text style={styles.emptyText}>Chưa có mục yêu thích nào.</Text>
      <Text style={styles.emptySubtext}>Các mục được thêm vào mục yêu thích của bạn sẽ hiển thị tại đây.</Text>
      <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate("Home")}>
        <Text style={styles.browseButtonText}>Xem sản phẩm</Text>
      </TouchableOpacity>
    </View>
  )

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Yêu thích</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C87D55" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yêu thích</Text>
        {favorites.length > 0 && (
          <TouchableOpacity onPress={clearFavorites}>
            <Text style={{ color: '#FF6B6B', fontSize: 14, fontWeight: '500' }}>Xóa tất cả</Text>
          </TouchableOpacity>
        )}
        {favorites.length > 0 && (
          <Text style={styles.itemCount}>
            {favorites.length} mục
          </Text>
        )}
      </View>

      <FlatList
        data={favorites}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.productsList, favorites.length === 0 && styles.emptyList]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyComponent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#BF9264",
  },
  header: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  itemCount: {
    fontSize: 14,
    color: "white",
  },
  productsList: {
    padding: 15,
  },
  emptyList: {
    flexGrow: 1,
  },
  productItem: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
    position: "relative",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
  },
  productInfo: {
    flex: 1,
    padding: 10,
    justifyContent: "space-between",
  },
  productName: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  productDescription: {
    color: "black",
    fontSize: 14,
    marginTop: 5,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  productPrice: {
    color: "#C87D55",
    fontSize: 16,
    fontWeight: "bold",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    color: "black",
    marginLeft: 5,
    fontSize: 14,
  },
  favoriteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
  },
  emptySubtext: {
    color: "#888",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
    marginBottom: 30,
  },
  browseButton: {
    backgroundColor: "#BF9264",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sizesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    gap: 5,
  },
  sizeTag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 4,
  },
  sizeText: {
    fontSize: 12,
    color: '#666',
  },
  reviewsText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 2,
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '90%',
    borderRadius: 10,
    marginVertical: 5,
    flexDirection: 'column',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
  },
})
