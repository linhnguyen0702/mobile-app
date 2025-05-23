import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Category } from '../services/dataService';
import * as dataService from '../services/dataService';

interface ProductContextType {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  selectedCategory: string | null;
  setSelectedCategory: (categoryId: string | null) => void;
  getProducts: () => Promise<void>;
  getCategories: () => Promise<void>;
  getProductById: (id: string) => Promise<Product | null>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const getProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await dataService.getProducts();
      setProducts(data);
    } catch (error) {
      setError('Lỗi lấy sản phẩm');
      console.error('Lỗi lấy sản phẩm:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategories = async () => {
    try {
      const data = await dataService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Lỗi lấy danh mục:', error);
    }
  };

  const getProductById = async (id: string): Promise<Product | null> => {
    try {
      const product = await dataService.getProductById(id);
      return product || null;
    } catch (error) {
      console.error('Lỗi lấy sản phẩm:', error);
      return null;
    }
  };

  useEffect(() => {
    getProducts();
    getCategories();
  }, [selectedCategory]);

  return (
    <ProductContext.Provider
      value={{
        products,
        categories,
        isLoading,
        error,
        selectedCategory,
        setSelectedCategory,
        getProducts,
        getCategories,
        getProductById
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts phải được sử dụng bên trong ProductProvider');
  }
  return context;
}; 