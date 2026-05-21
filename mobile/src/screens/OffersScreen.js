import React, { useCallback, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import PrimaryButton from "../components/PrimaryButton";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function OffersScreen() {
  const { token } = useAuth();
  const [mode, setMode] = useState("received");
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) {
      setOffers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result =
        mode === "received"
          ? await api.receivedOffers(token)
          : await api.sentOffers(token);
      setOffers(result.data || []);
    } catch (error) {
      Alert.alert("Offers error", error.message);
    } finally {
      setLoading(false);
    }
  }, [mode, token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function updateOffer(id, status) {
    try {
      await api.updateOfferStatus(token, id, status);
      load();
    } catch (error) {
      Alert.alert("Update failed", error.message);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Offers</Text>
        <View style={styles.row}>
          <PrimaryButton
            label="Received"
            variant={mode === "received" ? "primary" : "secondary"}
            style={styles.segment}
            onPress={() => setMode("received")}
          />
          <PrimaryButton
            label="Sent"
            variant={mode === "sent" ? "primary" : "secondary"}
            style={styles.segment}
            onPress={() => setMode("sent")}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {offers.map((offer) => (
          <View key={offer.id} style={styles.card}>
            <Text style={styles.cardTitle}>{offer.listing?.title}</Text>
            <Text style={styles.meta}>
              ${Number(offer.offerPrice).toFixed(2)} • {offer.status}
            </Text>
            <Text style={styles.text}>
              {offer.message || "No message included."}
            </Text>
            {mode === "received" ? (
              <View style={styles.row}>
                <PrimaryButton
                  label="Accept"
                  style={styles.segment}
                  onPress={() => updateOffer(offer.id, "ACCEPTED")}
                />
                <PrimaryButton
                  label="Reject"
                  variant="secondary"
                  style={styles.segment}
                  onPress={() => updateOffer(offer.id, "REJECTED")}
                />
              </View>
            ) : null}
          </View>
        ))}

        {!loading && offers.length === 0 ? (
          <Text style={styles.empty}>No offers yet.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 16 },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 12,
  },
  row: { flexDirection: "row", gap: 10 },
  segment: { flex: 1 },
  content: { padding: 16, gap: 12 },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 16, gap: 8 },
  cardTitle: { fontWeight: "800", color: "#0f172a", fontSize: 16 },
  meta: { color: "#2563eb", fontWeight: "700" },
  text: { color: "#475569" },
  empty: { textAlign: "center", color: "#64748b", marginTop: 24 },
});
