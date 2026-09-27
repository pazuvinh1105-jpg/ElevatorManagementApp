import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = 'http://127.0.0.1:3000';

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    throw new Error('Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.');
  }
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Yêu cầu không thành công.');
  }
  return data as T;
}

export const adminRequest = apiRequest;

export type Elevator = {
  elevatorId: string;
  owner: string;
  location: string;
  city: string;
  manufacturer: string | null;
  installationDate: string | null;
  type: string | null;
  capacity: string | null;
  status: string | null;
  numberOfStops: number | null;
  speed: number | null;
  pitDepth: number | null;
  overheadHeight: number | null;
  driveType: string | null;
};

export type ManagedUser = {
  id: number;
  username: string;
  role: 'admin' | 'technician' | 'owner';
  employeeId: string | null;
  elevatorId: string | null;
};
