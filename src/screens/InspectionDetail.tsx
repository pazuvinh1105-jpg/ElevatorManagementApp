import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/firebase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getCache, saveCache } from '../utils/offlineCache';

type RootStackParamList = {
  InspectionDetail: {
    elevatorId: string;
    inspectionId: number;
  };
};

type Props = NativeStackScreenProps<RootStackParamList, 'InspectionDetail'>;

type Inspection = {
  id: number;
  elevatorId: string;
  inspectionDate: string;
  inspectionUnit?: string;
  result?: string;
  description?: string;
};

type Attachment = {
  id: number;
  fileName: string;
  fileUri: string;
  fileType: string;
  fileSize?: number;
  createdAt?: string;
};

const InspectionDetail = ({ route }: Props) => {
  const { elevatorId, inspectionId } = route.params;

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        if (isMounted) {
          setLoading(true);
        }

        const token = await AsyncStorage.getItem('token');
        const userId = await AsyncStorage.getItem('userId');

        if (!token || !userId) {
          if (isMounted) {
            Alert.alert('Lỗi', 'Không tìm thấy thông tin đăng nhập.');
          }
          return;
        }

        // 1. Tải thông tin phiếu kiểm định từ Backend.
        // Danh sách này cũng được lưu cache ở màn hình Inspections.
        let foundInspection: Inspection | undefined;

        try {
          const inspectionResponse = await fetch(
            `${API_URL}/elevators/${elevatorId}/inspections`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (!inspectionResponse.ok) {
            throw new Error('Không thể tải dữ liệu kiểm định.');
          }

          const inspectionData = await inspectionResponse.json();

          if (!Array.isArray(inspectionData)) {
            throw new Error('Dữ liệu kiểm định không hợp lệ.');
          }

          foundInspection = inspectionData.find(
            (item: Inspection) => item.id === inspectionId,
          );

          // Cập nhật cache danh sách để lần sau có thể xem offline.
          await saveCache(
            userId,
            `inspections:${elevatorId}`,
            inspectionData,
          );
        } catch (error) {
          console.log('Không tải được phiếu kiểm định từ Backend:', error);

          // 2. Backend không truy cập được: lấy phiếu từ cache.
          const cachedInspections = await getCache<Inspection[]>(
            userId,
            `inspections:${elevatorId}`,
          );

          if (cachedInspections && Array.isArray(cachedInspections.data)) {
            foundInspection = cachedInspections.data.find(
              item => item.id === inspectionId,
            );
          }
        }

        if (isMounted) {
          setInspection(foundInspection || null);
        }

        if (!foundInspection) {
          if (isMounted) {
            setAttachments([]);
          }
          return;
        }

        // 3. Tải tệp đính kèm từ Backend.
        // Tệp đính kèm có cache riêng theo từng phiếu kiểm định.
        try {
          const attachmentResponse = await fetch(
            `${API_URL}/attachments?recordType=inspection&recordId=${inspectionId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (!attachmentResponse.ok) {
            throw new Error('Không thể tải tệp đính kèm.');
          }

          const attachmentData = await attachmentResponse.json();

          if (!Array.isArray(attachmentData)) {
            throw new Error('Dữ liệu tệp đính kèm không hợp lệ.');
          }

          await saveCache(
            userId,
            `inspectionAttachments:${inspectionId}`,
            attachmentData,
          );

          if (isMounted) {
            setAttachments(attachmentData);
          }
        } catch (error) {
          console.log('Không tải được tệp đính kèm từ Backend:', error);

          // 4. Nếu offline, hiển thị các tệp đã được lưu cache trước đó.
          const cachedAttachments = await getCache<Attachment[]>(
            userId,
            `inspectionAttachments:${inspectionId}`,
          );

          if (isMounted) {
            setAttachments(
              cachedAttachments && Array.isArray(cachedAttachments.data)
                ? cachedAttachments.data
                : [],
            );
          }
        }
      } catch (error) {
        console.log('Lỗi tải chi tiết kiểm định:', error);

        if (isMounted) {
          setInspection(null);
          setAttachments([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [elevatorId, inspectionId]);

  const formatFileSize = (size?: number) => {
    if (!size) {
      return '';
    }

    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (!inspection) {
    return (
      <View style={styles.center}>
        <Text>Không tìm thấy phiếu kiểm định trong dữ liệu đã tải hoặc đã lưu.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chi tiết kiểm định</Text>
        <Text style={styles.elevator}>Thang máy: {inspection.elevatorId}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Ngày kiểm định</Text>
        <Text style={styles.value}>{inspection.inspectionDate || '—'}</Text>

        <Text style={styles.label}>Đơn vị kiểm định</Text>
        <Text style={styles.value}>{inspection.inspectionUnit || '—'}</Text>

        <Text style={styles.label}>Kết quả</Text>
        <Text style={styles.value}>{inspection.result || '—'}</Text>

        <Text style={styles.label}>Mô tả</Text>
        <Text style={styles.description}>
          {inspection.description || 'Không có mô tả'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Tệp đính kèm ({attachments.length})
        </Text>

        {attachments.length === 0 ? (
          <View style={styles.emptyAttachment}>
            <Text style={styles.emptyText}>Không có tệp đính kèm đã lưu</Text>
          </View>
        ) : (
          attachments.map(file => (
            <TouchableOpacity
              key={file.id}
              style={styles.fileCard}
              onPress={() => {
                Alert.alert(
                  'Tệp đính kèm',
                  `${file.fileName}\n\nURI:\n${file.fileUri}`,
                );
              }}
            >
              <Text style={styles.fileIcon}>{getFileIcon(file.fileType)}</Text>

              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={2}>
                  {file.fileName}
                </Text>

                <Text style={styles.fileMeta}>
                  {file.fileType.toUpperCase()}
                  {file.fileSize ? ` • ${formatFileSize(file.fileSize)}` : ''}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 10,
    color: '#666',
  },

  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
  },

  elevator: {
    marginTop: 6,
    fontSize: 15,
    color: '#666',
  },

  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 18,
    borderRadius: 12,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#777',
    marginTop: 12,
  },

  value: {
    fontSize: 16,
    color: '#222',
    marginTop: 5,
  },

  description: {
    fontSize: 16,
    color: '#222',
    marginTop: 5,
    lineHeight: 23,
  },

  section: {
    marginHorizontal: 16,
    marginBottom: 30,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 12,
    color: '#222',
  },

  emptyAttachment: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
  },

  emptyText: {
    color: '#777',
    textAlign: 'center',
  },

  fileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  fileIcon: {
    fontSize: 30,
    marginRight: 12,
  },

  fileInfo: {
    flex: 1,
  },

  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },

  fileMeta: {
    marginTop: 5,
    fontSize: 12,
    color: '#777',
  },
});

export default InspectionDetail;
