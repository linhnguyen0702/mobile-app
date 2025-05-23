
import React, { useState, useContext, useEffect } from "react"
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native"
import { StatusBar } from "expo-status-bar"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from "../context/AuthContext"
import { MaterialIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_URL } from '../config/constants'
import { BASE_URL } from '../config/constants'
type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ResetPassword: { email: string; otp: string };
  Main: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>()
  const { login, isLoading: authLoading } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [savedCredentials, setSavedCredentials] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  
  // OTP related states
  const [resetStep, setResetStep] = useState(1) // 1: Enter email, 2: Enter OTP
  const [resetOtp, setResetOtp] = useState("")
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)

  // Load saved credentials when component mounts
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const saved = await AsyncStorage.getItem('savedCredentials')
        if (saved) {
          const parsed = JSON.parse(saved)
          setSavedCredentials(parsed)
        }
      } catch (error) {
        console.error('Lỗi tải dữ liệu:', error)
      }
    }

    loadSavedCredentials()
  }, [])

  const toggleShowPassword = () => {
    setShowPassword(!showPassword)
  }

  const clearError = (field: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: ""
    }))
  }

  const validateForm = () => {
    let isValid = true
    const newErrors = { email: "", password: "" }

    if (!email.trim()) {
      newErrors.email = "Vui lòng nhập Email"
      isValid = false
    }

    if (!password.trim()) {
      newErrors.password = "Vui lòng nhập mật khẩu"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleLogin = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const success = await login(email, password)
      if (success) {
        // Save the email/phone if it's not already saved
        if (!savedCredentials.includes(email)) {
          const updatedCredentials = [...savedCredentials, email]
          try {
            await AsyncStorage.setItem('savedCredentials', JSON.stringify(updatedCredentials))
            setSavedCredentials(updatedCredentials)
          } catch (error) {
            console.error('Lỗi lưu dữ liệu:', error)
          }
        }
        navigation.navigate("Main")
      } else {
        Alert.alert("Đăng nhập thất bại", "Email hoặc mật khẩu không đúng. Vui lòng đăng ký nếu bạn chưa có tài khoản.")
      }
    } catch (error) {
      Alert.alert("Lỗi", "Đã có lỗi xảy ra. Vui lòng thử lại sau.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = () => {
    navigation.navigate("SignUp")
  }

  const handleForgotPassword = () => {
    setForgotPasswordModalVisible(true)
    setResetStep(1)
    setResetEmail("")
    setResetOtp("")
  }

  const handleRequestOtp = async () => {
    if (!resetEmail.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập email của bạn")
      return
    }

    setIsResettingPassword(true)
    try {
      const response = await fetch(`${API_URL}/auth/request-reset-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      })

      if (response.ok) {
        Alert.alert(
          "Thành công",
          "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.",
          [{ text: "OK" }]
        )
        setResetStep(2) // Move to OTP input step
      } else {
        const data = await response.json()
        Alert.alert("Lỗi", data.message || "Không thể gửi mã OTP. Vui lòng thử lại sau.")
      }
    } catch (error) {
      Alert.alert("Lỗi", "Đã có lỗi xảy ra. Vui lòng thử lại sau.")
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!resetOtp.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mã OTP")
      return
    }

    setIsVerifyingOtp(true)
    try {
      // Validate OTP format first
      if (resetOtp.length < 4) {
        Alert.alert("Lỗi", "Mã OTP không hợp lệ.")
        setIsVerifyingOtp(false)
        return
      }
      
      // Pre-verify OTP with server before navigating
      const response = await fetch(`${API_URL}/auth/verify-reset-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          email: resetEmail,
          otp: resetOtp
        }),
      })

      const responseText = await response.text()
      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error("Error parsing response:", responseText)
        throw new Error("Invalid response from server")
      }

      if (response.ok) {
        // OTP is valid, navigate to reset password screen
        setForgotPasswordModalVisible(false)
        // Reset form before navigation
        resetModalForm()
        // Navigate with both email and OTP
        navigation.navigate("ResetPassword", {
          email: resetEmail,
          otp: resetOtp
        })
      } else {
        Alert.alert("Lỗi", data?.message || "Mã OTP không chính xác hoặc đã hết hạn.")
      }
    } catch (error) {
      console.error("Error verifying OTP:", error)
      Alert.alert("Lỗi", "Đã có lỗi xảy ra khi kiểm tra OTP. Vui lòng thử lại sau.")
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const resetModalForm = () => {
    setResetStep(1)
    setResetEmail("")
    setResetOtp("")
    setForgotPasswordModalVisible(false)
  }

  const selectSavedCredential = (credential: string) => {
    setEmail(credential)
    setShowSuggestions(false)
  }

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C87D55" />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar style="light" />
      <TouchableWithoutFeedback onPress={() => {
        Keyboard.dismiss()
        setShowSuggestions(false)
      }}>
        <View style={styles.content}>
          <Text style={styles.title}>Chào mừng đến với HAHACafe</Text>
          <Text style={styles.subtitle}>Đăng nhập vào tài khoản của bạn</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.email ? styles.inputError : null]}
                placeholder="Email"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={email}
                onChangeText={(text) => {
                  setEmail(text)
                  setShowSuggestions(text.length > 0)
                }}
                onFocus={() => {
                  setShowSuggestions(true)
                  clearError('email')
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              
              {/* Suggestions dropdown */}
              {showSuggestions && savedCredentials.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {savedCredentials
                    .filter(cred => cred.toLowerCase().includes(email.toLowerCase()))
                    .map((credential, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.suggestionItem}
                        onPress={() => {
                          selectSavedCredential(credential)
                          setShowSuggestions(false)
                        }}
                      >
                        <Text style={styles.suggestionText}>{credential}</Text>
                      </TouchableOpacity>
                    ))
                  }
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput, errors.password ? styles.inputError : null]}
                  placeholder="Mật khẩu"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => clearError('password')}
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={toggleShowPassword}>
                  <MaterialIcons 
                    name={showPassword ? "visibility-off" : "visibility"} 
                    size={24} 
                    color="rgba(255, 255, 255, 0.7)" 
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.disabledButton]} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginButtonText}>Đăng nhập</Text>
              )}
            </TouchableOpacity>

            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>
            </View>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Bạn chưa có tài khoản? </Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={styles.signupLink}>Đăng ký</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* Forgot Password Modal with OTP step */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={forgotPasswordModalVisible}
        onRequestClose={() => {
          setForgotPasswordModalVisible(false)
          resetModalForm()
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xác nhận mã OTP</Text>
            
            {resetStep === 1 ? (
              // Step 1: Enter email
              <View>
            <Text style={styles.modalSubtitle}>
                  Vui lòng nhập email của bạn. Chúng tôi sẽ gửi mã OTP đến email này.
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Email"
              placeholderTextColor="#999"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setForgotPasswordModalVisible(false)
                      resetModalForm()
                }}
              >
                <Text style={styles.cancelButtonText}>Huỷ</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.resetButton, isResettingPassword && styles.disabledButton]} 
                    onPress={handleRequestOtp}
                disabled={isResettingPassword}
              >
                {isResettingPassword ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                      <Text style={styles.resetButtonText}>Gửi mã OTP</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // Step 2: Enter OTP
              <View>
                <Text style={styles.modalSubtitle}>
                  Mã OTP đã được gửi đến email của bạn. Vui lòng nhập mã để tiếp tục.
                </Text>
                
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nhập mã OTP"
                  placeholderTextColor="#999"
                  value={resetOtp}
                  onChangeText={setResetOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]} 
                    onPress={() => setResetStep(1)}
                  >
                    <Text style={styles.cancelButtonText}>Quay lại</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.resetButton, isVerifyingOtp && styles.disabledButton]} 
                    onPress={handleVerifyOtp}
                    disabled={isVerifyingOtp}
                  >
                    {isVerifyingOtp ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.resetButtonText}>Tiếp tục</Text>
                )}
              </TouchableOpacity>
            </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#BF9264",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 23,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 40,
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    color: "white",
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    top: 15,
  },
  inputError: {
    borderColor: "#FF6B6B",
    borderWidth: 1,
  },
  errorText: {
    color: "#FF6B6B",
    marginTop: 5,
    marginLeft: 10,
  },
  loginButton: {
    backgroundColor: "white",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#BF9264",
    fontSize: 18,
    fontWeight: "600",
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: 'white',
    fontSize: 14,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signupText: {
    color: "white",
    fontSize: 14,
  },
  signupLink: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 10,
    marginTop: 5,
    maxHeight: 150,
    zIndex: 1,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#BF9264',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  resetButton: {
    backgroundColor: '#C87D55',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})