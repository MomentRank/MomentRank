import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { MaterialIcons } from '@expo/vector-icons';

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext(Navigator);

export default function TabsLayout() {
  return (
    <MaterialTopTabs
      tabBarPosition="bottom"
      initialRouteName="home"
      screenOptions={{
        tabBarShowIcon: true,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: '5%',
          left: '1.6%',
          right: '1.6%',
          backgroundColor: '#FFFFFF',
          borderBottomLeftRadius: 50,
          borderBottomRightRadius: 50,
          borderTopLeftRadius: 0, // Ensure top isn't rounded if not desired in original
          borderTopRightRadius: 0,
          height: 80,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5, // Elevation is needed for shadow on Android
        },
        tabBarIndicatorStyle: {
          display: 'none', // Hide the indicator line if we want to mimic the previous look exactly
        },
        tabBarActiveTintColor: 'rgba(255, 149, 0, 0.8)',
        tabBarInactiveTintColor: '#4C4C4C',
        tabBarIconStyle: {
          height: 30,
          width: 30,
        },
        // We need to ensure the tab bar doesn't cover content since it's absolute
        // But the previous implementation was also absolute.
      }}
    >
      <MaterialTopTabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={28} color={color} />
          ),
        }}
      />
      <MaterialTopTabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="people" size={28} color={color} />
          ),
        }}
      />
      <MaterialTopTabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="map" size={28} color={color} />
          ),
        }}
      />
      <MaterialTopTabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" size={28} color={color} />
          ),
        }}
      />
    </MaterialTopTabs>
  );
}
