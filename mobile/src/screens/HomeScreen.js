import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import ListingCard from "../components/ListingCard";
import { api } from "../services/api";

export default function HomeScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchListings = useCallback(
    async (nextPage = 1, replace = true) => {
      try {
        const result = await api.listings({
          page: String(nextPage),
          limit: "10",
          search: query || undefined,
          categoryId: categoryId || undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
        });

        const data = result.data || [];
        setItems((prev) => (replace ? data : [...prev, ...data]));
        setHasMore(data.length === 10);
        setPage(nextPage);
      } catch (error) {
        setItems([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [query, categoryId, minPrice, maxPrice],
  );

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      fetchListings(1, true);
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchListings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings(1, true);
  };

  const onEndReached = () => {
    if (!loading && hasMore) {
      fetchListings(page + 1, false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>
        <Text style={styles.subtitle}>
          Browse listings, filter by price, and make offers.
        </Text>
      </View>

      <View style={styles.filters}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search listings"
          style={styles.input}
        />
        <View style={styles.row}>
          <TextInput
            value={categoryId}
            onChangeText={setCategoryId}
            placeholder="Category ID"
            style={[styles.input, styles.half]}
          />
          <TextInput
            value={minPrice}
            onChangeText={setMinPrice}
            placeholder="Min"
            keyboardType="numeric"
            style={[styles.input, styles.half]}
          />
        </View>
        <TextInput
          value={maxPrice}
          onChangeText={setMaxPrice}
          placeholder="Max price"
          keyboardType="numeric"
          style={styles.input}
        />
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2563eb"
          style={{ marginTop: 24 }}
        />
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        renderItem={({ item }) => (
          <ListingCard
            item={item}
            onPress={() =>
              navigation.navigate("ListingDetails", { listing: item })
            }
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No listings found.</Text> : null
        }
        ListFooterComponent={
          hasMore && items.length > 0 ? (
            <ActivityIndicator style={{ marginVertical: 18 }} />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: "900", color: "#0f172a" },
  subtitle: { color: "#475569", marginTop: 4 },
  filters: { paddingHorizontal: 16, paddingBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  empty: { textAlign: "center", marginTop: 30, color: "#64748b" },
});
