import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/FontAwesome5';

// Screens
import HomeScreen from '../screens/HomeScreen';
import GamesScreen from '../screens/GamesScreen';
import BoardGamesScreen from '../screens/BoardGamesScreen';
import BoardGameScreen from '../screens/BoardGameScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ContactScreen from '../screens/ContactScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const GamesStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#2b044e',
      },
      headerTintColor: '#ffd700',
    }}
  >
    <Stack.Screen name="Games List" component={GamesScreen} />
    <Stack.Screen name="Board Games" component={BoardGamesScreen} />
    <Stack.Screen 
      name="BoardGame" 
      component={BoardGameScreen}
      options={({ route }) => ({ 
        title: route.params?.gameId.charAt(0).toUpperCase() + route.params?.gameId.slice(1)
      })}
    />
  </Stack.Navigator>
);

const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#2b044e',
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
        },
        tabBarActiveTintColor: '#ffd700',
        tabBarInactiveTintColor: '#666',
        headerStyle: {
          backgroundColor: '#2b044e',
        },
        headerTintColor: '#ffd700',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="home" size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Games"
        component={GamesStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Icon name="gamepad" size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="trophy" size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="user" size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="envelope" size={20} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator;