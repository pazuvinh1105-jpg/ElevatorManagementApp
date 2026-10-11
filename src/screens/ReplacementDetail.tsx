import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ReplacementDetail = ({route}: any) => {
  const {elevatorId, serviceId} = route.params;
   

  console.log('REPLACEMENT DETAIL PARAMS:', {
   elevatorId,
   serviceId,
  });

  const [service, setService] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();
  }, []);

  const loadDetail = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('token');

      // ================================
      // Lấy chi tiết thay thế
      // ================================
      const response = await fetch(
        `http://127.0.0.1:3000/elevators/${elevatorId}/services/${serviceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
    
      if (!response.ok) {
        throw new Error(
          data.message || 'Không thể lấy thông tin thay thế',
        );
      }

      setService(data.service);

      // ================================
      // Lấy file đính kèm
      // ================================
      const attachmentResponse = await fetch(
        `http://127.0.0.1:3000/attachments?recordType=replacement&recordId=${serviceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const attachmentData = await attachmentResponse.json();
      
      if (attachmentResponse.ok) {
        setAttachments(attachmentData.attachments || []);
      }
    } catch (error: any) {
      console.error('Lỗi lấy chi tiết thay thế:', error);

      Alert.alert(
        'Lỗi',
        error.message || 'Không thể tải thông tin thay thế',
      );
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'image') {
      return '🖼️';
    }

    if (fileType === 'video') {
      return '🎥';
    }

    return '📄';
  };

  const formatFileSize = (size: number | null) => {
    if (!size) {
      return '';
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>
            Không tìm thấy bản ghi thay thế
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>

          {/* Tiêu đề */}
          <View style={styles.headerCard}>
            <Text style={styles.title}>Chi tiết thay thế thiết bị</Text>
            <Text style={styles.subtitle}>
              Mã bản ghi: #{service.id}
            </Text>
          </View>

          {/* Thông tin thay thế */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              🔄 Thông tin thay thế
            </Text>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Thang máy</Text>
              <Text style={styles.value}>{service.elevatorId}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Ngày thay thế</Text>
              <Text style={styles.value}>{service.date}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Kỹ thuật viên</Text>
              <Text style={styles.value}>
                {service.technicianId || '---'}
              </Text>
            </View>

            <View style={styles.descriptionContainer}>
              <Text style={styles.label}>Nội dung thay thế</Text>

              <Text style={styles.description}>
                {service.description || 'Không có mô tả'}
              </Text>
            </View>
          </View>

          {/* File đính kèm */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📎 File đính kèm</Text>

            {attachments.length === 0 ? (
              <Text style={styles.emptyText}>
                Không có file đính kèm
              </Text>
            ) : (
              attachments.map(file => (
                <View
                  key={file.id}
                  style={styles.attachmentItem}>

                  <Text style={styles.attachmentIcon}>
                    {getFileIcon(file.fileType)}
                  </Text>

                  <View style={styles.attachmentInfo}>
                    <Text
                      style={styles.attachmentName}
                      numberOfLines={2}>
                      {file.fileName}
                    </Text>

                    <Text style={styles.attachmentMeta}>
                      {file.fileType.toUpperCase()}
                      {file.fileSize
                        ? ` • ${formatFileSize(file.fileSize)}`
                        : ''}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
     </View>
  );
};

export default ReplacementDetail;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  backgroundImage: {
    opacity: 0.95,
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: '#607A9B',
  },

  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
  },

  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    elevation: 3,
  },

  title: {
    fontSize: 23,
    fontWeight: '700',
    color: '#123B78',
  },

  subtitle: {
    fontSize: 13,
    color: '#607A9B',
    marginTop: 5,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#123B78',
    marginBottom: 14,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
    paddingVertical: 11,
  },

  label: {
    fontSize: 14,
    color: '#607A9B',
    flex: 1,
  },

  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#123B78',
    flex: 1.4,
    textAlign: 'right',
  },

  descriptionContainer: {
    marginTop: 15,
  },

  description: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#263A55',
  },

  emptyText: {
    fontSize: 14,
    color: '#7A8CA5',
  },

  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F9FF',
    borderWidth: 1,
    borderColor: 'rgba(80,160,230,0.20)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  attachmentIcon: {
    fontSize: 25,
    marginRight: 12,
  },

  attachmentInfo: {
    flex: 1,
  },

  attachmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#123B78',
  },

  attachmentMeta: {
    fontSize: 12,
    color: '#607A9B',
    marginTop: 5,
  },
});