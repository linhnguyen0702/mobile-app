import React, { useState } from 'react';
import { Image, ImageStyle, ActivityIndicator, View, StyleSheet } from 'react-native';
import { BASE_URL } from '../config/constants';

const DEFAULT_IMAGE = 'https://via.placeholder.com/150';

interface ProductImageProps {
  image: string | { toString(): string };
  style: ImageStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

export const ProductImage: React.FC<ProductImageProps> = ({ 
  image, 
  style,
  resizeMode = 'cover'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const getImageUrl = () => {
    if (!image) return DEFAULT_IMAGE;
    
    const imageStr = typeof image === 'string' ? image : image.toString();
    
    if (imageStr.startsWith('http')) {
      return imageStr;
    }
    
    // Nếu là đường dẫn tương đối, thêm base URL
    return `${BASE_URL}/uploads/${imageStr}`;
  };

  return (
    <View style={[style, styles.container]}>
      <Image
        source={{ uri: hasError ? DEFAULT_IMAGE : getImageUrl() }}
        style={[style, styles.image]}
        resizeMode={resizeMode}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
      {isLoading && (
        <View style={[style, styles.loadingContainer]}>
          <ActivityIndicator size="small" color="#C87D55" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
}); 