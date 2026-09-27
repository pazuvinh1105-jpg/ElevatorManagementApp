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

type Props = {
  route: {
    params: {
      elevatorId: string;
      owner?: string;
      location?: string;
    };
  };
  navigation: any;
};

const TechnicianElevatorMenu = ({route, navigation}: Props) => {
  const {elevatorId, owner, location} = route.params;

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
            
            {/* ================= HEADER ================= */}

            <View style={styles.headerCard}>
              <Text style={styles.title}>
                Quản lý thang máy
              </Text>

              <Text style={styles.elevatorId}>
                {elevatorId}
              </Text>

              <View style={styles.infoContainer}>
                {owner && (
                  <Text style={styles.info}>
                    Chủ sở hữu: {owner}
                  </Text>
                )}

                {location && (
                  <Text style={styles.info}>
                    Vị trí: {location}
                  </Text>
                )}
              </View>
            </View>

            {/* ================= MENU ================= */}

            <View style={styles.menu}>
              {/* Thông tin chung */}
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('ElevatorInfo', {
                    elevatorId,
                  })
                }>
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>🏢</Text>
                </View>

                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>
                    Thông tin chung
                  </Text>

                  <Text style={styles.menuDescription}>
                    Thông tin cơ bản của thang máy
                  </Text>
                </View>

                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>

              {/* Thông tin kỹ thuật */}
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('TechnicalInfo', {
                    elevatorId,
                  })
                }>
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>⚙️</Text>
                </View>

                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>
                    Thông tin kỹ thuật
                  </Text>

                  <Text style={styles.menuDescription}>
                    Thông số kỹ thuật của thang máy
                  </Text>
                </View>

                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>

              {/* Lịch sử kiểm định */}
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('Inspections', {
                    elevatorId,
                  })
                }>
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>📋</Text>
                </View>

                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>
                    Lịch sử kiểm định
                  </Text>

                  <Text style={styles.menuDescription}>
                    Theo dõi các lần kiểm định
                  </Text>
                </View>

                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>

              {/* Lịch sử bảo trì */}
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('ServiceHistory', {
                    elevatorId,
                  })
                }>
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>🔧</Text>
                </View>

                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>
                    Lịch sử bảo trì
                  </Text>

                  <Text style={styles.menuDescription}>
                    Theo dõi quá trình bảo trì và sửa chữa
                  </Text>
                </View>

                <Text style={styles.arrow}>›</Text>
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

  elevatorId: {
    fontSize: 20,
    fontWeight: '700',
    color: '#087FEA',
    marginTop: 8,
    textAlign: 'center',
  },

  infoContainer: {
    marginTop: 10,
  },

  info: {
    fontSize: 14,
    color: '#42658F',
    marginTop: 4,
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

export default TechnicianElevatorMenu;