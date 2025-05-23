"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  ActivityIndicator,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons, Feather } from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context"
import { useFavorites } from "../../src/context/FavoritesContext"
import { useCart } from "../../src/context/CartContext"
import { getCategories, getProducts, Product, Category } from "../../src/services/dataService"
import { ProductImage } from '../components/ProductImageComponent'

// Define navigation types
type RootStackParamList = {
  ProductDetail: { productId: string }
  Search: undefined
}

export default function HomeScreen() {
  const navigation = useNavigation<any>()
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites()
  const { addToCart } = useCart()

  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState("1")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const categoriesData = await getCategories()
        setCategories(categoriesData)

        const productsData = await getProducts()
        // Xử lý dữ liệu sản phẩm để đảm bảo các trường có giá trị đúng
        const processedProducts = productsData.map(product => ({
          ...product,
          id: String(product.id),
          price: typeof product.price === 'number' ? product.price : 
                 typeof product.price === 'string' ? parseFloat(product.price) : 0,
          image: typeof product.image === 'string' ? product.image : 
                 product.image?.toString?.() || 'coffee1.jpg',
          fullDescription: product.fullDescription || product.description || '',
          sizes: Array.isArray(product.sizes)
            ? product.sizes.map((s: any) => typeof s === 'string' ? s : s.size)
            : ['M'],
          reviews: typeof product.reviews === 'number' ? product.reviews : (typeof (product as any).reviews_count === 'number' ? (product as any).reviews_count : 0),
          rating:
            typeof product.rating === 'number'
              ? product.rating
              : typeof product.rating === 'string'
                ? parseFloat(product.rating)
                : typeof (product as any).averageRating === 'number'
                  ? (product as any).averageRating
                  : typeof (product as any).averageRating === 'string'
                    ? parseFloat((product as any).averageRating)
                    : 0,
          categoryId: typeof product.categoryId !== 'undefined' ? String(product.categoryId) : (typeof (product as any).category_id !== 'undefined' ? String((product as any).category_id) : "")
        }))
        
        setProducts(processedProducts)
        setFilteredProducts(processedProducts)
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Sắp xếp lại category theo id tăng dần
  const sortedCategories = [...categories].sort((a, b) => Number(a.id) - Number(b.id));

  const filterProductsByCategory = (categoryId: string) => {
    setSelectedCategory(categoryId)
    if (categoryId === "1") {
      setFilteredProducts(products)
    } else {
      const filtered = products.filter((product) => String(product.categoryId) === String(categoryId))
      setFilteredProducts(filtered)
    }
  }

  const handleProductPress = (product: Product) => {
    navigation.navigate("ProductDetail", { productId: product.id })
  }

  const handleSearchPress = () => {
    navigation.navigate("Search")
  }

  const handleFavoritePress = (product: Product) => {
    if (isFavorite(product.id)) {
      removeFromFavorites(product.id)
    } else {
      addToFavorites(product)
    }
  }

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1, "M")
    alert(`Đã thêm ${product.name} vào giỏ hàng!`)
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C87D55" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.searchBar} onPress={handleSearchPress}>
          <Feather name="search" size={20} color="#888" />
          <Text style={styles.searchText}>Tìm kiếm</Text>
          <View style={styles.filterButton}>
            <Feather name="sliders" size={18} color="white" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={require("../../assets/images/promo-banner.jpg")}
          style={styles.promoContainer}
          imageStyle={styles.promoImage}
        >
          <View style={styles.promoTag}>
            <Text style={styles.promoTagText}>Khuyến mãi</Text>
          </View>
          <Text style={styles.promoTitle}>Mua 1 tặng 1</Text>
        </ImageBackground>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {sortedCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryItem, selectedCategory === category.id && styles.selectedCategory]}
              onPress={() => filterProductsByCategory(category.id)}
            >
              <Text style={[styles.categoryText, selectedCategory === category.id && styles.selectedCategoryText]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.productsGrid}>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              return (
                <View key={product.id} style={styles.productCard}>
                  <TouchableOpacity style={styles.favoriteButton} onPress={() => handleFavoritePress(product)}>
                    <Ionicons
                      name={isFavorite(product.id) ? "heart" : "heart-outline"}
                      size={24}
                      color={isFavorite(product.id) ? "#FF6B6B" : "#888"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleProductPress(product)}>
                    <View style={{ position: 'relative' }}>
                      <ProductImage 
                        image={product.image}
                        style={styles.productImage}
                      />
                      {/* Rating badge overlay */}
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text style={styles.ratingBadgeText}>{product.rating?.toFixed(1) ?? "0.0"}</Text>
                      </View>
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productDescription} numberOfLines={2}>
                        {product.description}
                      </Text>
                      <View style={styles.productFooter}>
                        <Text style={styles.productPrice}>
                          {Number(product.price).toLocaleString('vi-VN')} VNĐ
                        </Text>
                        <TouchableOpacity style={styles.addButton} onPress={() => handleAddToCart(product)}>
                          <Ionicons name="add" size={20} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              )
            })
          ) : (
            <Text style={styles.noProductsText}>Không có sản phẩm nào</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#BF9264",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 10,
  },
  searchText: {
    flex: 1,
    marginLeft: 10,
    color: "#888",
    fontSize: 16,
  },
  filterButton: {
    backgroundColor: "#C87D55",
    padding: 8,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  promoContainer: {
    height: 200,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 20,
    overflow: "hidden",
  },
  promoImage: {
    borderRadius: 20,
  },
  promoTag: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: "#C87D55",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  promoTagText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  promoTitle: {
    position: "absolute",
    bottom: 20,
    left: 20,
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  categoriesContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  categoryItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  selectedCategory: {
    backgroundColor: "#C87D55",
  },
  categoryText: {
    color: "#666",
    fontSize: 16,
  },
  selectedCategoryText: {
    color: "white",
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    justifyContent: "space-between",
  },
  productCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  favoriteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 5,
  },
  productImage: {
    width: "100%",
    height: 150,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  productDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#C87D55",
  },
  addButton: {
    backgroundColor: "#C87D55",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  noProductsText: {
    width: "100%",
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
  },
  ratingBadgeText: {
    color: '#fff',
    marginLeft: 3,
    fontSize: 13,
    fontWeight: 'bold',
  },
})
