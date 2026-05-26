import React, { useCallback, useState } from "react";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import PrimaryButton from "../components/PrimaryButton";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useAppAlert } from "../components/AppAlert";

export default function ProfileScreen() {
  const { token, user, signOut } = useAuth();
  const alert = useAppAlert();
  const [myListings, setMyListings] = useState([]);
  const [sentOffers, setSentOffers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadActivity = useCallback(async (isRefresh = false) => {
    if (!token) {
      setMyListings([]);
      setSentOffers([]);
      return;
    }
    if (isRefresh) setRefreshing(true);
    try {
      const [listingsRes, sentRes] = await Promise.all([
        api.myListings(token),
        api.sentOffers(token),
      ]);
      setMyListings(listingsRes.data || []);
      setSentOffers(sentRes.data || []);
    } catch (error) {
      alert("Profile", error.message || "Failed to load activity");
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadActivity();
    }, [loadActivity]),
  );

  const soldItems = myListings.filter((item) => !item.isActive);
  const availableItems = myListings.filter((item) => item.isActive);
  const boughtItems = sentOffers.filter((offer) => offer.status === "ACCEPTED");

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadActivity(true)} colors={["#2563eb"]} />
        }
      >
        <View style={styles.card}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.text}>
            Status: {token ? "Signed in" : "Signed out"}
          </Text>
          <Text style={styles.text}>
            User: {user?.name || "Not loaded yet"}
          </Text>
          <Text style={styles.text}>Email: {user?.email || "-"}</Text>
          <Text style={styles.text}>Role: {user?.role || "-"}</Text>
          <PrimaryButton
            label="Sign Out"
            onPress={() => {
              signOut();
              alert("Signed out", "You have been signed out.");
            }}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>My Listings</Text>
          {myListings.length === 0 ? (
            <Text style={styles.empty}>No listings yet.</Text>
          ) : (
            myListings.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemMeta}>
                  ₹{Number(item.askingPrice).toFixed(2)}
                </Text>
                <Text
                  style={[
                    styles.badge,
                    item.isActive ? styles.badgeAvailable : styles.badgeSold,
                  ]}
                >
                  {item.isActive ? "AVAILABLE" : "SOLD"}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.text}>
            Available items: {availableItems.length}
          </Text>
          <Text style={styles.text}>Sold items: {soldItems.length}</Text>
          <Text style={styles.text}>Bought items: {boughtItems.length}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Bought Items</Text>
          {boughtItems.length === 0 ? (
            <Text style={styles.empty}>No accepted purchases yet.</Text>
          ) : (
            boughtItems.map((offer) => (
              <View key={offer.id} style={styles.itemRow}>
                <Text style={styles.itemTitle}>
                  {offer.listing?.title || "Item"}
                </Text>
                <Text style={styles.itemMeta}>
                  Paid: ₹{Number(offer.offerPrice).toFixed(2)}
                </Text>
                <Text style={[styles.badge, styles.badgeBought]}>BOUGHT</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 20, gap: 10 },
  title: { fontSize: 28, fontWeight: "900", color: "#0f172a", marginBottom: 8 },
  sectionTitle: { fontSize: 20, fontWeight: "900", color: "#0f172a" },
  text: { color: "#475569" },
  empty: { color: "#64748b" },
  itemRow: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  itemTitle: { color: "#0f172a", fontWeight: "800" },
  itemMeta: { color: "#475569" },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "800",
  },
  badgeAvailable: { backgroundColor: "#dcfce7", color: "#15803d" },
  badgeSold: { backgroundColor: "#fee2e2", color: "#b91c1c" },
  badgeBought: { backgroundColor: "#e0e7ff", color: "#1d4ed8" },
});
