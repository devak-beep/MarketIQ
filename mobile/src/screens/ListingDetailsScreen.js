import React, { useState } from "react";
import {
  Alert,
  Image,
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

export default function ListingDetailsScreen({ route }) {
  const { token } = useAuth();
  const initialListing = route.params?.listing || null;
  const [listing] = useState(initialListing);
  const [offerPrice, setOfferPrice] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const images = listing?.images || [];

  async function submitOffer() {
    if (!token) {
      Alert.alert(
        "Sign in required",
        "Please sign in before sending an offer.",
      );
      return;
    }

    if (!offerPrice || Number(offerPrice) <= 0) {
      Alert.alert("Invalid offer", "Enter a valid offer amount.");
      return;
    }

    setLoading(true);
    try {
      await api.createOffer(token, {
        listingId: listing.id,
        offerPrice: Number(offerPrice),
        message,
      });
      Alert.alert("Success", "Offer sent to seller.");
      setOfferPrice("");
      setMessage("");
    } catch (error) {
      Alert.alert("Offer failed", error.message);
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
      <ScrollView contentContainerStyle={styles.content}>
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
          ${Number(listing.askingPrice).toFixed(2)}
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
          <TextInput
            value={offerPrice}
            onChangeText={setOfferPrice}
            keyboardType="numeric"
            placeholder="Offer amount"
            style={styles.input}
          />
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Optional message"
            style={styles.input}
            multiline
          />
          <PrimaryButton
            label="Send Offer"
            onPress={submitOffer}
            loading={loading}
          />
        </View>
      </ScrollView>
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
  },
  empty: { textAlign: "center", marginTop: 40, color: "#64748b" },
});
