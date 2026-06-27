import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.dark.backgroundElement,
          borderTopColor: Colors.dark.border,
          height: 60,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: Colors.dark.neonCyan,
        tabBarInactiveTintColor: Colors.dark.textSecondary,
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>📊</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="fuel"
        options={{
          title: 'Fuel Core',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>⚡</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>👤</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          href: null, // Hiding journal from tab bar for now to keep Fuel centered
        }}
      />
    </Tabs>
  );
}
