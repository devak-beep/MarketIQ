import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import ListingCard from "../components/ListingCard";
import { api } from "../services/api";

export default function HomeScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [priceError, setPriceError] = useState("");
  const [categoriesError, setCategoriesError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  function parsePrice(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("-")) return -1;
    const normalized = trimmed.replace(/,/g, "");
    if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return NaN;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function validatePriceRange() {
    const min = parsePrice(minPrice);
    const max = parsePrice(maxPrice);

    if (Number.isNaN(min) || Number.isNaN(max)) {
      return { ok: false, message: "Enter valid numbers for price filters." };
    }

    if ((min !== null && min < 0) || (max !== null && max < 0)) {
      return { ok: false, message: "Price cannot be negative." };
    }

    if (min !== null && max !== null && min > max) {
      return {
        ok: false,
        message: "Minimum price must be less than or equal to maximum price.",
      };
    }

    return { ok: true, min, max, message: "" };
  }

  const fetchListings = useCallback(
    async (nextPage = 1, replace = true) => {
      const priceValidation = validatePriceRange();
      setPriceError(priceValidation.message);
      if (!priceValidation.ok) {
        setItems([]);
        setHasMore(false);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        const result = await api.listings({
          page: String(nextPage),
          limit: "10",
          search: query.trim() || undefined,
          categoryId: subcategoryId || categoryId || undefined,
          minPrice:
            priceValidation.min !== null
              ? String(priceValidation.min)
              : undefined,
          maxPrice:
            priceValidation.max !== null
              ? String(priceValidation.max)
              : undefined,
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
    [query, categoryId, subcategoryId, minPrice, maxPrice],
  );

  useEffect(() => {
    api
      .categories()
      .then((result) => {
        setCategories(result.data || []);
        setCategoriesError("");
      })
      .catch(() => setCategoriesError("Failed to load categories."));
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      fetchListings(1, true);
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchListings]);

  useFocusEffect(
    useCallback(() => {
      fetchListings(1, true);
    }, [fetchListings]),
  );

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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
      <View style={styles.header}>
        <Text style={styles.title}>MarketIQ</Text>
        <Text style={styles.subtitle}>
          Browse listings, filter by price, and make offers.
        </Text>
      </View>

      <View style={styles.filters}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search listings"
          placeholderTextColor="#94a3b8"
          style={styles.input}
        />
        <Text style={styles.filterLabel}>Category</Text>
        <View style={styles.chipsWrap}>
          <Pressable
            onPress={() => { setCategoryId(""); setSubcategoryId(""); }}
            style={[styles.chip, !categoryId && styles.chipActive]}
          >
            <Text style={[styles.chipText, !categoryId && styles.chipTextActive]}>
              All
            </Text>
          </Pressable>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => {
                setCategoryId(category.id);
                setSubcategoryId("");
              }}
              style={[styles.chip, categoryId === category.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, categoryId === category.id && styles.chipTextActive]}>
                {category.name}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Subcategory row — shown when selected category has subcategories */}
        {categories.find((c) => c.id === categoryId)?.subcategories?.length > 0 && (
          <>
            <Text style={styles.filterLabel}>Subcategory</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              <Pressable
                onPress={() => setSubcategoryId("")}
                style={[styles.chip, !subcategoryId && styles.chipActive]}
              >
                <Text style={[styles.chipText, !subcategoryId && styles.chipTextActive]}>
                  All
                </Text>
              </Pressable>
              {categories
                .find((c) => c.id === categoryId)
                .subcategories.map((sub) => (
                  <Pressable
                    key={sub.id}
                    onPress={() => setSubcategoryId(sub.id)}
                    style={[styles.chip, subcategoryId === sub.id && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, subcategoryId === sub.id && styles.chipTextActive]}>
                      {sub.name}
                    </Text>
                  </Pressable>
                ))}
            </ScrollView>
          </>
        )}
        {categoriesError ? (
          <Text style={styles.error}>{categoriesError}</Text>
        ) : null}
        <View style={styles.row}>
          <TextInput
            value={minPrice}
            onChangeText={setMinPrice}
            placeholder="Min price"
            keyboardType="numeric"
            placeholderTextColor="#94a3b8"
            style={[styles.input, styles.half]}
          />
          <TextInput
            value={maxPrice}
            onChangeText={setMaxPrice}
            placeholder="Max price"
            keyboardType="numeric"
            placeholderTextColor="#94a3b8"
            style={[styles.input, styles.half]}
          />
        </View>
        {priceError ? <Text style={styles.error}>{priceError}</Text> : null}
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
        keyboardShouldPersistTaps="handled"
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: "900", color: "#0f172a" },
  subtitle: { color: "#475569", marginTop: 4 },
  filters: { paddingHorizontal: 16, paddingBottom: 6 },
  filterLabel: {
    color: "#0f172a",
    fontWeight: "800",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    color: "#0f172a",
  },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  categoryRow: {
    gap: 8,
    paddingBottom: 12,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0",
  },
  chipActive: {
    backgroundColor: "#2563eb",
  },
  chipText: {
    color: "#0f172a",
    fontWeight: "800",
  },
  chipTextActive: {
    color: "#fff",
  },
  error: {
    color: "#ef4444",
    fontWeight: "700",
    marginBottom: 10,
  },
  empty: { textAlign: "center", marginTop: 30, color: "#64748b" },
});
