import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import AuthScreen from "../screens/AuthScreen";
import HomeScreen from "../screens/HomeScreen";
import ListingDetailsScreen from "../screens/ListingDetailsScreen";
import OffersScreen from "../screens/OffersScreen";
import PostItemScreen from "../screens/PostItemScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Marketplace" }}
      />
      <Stack.Screen
        name="ListingDetails"
        component={ListingDetailsScreen}
        options={{ title: "Listing Details" }}
      />
    </Stack.Navigator>
  );
}

function Tabs() {
  const { user } = useAuth();
  const isSeller = user?.role === "SELLER";

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Browse"
        component={HomeStack}
        options={{ tabBarLabel: "Browse", tabBarIcon: () => <Text>🏠</Text> }}
      />
      <Tab.Screen
        name="Offers"
        component={OffersScreen}
        options={{ tabBarIcon: () => <Text>💬</Text> }}
      />
      {isSeller ? (
        <Tab.Screen
          name="PostItem"
          component={PostItemScreen}
          options={{ tabBarLabel: "Sell", tabBarIcon: () => <Text>➕</Text> }}
        />
      ) : null}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: () => <Text>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        <Stack.Screen name="Tabs" component={Tabs} />
      )}
    </Stack.Navigator>
  );
}
