import React, { createContext, useCallback, useContext, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const AlertContext = createContext(null);

/**
 * Wrap your app with <AlertProvider> then call:
 *   const alert = useAppAlert();
 *   alert.show("Title", "Message", [{ text: "OK" }, { text: "Cancel", style: "cancel" }])
 *   alert.show("Title", "Message")   // single OK button
 */
export function AlertProvider({ children }) {
  const [config, setConfig] = useState(null); // { title, message, buttons }

  const show = useCallback((title, message, buttons) => {
    setConfig({
      title,
      message,
      buttons: buttons || [{ text: "OK" }],
    });
  }, []);

  const dismiss = useCallback(() => setConfig(null), []);

  return (
    <AlertContext.Provider value={show}>
      {children}
      <Modal
        visible={!!config}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={dismiss}
      >
        <Pressable style={styles.backdrop} onPress={dismiss}>
          <Pressable style={styles.card}>
            {config?.title ? (
              <Text style={styles.title}>{config.title}</Text>
            ) : null}
            {config?.message ? (
              <Text style={styles.message}>{config.message}</Text>
            ) : null}
            <View style={styles.buttonRow}>
              {config?.buttons.map((btn, i) => {
                const isDestructive = btn.style === "destructive";
                const isCancel = btn.style === "cancel";
                return (
                  <Pressable
                    key={i}
                    style={({ pressed }) => [
                      styles.btn,
                      isCancel && styles.btnCancel,
                      isDestructive && styles.btnDestructive,
                      !isCancel && !isDestructive && styles.btnPrimary,
                      pressed && styles.btnPressed,
                    ]}
                    onPress={() => {
                      dismiss();
                      btn.onPress?.();
                    }}
                  >
                    <Text
                      style={[
                        styles.btnText,
                        isCancel && styles.btnTextCancel,
                        isDestructive && styles.btnTextDestructive,
                        !isCancel && !isDestructive && styles.btnTextPrimary,
                      ]}
                    >
                      {btn.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAppAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAppAlert must be used inside <AlertProvider>");
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  btnPrimary: { backgroundColor: "#2563eb" },
  btnCancel: { backgroundColor: "#f1f5f9" },
  btnDestructive: { backgroundColor: "#fef2f2" },
  btnPressed: { opacity: 0.75 },
  btnText: { fontWeight: "800", fontSize: 15 },
  btnTextPrimary: { color: "#fff" },
  btnTextCancel: { color: "#475569" },
  btnTextDestructive: { color: "#ef4444" },
});
