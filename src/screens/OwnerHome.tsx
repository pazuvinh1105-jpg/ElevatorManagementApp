import React from 'react';
import {
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigation';
import LogoutButton from '../navigation/LogoutButton';

const OwnerHome = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ImageBackground
      source={require('../../assets/background.jpg')}
      style={styles.background}
      resizeMode="cover">
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}>
            <LogoutButton />

            {/* ================= HEADER ================= */}

            <View style={styles.headerCard}>
              <Text style={styles.title}>
                Quản lý thang máy
              </Text>

              <Text style={styles.subtitle}>
                Khu vực quản lý dành cho chủ sở hữu
              </Text>
            </View>

            {/* ================= MENU ================= */}

            <View style={styles.menu}>

              {/* Thông tin chung */}
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('ElevatorInfo')
                }>
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>
                    🏢
                  </Text>
                </View>

                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>
                    Thông tin chung
                  </Text>

                  <Text style={styles.menuDescription}>
                    Thông tin cơ bản của thang máy
                  </Text>
                </View>

                <Text style={styles.arrow}>
                  ›
                </Text>
              </TouchableOpacity>


              {/* Thông số kỹ thuật */}
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('TechnicalInfo')
                }>
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>
                    ⚙️
                  </Text>
                </View>

                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>
                    Thông số kỹ thuật
                  </Text>

                  <Text style={styles.menuDescription}>
                    Thông số kỹ thuật của thang máy
                  </Text>
                </View>

                <Text style={styles.arrow}>
                  ›
                </Text>
              </TouchableOpacity>


              {/* Dữ liệu kiểm định */}
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('Inspections')
                }>
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>
                    📋
                  </Text>
                </View>

                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>
                    Dữ liệu kiểm định
                  </Text>

                  <Text style={styles.menuDescription}>
                    Xem hồ sơ và kết quả kiểm định
                  </Text>
                </View>

                <Text style={styles.arrow}>
                  ›
                </Text>
              </TouchableOpacity>


              {/* Lịch sử dịch vụ */}
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('ServiceHistory')
                }>
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>
                    🔧
                  </Text>
                </View>

                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>
                    Lịch sử dịch vụ
                  </Text>

                  <Text style={styles.menuDescription}>
                    Theo dõi quá trình bảo trì và sửa chữa
                  </Text>
                </View>

                <Text style={styles.arrow}>
                  ›
                </Text>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({

  /* ================= BACKGROUND ================= */

  background: {
    flex: 1,
  },


  /* ================= OVERLAY ================= */

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(235,246,255,0.55)',
  },

  safeArea: {
    flex: 1,
  },


  /* ================= CONTENT ================= */

  content: {
    flexGrow: 1,

    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 35,

    justifyContent: 'center',
  },


  /* ================= HEADER ================= */

  headerCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',

    borderRadius: 22,

    paddingHorizontal: 20,
    paddingVertical: 20,

    marginBottom: 20,

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

  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#123B78',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: '#42658F',
    marginTop: 7,
    textAlign: 'center',
  },


  /* ================= MENU ================= */

  menu: {
    gap: 13,
  },

  menuItem: {
    minHeight: 82,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: 'rgba(255,255,255,0.94)',

    borderRadius: 18,

    paddingHorizontal: 14,
    paddingVertical: 12,

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


  /* ================= ICON ================= */

  iconBox: {
    width: 50,
    height: 50,

    borderRadius: 15,

    backgroundColor: '#E8F3FF',

    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    fontSize: 26,
  },


  /* ================= TEXT ================= */

  menuText: {
    flex: 1,

    marginLeft: 13,

    paddingRight: 8,
  },

  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#123B78',
  },

  menuDescription: {
    fontSize: 12,
    lineHeight: 17,

    color: '#607A9B',

    marginTop: 4,
  },


  /* ================= ARROW ================= */

  arrow: {
    fontSize: 29,

    color: '#1469D8',

    marginLeft: 5,
  },
});

export default OwnerHome;
