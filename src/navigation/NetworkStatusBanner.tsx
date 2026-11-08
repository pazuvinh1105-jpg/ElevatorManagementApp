
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { API_URL } from '../config/firebase';

type NetworkStatus =
  | 'checking'
  | 'disconnected'
  | 'connected';

const NetworkStatusBanner = () => {
  const [status, setStatus] = useState<NetworkStatus>('checking');

  useEffect(() => {
    let isMounted = true;
    let isChecking = false;

    const checkConnection = async () => {
      if (isChecking) return;

      isChecking = true;

      try {
        const network = await NetInfo.fetch();

        // Kiểm tra kết nối mạng và Internet
        if (
          network.isConnected === false ||
          network.isInternetReachable === false
        ) {
          if (isMounted) {
            setStatus('disconnected');
          }
          return;
        }

        // Trạng thái kết nối chưa xác định
        if (network.isConnected === null) {
          if (isMounted) {
            setStatus('checking');
          }
          return;
        }

        // Kiểm tra khả năng kết nối Backend/Server
        try {
          const response = await fetch(`${API_URL}/`, {
            method: 'GET',
          });

          if (!response.ok) {
            throw new Error('Server unavailable');
          }

          if (isMounted) {
            setStatus('connected');
          }
        } catch {
          if (isMounted) {
            setStatus('disconnected');
          }
        }
      } finally {
        isChecking = false;
      }
    };

    // Kiểm tra ngay khi component được khởi tạo
    checkConnection();

    // Theo dõi thay đổi trạng thái mạng
    const unsubscribe = NetInfo.addEventListener(() => {
      checkConnection();
    });

    // Kiểm tra định kỳ mỗi 10 giây
    const interval = setInterval(checkConnection, 10000);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Không hiển thị cảnh báo khi đang kiểm tra hoặc đã kết nối
  if (
    status === 'checking' ||
    status === 'connected'
  ) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Mất kết nối
      </Text>

      <Text style={styles.description}>
        Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
  },

  title: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '700',
  },

  description: {
    color: '#991B1B',
    fontSize: 12,
    marginTop: 4,
  },
});

export default NetworkStatusBanner;
