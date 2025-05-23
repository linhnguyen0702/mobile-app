"use client"

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../config/constants';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
}

export default function ProfileScreen() {
  const { 
    user, 
    logout, 
    updateProfile, 
    uploadAvatar, 
    isLoading: authLoading,
    reloadUserProfile
  } = useAuth();
  const navigation = useNavigation();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!formData.firstName || !formData.lastName) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ họ và tên');
      return;
    }

    setIsUpdating(true);
    try {
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address
      });
      Alert.alert('Thành công', 'Thông tin đã được cập nhật');
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Cập nhật thông tin không thành công');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập vào thư viện ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setIsUpdating(true);
        try {
          const uploadResult = await uploadAvatar(result.assets[0].uri);
          console.log('avatarUrl trả về:', uploadResult.avatarUrl);
          await reloadUserProfile();
          Alert.alert('Thành công', 'Ảnh đại diện đã được cập nhật');
        } catch (error: any) {
          console.error('Upload error:', error);
          Alert.alert('Lỗi', error.message || 'Không thể tải lên ảnh');
        } finally {
          setIsUpdating(false);
        }
      }
    } catch (error: any) {
      console.error('Image picker error:', error);
      Alert.alert('Lỗi', error.message || 'Không thể chọn ảnh');
    }
  };

  const getDefaultAvatar = (user: User | null) => {
    if (!user) return null;
    
    const firstLetterOfLastName = user.lastName?.[0]?.toUpperCase() || '';
    const firstLetterOfFirstName = user.firstName?.[0]?.toUpperCase() || '';
    
    return (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>
          {`${firstLetterOfLastName}${firstLetterOfFirstName}`}
        </Text>
      </View>
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.navigate('Login' as never);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Đăng xuất không thành công');
    }
  };

  if (authLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorText}>Không tìm thấy thông tin người dùng</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
          <Text style={styles.loginLink}>Đăng nhập lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Hồ sơ cá nhân</Text>
          </View>

          <View style={styles.profileSection}>
            <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
              {user?.avatarUrl ? (
                <Image
                  source={{ 
                    uri: user.avatarUrl.startsWith('http') 
                      ? user.avatarUrl 
                      : `${BASE_URL}${user.avatarUrl.startsWith('/') ? '' : '/'}${user.avatarUrl}`
                  }}
                  style={styles.avatar}
                  onError={e => {
                    console.log('Lỗi tải ảnh avatar:', e.nativeEvent);
                    console.log('URL gây lỗi:', user.avatarUrl);
                  }}
                />
              ) : (
                getDefaultAvatar(user)
              )}
              <View style={styles.editAvatarButton}>
                <Ionicons name="camera" size={20} color="white" />
              </View>
            </TouchableOpacity>

            <Text style={styles.userName}>{`${user.lastName} ${user.firstName}`}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>

          <View style={styles.content}>
            {isEditing ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Họ</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.lastName}
                    onChangeText={(text) => setFormData({...formData, lastName: text})}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tên</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.firstName}
                    onChangeText={(text) => setFormData({...formData, firstName: text})}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={[styles.input, styles.disabledInput]}
                    value={formData.email}
                    editable={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Số điện thoại</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.phone}
                    onChangeText={(text) => setFormData({...formData, phone: text})}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Địa chỉ</Text>
                  <TextInput
                    style={[styles.input, styles.multilineInput]}
                    value={formData.address}
                    onChangeText={(text) => setFormData({...formData, address: text})}
                    multiline
                  />
                </View>

                <View style={styles.buttonGroup}>
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]} 
                    onPress={() => setIsEditing(false)}
                    disabled={isUpdating}
                  >
                    <Text style={styles.buttonText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.saveButton]} 
                    onPress={handleUpdateProfile}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.buttonText}>Lưu</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.infoCard}>
                  <View style={styles.infoGroup}>
                    <Text style={styles.label}>Họ và tên</Text>
                    <Text style={styles.infoText}>{`${formData.lastName} ${formData.firstName}`}</Text>
                  </View>

                  <View style={styles.infoGroup}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.infoText}>{formData.email}</Text>
                  </View>

                  <View style={styles.infoGroup}>
                    <Text style={styles.label}>Số điện thoại</Text>
                    <Text style={styles.infoText}>{formData.phone || 'Chưa cập nhật'}</Text>
                  </View>

                  <View style={styles.infoGroup}>
                    <Text style={styles.label}>Địa chỉ</Text>
                    <Text style={styles.infoText}>{formData.address || 'Chưa cập nhật'}</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.editButtonText}>Chỉnh sửa thông tin</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => navigation.navigate('OrderHistory' as never)}
                >
                  <Text style={styles.secondaryButtonText}>Lịch sử đơn hàng</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.logoutButton} 
                  onPress={handleLogout}
                >
                  <Text style={styles.logoutButtonText}>Đăng xuất</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B35',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarText: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    color: '#333',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  disabledInput: {
    backgroundColor: '#F0F0F0',
    color: '#888',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  infoGroup: {
    marginBottom: 16,
  },
  infoText: {
    color: '#333',
    fontSize: 16,
    lineHeight: 24,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    height: 50,
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  saveButton: {
    backgroundColor: '#FF6B35',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#FF6B35',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#333',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center'
  },
  loginLink: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline'
  },
  logoutButton: {
    backgroundColor: 'transparent',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FF3A30',
  },
  logoutButtonText: {
    color: '#FF3A30',
    fontSize: 16,
    fontWeight: '600',
  },
});