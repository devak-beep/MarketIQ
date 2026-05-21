import React from "react";
import { Alert, SafeAreaView, StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../context/AuthContext";

export default function ProfileScreen() {
  const { token, user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.text}>
          Status: {token ? "Signed in" : "Signed out"}
        </Text>
        <Text style={styles.text}>User: {user?.name || "Not loaded yet"}</Text>
        <Text style={styles.text}>Email: {user?.email || "-"}</Text>
        <Text style={styles.text}>Role: {user?.role || "-"}</Text>
        <PrimaryButton
          label="Sign Out"
          onPress={() => {
            signOut();
            Alert.alert("Signed out", "You have been signed out.");
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
    justifyContent: "center",
  },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 20, gap: 10 },
  title: { fontSize: 28, fontWeight: "900", color: "#0f172a", marginBottom: 8 },
  text: { color: "#475569" },
});
