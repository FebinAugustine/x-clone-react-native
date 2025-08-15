// TabsLayout.tsx (Updated)

import { Redirect, Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import { useUserSync } from "@/hooks/useUserSync";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ActivityIndicator, View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";

const TabsLayout = () => {
  const insets = useSafeAreaInsets();
  const { isLoaded, isSignedIn } = useAuth();

  // Conditionally enable user sync only when Clerk is loaded and signed in
  const { isSynced } = useUserSync(isLoaded && isSignedIn);

  // Conditionally enable the user fetch only after the sync is complete
  const { currentUser, isLoading, error } = useCurrentUser(isSynced);

  // 1. Initial Loading State for Clerk
  if (!isLoaded) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 2. Redirect if not signed in
  if (!isSignedIn) {
    return <Redirect href="/(auth)" />;
  }

  // 3. Show loading screen for both sync and user fetch
  if (!isSynced || isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#1DA1F2" />
      </View>
    );
  }

  // 4. Handle a failed user data fetch
  if (error || !currentUser) {
    console.error("Failed to load current user:", error);
    return <Redirect href="/(auth)" />;
  }

  // 5. Success: All checks pass, render the tabs
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1DA1F2",
        tabBarInactiveTintColor: "#657786",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#E1E8ED",
          height: 50 + insets.bottom,
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      {/* ... other Tabs.Screens */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <Feather name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size }) => (
            <Feather name="bell" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
