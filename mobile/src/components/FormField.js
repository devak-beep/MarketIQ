import React from "react";
import { StyleSheet, Text, TextInput } from "react-native";

export default function FormField({
  label,
  error,
  style,
  multiline = false,
  editable = true,
  secureTextEntry = false,
  ...props
}) {
  return (
    <>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        autoComplete="off"
        importantForAutofill="no"
        {...props}
        multiline={Boolean(multiline)}
        editable={Boolean(editable)}
        secureTextEntry={Boolean(secureTextEntry)}
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor="#94a3b8"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
    color: "#0f172a",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  error: {
    color: "#ef4444",
    marginTop: -6,
    marginBottom: 12,
  },
});
