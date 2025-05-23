import { useState, useEffect } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Ionicons } from "@expo/vector-icons"
import { View, Text, LogBox } from "react-native"
import { GestureHandlerRootView } from 'react-native-gesture-handler'

// Screens
import OnboardingScreen from "./src/screens/OnboardingScreen"
import LoginScreen from "./src/screens/LoginScreen"
import SignUpScreen from "./src/screens/SignUpScreen"
import HomeScreen from "./src/screens/HomeScreen"
import ProductDetailScreen from "./src/screens/ProductDetailScreen"
import OrderScreen from "./src/screens/OrderScreen"
import ProfileScreen from "./src/screens/ProfileScreen"
import SearchScreen from "./src/screens/SearchScreen"
import PaymentScreen from "./src/screens/PaymentScreen"
import CartScreen from "./src/screens/CartScreen"
import FavoritesScreen from "./src/screens/FavoritesScreen"
import OrderHistoryScreen from "./src/screens/OrderHistoryScreen"
import OrderDetailScreen from './src/screens/OrderDetailScreen'
import ResetPasswordScreen from './src/screens/ResetPasswordScreen'

// Context
import AuthProvider from "./src/context/AuthContext"
import { FavoritesProvider } from "./src/context/FavoritesContext"
import { CartProvider } from "./src/context/CartContext"
import { useCart } from "./src/context/CartContext"
import { OrderProvider } from "./src/context/OrderContext"
import { ProductProvider } from "./src/context/ProductContext"

// Ẩn log lỗi ảnh không load được và các lỗi ảnh phổ biến
LogBox.ignoreLogs([
  'Failed to load resource',
  'Error: Request failed with status code 404',
  'Warning: Failed prop type: Invalid prop `source` supplied to `Image`',
  'Error: Unable to resolve module ./assets',
]);

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const linking = {
  prefixes: ['myapp://'],
  config: {
    screens: {
      ResetPassword: {
        path: 'reset-password',
        parse: {
          token: (token: string) => token,
        },
      },
      // các màn khác nếu cần
    },
  },
};

// Sửa lỗi kiểu dữ liệu cho CartIcon
function CartIcon({ color, size }: { color: string; size: number }) {
  const { getCartItemCount } = useCart()
  const cartItemCount = getCartItemCount()

  return (
    <View style={{ width: 24, height: 24 }}>
      <Ionicons name="cart-outline" size={size} color={color} />
      {cartItemCount > 0 && (
        <View
          style={{
            position: "absolute",
            right: -6,
            top: -3,
            backgroundColor: "#FF6B6B",
            borderRadius: 10,
            width: 16,
            height: 16,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>
            {cartItemCount > 9 ? "9+" : cartItemCount}
          </Text>
        </View>
      )}
    </View>
  )
}

// Trong HomeTabs, sửa lỗi tên icon
function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: { name: string } }) => ({
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          if (route.name === "Home") {
            return <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
          } else if (route.name === "Search") {
            return <Ionicons name={focused ? "search" : "search-outline"} size={size} color={color} />
          } else if (route.name === "Cart") {
            return <CartIcon color={color} size={size} />
          } else if (route.name === "Favorites") {
            return <Ionicons name={focused ? "heart" : "heart-outline"} size={size} color={color} />
          } else if (route.name === "Profile") {
            return <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
          }
          return null
        },
        tabBarActiveTintColor: "#C87D55",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Trang chủ" }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: "Tìm kiếm" }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: "Giỏ hàng" }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: "Yêu thích" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Hồ sơ" }} />
    </Tab.Navigator>
  )
}

export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null)

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const value = await AsyncStorage.getItem("alreadyLaunched")
        if (value === null) {
          await AsyncStorage.setItem("alreadyLaunched", "true")
          setIsFirstLaunch(true)
        } else {
          setIsFirstLaunch(false)
        }
      } catch (error) {
        console.error("Error checking first launch:", error)
        setIsFirstLaunch(false) // Fallback to false if there's an error
      }
    }

    checkFirstLaunch()
  }, [])

  // Hiển thị màn hình trống trong khi kiểm tra isFirstLaunch
  if (isFirstLaunch === null) {
    return null
  }

  // Bọc toàn bộ app bằng GestureHandlerRootView
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ProductProvider>
            <FavoritesProvider>
              <CartProvider>
                <OrderProvider>
                  <NavigationContainer linking={linking}>
                    <StatusBar style="auto" />
                    <Stack.Navigator initialRouteName={isFirstLaunch ? "Onboarding" : "Login"}>
                      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="Main" component={HomeTabs} options={{ headerShown: false }} />
                      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="Order" component={OrderScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="Payment" component={PaymentScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ headerShown: false }} />
                    </Stack.Navigator>
                  </NavigationContainer>
                </OrderProvider>
              </CartProvider>
            </FavoritesProvider>
          </ProductProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}