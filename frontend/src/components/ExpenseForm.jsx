import { useState } from "react";
import categories from "../categories.js";

const emptyForm = { title: "", amount: "", category: "", date: "", description: "" };

function toForm(expense) {
  if (!expense) return emptyForm;
  return {
    title: expense.title ?? "",
    amount: expense.amount != null ? String(expense.amount) : "",
    category: expense.category ?? "",
    date: expense.date ?? "",
    description: expense.description ?? "",
  };
}

// App passes key={expense id} so this component remounts (and refills) when switching expenses
function ExpenseForm({ selectedExpense, onSave, onCancel, saving }) {
  const [form, setForm] = useState(() => toForm(selectedExpense));
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validate() {
    if (!form.title.trim()) return "Title is required";
    const amount = Number(form.amount);
    if (form.amount.trim() === "" || !Number.isFinite(amount) || amount <= 0) {
      return "Amount must be a positive number";
    }
    if (!categories.includes(form.category)) return "Please choose a category";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date) || isNaN(new Date(form.date))) {
      return "Please enter a valid date";
    }
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const message = validate();
    if (message) return setError(message);
    setError("");

    const payload = {
      title: form.title.trim(),
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
      description: form.description.trim(),
    };

    // Only clear the form after the save succeeded
    const ok = await onSave(payload);
    if (ok && !selectedExpense) setForm(emptyForm);
  }

  return (
    <form onSubmit={handleSubmit} className="form" noValidate>
      <h2>{selectedExpense ? "Edit Expense" : "Add Expense"}</h2>

      <label>
        Title
        <input name="title" value={form.title} onChange={handleChange} disabled={saving} required />
      </label>
      <label>
        Amount (₹)
        <input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          value={form.amount}
          onChange={handleChange}
          disabled={saving}
          required
        />
      </label>
      <label>
        Category
        <select name="category" value={form.category} onChange={handleChange} disabled={saving} required>
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Date
        <input name="date" type="date" value={form.date} onChange={handleChange} disabled={saving} required />
      </label>
      <label>
        Description (optional)
        <textarea name="description" value={form.description} onChange={handleChange} disabled={saving} />
      </label>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : selectedExpense ? "Update" : "Add"}
        </button>
        {selectedExpense && (
          <button type="button" onClick={onCancel} disabled={saving}>Cancel</button>
        )}
      </div>
    </form>
  );
}

export default ExpenseForm;
