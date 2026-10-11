import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DatePickerField from '../components/DatePickerField';
import {pick, types} from '@react-native-documents/picker';

const ServiceEdit = ({route, navigation}: any) => {
  const {elevatorId, serviceId} = route.params;

  const [service, setService] = useState<any>(null);
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [results, setResults] = useState<any[]>([]);
  // File đính kèm đã lưu
  const [attachments, setAttachments] = useState<any[]>([]);

  // File mới được chọn
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

useEffect(() => {
  const getServiceDetail = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        Alert.alert(
          'Lỗi',
          'Không tìm thấy thông tin đăng nhập.',
        );
        return;
      }

      // ==========================================
      // 1. LẤY THÔNG TIN PHIẾU BẢO TRÌ
      // ==========================================
      const response = await fetch(
        `http://127.0.0.1:3000/elevators/${elevatorId}/maintenance/${serviceId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          'Lỗi',
          data.message || 'Không thể lấy thông tin phiếu.',
        );
        return;
      }

      setService(data);

      setDate(
        data.service?.date ||
          data.date ||
          '',
      );

      setDescription(
        data.service?.description ||
          data.description ||
          '',
      );

      setResults(
        Array.isArray(data.results)
          ? data.results
          : [],
      );

      // ==========================================
      // 2. LẤY FILE ĐÍNH KÈM ĐÃ LƯU
      // ==========================================
      try {
        const attachmentResponse = await fetch(
          `http://127.0.0.1:3000/attachments?recordType=maintenance&recordId=${serviceId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const attachmentData =
          await attachmentResponse.json();

        if (attachmentResponse.ok) {
          setAttachments(
            Array.isArray(attachmentData)
              ? attachmentData
              : [],
          );
        } else {
          console.error(
            'Lỗi lấy attachments:',
            attachmentData,
          );

          setAttachments([]);
        }
      } catch (attachmentError) {
        console.error(
          'Lỗi kết nối khi lấy attachments:',
          attachmentError,
        );

        setAttachments([]);
      }
    } catch (error) {
      console.error(
        'Lỗi lấy dữ liệu chỉnh sửa:',
        error,
      );

      Alert.alert(
        'Lỗi kết nối',
        'Không thể kết nối tới Backend.',
      );
    } finally {
      setLoading(false);
    }
  };

  getServiceDetail();
}, [elevatorId, serviceId]);
 const handlePickFiles = async () => {
  try {
    const result = await pick({
      allowMultiSelection: true,
      type: [
        types.images,
        types.video,
        types.allFiles,
      ],
    });

    if (result && result.length > 0) {
      setSelectedFiles(current => [
        ...current,
        ...result,
      ]);
    }
  } catch (error) {
    console.error(
      'Lỗi chọn file:',
      error,
    );
  }
};
const handleRemoveSelectedFile = (index: number) => {
  setSelectedFiles(currentFiles =>
    currentFiles.filter(
      (_, fileIndex) => fileIndex !== index,
    ),
  );
};
const handleDeleteAttachment = async (
  attachmentId: number,
) => {
  Alert.alert(
    'Xóa file',
    'Bạn có chắc muốn xóa file này không?',
    [
      {
        text: 'Hủy',
        style: 'cancel',
      },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const token =
              await AsyncStorage.getItem('token');

            if (!token) {
              Alert.alert(
                'Lỗi',
                'Không tìm thấy thông tin đăng nhập.',
              );
              return;
            }

            const response = await fetch(
              `http://127.0.0.1:3000/attachments/${attachmentId}`,
              {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            const data =
              await response.json();

            if (!response.ok) {
              Alert.alert(
                'Lỗi',
                data.message ||
                  'Không thể xóa file.',
              );
              return;
            }

            // Xóa file khỏi danh sách đang hiển thị
            setAttachments(current =>
              current.filter(
                file =>
                  Number(file.id) !==
                  Number(attachmentId),
              ),
            );

            Alert.alert(
              'Thành công',
              'Đã xóa file.',
            );
          } catch (error) {
            console.error(
              'Lỗi xóa attachment:',
              error,
            );

            Alert.alert(
              'Lỗi kết nối',
              'Không thể kết nối tới Backend.',
            );
          }
        },
      },
    ],
  );
};
  const handleResultChange = (
    checklistId: number,
    result: 'pass' | 'fail',
  ) => {
    setResults(currentResults =>
      currentResults.map(item =>
        Number(item.checklistId) ===
        Number(checklistId)
          ? {
              ...item,
              result,
            }
          : item,
      ),
    );
  };

 const handleSave = async () => {
  if (!date.trim()) {
    Alert.alert(
      'Thiếu thông tin',
      'Vui lòng nhập ngày bảo trì.',
    );
    return;
  }

  if (results.length === 0) {
    Alert.alert(
      'Thiếu checklist',
      'Phiếu bảo trì chưa có dữ liệu checklist.',
    );
    return;
  }

  try {
    setSaving(true);

    const token = await AsyncStorage.getItem('token');

    if (!token) {
      Alert.alert(
        'Lỗi',
        'Không tìm thấy thông tin đăng nhập.',
      );
      return;
    }

    // ==========================================
    // 1. CẬP NHẬT THÔNG TIN PHIẾU + CHECKLIST
    // ==========================================
    const response = await fetch(
      `http://127.0.0.1:3000/elevators/${elevatorId}/maintenance/${serviceId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: date.trim(),
          description: description.trim(),
          results: results.map(item => ({
            checklistId: Number(item.checklistId),
            result: item.result,
          })),
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      Alert.alert(
        'Lỗi',
        data.message ||
          'Không thể cập nhật phiếu bảo trì.',
      );
      return;
    }

    // ==========================================
    // 2. UPLOAD FILE MỚI
    // ==========================================
    if (selectedFiles.length > 0) {
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
              recordType: 'maintenance',
              recordId: Number(serviceId),
              fileName:
                file.name || 'File đính kèm',
              fileUri: file.uri,
              fileType: fileType,
              fileSize: file.size || null,
            }),
          },
        );

        const attachmentData =
          await attachmentResponse.json();

        if (!attachmentResponse.ok) {
          console.error(
            'Lỗi lưu attachment:',
            attachmentData,
          );

          Alert.alert(
            'Cảnh báo',
            'Phiếu bảo trì đã được cập nhật nhưng có file chưa được lưu.',
          );

          return;
        }
      }
    }

    // ==========================================
    // 3. THÀNH CÔNG
    // ==========================================
    Alert.alert(
      'Thành công',
      selectedFiles.length > 0
        ? `Đã cập nhật phiếu và lưu ${selectedFiles.length} file.`
        : 'Đã cập nhật phiếu bảo trì.',
      [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ],
    );
  } catch (error) {
    console.error(
      'Lỗi cập nhật phiếu bảo trì:',
      error,
    );

    Alert.alert(
      'Lỗi kết nối',
      'Không thể kết nối tới Backend.',
    );
  } finally {
    setSaving(false);
  }
};

  if (loading) {
    return (
      <ImageBackground
        source={require('../../assets/background.jpg')}
        style={styles.background}
        resizeMode="cover">
        <SafeAreaView style={styles.container}>
          <View style={styles.loading}>
            <ActivityIndicator
              size="large"
              color="#135FC4"
            />

            <Text style={styles.loadingText}>
              Đang tải phiếu bảo trì...
            </Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (!service) {
    return (
      <ImageBackground
        source={require('../../assets/background.jpg')}
        style={styles.background}
        resizeMode="cover">
        <SafeAreaView style={styles.container}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              Không tìm thấy phiếu
            </Text>

            <Text style={styles.emptyText}>
              Không thể tải dữ liệu phiếu bảo trì.
            </Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

 return (
  <ImageBackground
    source={require('../../assets/background.jpg')}
    style={styles.background}
    resizeMode="cover">

    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}>

        {/* ============================= */}
        {/* HEADER */}
        {/* ============================= */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Chỉnh sửa phiếu
          </Text>

          <Text style={styles.subtitle}>
            Cập nhật thông tin bảo trì
          </Text>

          <Text style={styles.elevatorId}>
            Mã thang máy: {elevatorId}
          </Text>
        </View>


        {/* ============================= */}
        {/* THÔNG TIN PHIẾU */}
        {/* ============================= */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Thông tin phiếu
          </Text>

          <View style={styles.infoBlock}>
            <Text style={styles.label}>
              Mã phiếu
            </Text>

            <Text style={styles.value}>
              {service.service?.id ||
                service.id}
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.label}>
              Ngày thực hiện
            </Text>

            <DatePickerField
              value={date}
              onChangeText={setDate}
              style={styles.input}
              placeholderTextColor="#8A9BB0"
            />
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.label}>
              Nội dung dịch vụ
            </Text>

            <TextInput
              value={description}
              onChangeText={setDescription}
              style={[
                styles.input,
                styles.descriptionInput,
              ]}
              placeholder="Nhập nội dung bảo trì"
              placeholderTextColor="#8A9BB0"
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>


        {/* ============================= */}
        {/* CHECKLIST */}
        {/* ============================= */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Checklist bảo trì
          </Text>

          {results.length > 0 ? (
            results.map(
              (item: any, index: number) => (
                <View
                  key={
                    item.checklistId ||
                    item.id ||
                    index
                  }
                  style={styles.checklistItem}>

                  <Text style={styles.checklistCode}>
                    {item.code ||
                      item.checklistCode ||
                      `Mục ${index + 1}`}
                  </Text>

                  <Text style={styles.checklistContent}>
                    {item.content ||
                      item.checklistContent ||
                      'Không có nội dung'}
                  </Text>

                  <View style={styles.resultRow}>

                    {/* ĐẠT */}
                    <TouchableOpacity
                      style={[
                        styles.resultButton,
                        item.result === 'pass' &&
                          styles.passButton,
                      ]}
                      activeOpacity={0.85}
                      onPress={() =>
                        handleResultChange(
                          Number(
                            item.checklistId,
                          ),
                          'pass',
                        )
                      }>

                      <Text
                        style={[
                          styles.resultButtonText,
                          item.result === 'pass' &&
                            styles.selectedResultText,
                        ]}>
                        ✓ Đạt
                      </Text>

                    </TouchableOpacity>


                    {/* KHÔNG ĐẠT */}
                    <TouchableOpacity
                      style={[
                        styles.resultButton,
                        item.result === 'fail' &&
                          styles.failButton,
                      ]}
                      activeOpacity={0.85}
                      onPress={() =>
                        handleResultChange(
                          Number(
                            item.checklistId,
                          ),
                          'fail',
                        )
                      }>

                      <Text
                        style={[
                          styles.resultButtonText,
                          item.result === 'fail' &&
                            styles.selectedResultText,
                        ]}>
                        ✕ Không đạt
                      </Text>

                    </TouchableOpacity>

                  </View>
                </View>
              ),
            )
          ) : (
            <Text style={styles.emptyText}>
              Không có dữ liệu checklist.
            </Text>
          )}
        </View>


        {/* ====================================== */}
        {/* FILE ĐÍNH KÈM */}
        {/* ====================================== */}
        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            📎 File đính kèm
          </Text>


          {/* ================================= */}
          {/* FILE ĐÃ LƯU */}
          {/* ================================= */}
          <Text style={styles.attachmentSubTitle}>
            File đã lưu
          </Text>

          {attachments.length > 0 ? (
            attachments.map(
              (file: any, index: number) => (
                <View
                  key={
                    file.id ||
                    `old-file-${index}`
                  }
                  style={styles.attachmentItem}>

                  {/* ICON */}
                  <Text style={styles.attachmentIcon}>
                    {file.fileType === 'image'
                      ? '🖼️'
                      : file.fileType === 'video'
                      ? '🎥'
                      : '📄'}
                  </Text>


                  {/* THÔNG TIN FILE */}
                  <View style={styles.attachmentInfo}>

                    <Text
                      style={styles.attachmentName}
                      numberOfLines={2}>
                      {file.fileName ||
                        'File đính kèm'}
                    </Text>

                    <Text
                      style={styles.attachmentMeta}>
                      {String(
                        file.fileType || '',
                      ).toUpperCase()}

                      {file.fileSize
                        ? ` · ${(
                            file.fileSize /
                            (1024 * 1024)
                          ).toFixed(1)} MB`
                        : ''}
                    </Text>

                  </View>


                  {/* NÚT XÓA FILE CŨ */}
                  <TouchableOpacity
                    style={styles.deleteAttachmentButton}
                    activeOpacity={0.85}
                    onPress={() =>
                      handleDeleteAttachment(
                        file.id,
                      )
                    }>

                    <Text
                      style={
                        styles.deleteAttachmentText
                      }>
                      Xóa
                    </Text>

                  </TouchableOpacity>

                </View>
              ),
            )
          ) : (
            <Text style={styles.emptyText}>
              Chưa có file đã lưu.
            </Text>
          )}


          {/* ================================= */}
          {/* FILE MỚI ĐƯỢC CHỌN */}
          {/* ================================= */}
          <Text
            style={[
              styles.attachmentSubTitle,
              {
                marginTop: 18,
              },
            ]}>
            File mới
          </Text>

          {selectedFiles.length > 0 ? (
            selectedFiles.map(
              (file: any, index: number) => (
                <View
                  key={
                    file.uri ||
                    `new-file-${index}`
                  }
                  style={styles.attachmentItem}>

                  {/* ICON */}
                  <Text style={styles.attachmentIcon}>
                    {file.type?.startsWith(
                      'image/',
                    )
                      ? '🖼️'
                      : file.type?.startsWith(
                          'video/',
                        )
                      ? '🎥'
                      : '📄'}
                  </Text>


                  {/* THÔNG TIN FILE */}
                  <View style={styles.attachmentInfo}>

                    <Text
                      style={styles.attachmentName}
                      numberOfLines={2}>
                      {file.name ||
                        'File mới'}
                    </Text>

                    <Text
                      style={styles.attachmentMeta}>
                      {file.type ||
                        'Không xác định'}

                      {file.size
                        ? ` · ${(
                            file.size /
                            (1024 * 1024)
                          ).toFixed(1)} MB`
                        : ''}
                    </Text>

                  </View>


                  {/* XÓA FILE KHỎI DANH SÁCH CHỜ UPLOAD */}
                  <TouchableOpacity
                    style={styles.deleteAttachmentButton}
                    activeOpacity={0.85}
                    onPress={() =>
                      handleRemoveSelectedFile(
                        index,
                      )
                    }>

                    <Text
                      style={
                        styles.deleteAttachmentText
                      }>
                      Xóa
                    </Text>

                  </TouchableOpacity>

                </View>
              ),
            )
          ) : (
            <Text style={styles.emptyText}>
              Chưa chọn file mới.
            </Text>
          )}


          {/* ================================= */}
          {/* NÚT THÊM FILE */}
          {/* ================================= */}
          <TouchableOpacity
            style={styles.addAttachmentButton}
            activeOpacity={0.85}
            onPress={handlePickFiles}>

            <Text
              style={styles.addAttachmentText}>
              ＋ Thêm ảnh / video / file
            </Text>

          </TouchableOpacity>

        </View>


        {/* ====================================== */}
        {/* NÚT LƯU */}
        {/* ====================================== */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            saving && styles.disabledButton,
          ]}
          activeOpacity={0.85}
          disabled={saving}
          onPress={handleSave}>

          {saving ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.saveButtonText}>
              Lưu thay đổi
            </Text>
          )}

        </TouchableOpacity>


        {/* ====================================== */}
        {/* NÚT HỦY */}
        {/* ====================================== */}
        <TouchableOpacity
          style={styles.cancelButton}
          activeOpacity={0.85}
          disabled={saving}
          onPress={() =>
            navigation.goBack()
          }>

          <Text style={styles.cancelButtonText}>
            Hủy
          </Text>

        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  </ImageBackground>
);
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.48)',
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 25,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#123B78',
  },

  subtitle: {
    fontSize: 15,
    marginTop: 6,
    color: '#42658F',
  },

  elevatorId: {
    fontSize: 13,
    marginTop: 8,
    color: '#607A9B',
    fontWeight: '600',
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 20,
    padding: 17,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(80,160,230,0.22)',
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#123B78',
    marginBottom: 15,
  },

  infoBlock: {
    marginBottom: 15,
  },

  label: {
    fontSize: 13,
    color: '#607A9B',
    marginBottom: 6,
  },

  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#123B78',
  },

  input: {
    backgroundColor: '#F5F9FF',
    borderWidth: 1,
    borderColor: 'rgba(80,160,230,0.25)',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    color: '#123B78',
  },

  descriptionInput: {
    minHeight: 90,
  },

  checklistItem: {
    backgroundColor: '#F5F9FF',
    borderWidth: 1,
    borderColor: 'rgba(80,160,230,0.20)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  checklistCode: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#135FC4',
    marginBottom: 4,
  },

  checklistContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#123B78',
  },

  resultRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  resultButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#B8C7D9',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  attachmentSubTitle: {
  fontSize: 13,
  fontWeight: '600',
  color: '#607A9B',
  marginBottom: 8,
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
  fontSize: 24,
  marginRight: 10,
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

deleteAttachmentButton: {
  marginLeft: 10,
  padding: 8,
},

deleteAttachmentText: {
  fontSize: 20,
},

addAttachmentButton: {
  marginTop: 5,
  backgroundColor: '#F5F9FF',
  borderWidth: 1,
  borderColor: '#135FC4',
  borderRadius: 12,
  paddingVertical: 12,
  alignItems: 'center',
},

addAttachmentText: {
  color: '#135FC4',
  fontSize: 14,
  fontWeight: 'bold',
},
  passButton: {
    backgroundColor: '#16834B',
    borderColor: '#16834B',
  },

  failButton: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },

  resultButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#607A9B',
  },

  selectedResultText: {
    color: '#FFFFFF',
  },

  saveButton: {
    backgroundColor: '#135FC4',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },

  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#B8C7D9',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
  },

  cancelButtonText: {
    color: '#607A9B',
    fontSize: 15,
    fontWeight: 'bold',
  },

  disabledButton: {
    opacity: 0.6,
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#607A9B',
  },

  emptyCard: {
    margin: 20,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 3,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#123B78',
  },

  emptyText: {
    fontSize: 14,
    color: '#607A9B',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ServiceEdit;
