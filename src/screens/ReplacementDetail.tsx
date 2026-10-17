import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {pick, types} from '@react-native-documents/picker';

const ReplacementDetail = ({route}: any) => {
  const {elevatorId, serviceId} = route.params;
   

  console.log('REPLACEMENT DETAIL PARAMS:', {
   elevatorId,
   serviceId,
  });

  const [service, setService] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [filesToDelete, setFilesToDelete] = useState<number[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editDescription, setEditDescription] = useState('');

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
        setAttachments(
          Array.isArray(attachmentData)
         ? attachmentData
          : [],
        );
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
const startEditing = () => {
  setEditDate(service.date || '');
  setEditDescription(service.description || '');
  setIsEditing(true);
};

const saveChanges = async () => {
  try {
    const token = await AsyncStorage.getItem('token');

    // 1. Cập nhật ngày và nội dung thay thế
    const response = await fetch(
      `http://127.0.0.1:3000/elevators/${elevatorId}/services/${serviceId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: editDate,
          description: editDescription,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || 'Không thể cập nhật bản ghi',
      );
    }

    // 2. Lưu các file mới
    for (const file of selectedFiles) {
      let fileType = 'document';

      if (file.type?.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type?.startsWith('video/')) {
        fileType = 'video';
      }

      const attachmentResponse = await fetch(
        'http://127.0.0.1:3000/attachments',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            recordType: 'replacement',
            recordId: Number(serviceId),
            fileName: file.name || 'File đính kèm',
            fileUri: file.uri,
            fileType: fileType,
            fileSize: file.size || null,
          }),
        },
      );

      const attachmentData = await attachmentResponse.json();

      if (!attachmentResponse.ok) {
        throw new Error(
          attachmentData.message ||
            'Không thể lưu file đính kèm',
        );
      }
    }

    // 3. Xóa các file cũ đã được đánh dấu xóa
    for (const fileId of filesToDelete) {
      const deleteResponse = await fetch(
        `http://127.0.0.1:3000/attachments/${fileId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const deleteData = await deleteResponse.json();

      if (!deleteResponse.ok) {
        throw new Error(
          deleteData.message ||
            'Không thể xóa file đính kèm',
        );
      }
    }

    // 4. Reset trạng thái
    setSelectedFiles([]);
    setFilesToDelete([]);
    setIsEditing(false);

    // 5. Tải lại dữ liệu
    await loadDetail();

    Alert.alert(
      'Thành công',
      'Đã cập nhật bản ghi thay thế',
    );
  } catch (error: any) {
    console.error('Lỗi cập nhật thay thế:', error);

    Alert.alert(
      'Lỗi',
      error.message || 'Không thể cập nhật bản ghi',
    );
  }
};

const pickFiles = async () => {
  try {
    const result = await pick({
      allowMultiSelection: true,
      type: [types.images, types.video, types.allFiles],
    });

    setSelectedFiles(prev => [
      ...prev,
      ...result,
    ]);
  } catch (error) {
    console.log('Chọn file bị hủy hoặc lỗi:', error);
  }
};

const markFileForDelete = (fileId: number) => {
  setFilesToDelete(prev =>
    prev.includes(fileId)
      ? prev
      : [...prev, fileId],
  );

  setAttachments(prev =>
    prev.filter(file => file.id !== fileId),
  );
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
          <Text style={styles.title}>
            Chi tiết thay thế thiết bị
          </Text>

          <Text style={styles.subtitle}>
            Mã bản ghi: #{service.id}
          </Text>

          {!isEditing ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={startEditing}>
              <Text style={styles.buttonText}>
                ✏️ Chỉnh sửa
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsEditing(false);
                  setSelectedFiles([]);
                  setFilesToDelete([]);
                  loadDetail();
                }}>
                <Text style={styles.buttonText}>
                  Hủy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveChanges}>
                <Text style={styles.buttonText}>
                  💾 Lưu
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Thông tin thay thế */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            🔄 Thông tin thay thế
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>
              Thang máy
            </Text>

            <Text style={styles.value}>
              {service.elevatorId}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>
              Ngày thay thế
            </Text>

            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={editDate}
                onChangeText={setEditDate}
                placeholder="Nhập ngày thay thế"
              />
            ) : (
              <Text style={styles.value}>
                {service.date}
              </Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>
              Kỹ thuật viên
            </Text>

            <Text style={styles.value}>
              {service.technicianId || '---'}
            </Text>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.label}>
              Nội dung thay thế
            </Text>

            {isEditing ? (
              <TextInput
                style={styles.descriptionInput}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Nhập nội dung thay thế"
                multiline
                textAlignVertical="top"
              />
            ) : (
              <Text style={styles.description}>
                {service.description || 'Không có mô tả'}
              </Text>
            )}
          </View>
        </View>

        {/* File đính kèm */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            📎 File đính kèm
          </Text>

          {/* Nút thêm file khi chỉnh sửa */}
          {isEditing && (
            <TouchableOpacity
              style={styles.addFileButton}
              onPress={pickFiles}>
              <Text style={styles.addFileText}>
                ＋ Thêm file
              </Text>
            </TouchableOpacity>
          )}

          {/* File cũ */}
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

                {/* Nút xóa file khi chỉnh sửa */}
                {isEditing && (
                  <TouchableOpacity
                    style={styles.deleteFileButton}
                    onPress={() =>
                      markFileForDelete(file.id)
                    }>
                    <Text style={styles.deleteFileText}>
                      Xóa
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}

          {/* File mới được chọn */}
          {isEditing && selectedFiles.length > 0 && (
            <View style={styles.selectedFilesContainer}>
              <Text style={styles.selectedFilesTitle}>
                File mới:
              </Text>

              {selectedFiles.map((file, index) => (
                <View
                  key={`${file.uri}-${index}`}
                  style={styles.selectedFileItem}>

                  <Text
                    style={styles.selectedFileName}
                    numberOfLines={2}>
                    📄 {file.name || 'File đính kèm'}
                  </Text>

                </View>
              ))}
            </View>
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

  /* =========================
     NÚT CHỈNH SỬA
     ========================= */

  editButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#123B78',
    alignItems: 'center',
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#777',
    alignItems: 'center',
  },

  saveButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  /* =========================
     Ô NHẬP KHI CHỈNH SỬA
     ========================= */

  editInput: {
    flex: 1.4,
    borderWidth: 1,
    borderColor: '#D5DFEC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 14,
    color: '#123B78',
    textAlign: 'right',
  },

  descriptionInput: {
    marginTop: 8,
    minHeight: 90,
    borderWidth: 1,
    borderColor: '#D5DFEC',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#263A55',
    textAlignVertical: 'top',
  },

  /* =========================
     FILE ĐÍNH KÈM
     ========================= */

  addFileButton: {
    backgroundColor: '#E8F1FF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },

  addFileText: {
    color: '#123B78',
    fontSize: 12,
    fontWeight: '600',
  },

  deleteFileButton: {
    marginLeft: 8,
    padding: 6,
  },

  deleteFileText: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '600',
  },

  selectedFilesContainer: {
    marginTop: 8,
  },

  selectedFilesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#607A9B',
    marginBottom: 8,
  },

  selectedFileItem: {
    backgroundColor: '#F5F9FF',
    borderWidth: 1,
    borderColor: 'rgba(80,160,230,0.20)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },

  selectedFileName: {
    fontSize: 13,
    color: '#263A55',
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