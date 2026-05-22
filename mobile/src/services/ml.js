const ML_BASE_URL = process.env.ML_URL || "https://marketiq-abqg.onrender.com";

export async function predictPrice(payload) {
  const response = await fetch(`${ML_BASE_URL}/predict-price`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || "Prediction failed");
  }

  return {
    ...data,
    currency: data?.currency || "INR",
  };
}
