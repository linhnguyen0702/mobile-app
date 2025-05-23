import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking, Alert, Clipboard } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '../../src/context/OrderContext';
import { useAuth } from '../../src/context/AuthContext';

const STORE_INFO = {
  name: 'HAHACafe',
  cashier: 'Nguyễn Ngọc Vũ',
  address: 'Tầng 19A, 169 Nguyễn Ngọc Vũ, Trung Hòa, Cầu Giấy, Hà Nội',
  wifi: 'HAHACafe',
  wifiPassword: 'HAHACAMON',
};

export default function OrderDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId } = route.params || {};
  const { getOrderById, updateOrderStatus, confirmUserTransfer } = useOrders();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (orderId) {
      const foundOrder = getOrderById(orderId);
      setOrder(foundOrder);
    }
  }, [orderId, getOrderById]);

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text>Không tìm thấy đơn hàng.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#C87D55" />
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const total = order.totalAmount || 0;
  const createdAt = order.date ? new Date(order.date) : new Date();
  const timeStr = createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = createdAt.toLocaleDateString('vi-VN');

  // Thay hàm thanh toán MoMo bằng deep link
  const handleMomoPayment = () => {
    const amount = order.totalAmount;
    const receiver = '0368251814';
    const comment = `Thanh toan don hang #${order.id?.slice(0,8)}`;
    const momoUrl = `momo://?action=transfer&amount=${amount}&receiver=${receiver}&comment=${encodeURIComponent(comment)}`;
    Linking.openURL(momoUrl).catch(() => {
      Alert.alert('Lỗi', 'Không thể mở ứng dụng MoMo.');
    });
  };

  // Hàm sao chép clipboard
  const copyToClipboard = (text: string) => {
    if (Clipboard && Clipboard.setString) {
      Clipboard.setString(text);
      Alert.alert('Đã sao chép', text);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      Alert.alert('Đã sao chép', text);
    }
  };

  // Hàm xác nhận đã chuyển khoản
  const handleConfirmTransfer = async () => {
    try {
      await confirmUserTransfer(order.id);
      Alert.alert('Thành công', 'Đã xác nhận bạn đã chuyển khoản. Đơn hàng chuyển sang chờ xác nhận.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể xác nhận chuyển khoản.');
    }
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.detailTitle}>Chi tiết hóa đơn</Text>
        <TouchableOpacity style={styles.backButtonTop} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backText}>Quay lại lịch sử đơn hàng</Text>
        </TouchableOpacity>
        <View style={styles.receiptBox}>
          <Text style={styles.title}>HÓA ĐƠN THANH TOÁN</Text>
          <Text style={styles.receiptId}>Số HĐ: {order.id?.slice(0, 8) || '---'}</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.infoText}>Thu ngân: {STORE_INFO.cashier}</Text>
            <Text style={styles.infoText}>Ngày: {dateStr}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.infoText}>Giờ vào: {timeStr}</Text>
            <Text style={styles.infoText}>Giờ ra: {timeStr}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, { flex: 2 }]}>Tên món</Text>
            <Text style={[styles.cell, { flex: 1, textAlign: 'center' }]}>SL</Text>
            <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>Đơn giá</Text>
            <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>Thành tiền</Text>
          </View>
          {order.items?.map((item: any, idx: number) => (
            <View style={styles.tableRow} key={item.id || idx}>
              <Text style={[styles.cell, { flex: 2 }]}>{item.productName}</Text>
              <Text style={[styles.cell, { flex: 1, textAlign: 'center' }]}>{item.quantity}</Text>
              <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>{Number(item.price).toLocaleString('vi-VN')}</Text>
              <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>{(item.price * item.quantity).toLocaleString('vi-VN')}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={styles.totalLabel}>Tổng tiền:</Text>
            <Text style={styles.totalValue}>{Number(total).toLocaleString('vi-VN')} đ</Text>
          </View>
          <Text style={styles.paymentMethod}>+Thanh toán (TRANSFER)</Text>
          {/* Nếu chọn momo, hiển thị thông tin chuyển khoản MB Bank */}
          {order.paymentMethod === 'momo' && (
            <View style={{backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#eee'}}>
              <Text style={{color: '#A50064', fontWeight: 'bold', fontSize: 16, marginBottom: 8, textAlign: 'center'}}>Hướng dẫn chuyển khoản qua ngân hàng MB (dùng app MoMo hoặc ngân hàng bất kỳ)</Text>
              <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                <Text style={{fontWeight: 'bold', fontSize: 15, flex: 1}}>Số tài khoản:</Text>
                <Text selectable style={{fontSize: 15, color: '#222', marginRight: 8}}>1965196612004</Text>
                <TouchableOpacity onPress={() => copyToClipboard('1965196612004')} style={{padding: 4}}>
                  <Text style={{color: '#C87D55', fontWeight: 'bold'}}>Sao chép</Text>
                </TouchableOpacity>
              </View>
              <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                <Text style={{fontWeight: 'bold', fontSize: 15, flex: 1}}>Chủ tài khoản:</Text>
                <Text selectable style={{fontSize: 15, color: '#222', marginRight: 8}}>NGUYEN THI HANH AN</Text>
                <TouchableOpacity onPress={() => copyToClipboard('NGUYEN THI HANH AN')} style={{padding: 4}}>
                  <Text style={{color: '#C87D55', fontWeight: 'bold'}}>Sao chép</Text>
                </TouchableOpacity>
              </View>
              <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                <Text style={{fontWeight: 'bold', fontSize: 15, flex: 1}}>Ngân hàng:</Text>
                <Text selectable style={{fontSize: 15, color: '#222', marginRight: 8}}>MB Bank</Text>
                <TouchableOpacity onPress={() => copyToClipboard('MB Bank')} style={{padding: 4}}>
                  <Text style={{color: '#C87D55', fontWeight: 'bold'}}>Sao chép</Text>
                </TouchableOpacity>
              </View>
              <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                <Text style={{fontWeight: 'bold', fontSize: 15, flex: 1}}>Số tiền:</Text>
                <Text selectable style={{fontSize: 15, color: '#222', marginRight: 8}}>{order.totalAmount?.toLocaleString('vi-VN')} đ</Text>
                <TouchableOpacity onPress={() => copyToClipboard(order.totalAmount?.toString())} style={{padding: 4}}>
                  <Text style={{color: '#C87D55', fontWeight: 'bold'}}>Sao chép</Text>
                </TouchableOpacity>
              </View>
              <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                <Text style={{fontWeight: 'bold', fontSize: 15, flex: 1}}>Nội dung:</Text>
                <Text selectable style={{fontSize: 15, color: '#222', marginRight: 8}}>{`Thanh toan don hang #${order.id?.slice(0,8)}`}</Text>
                <TouchableOpacity onPress={() => copyToClipboard(`Thanh toan don hang #${order.id?.slice(0,8)}`)} style={{padding: 4}}>
                  <Text style={{color: '#C87D55', fontWeight: 'bold'}}>Sao chép</Text>
                </TouchableOpacity>
              </View>
              <Text style={{color: '#A50064', fontSize: 13, marginTop: 8, textAlign: 'center'}}>Sau khi chuyển khoản, vui lòng chờ xác nhận đơn hàng!</Text>
              {/* Đảm bảo nút Tôi đã chuyển khoản hiển thị đúng điều kiện */}
              {order.status === 'processing' && (
                <TouchableOpacity
                  style={{backgroundColor: '#C87D55', borderRadius: 8, padding: 12, marginTop: 16, alignItems: 'center'}} 
                  onPress={handleConfirmTransfer}
                >
                  <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 16}}>Tôi đã chuyển khoản</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          <View style={{ alignItems: 'center', marginVertical: 12 }}>
            <Image
              source={{
                uri: `https://img.vietqr.io/image/970422-1965196612004-compact2.png?amount=${order.totalAmount}&addInfo=Thanh%20toan%20don%20hang%20%23${order.id?.slice(0,8)}`
              }}
              style={{ width: 180, height: 180, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#eee' }}
              resizeMode="contain"
            />
            <Text style={{ color: '#C87D55', fontWeight: 'bold', marginTop: 8, textAlign: 'center' }}>
              Quét mã QR để thanh toán tự động
            </Text>
            <Text style={{ color: '#444', fontSize: 13, textAlign: 'center' }}>
              Số tài khoản: 1965196612004 (MBBank){'\n'}Chủ tài khoản: NGUYEN THI HANH AN
            </Text>
          </View>
          <View style={styles.divider} />
          <Text style={[styles.infoText, { textAlign: 'center' }]}>{STORE_INFO.name} - {STORE_INFO.cashier}</Text>
          <Text style={[styles.infoText, { textAlign: 'center' }]}>Địa chỉ: {STORE_INFO.address}</Text>
          <Text style={styles.infoText}>Khách hàng: {user ? `${user.firstName} ${user.lastName}` : '---'}</Text>
          <Text style={styles.infoText}>SĐT: {user?.phone || '---'}</Text>
          <Text style={[styles.infoText, { textAlign: 'center' }]}>MEMBER</Text>
          <Text style={[styles.infoText, { textAlign: 'center' }]}>Hà Nội</Text>
          <View style={styles.divider} />
          <Text style={[styles.infoText, { textAlign: 'center' }]}>Wifi: {STORE_INFO.wifi} - Password: {STORE_INFO.wifiPassword}</Text>
          <Text style={styles.infoTextSmall}>Quý khách vui lòng nhận hóa đơn tại quầy để được miễn phí gửi xe.</Text>
          <Text style={styles.thankyou}>HAHA Cafe xin cảm ơn!</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#BF9264',
    justifyContent: 'flex-end',
    paddingBottom: 32,
  },
  backButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 4,
    marginLeft: 8,
    marginBottom: 12,
    padding: 8,
    zIndex: 10,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
  receiptBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    width: '100%',
    maxWidth: 400,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  receiptId: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#222',
  },
  infoTextSmall: {
    fontSize: 12,
    color: '#444',
    marginTop: 4,
    marginBottom: 2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginVertical: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  cell: {
    fontSize: 14,
    color: '#222',
  },
  totalLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#C87D55',
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#C87D55',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
    marginBottom: 2,
  },
  thankyou: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#C87D55',
    marginTop: 10,
    fontSize: 16,
  },
  powered: {
    textAlign: 'center',
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  backButton: {
    color: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
    padding: 8,
  },
  backText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  detailTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
}); 