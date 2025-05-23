import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  BackHandler,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from "@expo/vector-icons";
import axios from 'axios';
import { API_URL } from '../config/constants';

type RootStackParamList = {
  Login: undefined;
  ResetPassword: { email: string; otp: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ResetPasswordScreenRouteProp = RouteProp<RootStackParamList, 'ResetPassword'>;

const ResetPasswordScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ResetPasswordScreenRouteProp>();
  
  // Get parameters from navigation and provide defaults to prevent undefined errors
  const { email = "", otp = "" } = route.params || {};
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Check if we have the required parameters
  useEffect(() => {
    if (!email || !otp) {
      Alert.alert(
        "Thông tin không đầy đủ", 
        "Không tìm thấy thông tin email hoặc mã OTP cần thiết.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    }
  }, [email, otp, navigation]);

  const clearError = (field: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: ""
    }));
  };

  const handleResetPassword = async () => {
    // Verify we have all needed data
    if (!email || !otp) {
      Alert.alert('Lỗi', 'Thiếu thông tin email hoặc mã OTP cần thiết');
      return;
    }
    
    if (!newPassword || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (newPassword.length < 6 || newPassword.length > 16) {
      Alert.alert('Lỗi', 'Mật khẩu phải từ 6-16 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu không khớp');
      return;
    }

    try {
      setLoading(true);
      console.log("Sending reset request with:", { email, otp, newPassword: "***" });
      
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Thành công', data.message || 'Mật khẩu đã được đặt lại thành công', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]);
      } else {
        console.error("Reset password error:", data);
        Alert.alert('Lỗi', data.message || 'Có lỗi xảy ra khi đặt lại mật khẩu');
      }
    } catch (error) {
      console.error("Reset password exception:", error);
      if (axios.isAxiosError(error)) {
        Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu');
      } else {
        Alert.alert('Lỗi', 'Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  // If missing essential data, show a simple screen with just a back button
  if (!email || !otp) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Lỗi xác thực</Text>
        <Text style={styles.errorMessage}>
          Không tìm thấy thông tin xác thực cần thiết. Vui lòng thử lại quá trình đặt lại mật khẩu.
        </Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Đặt lại mật khẩu</Text>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Nhập mật khẩu mới cho tài khoản <Text style={styles.emailText}>{email}</Text>
          </Text>
        </View>

        <Text style={styles.label}>Mật khẩu mới</Text>
        <View style={styles.inputContainer}>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput, errors.password ? styles.inputError : null]}
              placeholder="Mật khẩu mới"
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
              value={newPassword}
              onChangeText={(text) => {
                if (text.length <= 16) {
                  setNewPassword(text);
                }
              }}
              secureTextEntry={!showNewPassword}
              maxLength={16}
              onFocus={() => clearError('password')}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowNewPassword(!showNewPassword)}>
              <MaterialIcons 
                name={showNewPassword ? "visibility-off" : "visibility"} 
                size={24} 
                color="rgba(255, 255, 255, 0.7)" 
              />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        </View>

        <Text style={styles.label}>Xác nhận mật khẩu</Text>
        <View style={styles.inputContainer}>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput, errors.confirmPassword ? styles.inputError : null]}
              placeholder="Nhập lại mật khẩu mới"
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
              value={confirmPassword}
              onChangeText={(text) => {
                if (text.length <= 16) {
                  setConfirmPassword(text);
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
          style={[styles.button, loading && styles.disabledButton]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Đặt lại mật khẩu</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.backButton}>Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  infoContainer: {
    backgroundColor: '#eaf5ea',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#5cb85c',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  emailText: {
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  button: {
    backgroundColor: '#C87D55',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20,
    textAlign: 'center',
    color: '#C87D55',
    fontSize: 16,
  },
  errorMessage: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
    lineHeight: 22,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 12,
  },
  inputContainer: {
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
});

export default ResetPasswordScreen;