import React from "react";
import { ActivityIndicator, Pressable, Text, StyleSheet } from "react-native";

export default function PrimaryButton({
  label,
  onPress,
  loading = false,
  variant = "primary",
  style,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        variant === "secondary" && styles.secondary,
        style,
      ]}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? "#0f172a" : "#fff"} />
      ) : (
        <Text style={[styles.text, variant === "secondary" && styles.secondaryText]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 14,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondary: {
    backgroundColor: "#e5e7eb",
  },
  text: {
    color: "#fff",
    fontWeight: "700",
  },
  secondaryText: {
    color: "#0f172a",
  },
});
