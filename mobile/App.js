import React from "react";
import { ScrollView, StatusBar, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { AlertProvider } from "./src/components/AppAlert";

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, padding: 24, backgroundColor: "#fff" }}>
          <Text style={{ color: "red", fontWeight: "bold", fontSize: 16 }}>
            App Error:{"\n"}{this.state.error.message}{"\n\n"}{this.state.error.stack}
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" translucent={false} />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
        <AuthProvider>
          <AlertProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </AlertProvider>
        </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
