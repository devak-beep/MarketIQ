import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function ListingCard({ item, onPress }) {
  const image = item.images?.[0]?.url;

  return (
    <Pressable onPress={onPress} style={styles.card}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.meta}>
          {item.category?.name || "Uncategorized"} • {item.condition}
        </Text>
        <Text style={styles.price}>₹{Number(item.askingPrice).toFixed(2)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 180,
    backgroundColor: "#e5e7eb",
  },
  placeholder: {
    backgroundColor: "#cbd5e1",
  },
  body: {
    padding: 14,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  meta: {
    color: "#64748b",
  },
  price: {
    fontSize: 18,
    color: "#2563eb",
    fontWeight: "800",
  },
});
