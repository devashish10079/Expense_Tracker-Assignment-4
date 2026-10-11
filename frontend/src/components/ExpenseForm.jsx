import { useState } from "react";
import categories from "../categories.js";

const emptyForm = { title: "", amount: "", category: "", date: "", description: "" };

function ExpenseForm({ selectedExpense, onSave, onCancel, loading }) {
  // If we are editing, start with that expense's values
  const [form, setForm] = useState(selectedExpense || emptyForm);
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.title.trim()) return setError("Title is required");
    if (!(Number(form.amount) > 0)) return setError("Amount must be a positive number");
    if (!form.category) return setError("Category is required");
    if (!form.date || isNaN(new Date(form.date))) return setError("Please enter a valid date");

    setError("");
    onSave(form);
    if (!selectedExpense) setForm(emptyForm);
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <h2>{selectedExpense ? "Edit Expense" : "Add Expense"}</h2>

      <input name="title" placeholder="Title" value={form.title} onChange={handleChange} />
      <input name="amount" type="number" placeholder="Amount" value={form.amount} onChange={handleChange} />
      <select name="category" value={form.category} onChange={handleChange}>
        <option value="">Select category</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <input name="date" type="date" value={form.date} onChange={handleChange} />
      <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} />

      {error && <p className="error">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Saving..." : selectedExpense ? "Update" : "Add"}
      </button>
      {selectedExpense && (
        <button type="button" onClick={onCancel}>Cancel</button>
      )}
    </form>
  );
}

export default ExpenseForm;
