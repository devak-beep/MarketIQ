import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL =
  process.env.API_URL || "https://marketiq-9qlb.onrender.com/api";
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

let authClient = {
  getRefreshToken: async () => null,
  onTokenRefreshed: null,
  onAuthFailure: null,
};

export function configureAuthClient(nextClient = {}) {
  authClient = {
    ...authClient,
    ...nextClient,
  };
}

async function refreshAccessToken() {
  const refreshToken = await authClient.getRefreshToken();
  if (!refreshToken) return null;

  const data = await request(
    "/auth/refresh",
    {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    },
    false,
  );

  if (data?.refreshToken) {
    await AsyncStorage.setItem("refreshToken", data.refreshToken);
  }
  if (data?.accessToken) {
    await AsyncStorage.setItem("accessToken", data.accessToken);
  }

  if (data?.accessToken && authClient.onTokenRefreshed) {
    authClient.onTokenRefreshed(data.accessToken, data.refreshToken || null);
  }

  return data?.accessToken || null;
}

function createTimeoutSignal(externalSignal, timeoutMs) {
  if (typeof AbortController === "undefined") {
    return { signal: externalSignal, cleanup: () => {} };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const abortFromExternalSignal = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else if (externalSignal.addEventListener) {
      externalSignal.addEventListener("abort", abortFromExternalSignal);
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeout);
      if (externalSignal?.removeEventListener) {
        externalSignal.removeEventListener("abort", abortFromExternalSignal);
      }
    },
  };
}

async function request(path, options = {}, retryOnAuthFailure = true) {
  const method = options.method || "GET";
  const {
    headers,
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    signal,
    ...fetchOptions
  } = options;
  const timeout = createTimeoutSignal(signal, timeoutMs);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      signal: timeout.signal,
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
      },
    });
  } catch (error) {
    const isTimeout = error?.name === "AbortError";
    const requestError = new Error(
      isTimeout
        ? "Server request timed out. Please try again."
        : error?.message || "Network request failed",
    );
    requestError.cause = error;
    requestError.isTimeout = isTimeout;
    throw requestError;
  } finally {
    timeout.cleanup();
  }

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  if (
    response.status === 401 &&
    retryOnAuthFailure &&
    headers?.Authorization?.startsWith("Bearer ")
  ) {
    try {
      const nextAccessToken = await refreshAccessToken();
      if (nextAccessToken) {
        const retryHeaders = {
          ...(headers || {}),
          Authorization: `Bearer ${nextAccessToken}`,
        };
        return request(
          path,
          {
            ...options,
            headers: retryHeaders,
          },
          false,
        );
      }
      if (authClient.onAuthFailure) authClient.onAuthFailure();
    } catch (error) {
      if (authClient.onAuthFailure) authClient.onAuthFailure(error);
    }
  }

  if (!response.ok) {
    console.error("API request failed", {
      method,
      path,
      status: response.status,
      response: data,
      requestBody: options.body,
    });
    const error = new Error(data?.message || "Request failed");
    error.details = data;
    error.status = response.status;
    throw error;
  }

  return data;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export const api = {
  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  refresh: (refreshToken) =>
    request("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),
  me: (token) =>
    request("/auth/me", { headers: { Authorization: `Bearer ${token}` } }),
  categories: () => request("/categories"),
  listings: (query = {}) => {
    const filteredQuery = Object.fromEntries(
      Object.entries(query).filter(
        ([, value]) => value !== undefined && value !== null && value !== "",
      ),
    );
    const params = new URLSearchParams(filteredQuery).toString();
    return request(`/listings${params ? `?${params}` : ""}`);
  },
  myListings: (token) =>
    request("/listings/mine", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  listing: (id) => request(`/listings/${id}`),
  uploadImage: (token, image) =>
    request("/upload/image", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ image }),
    }),
  uploadImage: (token, dataUri) =>
    request("/upload/image", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ image: dataUri }),
    }),
  createListing: (token, payload) => {
    console.log("Create listing request", payload);
    return request("/listings", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  },
  updateListing: (token, id, payload) =>
    request(`/listings/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  deleteListing: (token, id) =>
    request(`/listings/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),
  createOffer: (token, payload) =>
    request("/offers", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  logout: (refreshToken) =>
    request("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),
  sentOffers: (token) =>
    request("/offers/sent", { headers: { Authorization: `Bearer ${token}` } }),
  receivedOffers: (token) =>
    request("/offers/received", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  updateOfferStatus: (token, id, status) =>
    request(`/offers/${id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    }),
};
