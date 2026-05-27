import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { launchImageLibrary, launchCamera } from "react-native-image-picker";
import { api } from "../services/api";
import { predictPrice } from "../services/ml";
import { useAuth } from "../context/AuthContext";
import { useAppAlert } from "../components/AppAlert";
import FormField from "../components/FormField";
import PrimaryButton from "../components/PrimaryButton";

const CONDITIONS = ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"];
const ML_CATEGORY_BY_SLUG = {
  "mobile-phones": "phones",
  laptops: "laptops",
  cameras: "cameras",
  "audio-headphones": "accessories",
  "video-games-consoles": "games",
  "tv-home-theatre": "appliances",
  tablets: "tablets",
  motorcycles: "bikes",
  scooters: "bikes",
  bicycles: "bikes",
  "kitchen-appliances": "appliances",
  "washing-machines": "appliances",
  "air-conditioners": "appliances",
  refrigerators: "appliances",
  textbooks: "books",
  fiction: "books",
  "non-fiction": "books",
  "gym-equipment": "fitness",
  "outdoor-sports": "fitness",
  "cycles-skating": "fitness",
  "video-games": "games",
  accessories: "accessories",
};
const ML_KEYWORDS_BY_SLUG = {
  "mobile-phones": "phone iphone samsung mobile",
  laptops: "laptop macbook dell hp",
  cameras: "camera canon sony lens",
  "audio-headphones": "headphones airpods audio sony",
  "video-games-consoles": "playstation xbox nintendo console games",
  "tv-home-theatre": "tv television home theatre oled",
  tablets: "tablet ipad android",
  motorcycles: "motorcycle royal enfield bike",
  scooters: "scooter activa",
  bicycles: "bicycle cycle bike",
  "kitchen-appliances": "kitchen appliance air fryer microwave",
  "washing-machines": "washing machine washer",
  "air-conditioners": "air conditioner ac inverter",
  refrigerators: "refrigerator fridge",
  textbooks: "textbook books study",
  fiction: "fiction novel books",
  "non-fiction": "non fiction books",
  "gym-equipment": "gym fitness dumbbell treadmill",
  "outdoor-sports": "sports badminton racket",
  "cycles-skating": "cycle skating fitness",
  "video-games": "video game playstation xbox",
  accessories: "airpods headphones mouse accessories",
};

function normalizeForMl(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getPredictionCategory(category, subcategory) {
  const subSlug = normalizeForMl(subcategory?.slug || subcategory?.name);
  const categorySlug = normalizeForMl(category?.slug || category?.name);

  return (
    ML_CATEGORY_BY_SLUG[subSlug] ||
    ML_CATEGORY_BY_SLUG[categorySlug] ||
    categorySlug ||
    "general"
  );
}

function getPredictionKeywords(category, subcategory) {
  const subSlug = normalizeForMl(subcategory?.slug || subcategory?.name);
  const categorySlug = normalizeForMl(category?.slug || category?.name);

  return ML_KEYWORDS_BY_SLUG[subSlug] || ML_KEYWORDS_BY_SLUG[categorySlug] || "";
}

function formatRupees(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

export default function PostItemScreen() {
  const { token, user } = useAuth();
  const alert = useAppAlert();
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("GOOD");
  const [askingPrice, setAskingPrice] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [suggestedPrice, setSuggestedPrice] = useState(null);
  const [suggestedRange, setSuggestedRange] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const userEditedPrice = useRef(false);

  const [categoriesError, setCategoriesError] = useState(false);

  useEffect(() => {
    api
      .categories()
      .then((result) => {
        const data = result.data || [];
        setCategories(data);
        if (data.length === 0) setCategoriesError(true);
      })
      .catch(() => setCategoriesError(true));
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!categoryId || !description.trim()) {
        setPredicting(false);
        setSuggestedPrice(null);
        setSuggestedRange(null);
        return;
      }

      const selectedCategory = categories.find(
        (item) => item.id === categoryId,
      );
      const subcategories = selectedCategory?.subcategories || [];
      const selectedSubcategory = subcategories.find(
        (s) => s.id === subcategoryId,
      );

      if (subcategories.length > 0 && !selectedSubcategory) {
        setPredicting(false);
        setSuggestedPrice(null);
        setSuggestedRange(null);
        return;
      }

      setPredicting(true);
      try {
        const predictionKeywords = getPredictionKeywords(
          selectedCategory,
          selectedSubcategory,
        );
        const predictionTitle = [predictionKeywords, title.trim()]
          .filter(Boolean)
          .join(" ");
        const predictionDescription = [predictionKeywords, description.trim()]
          .filter(Boolean)
          .join(" ");

        const result = await predictPrice({
          category: getPredictionCategory(selectedCategory, selectedSubcategory),
          subcategory: normalizeForMl(
            selectedSubcategory?.slug ||
              selectedSubcategory?.name ||
              selectedCategory?.slug ||
              selectedCategory?.name,
          ),
          condition,
          title: predictionTitle,
          description: predictionDescription,
          description_length: description.length,
        });
        setSuggestedPrice(result.predicted_price);
        setSuggestedRange({
          low: result.price_low ?? result.predicted_price * 0.88,
          high: result.price_high ?? result.predicted_price * 1.12,
        });
        if (!userEditedPrice.current) {
          setAskingPrice(String(Math.round(result.predicted_price)));
        }
      } catch {
        setSuggestedPrice(null);
        setSuggestedRange(null);
      } finally {
        setPredicting(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [categoryId, subcategoryId, categories, condition, description, title]);

  async function handleImageUpload(response) {
    if (response.didCancel || !response.assets?.length) return;

    setSubmitting(true);
    try {
      const uploadedUrls = [];
      for (const asset of response.assets) {
        const formData = new FormData();
        formData.append("file", {
          uri: asset.uri,
          type: asset.type || "image/jpeg",
          name: asset.fileName || "photo.jpg",
        });
        formData.append("upload_preset", "ml_default");
        formData.append("folder", "marketiq");

        try {
          const res = await fetch(
            "https://api.cloudinary.com/v1_1/dwyoyjqt8/image/upload",
            { method: "POST", body: formData }
          );
          const data = await res.json();
          if (data.secure_url) {
            uploadedUrls.push(data.secure_url);
          } else {
            throw new Error(data.error?.message || "Upload failed");
          }
        } catch (uploadErr) {
          alert("Upload failed", uploadErr.message);
          setSubmitting(false);
          return;
        }
      }
      setImageUrls((prev) => [...prev, ...uploadedUrls]);
    } catch (error) {
      alert("Upload failed", error.message || "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  function pickImages() {
    alert("Upload Image", "Choose an option", [
      {
        text: "Take Photo",
        onPress: () =>
          launchCamera({ mediaType: "photo", quality: 0.5 }, handleImageUpload),
      },
      {
        text: "Choose from Gallery",
        onPress: () =>
          launchImageLibrary(
            { mediaType: "photo", selectionLimit: 4, quality: 0.5 },
            handleImageUpload
          ),
      },
      { text: "Cancel", style: "cancel" },
    ]);
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
    const formErrors = Array.isArray(errors?.formErrors)
      ? errors.formErrors.filter(Boolean)
      : [];
    const errorFields = errors?.fieldErrors || errors?.errors || {};
    const parts = Object.entries(errorFields || {})
      .map(([field, value]) => {
        if (Array.isArray(value))
          return [field, value.filter(Boolean).join(", ")];
        if (typeof value === "string") return [field, value];
        if (value && typeof value === "object") return [field, "Invalid value"];
        return [field, "Invalid value"];
      })
      .filter(([, message]) => message && message !== "Invalid value");

    return [
      ...formErrors,
      ...parts.map(([field, message]) => `${field}: ${message}`),
    ].join("\n");
  }

  function validateLocal() {
    const nextErrors = {};

    const selectedCategory = categories.find((item) => item.id === categoryId);
    if (!categoryId.trim()) {
      nextErrors.categoryId = "Select a category.";
    } else if (
      selectedCategory?.subcategories?.length > 0 &&
      !subcategoryId.trim()
    ) {
      nextErrors.categoryId = "Select a subcategory.";
    }
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
      alert(
        "Missing details",
        `Please complete these fields:\n• ${Object.values(validation.nextErrors).join("\n• ")}`,
      );
      return;
    }

    if (!token) {
      alert("Sign in required", "Please sign in before posting an item.");
      return;
    }

    if (user?.role !== "SELLER") {
      console.error("Create listing blocked for non-seller", {
        role: user?.role,
        userId: user?.id,
      });
      alert(
        "Seller account required",
        "Only seller accounts can publish listings.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        categoryId: (subcategoryId || categoryId).trim(),
        title: title.trim(),
        description: description.trim(),
        condition,
        askingPrice: validation.normalizedPrice,
        imageUrls,
      };
      await api.createListing(token, payload);
      alert("Success", "Listing created successfully.");
      setCategoryId("");
      setTitle("");
      setDescription("");
      setCondition("GOOD");
      setAskingPrice("");
      setImageUrls([]);
      setSuggestedPrice(null);
      setSuggestedRange(null);
      setFieldErrors({});
      userEditedPrice.current = false;
    } catch (error) {
      console.error("Create listing failed", {
        message: error.message,
        details: error.details,
      });
      const details = getFieldErrorMessage(error.details);
      alert(
        "Create listing failed",
        details || error.message || "Request failed",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (user?.role && user.role !== "SELLER") {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.blocked}>
          <Text style={styles.title}>Seller account required</Text>
          <Text style={styles.subtitle}>
            Buyers can browse listings and make offers. Use a seller account to
            publish items.
          </Text>
        </View>
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
        <Text style={styles.title}>Post Item</Text>
        <Text style={styles.subtitle}>
          Get an instant suggested price before publishing.
        </Text>

        <Text style={styles.label}>Category *</Text>
        {categoriesError ? (
          <Text style={styles.inlineError}>Failed to load categories. Check your connection.</Text>
        ) : null}
        <View style={styles.chipsWrap}>
          {categories.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                setCategoryId(item.id);
                setSubcategoryId("");
                clearFieldError("categoryId");
              }}
              style={[styles.chip, categoryId === item.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, categoryId === item.id && styles.chipTextActive]}>
                {item.name}
              </Text>
            </Pressable>
          ))}
        </View>
        {fieldErrors.categoryId ? (
          <Text style={styles.inlineError}>{fieldErrors.categoryId}</Text>
        ) : null}

        {/* Subcategory — shown only when parent has subcategories */}
        {categories.find((c) => c.id === categoryId)?.subcategories?.length > 0 && (
          <>
            <Text style={styles.label}>Subcategory *</Text>
            <View style={styles.chipsWrap}>
              {categories
                .find((c) => c.id === categoryId)
                .subcategories.map((sub) => (
                  <Pressable
                    key={sub.id}
                    onPress={() => {
                      setSubcategoryId(sub.id);
                      clearFieldError("categoryId");
                    }}
                    style={[styles.chip, subcategoryId === sub.id && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, subcategoryId === sub.id && styles.chipTextActive]}>
                      {sub.name}
                    </Text>
                  </Pressable>
                ))}
            </View>
          </>
        )}

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
            userEditedPrice.current = true;
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
              : suggestedRange
                ? `${formatRupees(suggestedRange.low)} - ${formatRupees(suggestedRange.high)}`
                : "Select category and enter description"}
          </Text>
          {suggestedRange ? (
            <>
              <View style={styles.rangeTrack}>
                <View style={styles.rangeFill} />
                <View style={styles.rangeMarker} />
              </View>
              <View style={styles.rangeLabels}>
                <Text style={styles.rangeLabel}>
                  Low {formatRupees(suggestedRange.low)}
                </Text>
                <Text style={styles.rangeLabel}>
                  Best {formatRupees(suggestedPrice)}
                </Text>
                <Text style={styles.rangeLabel}>
                  High {formatRupees(suggestedRange.high)}
                </Text>
              </View>
            </>
          ) : null}
          {suggestedPrice ? (
            <PrimaryButton
              label="Use Suggested Price"
              variant="secondary"
              onPress={() => {
                userEditedPrice.current = false;
                setAskingPrice(String(Math.round(suggestedPrice)));
              }}
            />
          ) : null}
        </View>

        <PrimaryButton
          label="Publish Listing"
          onPress={submit}
          loading={submitting}
        />
        </ScrollView>
      </KeyboardAvoidingView>
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
  rangeTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#dbeafe",
    overflow: "hidden",
    justifyContent: "center",
  },
  rangeFill: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: "#93c5fd",
  },
  rangeMarker: {
    alignSelf: "center",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#1d4ed8",
    borderWidth: 3,
    borderColor: "#eff6ff",
  },
  rangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  rangeLabel: {
    flex: 1,
    color: "#475569",
    fontSize: 11,
    fontWeight: "700",
  },
  blocked: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    gap: 8,
  },
});
