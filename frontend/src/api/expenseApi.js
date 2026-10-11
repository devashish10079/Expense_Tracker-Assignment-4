// Set VITE_API_URL in frontend/.env (or in your hosting provider) to the deployed backend, e.g. https://my-api.example.com/api
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

// Small helper: sends a request and throws a readable error if it fails
async function request(path, options = {}) {
  let res;
  const token = localStorage.getItem("expenseTrackerToken");
  const headers = { "Content-Type": "application/json", ...options.headers };

  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    res = await fetch(API_URL + path, {
      ...options,
      headers,
    });
  } catch {
    throw new Error("Could not reach the server. Please check your connection and try again.");
  }

  // The body may be empty or not JSON (e.g. an HTML error page from a proxy)
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (res.status === 401) {
    localStorage.removeItem("expenseTrackerToken");
    localStorage.removeItem("expenseTrackerUser");
    const error = new Error((data && data.message) || "Session expired. Please log in again.");
    error.status = 401;
    throw error;
  }

  if (res.status === 403) {
    const error = new Error((data && data.message) || "Access denied: Administrator permissions required.");
    error.status = 403;
    throw error;
  }

  if (!res.ok) {
    const error = new Error((data && data.message) || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return data;
}

export async function getExpenses() {
  const data = await request("/expenses");
  return Array.isArray(data) ? data : [];
}

export function getExpense(id) {
  if (!id) return Promise.reject(new Error("Invalid expense ID"));
  return request(`/expenses/${id}`);
}

export function createExpense(expense) {
  return request("/expenses", { method: "POST", body: JSON.stringify(expense) });
}

export function updateExpense(id, expense) {
  if (!id) return Promise.reject(new Error("Invalid expense ID"));
  return request(`/expenses/${id}`, { method: "PUT", body: JSON.stringify(expense) });
}

export function deleteExpense(id) {
  if (!id) return Promise.reject(new Error("Invalid expense ID"));
  return request(`/expenses/${id}`, { method: "DELETE" });
}

export async function getAdminExpenses() {
  const data = await request("/admin/expenses");
  return Array.isArray(data) ? data : [];
}

export function getAdminExpense(id) {
  if (!id) return Promise.reject(new Error("Invalid expense ID"));
  return request(`/admin/expenses/${id}`);
}

export function updateAdminExpense(id, expense) {
  if (!id) return Promise.reject(new Error("Invalid expense ID"));
  return request(`/admin/expenses/${id}`, { method: "PUT", body: JSON.stringify(expense) });
}

export function deleteAdminExpense(id) {
  if (!id) return Promise.reject(new Error("Invalid expense ID"));
  return request(`/admin/expenses/${id}`, { method: "DELETE" });
}
