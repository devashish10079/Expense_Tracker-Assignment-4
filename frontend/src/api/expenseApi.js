const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Small helper: sends a request and throws an error if it fails
async function request(path, options = {}) {
  const res = await fetch(API_URL + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

export function getExpenses() {
  return request("/expenses");
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
