// Set VITE_API_URL in frontend/.env (or in your hosting provider) to the deployed backend, e.g. https://my-api.example.com/api
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

// Small helper: sends a request and throws a readable error if it fails
async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(API_URL + path, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
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

  if (!res.ok) {
    throw new Error((data && data.message) || `Request failed (${res.status})`);
  }
  return data;
}

export async function getExpenses() {
  const data = await request("/expenses");
  return Array.isArray(data) ? data : [];
}

export function getExpense(id) {
  return request(`/expenses/${id}`);
}

export function createExpense(expense) {
  return request("/expenses", { method: "POST", body: JSON.stringify(expense) });
}

export function updateExpense(id, expense) {
  return request(`/expenses/${id}`, { method: "PUT", body: JSON.stringify(expense) });
}

export function deleteExpense(id) {
  return request(`/expenses/${id}`, { method: "DELETE" });
}
