import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useAppAlert } from "../components/AppAlert";

export default function ListingDetailsScreen({ route }) {
  const { token } = useAuth();
  const alert = useAppAlert();
  const initialListing = route.params?.listing || null;
  const [listing] = useState(initialListing);
  const [offerPrice, setOfferPrice] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingOffer, setExistingOffer] = useState(null);

  const images = listing?.images || [];

  useEffect(() => {
    if (!token || !listing) return;
    api.sentOffers(token).then((res) => {
      const match = (res.data || []).find((o) => o.listingId === listing.id);
      setExistingOffer(match || null);
    }).catch(() => {});
  }, [token, listing]);

  async function submitOffer() {
    if (!token) {
      alert(
        "Sign in required",
        "Please sign in before sending an offer.",
      );
      return;
    }

    if (!offerPrice || Number(offerPrice) <= 0) {
      alert("Invalid offer", "Enter a valid offer amount.");
      return;
    }

    setLoading(true);
    try {
      const created = await api.createOffer(token, {
        listingId: listing.id,
        offerPrice: Number(offerPrice),
        message,
      });
      setExistingOffer(created.data);
      alert("Success", "Offer sent to seller.");
      setOfferPrice("");
      setMessage("");
    } catch (error) {
      alert("Offer failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.empty}>No listing data available.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.gallery}
        >
          {images.length > 0 ? (
            images.map((image) => (
              <Image
                key={image.id}
                source={{ uri: image.url }}
                style={styles.image}
              />
            ))
          ) : (
            <View style={[styles.image, styles.placeholder]} />
          )}
        </ScrollView>

        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.price}>
          ₹{Number(listing.askingPrice).toFixed(2)}
        </Text>
        <Text style={styles.meta}>
          {listing.category?.name} • {listing.condition}
        </Text>
        <Text style={styles.label}>Seller</Text>
        <Text style={styles.text}>
          {listing.seller?.name} • {listing.seller?.email}
        </Text>
        <Text style={styles.label}>Description</Text>
        <Text style={styles.text}>{listing.description}</Text>

        <View style={styles.offerCard}>
          <Text style={styles.label}>Make an Offer</Text>

          {existingOffer?.status === "PENDING" && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusPending}>⏳ Offer pending — ₹{Number(existingOffer.offerPrice).toFixed(2)}</Text>
            </View>
          )}

          {existingOffer?.status === "ACCEPTED" && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusAccepted}>✅ Offer accepted — ₹{Number(existingOffer.offerPrice).toFixed(2)}</Text>
            </View>
          )}

          {existingOffer?.status === "REJECTED" && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusRejected}>❌ Previous offer rejected — you can make a new offer</Text>
            </View>
          )}

          {existingOffer?.status !== "PENDING" && existingOffer?.status !== "ACCEPTED" && (
            <>
              <TextInput
                value={offerPrice}
                onChangeText={setOfferPrice}
                keyboardType="numeric"
                placeholder="Offer amount"
                placeholderTextColor="#94a3b8"
                style={styles.input}
              />
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Optional message"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                multiline
                textAlignVertical="top"
              />
              <PrimaryButton
                label="Send Offer"
                onPress={submitOffer}
                loading={loading}
              />
            </>
          )}
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, gap: 12 },
  gallery: { borderRadius: 20 },
  image: {
    width: 330,
    height: 260,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "#e5e7eb",
  },
  placeholder: { backgroundColor: "#cbd5e1" },
  title: { fontSize: 26, fontWeight: "900", color: "#0f172a" },
  price: { fontSize: 24, fontWeight: "900", color: "#2563eb" },
  meta: { color: "#64748b" },
  label: { fontWeight: "800", color: "#0f172a", marginTop: 6 },
  text: { color: "#334155", lineHeight: 20 },
  offerCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fff",
    marginBottom: 10,
    color: "#0f172a",
  },
  empty: { textAlign: "center", marginTop: 40, color: "#64748b" },
  statusBadge: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#f8fafc",
  },
  statusPending: { fontWeight: "700", color: "#d97706" },
  statusAccepted: { fontWeight: "700", color: "#16a34a" },
  statusRejected: { fontWeight: "700", color: "#ef4444" },
});
