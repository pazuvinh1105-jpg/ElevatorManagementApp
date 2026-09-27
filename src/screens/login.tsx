import React, {useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/loginStyle';
import {
  Alert,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {RootStackParamList} from '../navigation/AppNavigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({navigation}: Props) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên đăng nhập.');
      return;
    }

    if (!password) {
      Alert.alert('Thông báo', 'Vui lòng nhập mật khẩu.');
      return;
    }
    try {
    const response = await fetch('http://127.0.0.1:3000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      Alert.alert('Đăng nhập thất bại', data.message);
      return;
    }

    await AsyncStorage.setItem('token', data.token);

   Alert.alert(
  'Đăng nhập thành công',
  `Xin chào ${data.user.username}`,
   [
    {
      text: 'OK',
      onPress: () => {
        if (data.user.role === 'admin') {
           navigation.navigate('AdminHome');
        } else if (data.user.role === 'technician') {
           navigation.navigate('ElevatorSearch');
        } else if (data.user.role === 'owner') {
           navigation.navigate('OwnerHome');
        }
      },
    },
      ],
  );
  } catch (error) {
    console.error(error);
    Alert.alert(
      'Lỗi kết nối',
      'Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend.',
    );
  }
};

  return (
    <ImageBackground
      source={require('../../assets/background.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>

              {/* Logo */}
              <View style={styles.logo}>
                <Text style={styles.logoArrow}>↑ ↓</Text>

                <View style={styles.elevatorDoor}>
                  <View style={styles.doorLeft} />
                  <View style={styles.doorRight} />
                </View>
              </View>

              {/* App name */}
              <Text style={styles.appTitle}>
                Elevator Management App
              </Text>

              <Text style={styles.appSubtitle}>
                Quản lý thang máy thông minh
              </Text>

              {/* Login title */}
              <View style={styles.loginHeader}>
                <Text style={styles.loginTitle}>
                  Đăng nhập
                </Text>

                <Text style={styles.welcomeText}>
                  Chào mừng bạn quay trở lại!
                </Text>

                <Text style={styles.description}>
                  Vui lòng đăng nhập để tiếp tục sử dụng hệ thống.
                </Text>
              </View>

              {/* Username */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>♙</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Tên đăng nhập"
                  placeholderTextColor="#8A9AB5"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>♙</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Mật khẩu"
                  placeholderTextColor="#8A9AB5"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword ? '◉' : '◌'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Login button */}
              <TouchableOpacity
                style={styles.loginButton}
                activeOpacity={0.8}
                onPress={handleLogin}
              >
                <Text style={styles.loginButtonText}>
                  Đăng nhập
                </Text>
              </TouchableOpacity>

              {/* Footer */}
              <Text style={styles.footer}>
                Vận hành an toàn
              </Text>
              <Text style={styles.footerSubtitle}>
               Nâng tầm cuộc sống
              </Text>

            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

export default LoginScreen;