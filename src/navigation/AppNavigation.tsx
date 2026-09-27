import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import LoginScreen from '../screens/login';
import RegisterScreen from '../screens/register';
import HomeScreen from '../screens/Home';

import OwnerHome from '../screens/OwnerHome';

import ElevatorSearch from '../screens/ElevatorSearch';
import TechnicianElevatorMenu from '../screens/TechnicianElevatorMenu';

import ElevatorInfo from '../screens/ElevatorInfo';
import TechnicalInfo from '../screens/TechnicalInfo';
import Inspections from '../screens/Inspections';
import ServiceHistory from '../screens/ServiceHistory';

// Admin
import AdminHome from '../screens/AdminHome';
import AdminElevators from '../screens/AdminElevators';
import AdminElevatorForm from '../screens/AdminElevatorForm';
import AdminUsers from '../screens/AdminUsers';
import AdminUserForm from '../screens/AdminUserForm';
import AdminElevatorActions from '../screens/AdminElevatorActions';
import AdminRecordForm from '../screens/AdminRecordForm';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;

  // Owner
  OwnerHome: undefined;

  // Technician
  ElevatorSearch: undefined;
  TechnicianElevatorMenu: {
    elevatorId: string;
    owner?: string;
    location?: string;
  };

  // Shared screens
  ElevatorInfo: {elevatorId?: string} | undefined;
  TechnicalInfo: {elevatorId?: string} | undefined;
  Inspections: {elevatorId?: string} | undefined;
  ServiceHistory: {elevatorId?: string} | undefined;

  // Admin
  AdminHome: undefined;
  AdminElevators: undefined;
  AdminElevatorForm: {elevatorId?: string} | undefined;
  AdminUsers: undefined;
  AdminUserForm:
    | {
        userId?: number;
        role?: 'owner' | 'technician';
      }
    | undefined;
  AdminElevatorActions: {
    elevatorId: string;
  };
  AdminRecordForm: {
    elevatorId: string;
    kind: 'inspection' | 'service';
    recordId?: number;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="Login" component={LoginScreen} />

        <Stack.Screen name="Register" component={RegisterScreen} />

        <Stack.Screen name="Home" component={HomeScreen} />

        {/* Owner */}
        <Stack.Screen name="OwnerHome" component={OwnerHome} />

        {/* Technician */}
        <Stack.Screen
          name="ElevatorSearch"
          component={ElevatorSearch}
        />

        <Stack.Screen
          name="TechnicianElevatorMenu"
          component={TechnicianElevatorMenu}
        />

        {/* Shared */}
        <Stack.Screen
          name="ElevatorInfo"
          component={ElevatorInfo}
        />

        <Stack.Screen
          name="TechnicalInfo"
          component={TechnicalInfo}
        />

        <Stack.Screen
          name="Inspections"
          component={Inspections}
        />

        <Stack.Screen
          name="ServiceHistory"
          component={ServiceHistory}
        />

        {/* Admin */}
        <Stack.Screen
          name="AdminHome"
          component={AdminHome}
        />

        <Stack.Screen
          name="AdminElevators"
          component={AdminElevators}
        />

        <Stack.Screen
          name="AdminElevatorForm"
          component={AdminElevatorForm}
        />

        <Stack.Screen
          name="AdminUsers"
          component={AdminUsers}
        />

        <Stack.Screen
          name="AdminUserForm"
          component={AdminUserForm}
        />

        <Stack.Screen
          name="AdminElevatorActions"
          component={AdminElevatorActions}
        />

        <Stack.Screen
          name="AdminRecordForm"
          component={AdminRecordForm}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;