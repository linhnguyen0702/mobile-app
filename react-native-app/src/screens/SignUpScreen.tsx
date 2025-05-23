"use client"

import { useState } from "react"
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native"
import { StatusBar } from "expo-status-bar"
import { useNavigation } from "@react-navigation/native"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { useAuth } from "../context/AuthContext"

export default function SignUpScreen() {
  const navigation = useNavigation()
  const { register } = useAuth()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const clearError = (field: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: ""
    }))
  }

  const validateForm = () => {
    let isValid = true
    const newErrors = {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    }

    if (!firstName.trim()) {
      newErrors.firstName = "Tên là bắt buộc"
      isValid = false
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Họ là bắt buộc"
      isValid = false
    }

    if (!email.trim()) {
      newErrors.email = "Email/SĐT là bắt buộc"
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(email) && !/^\d{10}$/.test(email)) {
      newErrors.email = "Vui lòng nhập email hoặc sĐT hợp lệ"
      isValid = false
    }

    if (!password.trim()) {
      newErrors.password = "Mật khẩu là bắt buộc"
      isValid = false
    } else if (password.length < 6 || password.length > 16) {
      newErrors.password = "Mật khẩu phải từ 6-16 ký tự"
      isValid = false
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu không khớp"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSignUp = async () => {
    if (!validateForm()) return

    try {
      setIsLoading(true)
      const success = await register({
        firstName,
        lastName,
        email,
        password
      })
      
      if (success) {
        Alert.alert("Thành công", "Tạo tài khoản thành công!", [
          { text: "OK", onPress: () => navigation.navigate("Main" as never) },
        ])
      } else {
        Alert.alert("Thất bại", "Email đã được đăng ký.")
      }
    } catch (error: any) {
      console.error('Lỗi đăng ký:', error)
      Alert.alert(
        "Thất bại",
        error?.message || "Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại."
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = () => {
    navigation.navigate("Login" as never)
  }

  const handleBack = () => {
    navigation.goBack()
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar style="light" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Chào mừng đến HAHACafe</Text>
            <Text style={styles.subtitle}>Đăng ký tài khoản</Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, errors.firstName ? styles.inputError : null]}
                  placeholder="Tên"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  value={firstName}
                  onChangeText={setFirstName}
                  onFocus={() => clearError('firstName')}
                />
                {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, errors.lastName ? styles.inputError : null]}
                  placeholder="Họ"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  value={lastName}
                  onChangeText={setLastName}
                  onFocus={() => clearError('lastName')}
                />
                {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, errors.email ? styles.inputError : null]}
                  placeholder="Email/SĐT"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => clearError('email')}
                />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, errors.password ? styles.inputError : null]}
                    placeholder="Mật khẩu"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={password}
                    onChangeText={(text) => {
                      if (text.length <= 16) {
                        setPassword(text)
                      }
                    }}
                    secureTextEntry={!showPassword}
                    maxLength={16}
                    onFocus={() => clearError('password')}
                  />
                  <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                    <MaterialIcons 
                      name={showPassword ? "visibility-off" : "visibility"} 
                      size={24} 
                      color="rgba(255, 255, 255, 0.7)" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, errors.confirmPassword ? styles.inputError : null]}
                    placeholder="Nhập lại mật khẩu"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      if (text.length <= 16) {
                        setConfirmPassword(text)
                      }
                    }}
                    secureTextEntry={!showConfirmPassword}
                    maxLength={16}
                    onFocus={() => clearError('confirmPassword')}
                  />
                  <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <MaterialIcons 
                      name={showConfirmPassword ? "visibility-off" : "visibility"} 
                      size={24} 
                      color="rgba(255, 255, 255, 0.7)" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
              </View>

              <TouchableOpacity 
                style={[styles.createButton, isLoading && styles.disabledButton]} 
                onPress={handleSignUp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#BF9264" />
                ) : (
                  <Text style={styles.createButtonText}>Đăng ký</Text>
                )}
              </TouchableOpacity>

              <View style={styles.signinContainer}>
                <Text style={styles.signinText}>Đã có tài khoản? </Text>
                <TouchableOpacity onPress={handleSignIn}>
                  <Text style={styles.signinLink}>Đăng nhập</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#BF9264",
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 30,
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    color: "white",
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
  createButton: {
    backgroundColor: "white",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  createButtonText: {
    color: "#BF9264",
    fontSize: 16,
    fontWeight: "600",
  },
  signinContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  signinText: {
    color: "white",
    fontSize: 14,
  },
  signinLink: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.7,
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
})
