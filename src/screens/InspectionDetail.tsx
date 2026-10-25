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

  const loadData = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('token');

      if (!token) {
        Alert.alert('Lỗi', 'Không tìm thấy token đăng nhập');
        return;
      }

      // Lấy danh sách kiểm định
      const inspectionResponse = await fetch(
        `${API_URL}/elevators/${elevatorId}/inspections`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!inspectionResponse.ok) {
        throw new Error('Không thể tải dữ liệu kiểm định');
      }

      const inspectionData = await inspectionResponse.json();

      const foundInspection = inspectionData.find(
        (item: Inspection) => item.id === inspectionId,
      );

      if (!foundInspection) {
        Alert.alert('Thông báo', 'Không tìm thấy phiếu kiểm định');
        return;
      }

      setInspection(foundInspection);

      // Lấy attachment của inspection
      const attachmentResponse = await fetch(
        `${API_URL}/attachments?recordType=inspection&recordId=${inspectionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (attachmentResponse.ok) {
        const attachmentData = await attachmentResponse.json();
        setAttachments(attachmentData);
      } else {
        setAttachments([]);
      }
    } catch (error) {
      console.log('Lỗi tải chi tiết kiểm định:', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết kiểm định');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
        <Text>Không tìm thấy phiếu kiểm định.</Text>
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
            <Text style={styles.emptyText}>Không có tệp đính kèm</Text>
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
