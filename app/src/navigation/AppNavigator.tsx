import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ValoresScreen from '../screens/ValoresScreen';
import NovaCartaScreen from '../screens/NovaCartaScreen';
import CardDetailScreen from '../screens/CardDetailScreen';

export type RootStackParamList = {
  Tabs: undefined;
  CardDetail: { code: string };
};

export type TabParamList = {
  Home: undefined;
  Valores: undefined;
  NovaCarta: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Valores" component={ValoresScreen} options={{ title: 'Valores' }} />
      <Tab.Screen name="NovaCarta" component={NovaCartaScreen} options={{ title: 'Nova Carta' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="CardDetail" component={CardDetailScreen} options={{ title: 'Detalhe' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
