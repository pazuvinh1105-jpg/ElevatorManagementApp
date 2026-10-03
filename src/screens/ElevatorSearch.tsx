import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LogoutButton from '../navigation/LogoutButton';
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

type Elevator = {
  elevatorId: string;
  owner: string;
  location: string;
  city: string;
  manufacturer: string;
  status: string;
};

const ElevatorSearch = () => {
  const navigation =
  useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Elevator[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    const searchText = keyword.trim().toLowerCase();

    if (!searchText) {
      Alert.alert(
        'Thông báo',
        'Vui lòng nhập mã thang máy hoặc tên chủ sở hữu.',
      );
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);

      const token = await AsyncStorage.getItem('token');

      const response = await fetch(
        'http://127.0.0.1:3000/elevators',
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
          'Tra cứu thất bại',
          data.message || 'Không thể lấy danh sách thang máy.',
        );
        setResults([]);
        return;
      }

      const elevators: Elevator[] = Array.isArray(data)
        ? data
        : data.elevators || [];

      const filteredResults = elevators.filter(
        elevator =>
          elevator.elevatorId?.toLowerCase().includes(searchText) ||
          elevator.owner?.toLowerCase().includes(searchText),
      );

      setResults(filteredResults);
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Lỗi kết nối',
        'Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend.',
      );

      setResults([]);
    } finally {
      setLoading(false);
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
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <LogoutButton />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                Elevator Management
              </Text>

              <Text style={styles.subtitle}>
                Tra cứu nhanh thông tin thang máy
              </Text>
            </View>

            {/* Search */}
            <View style={styles.searchSection}>
              <Text style={styles.sectionTitle}>
                NHẬP THÔNG TIN TRA CỨU
              </Text>

              <View style={styles.searchInputContainer}>
                <Text style={styles.searchIcon}>
                  🔍
                </Text>

                <TextInput
                  style={styles.searchInput}
                  placeholder="Mã thang máy hoặc tên chủ sở hữu"
                  placeholderTextColor="#7890B2"
                  value={keyword}
                  onChangeText={setKeyword}
                  autoCapitalize="none"
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                />
              </View>

              <TouchableOpacity
                style={styles.searchButton}
                activeOpacity={0.8}
                onPress={handleSearch}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.searchButtonIcon}>
                      🔍
                    </Text>

                    <Text style={styles.searchButtonText}>
                      TRA CỨU
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Results */}
            {hasSearched && !loading && (
              <View style={styles.resultSection}>

                <Text style={styles.resultTitle}>
                  Kết quả tra cứu
                </Text>

                {results.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>
                      Không tìm thấy thang máy
                    </Text>

                    <Text style={styles.emptyDescription}>
                      Vui lòng kiểm tra lại mã thang máy hoặc tên chủ sở hữu.
                    </Text>
                  </View>
                ) : (
                  results.map(elevator => (
                    <TouchableOpacity
                       key={elevator.elevatorId}
                       style={styles.resultCard}
                       activeOpacity={0.8}
                       onPress={() => {
                        navigation.navigate('TechnicianElevatorMenu', {
                        elevatorId: elevator.elevatorId,
                        owner: elevator.owner,
                        location: `${elevator.location}, ${elevator.city}`,
                        });
                    }}
                    >
                      <View style={styles.resultIconBox}>
                        <Text style={styles.resultIcon}>
                          ⇅
                        </Text>
                      </View>

                      <View style={styles.resultContent}>
                        <Text style={styles.elevatorId}>
                          {elevator.elevatorId}
                        </Text>

                        <Text style={styles.owner}>
                          Chủ sở hữu: {elevator.owner}
                        </Text>

                        <Text style={styles.location}>
                          {elevator.location}, {elevator.city}
                        </Text>

                        <Text style={styles.manufacturer}>
                          {elevator.manufacturer}
                        </Text>
                      </View>

                      <Text style={styles.arrow}>
                        ›
                      </Text>
                    </TouchableOpacity>
                  ))
                )}

              </View>
            )}

          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(235, 246, 255, 0.55)',
  },

  safeArea: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 25,
  },

  header: {
    marginBottom: 30,
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

  searchSection: {
    marginBottom: 25,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#123B78',
    marginBottom: 10,
  },

  searchInputContainer: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: '#BFD9F4',
    borderRadius: 12,
    paddingHorizontal: 14,
  },

  searchIcon: {
    fontSize: 20,
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#243B5A',
  },

  searchButton: {
    height: 52,
    borderRadius: 11,
    backgroundColor: '#087FEA',
    marginTop: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',

    elevation: 3,
    shadowColor: '#087FEA',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  searchButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },

  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  resultSection: {
    marginTop: 5,
  },

  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#123B78',
    marginBottom: 12,
  },

  resultCard: {
    minHeight: 105,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 12,

    borderWidth: 1,
    borderColor: 'rgba(80,160,230,0.22)',

    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },

  resultIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E5F2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  resultIcon: {
    fontSize: 25,
    color: '#135FC4',
    fontWeight: '700',
  },

  resultContent: {
    flex: 1,
    marginLeft: 14,
    paddingRight: 6,
  },

  elevatorId: {
    fontSize: 17,
    fontWeight: '700',
    color: '#123B78',
  },

  owner: {
    fontSize: 13,
    color: '#42658F',
    marginTop: 5,
  },

  location: {
    fontSize: 12,
    color: '#607A9B',
    marginTop: 3,
  },

  manufacturer: {
    fontSize: 12,
    color: '#7185A5',
    marginTop: 3,
  },

  arrow: {
    fontSize: 30,
    color: '#1469D8',
    marginLeft: 4,
  },

  emptyContainer: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#123B78',
  },

  emptyDescription: {
    fontSize: 13,
    color: '#607A9B',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 7,
  },
});

export default ElevatorSearch;
