const API_BASE_URL =
  process.env.API_URL || "http://10.0.2.2:4000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
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
    const params = new URLSearchParams(query).toString();
    return request(`/listings${params ? `?${params}` : ""}`);
  },
  listing: (id) => request(`/listings/${id}`),
  createListing: (token, payload) =>
    request("/listings", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
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
