const ML_BASE_URL = process.env.ML_URL || "https://marketiq-abqg.onrender.com";

export async function predictPrice(payload) {
  console.log("Predict price request", payload);
  const response = await fetch(`${ML_BASE_URL}/predict-price`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    console.error("Predict price failed", {
      status: response.status,
      response: data,
      requestBody: payload,
    });
    throw new Error(data?.message || "Prediction failed");
  }

  console.log("Predict price response", data);

  return {
    ...data,
    currency: data?.currency || "INR",
  };
}
