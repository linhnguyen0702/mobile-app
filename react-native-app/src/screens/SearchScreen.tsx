"use client"

import React from "react"
import { useState, useEffect } from "react"
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons, Feather } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { StackNavigationProp } from "@react-navigation/stack"
import apiService from "../services/apiService"

// Define types for navigation
type RootStackParamList = {
  ProductDetail: { productId: string }
  Search: undefined
  // Add other screens here as needed
}

// Define product interface
interface Product {
  id: string
  name: string
  description: string
  price: number
  rating: number
  image: string | { toString(): string }
  fullDescription?: string
  sizes?: string[]
  reviews?: number
  categoryId?: string
}

// Helper function for price formatting
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'decimal', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }).format(price)
}

export default function SearchScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [searchResults, setSearchResults] = useState<{ products: Product[], categories: any[] }>({ products: [], categories: [] })
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "Cappuccino", 
    "Latte", 
    "Espresso"
  ])

  // Search products when query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults({ products: [], categories: [] })
      return
    }

    setIsLoading(true)
    const timer = setTimeout(async () => {
      try {
        const results = await apiService.search(searchQuery)
        setSearchResults(results)
      } catch (error) {
        console.error("Lỗi tìm kiếm:", error)
      } finally {
        setIsLoading(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleProductPress = (product: Product) => {
    if (!recentSearches.includes(product.name)) {
      setRecentSearches(prev => [product.name, ...prev.slice(0, 4)])
    }
    navigation.navigate("ProductDetail", { productId: product.id })
  }

  const handleRecentSearchPress = (search: string) => {
    setSearchQuery(search)
  }

  const handleClearSearch = () => {
    setSearchQuery("")
  }

  const handleBack = () => {
    navigation.goBack()
  }

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.productItem}
      onPress={() => handleProductPress(item)}
    >
      <Image 
        source={{ uri: typeof item.image === 'string' ? item.image : item.image.toString() }} 
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm cà phê..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity style={styles.filterButton}>
          <Feather name="sliders" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search Results */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A6572" />
        </View>
      ) : searchQuery.length > 0 ? (
        <View style={styles.resultsContainer}>
          {searchResults.products.length > 0 ? (
            <FlatList
              data={searchResults.products}
              renderItem={renderProductItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.productList}
            />
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>Không tìm thấy kết quả</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.recentSearchesContainer}>
          <Text style={styles.recentSearchesTitle}>Tìm kiếm gần đây</Text>
          {recentSearches.map((search, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recentSearchItem}
              onPress={() => handleRecentSearchPress(search)}
            >
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.recentSearchText}>{search}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: {
    marginRight: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: "white",
  },
  clearButton: {
    padding: 5,
  },
  filterButton: {
    marginLeft: 10,
    backgroundColor: "#C87D55",
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  recentSearchesContainer: {
    padding: 15,
  },
  recentSearchesTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
  },
  recentSearchesList: {
    marginBottom: 20,
  },
  recentSearchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  recentSearchText: {
    color: "white",
    marginLeft: 10,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  productsList: {
    padding: 15,
  },
  productItem: {
    flexDirection: "row",
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
  },
  productImage: {
    width: 100,
    height: 100,
  },
  productInfo: {
    flex: 1,
    padding: 10,
    justifyContent: "space-between",
  },
  productName: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  productDescription: {
    color: "#888",
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
    color: "white",
    marginLeft: 5,
    fontSize: 14,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noResultsText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
  },
  noResultsSubtext: {
    color: "#888",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  resultsContainer: {
    flex: 1,
  },
  productList: {
    padding: 15,
  },
})