import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, Platform } from 'react-native';
import FlashMessage from 'react-native-flash-message';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import ChatScreen from './src/screens/ChatScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import CompetitorsScreen from './src/screens/CompetitorsScreen';
import AlibabaScreen from './src/screens/AlibabaScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Theme
import { COLORS } from './src/utils/theme';

// Notifications Setup
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs({ language, setLanguage }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Dashboard: focused ? 'home' : 'home-outline',
            Orders: focused ? 'cart' : 'cart-outline',
            Inventory: focused ? 'cube' : 'cube-outline',
            Chat: focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline',
            Analytics: focused ? 'bar-chart' : 'bar-chart-outline',
            Competitors: focused ? 'eye' : 'eye-outline',
            Alibaba: focused ? 'business' : 'business-outline',
            Notifications: focused ? 'notifications' : 'notifications-outline',
          };
          return <Ionicons name={icons[route.name] || 'apps'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        options={{ tabBarLabel: language === 'fr' ? 'Accueil' : 'Home' }}
      >
        {props => <DashboardScreen {...props} language={language} />}
      </Tab.Screen>
      <Tab.Screen
        name="Orders"
        options={{ tabBarLabel: language === 'fr' ? 'Commandes' : 'Orders' }}
      >
        {props => <OrdersScreen {...props} language={language} />}
      </Tab.Screen>
      <Tab.Screen
        name="Inventory"
        options={{ tabBarLabel: language === 'fr' ? 'Inventaire' : 'Inventory' }}
      >
        {props => <InventoryScreen {...props} language={language} />}
      </Tab.Screen>
      <Tab.Screen
        name="Chat"
        options={{ tabBarLabel: 'IA Chat' }}
      >
        {props => <ChatScreen {...props} language={language} />}
      </Tab.Screen>
      <Tab.Screen
        name="Analytics"
        options={{ tabBarLabel: language === 'fr' ? 'Analytics' : 'Analytics' }}
      >
        {props => <AnalyticsScreen {...props} language={language} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [language, setLanguage] = useState('fr');
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Charger la langue sauvegardée
    AsyncStorage.getItem('language').then(lang => {
      if (lang) setLanguage(lang);
    });

    // Configurer les notifications push
    registerForPushNotifications().then(token => {
      if (token) {
        setExpoPushToken(token);
        AsyncStorage.setItem('expo_push_token', token);
      }
    });

    // Écouter les notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification reçue:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const screen = response.notification.request.content.data?.screen;
      // Navigation vers l'écran concerné
      console.log('Notification tapée, écran:', screen);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor={COLORS.background} />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: COLORS.background }
        }}
      >
        <Stack.Screen name="Main">
          {props => <MainTabs {...props} language={language} setLanguage={setLanguage} />}
        </Stack.Screen>
        <Stack.Screen name="ProductDetail">
          {props => <ProductDetailScreen {...props} language={language} />}
        </Stack.Screen>
        <Stack.Screen name="Competitors">
          {props => <CompetitorsScreen {...props} language={language} />}
        </Stack.Screen>
        <Stack.Screen name="Alibaba">
          {props => <AlibabaScreen {...props} language={language} />}
        </Stack.Screen>
        <Stack.Screen name="Notifications">
          {props => <NotificationsScreen {...props} language={language} />}
        </Stack.Screen>
        <Stack.Screen name="Settings">
          {props => <SettingsScreen {...props} language={language} setLanguage={setLanguage} />}
        </Stack.Screen>
      </Stack.Navigator>
      <FlashMessage position="top" />
    </NavigationContainer>
  );
}

async function registerForPushNotifications() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'SellerPro Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C63FF',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission notifications refusée');
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
  }

  return token;
}
