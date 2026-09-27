import React from 'react';
import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import LoginScreen from '../screens/login';
import RegisterScreen from '../screens/register';
import OwnerHome from '../screens/OwnerHome';
import ElevatorSearch from '../screens/ElevatorSearch';
import TechnicianElevatorMenu from '../screens/TechnicianElevatorMenu';
import ElevatorInfo from '../screens/ElevatorInfo';
import TechnicalInfo from '../screens/TechnicalInfo';
import Inspections from '../screens/Inspections';
import ServiceHistory from '../screens/ServiceHistory';
import HomeScreen from '../screens/Home';
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  OwnerHome: undefined;
  TechnicalInfo: undefined;
  Inspections: undefined;
  ServiceHistory: undefined;
  ElevatorSearch: undefined;
  TechnicianElevatorMenu: {
  elevatorId: string;
  owner?: string;
  location?: string;
 };
  ElevatorInfo: undefined;
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

        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="Register"
          component={RegisterScreen}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          
        />      
        <Stack.Screen
          name="ElevatorSearch"
          component={ElevatorSearch}
         />
         <Stack.Screen
         name="TechnicianElevatorMenu"
         component={TechnicianElevatorMenu}
        />
        <Stack.Screen
          name="OwnerHome"
          component={OwnerHome}
        />
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

      </Stack.Navigator>

    </NavigationContainer>
  );
};

export default AppNavigator;