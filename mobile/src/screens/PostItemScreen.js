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
import { launchImageLibrary } from "react-native-image-picker";
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
  const [fieldErrors, setFieldErrors] = useState({});

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
          category:
            selectedCategory?.slug || selectedCategory?.name || categoryId,
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

  function pickImages() {
    launchImageLibrary(
      {
        mediaType: "photo",
        selectionLimit: 4,
        quality: 0.8,
        includeBase64: true,
      },
      async (response) => {
        if (response.didCancel || !response.assets?.length) {
          return;
        }

        setSubmitting(true);
        try {
          const uploadedUrls = [];

          for (const asset of response.assets) {
            if (!asset.base64) continue;

            const mimeType = asset.type || "image/jpeg";
            const dataUri = `data:${mimeType};base64,${asset.base64}`;
            const uploaded = await api.uploadImage(token, dataUri);
            if (uploaded?.url) uploadedUrls.push(uploaded.url);
          }

          if (uploadedUrls.length === 0) {
            Alert.alert(
              "Upload failed",
              "The selected photo could not be uploaded. Try another image.",
            );
            return;
          }

          setImageUrls((prev) => [...prev, ...uploadedUrls]);
        } catch (error) {
          Alert.alert("Upload failed", error.message);
        } finally {
          setSubmitting(false);
        }
      },
    );
  }

  function clearFieldError(field) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function getFieldErrorMessage(errors) {
    const fieldErrors = errors?.fieldErrors || errors?.errors || {};
    const parts = Object.entries(fieldErrors)
      .map(([field, value]) => {
        if (Array.isArray(value))
          return [field, value.filter(Boolean).join(", ")];
        if (typeof value === "string") return [field, value];
        return [field, "Invalid value"];
      })
      .filter(([, message]) => message);

    return parts.map(([field, message]) => `${field}: ${message}`).join("\n");
  }

  function validateLocal() {
    const nextErrors = {};

    if (!categoryId.trim()) nextErrors.categoryId = "Select a category.";
    if (title.trim().length < 3)
      nextErrors.title = "Enter at least 3 characters.";
    if (description.trim().length < 3)
      nextErrors.description = "Enter a description.";

    const normalizedPrice = Number(
      String(askingPrice).replace(/[^0-9.-]/g, ""),
    );
    if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      nextErrors.askingPrice = "Enter a valid asking price.";
    }

    setFieldErrors(nextErrors);
    return {
      ok: Object.keys(nextErrors).length === 0,
      normalizedPrice,
      nextErrors,
    };
  }

  async function submit() {
    const validation = validateLocal();
    if (!validation.ok) {
      Alert.alert(
        "Missing details",
        `Please complete these fields:\n• ${Object.values(validation.nextErrors).join("\n• ")}`,
      );
      return;
    }

    if (!token) {
      Alert.alert("Sign in required", "Please sign in before posting an item.");
      return;
    }

    setSubmitting(true);
    try {
      await api.createListing(token, {
        categoryId: categoryId.trim(),
        title: title.trim(),
        description: description.trim(),
        condition,
        askingPrice: validation.normalizedPrice,
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
      setFieldErrors({});
    } catch (error) {
      const message = getFieldErrorMessage(error.details?.errors);
      const backendFieldErrors =
        error.details?.errors?.fieldErrors || error.details?.errors?.errors;
      if (backendFieldErrors && Object.keys(backendFieldErrors).length > 0) {
        const nextErrors = {};
        for (const [field, value] of Object.entries(backendFieldErrors)) {
          if (Array.isArray(value) && value.length > 0)
            nextErrors[field] = value.join(", ");
          else if (typeof value === "string" && value)
            nextErrors[field] = value;
        }
        setFieldErrors((prev) => ({ ...prev, ...nextErrors }));

        Alert.alert(
          "Create listing failed",
          message || error.message || "Validation failed",
        );
      } else {
        Alert.alert("Create listing failed", error.message);
      }
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
              onPress={() => {
                setCategoryId(item.id);
                clearFieldError("categoryId");
              }}
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
        {fieldErrors.categoryId ? (
          <Text style={styles.inlineError}>{fieldErrors.categoryId}</Text>
        ) : null}

        <FormField
          label="Title"
          value={title}
          onChangeText={(value) => {
            setTitle(value);
            clearFieldError("title");
          }}
          placeholder="Item title"
          error={fieldErrors.title}
        />
        <FormField
          label="Description"
          value={description}
          onChangeText={(value) => {
            setDescription(value);
            clearFieldError("description");
          }}
          placeholder="Describe the item"
          multiline
          style={{ minHeight: 120, textAlignVertical: "top" }}
          error={fieldErrors.description}
        />

        <Text style={styles.label}>Condition</Text>
        <View style={styles.chipsWrap}>
          {CONDITIONS.map((item) => (
            <Pressable
              key={item}
              onPress={() => {
                setCondition(item);
                clearFieldError("condition");
              }}
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
          onChangeText={(value) => {
            setAskingPrice(value);
            clearFieldError("askingPrice");
          }}
          placeholder="0.00"
          keyboardType="numeric"
          error={fieldErrors.askingPrice}
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
                ? `₹${Number(suggestedPrice).toFixed(2)}`
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
  inlineError: {
    color: "#ef4444",
    marginTop: -2,
    marginBottom: 8,
    fontWeight: "600",
  },
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
