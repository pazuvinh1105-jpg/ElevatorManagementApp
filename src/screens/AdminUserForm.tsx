import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigation';
import {adminRequest, ManagedUser} from '../admin/api';
import styles from '../admin/styles';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminUserForm'>;

const AdminUserForm = ({navigation, route}: Props) => {
  const userId = route.params?.userId;

  const [role, setRole] = useState<'owner' | 'technician'>(
    route.params?.role || 'technician',
  );

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [elevatorId, setElevatorId] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    adminRequest<ManagedUser[]>('/users')
      .then(users => {
        const user = users.find(item => item.id === userId);

        if (!user || user.role === 'admin') {
          throw new Error(
            'Không tìm thấy tài khoản có thể phân quyền.',
          );
        }

        setUsername(user.username);
        setRole(user.role);
        setEmployeeId(user.employeeId || '');
        setElevatorId(user.elevatorId || '');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  const save = async () => {
    setError('');

    // Kiểm tra thông tin bắt buộc
    if (
      (!userId &&
        (!username.trim() ||
          !password ||
          !confirmPassword)) ||
      (role === 'technician' && !employeeId.trim()) ||
      (role === 'owner' && !elevatorId.trim())
    ) {
      setError('Vui lòng nhập đầy đủ thông tin bắt buộc.');
      return;
    }

    // Chỉ kiểm tra xác nhận mật khẩu khi tạo tài khoản mới
    if (!userId && password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSaving(true);

    try {
      await adminRequest(userId ? `/users/${userId}` : '/users', {
        method: userId ? 'PATCH' : 'POST',
        body: JSON.stringify({
          username: username.trim(),
          password,
          role,
          employeeId:
            role === 'technician'
              ? employeeId.trim()
              : null,
          elevatorId:
            role === 'owner'
              ? elevatorId.trim()
              : null,
        }),
      });

      navigation.goBack();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể lưu tài khoản.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">

      {/* Tiêu đề */}
      <Text style={styles.title}>
        {userId
          ? 'Phân quyền tài khoản'
          : role === 'technician'
          ? 'Tạo tài khoản kỹ thuật viên'
          : 'Tạo tài khoản chủ sở hữu'}
      </Text>

      <Text style={styles.subtitle}>
        {userId
          ? 'Chọn quyền và thông tin tương ứng'
          : 'Nhập thông tin tài khoản'}
      </Text>

      {loading ? (
        <ActivityIndicator color="#135FC4" />
      ) : (
        <>
          {/* Tạo tài khoản mới */}
          {!userId && (
            <>
              <Text style={styles.label}>Tên đăng nhập</Text>

              <TextInput
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={setUsername}
                placeholder="Nhập tên đăng nhập"
              />

              <Text style={styles.label}>Mật khẩu</Text>

              <TextInput
                style={styles.input}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholder="Nhập mật khẩu"
              />

              <Text style={styles.label}>
                Xác nhận mật khẩu
              </Text>

              <TextInput
                style={styles.input}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Nhập lại mật khẩu"
              />
            </>
          )}

          {/* Tên tài khoản khi phân quyền */}
          {!!userId && (
            <Text style={styles.section}>{username}</Text>
          )}

          {/* Chọn vai trò khi phân quyền */}
          {!!userId && (
            <>
              <Text style={styles.label}>Vai trò</Text>

              <View
                style={{
                  flexDirection: 'row',
                  gap: 10,
                  marginBottom: 16,
                }}>

                {(['technician', 'owner'] as const).map(value => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.secondaryButton,
                      {
                        flex: 1,
                        backgroundColor:
                          role === value
                            ? '#135FC4'
                            : '#E5F2FF',
                      },
                    ]}
                    onPress={() => {
                      setRole(value);
                      setError('');
                    }}>

                    <Text
                      style={[
                        styles.secondaryText,
                        role === value && {
                          color: '#FFFFFF',
                        },
                      ]}>
                      {value === 'owner'
                        ? 'Chủ sở hữu'
                        : 'Kỹ thuật viên'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Thông tin theo vai trò */}
          {role === 'technician' ? (
            <>
              <Text style={styles.label}>
                Mã nhân viên
              </Text>

              <TextInput
                style={styles.input}
                value={employeeId}
                onChangeText={setEmployeeId}
                placeholder="Ví dụ: TECH001"
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>
                Mã định danh thang máy
              </Text>

              <TextInput
                style={styles.input}
                value={elevatorId}
                onChangeText={setElevatorId}
                placeholder="Ví dụ: 29A1-0001-01"
                autoCapitalize="characters"
                autoCorrect={false}
              />

              <Text
                style={{
                  fontSize: 13,
                  color: '#6B7280',
                  marginTop: -8,
                  marginBottom: 16,
                }}>
                Nhập đúng mã thang máy đã được tạo
                trong hệ thống.
              </Text>
            </>
          )}

          {/* Thông báo lỗi */}
          {!!error && (
            <Text style={styles.error}>{error}</Text>
          )}

          {/* Nút lưu */}
          <TouchableOpacity
            style={styles.button}
            onPress={save}
            disabled={saving}>

            <Text style={styles.buttonText}>
              {saving
                ? 'Đang lưu...'
                : 'Lưu tài khoản'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {loading && !!error && (
        <Text style={styles.error}>{error}</Text>
      )}
    </ScrollView>
  );
};

export default AdminUserForm;