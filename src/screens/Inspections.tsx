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

const Inspections = ({route}: any) => {
  const selectedElevatorId = route.params?.elevatorId;

  const [elevatorId, setElevatorId] = useState<string | null>(null);
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [inspectionDate, setInspectionDate] = useState('');
  const [inspectionUnit, setInspectionUnit] = useState('');
  const [result, setResult] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const getInspections = async () => {
      try {
        const token = await AsyncStorage.getItem('token');

        if (!token) {
          Alert.alert(
            'Lỗi',
            'Không tìm thấy thông tin đăng nhập.',
          );
          return;
        }

        let elevatorId = selectedElevatorId;

        // Nếu Technician đã chọn một thang máy
        if (!elevatorId) {
          // Owner: lấy thang máy được phân quyền
          const elevatorResponse = await fetch(
            'http://127.0.0.1:3000/elevators',
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          const elevatorData = await elevatorResponse.json();

          if (!elevatorResponse.ok) {
            Alert.alert(
              'Lỗi',
              elevatorData.message ||
                'Không lấy được thông tin thang máy.',
            );
            return;
          }

          if (elevatorData.length === 0) {
            Alert.alert(
              'Thông báo',
              'Không tìm thấy thang máy được phân quyền.',
            );
            return;
          }

          elevatorId = elevatorData[0].elevatorId;
        }

        setElevatorId(elevatorId);

        // Lấy dữ liệu kiểm định của đúng thang máy
        const inspectionResponse = await fetch(
          `http://127.0.0.1:3000/elevators/${elevatorId}/inspections`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const inspectionData = await inspectionResponse.json();

        if (!inspectionResponse.ok) {
          Alert.alert(
            'Lỗi',
            inspectionData.message ||
              'Không lấy được dữ liệu kiểm định.',
          );
          return;
        }

        setInspections(inspectionData);
      } catch (error) {
        console.error(
          'Lỗi lấy dữ liệu kiểm định:',
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

    getInspections();
  }, [selectedElevatorId]);

  const handleAddInspection = async () => {
    if (
      !inspectionDate.trim() ||
      !inspectionUnit.trim() ||
      !result.trim()
    ) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng nhập ngày kiểm định, đơn vị kiểm định và kết quả.',
      );
      return;
    }

    if (!elevatorId) {
      Alert.alert(
        'Lỗi',
        'Không xác định được thang máy.',
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

      const response = await fetch(
        `http://127.0.0.1:3000/elevators/${elevatorId}/inspections`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            inspectionDate: inspectionDate.trim(),
            inspectionUnit: inspectionUnit.trim(),
            result: result.trim(),
            description: description.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          'Lỗi',
          data.message || 'Không thể thêm bản ghi kiểm định.',
        );
        return;
      }

      Alert.alert(
        'Thành công',
        'Đã thêm bản ghi kiểm định.',
      );

      setInspectionDate('');
      setInspectionUnit('');
      setResult('');
      setDescription('');
      setShowAddForm(false);

      // Tải lại danh sách
      const refreshResponse = await fetch(
        `http://127.0.0.1:3000/elevators/${elevatorId}/inspections`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const refreshData = await refreshResponse.json();

      if (refreshResponse.ok) {
        setInspections(refreshData);
      }
    } catch (error) {
      console.error(
        'Lỗi thêm kiểm định:',
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

  return (
    <ImageBackground
      source={require('../../assets/background.jpg')}
      style={styles.background}
      resizeMode="cover">
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {/* ================= HEADER ================= */}

          <View style={styles.header}>
            <Text style={styles.title}>
              Dữ liệu kiểm định
            </Text>

            <Text style={styles.subtitle}>
              Hồ sơ và kết quả kiểm định thang máy
            </Text>

            {elevatorId && (
              <Text style={styles.elevatorId}>
                Mã thang máy: {elevatorId}
              </Text>
            )}

            {selectedElevatorId && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddForm(!showAddForm)}>
              <Text style={styles.addButtonText}>
                {showAddForm
                  ? 'Đóng biểu mẫu'
                  : '+ Thêm kiểm định'}
              </Text>
            </TouchableOpacity>
            )}
          </View>

          {/* ================= ADD FORM ================= */}

          {showAddForm && selectedElevatorId && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                Thêm bản ghi kiểm định
              </Text>

              <Text style={styles.inputLabel}>
                Ngày kiểm định
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ví dụ: 2026-09-27"
                value={inspectionDate}
                onChangeText={setInspectionDate}
              />

              <Text style={styles.inputLabel}>
                Đơn vị kiểm định
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Nhập tên đơn vị kiểm định"
                value={inspectionUnit}
                onChangeText={setInspectionUnit}
              />

              <Text style={styles.inputLabel}>
                Kết quả
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Đạt"
                value={result}
                onChangeText={setResult}
              />

              <Text style={styles.inputLabel}>
                Nội dung
              </Text>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Nhập nội dung kiểm định"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddInspection}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    Lưu kiểm định
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ================= LOADING ================= */}

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator
                size="large"
                color="#135FC4"
              />

              <Text style={styles.loadingText}>
                Đang tải dữ liệu...
              </Text>
            </View>
          ) : inspections.length === 0 ? (
            /* ================= EMPTY ================= */

            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                Chưa có dữ liệu kiểm định
              </Text>

              <Text style={styles.emptyText}>
                Thang máy hiện chưa có hồ sơ kiểm định.
              </Text>
            </View>
          ) : (
            /* ================= INSPECTION LIST ================= */

            <View style={styles.list}>
              {inspections.map((inspection, index) => (
                <View
                  key={inspection.id}
                  style={styles.card}>
                  {/* Card header */}

                  <View style={styles.cardHeader}>
                    <View style={styles.numberBox}>
                      <Text style={styles.number}>
                        {index + 1}
                      </Text>
                    </View>

                    <View style={styles.cardHeaderContent}>
                      <Text style={styles.cardTitle}>
                        Lần kiểm định {index + 1}
                      </Text>

                      <Text style={styles.date}>
                        {inspection.inspectionDate}
                      </Text>
                    </View>

                    <View style={styles.resultBadge}>
                      <Text style={styles.resultText}>
                        {inspection.result}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.separator} />

                  {/* Inspection unit */}

                  <View style={styles.infoBlock}>
                    <Text style={styles.label}>
                      Đơn vị kiểm định
                    </Text>

                    <Text style={styles.value}>
                      {inspection.inspectionUnit ||
                        'Chưa cập nhật'}
                    </Text>
                  </View>

                  {/* Description */}

                  <View style={styles.infoBlock}>
                    <Text style={styles.label}>
                      Nội dung
                    </Text>

                    <Text style={styles.description}>
                      {inspection.description ||
                        'Không có mô tả'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  /* ================= BACKGROUND ================= */

  background: {
    flex: 1,
  },

  /* ================= OVERLAY ================= */

  container: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.48)',
  },

  /* ================= CONTENT ================= */

  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 25,
    paddingBottom: 40,
    justifyContent: 'center',
  },

  /* ================= HEADER ================= */

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

  addButton: {
    marginTop: 15,
    backgroundColor: '#135FC4',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },

  /* ================= ADD FORM ================= */

  formCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(80,160,230,0.22)',
    elevation: 3,
  },

  formTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#123B78',
    marginBottom: 15,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#607A9B',
    marginBottom: 6,
    marginTop: 10,
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

  textArea: {
    minHeight: 90,
  },

  saveButton: {
    marginTop: 18,
    backgroundColor: '#16834B',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },

  /* ================= LOADING ================= */

  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#607A9B',
  },

  /* ================= LIST ================= */

  list: {
    gap: 14,
  },

  /* ================= INSPECTION CARD ================= */

  card: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 20,
    padding: 17,
    borderWidth: 1,
    borderColor: 'rgba(80,160,230,0.22)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },

  /* ================= CARD HEADER ================= */

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  numberBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5F2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  number: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#135FC4',
  },

  cardHeaderContent: {
    flex: 1,
    marginLeft: 12,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#123B78',
  },

  date: {
    fontSize: 13,
    color: '#607A9B',
    marginTop: 4,
  },

  /* ================= RESULT ================= */

  resultBadge: {
    backgroundColor: '#E7F7EE',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  resultText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#16834B',
  },

  /* ================= SEPARATOR ================= */

  separator: {
    height: 1,
    backgroundColor: 'rgba(80,120,160,0.12)',
    marginVertical: 14,
  },

  /* ================= INFO ================= */

  infoBlock: {
    marginBottom: 12,
  },

  label: {
    fontSize: 13,
    color: '#607A9B',
    marginBottom: 4,
  },

  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#123B78',
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#42658F',
  },

  /* ================= EMPTY ================= */

  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(80,160,230,0.22)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },

  emptyTitle: {
    fontSize: 17,
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

export default Inspections;