import React, {createContext, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Role = 'admin' | 'technician' | 'owner';
type AuthState = {role: Role | null; ready: boolean; signIn: (token: string, role: Role) => Promise<void>; signOut: () => Promise<void>};
const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider = ({children}: {children: React.ReactNode}) => {
  const [role, setRole] = useState<Role | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem('token'), AsyncStorage.getItem('role')])
      .then(([token, storedRole]) => {
        if (token && (storedRole === 'admin' || storedRole === 'technician' || storedRole === 'owner')) setRole(storedRole);
      })
      .finally(() => setReady(true));
  }, []);

  const signIn = async (token: string, nextRole: Role) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('role', nextRole);
    setRole(nextRole);
  };
  const signOut = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('role');
    setRole(null);
  };
  return <AuthContext.Provider value={{role, ready, signIn, signOut}}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('AuthProvider is missing');
  return auth;
};
