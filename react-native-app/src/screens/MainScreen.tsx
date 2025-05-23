import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { Product, Category } from '../services/dataService';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProductImage } from '../components/ProductImageComponent';

// Định nghĩa kiểu cho navigation
type RootStackParamList = {
  ProductDetail: { productId: string };
  // ... các màn khác nếu có
};

export default function MainScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { products, categories, isLoading, error, selectedCategory, setSelectedCategory } = useProducts();
  const { addToCart } = useCart();

  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Sort categories theo id tăng dần
  const sortedCategories = [...categories].sort((a, b) => Number(a.id) - Number(b.id));

  useEffect(() => {
    if (selectedCategory && selectedCategory !== "1") {
      setFilteredProducts(products.filter(
        (product) => String(product.categoryId) === String(selectedCategory)
      ));
    } else {
      setFilteredProducts(products);
    }
  }, [products, selectedCategory]);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1, 'M');
    // Có thể hiện toast/thông báo thành công ở đây
    alert(`Đã thêm ${product.name} vào giỏ hàng!`);
  };

  const renderCategoryItem = ({ item }: { item: Category }) => {
    if (!item) return null;
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          selectedCategory === item.id && styles.selectedCategory
        ]}
        onPress={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
      >
        <Text style={[
          styles.categoryText,
          selectedCategory === item.id && styles.selectedCategoryText
        ]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    if (!item) return null;
    return (
      <View style={styles.productItem}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ProductDetail', { productId: String(item.id) })}
        >
          <ProductImage image={item.image} style={styles.productImage} />
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productDescription}>{item.description}</Text>
            <Text style={styles.productPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={{position: 'absolute', top: 10, right: 10, backgroundColor: '#C87D55', borderRadius: 8, padding: 6}} onPress={() => handleAddToCart(item)}>
          <Text style={{color: 'white', fontWeight: 'bold', fontSize: 18}}>+</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C87D55" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedCategories}
        renderItem={renderCategoryItem}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesList}
      />
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.productsList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7E4D4', // màu cam chủ đạo
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  categoriesList: {
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
  },
  categoryItem: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  selectedCategory: {
    backgroundColor: '#C87D55',
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  productsList: {
    padding: 10,
  },
  productItem: {
    flex: 1,
    margin: 5,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C87D55',
  },
}); 