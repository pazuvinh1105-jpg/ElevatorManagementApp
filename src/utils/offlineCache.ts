
import AsyncStorage from '@react-native-async-storage/async-storage';

type CacheData<T> = {
  data: T;
  updatedAt: string;
};

const CACHE_PREFIX = '@liftcare_cache:';

/**
 * Tạo key riêng cho từng tài khoản và từng loại dữ liệu.
 */
const getCacheKey = (userId: string, dataType: string) => {
  return `${CACHE_PREFIX}${userId}:${dataType}`;
};

/**
 * Lưu dữ liệu mới nhất vào bộ nhớ thiết bị.
 */
export const saveCache = async <T>(
  userId: string,
  dataType: string,
  data: T,
): Promise<void> => {
  try {
    const cache: CacheData<T> = {
      data,
      updatedAt: new Date().toISOString(),
    };

    const key = getCacheKey(userId, dataType);

    await AsyncStorage.setItem(key, JSON.stringify(cache));
  } catch (error) {
    console.error('Lỗi lưu cache:', error);
  }
};

/**
 * Đọc dữ liệu đã lưu gần nhất.
 */
export const getCache = async <T>(
  userId: string,
  dataType: string,
): Promise<CacheData<T> | null> => {
  try {
    const key = getCacheKey(userId, dataType);
    const cachedValue = await AsyncStorage.getItem(key);

    if (!cachedValue) {
      return null;
    }

    return JSON.parse(cachedValue) as CacheData<T>;
  } catch (error) {
    console.error('Lỗi đọc cache:', error);
    return null;
  }
};

/**
 * Xóa cache của một loại dữ liệu thuộc một tài khoản.
 */
export const removeCache = async (
  userId: string,
  dataType: string,
): Promise<void> => {
  try {
    const key = getCacheKey(userId, dataType);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Lỗi xóa cache:', error);
  }
};
