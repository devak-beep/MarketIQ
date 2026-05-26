import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FormField from "../components/FormField";
import PrimaryButton from "../components/PrimaryButton";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useAppAlert } from "../components/AppAlert";

export default function AuthScreen() {
  const { signIn } = useAuth();
  const alert = useAppAlert();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("SELLER");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email || !password || (mode === "register" && !name)) {
      alert("Missing fields", "Please complete all required fields.");
      return;
    }

    setLoading(true);
    try {
      const payload =
        mode === "login"
          ? { email, password }
          : { name, email, password, role };
      const result =
        mode === "login"
          ? await api.login(payload)
          : await api.register(payload);
      // result contains { accessToken, refreshToken, user }
      await signIn(result.accessToken, result.refreshToken, result.user);
    } catch (error) {
      alert("Authentication failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.hero}>
          <Text style={styles.kicker}>MarketIQ</Text>
          <Text style={styles.title}>Buy, sell, and price items smarter.</Text>
          <Text style={styles.subtitle}>
            Mobile marketplace with built-in AI price guidance.
          </Text>
        </View>

        <View style={styles.card}>
          {mode === "register" ? (
            <>
              <FormField
                label="Name"
                value={name}
                onChangeText={setName}
                placeholder="Your name"
              />
              <Text style={styles.label}>Account Type</Text>
              <View style={styles.segmentRow}>
                {["SELLER", "BUYER"].map((item) => (
                  <PrimaryButton
                    key={item}
                    label={item}
                    variant={role === item ? "primary" : "secondary"}
                    style={styles.segmentButton}
                    onPress={() => setRole(item)}
                  />
                ))}
              </View>
            </>
          ) : null}
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />
          <PrimaryButton
            label={mode === "login" ? "Sign In" : "Create Account"}
            onPress={submit}
            loading={loading}
          />
          <PrimaryButton
            label={
              mode === "login"
                ? "Need an account? Register"
                : "Already have an account? Sign In"
            }
            variant="secondary"
            style={{ marginTop: 12 }}
            onPress={() => setMode(mode === "login" ? "register" : "login")}
          />
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  container: { padding: 20, gap: 18, flexGrow: 1, justifyContent: "center" },
  hero: { gap: 8, marginBottom: 8 },
  kicker: {
    color: "#2563eb",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: { fontSize: 32, fontWeight: "900", color: "#0f172a" },
  subtitle: { fontSize: 16, color: "#475569" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2,
  },
  label: { fontWeight: "700", marginBottom: 10, color: "#0f172a" },
  segmentRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  segmentButton: { flex: 1 },
});
