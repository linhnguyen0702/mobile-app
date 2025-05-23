"use client"

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Product } from '../services/dataService';
import { ProductImage } from '../components/ProductImageComponent';

interface RouteParams {
  productId: string;
}

export default function ProductDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { productId } = route.params as RouteParams;
  const { getProductById } = useProducts();
  const { addToCart } = useCart();
  const { token } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getProductById(productId);
      if (data) {
        setProduct(data);
        const defaultSize = 'M';
        setSelectedSize(defaultSize);
      } else {
        setError('Không tìm thấy sản phẩm');
      }
    } catch (error) {
      setError('Lỗi tải sản phẩm');
      console.error('Lỗi tải sản phẩm:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!token) {
      Alert.alert('Vui lòng đăng nhập', 'Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng');
      navigation.navigate('Login' as never);
      return;
    }

    if (!selectedSize || !product) {
      Alert.alert('Vui lòng chọn kích thước', 'Bạn cần chọn kích thước sản phẩm');
      return;
    }

    try {
      await addToCart(product, quantity, selectedSize);
      Alert.alert('Thành công', 'Đã thêm sản phẩm vào giỏ hàng', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Main' as never)
        }
      ]);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể thêm sản phẩm vào giỏ hàng');
      console.error('Lỗi thêm vào giỏ hàng:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C87D55" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Không tìm thấy sản phẩm'}</Text>
      </View>
    );
  }

  const getPriceModifier = () => {
    if (!product || !selectedSize) return 0;
    if (typeof product.sizes[0] === 'string') return 0;
    const sizeObj = (product.sizes as any[]).find(s => s.size === selectedSize);
    return sizeObj ? Number(sizeObj.price_modifier) : 0;
  };

  const priceModifier = getPriceModifier();
  const totalPrice = product.price * quantity + priceModifier * quantity;
  const imageSource = { uri: typeof product.image === 'string' ? product.image : product.image?.toString?.() || '' };

  return (
    <ScrollView style={styles.container}>
      <ProductImage image={product.image} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{totalPrice.toLocaleString('vi-VN')}đ</Text>
        <Text style={styles.description}>{product.description}</Text>
        {product.fullDescription && (
          <View style={styles.fullDescriptionBox}>
            <Text style={styles.fullDescriptionTitle}>Mô tả chi tiết</Text>
            <Text style={styles.fullDescription}>{product.fullDescription}</Text>
          </View>
        )}
        <View style={styles.ratingRow}>
          <Text style={styles.ratingText}>⭐ {product.rating || 0}</Text>
          <Text style={styles.reviewsText}>({product.reviews || (product as any).reviews_count || 0} đánh giá)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn size</Text>
          <View style={styles.sizeContainer}>
            {product.sizes.map((size, idx) => {
              let display = size;
              let priceMod = 0;
              if (typeof size !== 'string' && (size as any).size) {
                display = (size as any).size;
                priceMod = Number((size as any).price_modifier) || 0;
              }
              return (
                <TouchableOpacity
                  key={display + idx}
                  style={[
                    styles.sizeButton,
                    selectedSize === display && styles.selectedSize,
                  ]}
                  onPress={() => setSelectedSize(display)}
                >
                  <Text
                    style={[
                      styles.sizeText,
                      selectedSize === display && styles.selectedSizeText,
                    ]}
                  >
                    {display}
                  </Text>
                  <Text style={styles.sizePriceText}>
                    {priceMod !== 0 ? `${priceMod > 0 ? '+' : ''}${priceMod.toLocaleString('vi-VN')}đ` : '+0đ'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Số lượng</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
          <Text style={styles.addToCartButtonText}>Thêm vào giỏ hàng</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  image: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C87D55',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sizeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  sizeButton: {
    minWidth: 80,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedSize: {
    backgroundColor: '#C87D55',
    borderColor: '#C87D55',
  },
  sizeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  selectedSizeText: {
    color: '#fff',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    color: '#333',
  },
  quantityText: {
    fontSize: 18,
    marginHorizontal: 20,
  },
  addToCartButton: {
    backgroundColor: '#C87D55',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fullDescriptionBox: {
    marginBottom: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
  },
  fullDescriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C87D55',
    marginBottom: 6,
  },
  fullDescription: {
    fontSize: 15,
    color: '#444',
    marginBottom: 16,
    lineHeight: 22,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingText: {
    fontSize: 16,
    color: '#C87D55',
    fontWeight: 'bold',
    marginRight: 8,
  },
  reviewsText: {
    fontSize: 14,
    color: '#888',
  },
  sizePriceText: {
    fontSize: 14,
    color: '#C87D55',
    fontWeight: 'bold',
    marginTop: 4,
  },
});