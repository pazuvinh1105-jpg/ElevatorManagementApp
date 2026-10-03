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

const ServiceEdit = ({route, navigation}: any) => {
  const {elevatorId, serviceId} = route.params;

  const [service, setService] = useState<any>(null);
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [results, setResults] = useState<any[]>([]);

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

      Alert.alert(
        'Thành công',
        'Đã cập nhật phiếu bảo trì.',
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

          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.85}
            disabled={saving}
            onPress={() => navigation.goBack()}>
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
