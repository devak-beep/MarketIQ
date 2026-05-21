import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { api } from "../services/api";
import { predictPrice } from "../services/ml";
import { useAuth } from "../context/AuthContext";
import FormField from "../components/FormField";
import PrimaryButton from "../components/PrimaryButton";

const CONDITIONS = ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"];

export default function PostItemScreen() {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("GOOD");
  const [askingPrice, setAskingPrice] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [suggestedPrice, setSuggestedPrice] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .categories()
      .then((result) => setCategories(result.data || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!categoryId || !description) {
        setSuggestedPrice(null);
        return;
      }

      setPredicting(true);
      try {
        const selectedCategory = categories.find(
          (item) => item.id === categoryId,
        );
        const result = await predictPrice({
          category: selectedCategory?.name || categoryId,
          condition,
          description_length: description.length,
        });
        setSuggestedPrice(result.predicted_price);
        if (!askingPrice) {
          setAskingPrice(String(Math.round(result.predicted_price)));
        }
      } catch {
        setSuggestedPrice(null);
      } finally {
        setPredicting(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [categoryId, categories, condition, description, askingPrice]);

  async function pickImages() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 4,
    });

    if (!result.canceled) {
      setImageUrls((prev) => [
        ...prev,
        ...result.assets.map((asset) => asset.uri),
      ]);
    }
  }

  async function submit() {
    if (!token) {
      Alert.alert("Sign in required", "Please sign in before posting an item.");
      return;
    }

    if (!categoryId || !title || !description || !askingPrice) {
      Alert.alert("Validation", "Please complete all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await api.createListing(token, {
        categoryId,
        title,
        description,
        condition,
        askingPrice: Number(askingPrice),
        imageUrls,
      });
      Alert.alert("Success", "Listing created successfully.");
      setCategoryId("");
      setTitle("");
      setDescription("");
      setCondition("GOOD");
      setAskingPrice("");
      setImageUrls([]);
      setSuggestedPrice(null);
    } catch (error) {
      Alert.alert("Create listing failed", error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Post Item</Text>
        <Text style={styles.subtitle}>
          Get an instant suggested price before publishing.
        </Text>

        <Text style={styles.label}>Category</Text>
        <View style={styles.chipsWrap}>
          {categories.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setCategoryId(item.id)}
              style={[styles.chip, categoryId === item.id && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  categoryId === item.id && styles.chipTextActive,
                ]}
              >
                {item.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <FormField
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Item title"
        />
        <FormField
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the item"
          multiline
          style={{ minHeight: 120, textAlignVertical: "top" }}
        />

        <Text style={styles.label}>Condition</Text>
        <View style={styles.chipsWrap}>
          {CONDITIONS.map((item) => (
            <Pressable
              key={item}
              onPress={() => setCondition(item)}
              style={[styles.chip, condition === item && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  condition === item && styles.chipTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        <FormField
          label="Asking Price"
          value={askingPrice}
          onChangeText={setAskingPrice}
          placeholder="0.00"
          keyboardType="numeric"
        />

        <PrimaryButton
          label="Upload Images"
          variant="secondary"
          onPress={pickImages}
        />
        <View style={styles.previewRow}>
          {imageUrls.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.preview} />
          ))}
        </View>

        <View style={styles.suggestionBox}>
          <Text style={styles.label}>AI Suggested Price</Text>
          <Text style={styles.suggested}>
            {predicting
              ? "Calculating..."
              : suggestedPrice
                ? `$${Number(suggestedPrice).toFixed(2)}`
                : "Select category and enter description"}
          </Text>
          {suggestedPrice ? (
            <PrimaryButton
              label="Use Suggested Price"
              variant="secondary"
              onPress={() => setAskingPrice(String(Math.round(suggestedPrice)))}
            />
          ) : null}
        </View>

        <PrimaryButton
          label="Publish Listing"
          onPress={submit}
          loading={submitting}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, gap: 10 },
  title: { fontSize: 28, fontWeight: "900", color: "#0f172a" },
  subtitle: { color: "#475569", marginBottom: 8 },
  label: { fontWeight: "800", color: "#0f172a", marginTop: 6, marginBottom: 8 },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
  },
  chipActive: { backgroundColor: "#2563eb" },
  chipText: { color: "#0f172a", fontWeight: "700" },
  chipTextActive: { color: "#fff" },
  previewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  preview: {
    width: 84,
    height: 84,
    borderRadius: 14,
    backgroundColor: "#e5e7eb",
  },
  suggestionBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 18,
    padding: 16,
    gap: 10,
    marginBottom: 6,
  },
  suggested: { fontSize: 24, fontWeight: "900", color: "#1d4ed8" },
});
