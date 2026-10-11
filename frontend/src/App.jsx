import { useState, useEffect } from "react";
import ExpenseForm from "./components/ExpenseForm.jsx";
import ExpenseList from "./components/ExpenseList.jsx";
import { getExpenses, createExpense, updateExpense, deleteExpense } from "./api/expenseApi.js";

function App() {
  const [expenses, setExpenses] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadExpenses() {
    setLoading(true);
    try {
      setExpenses(await getExpenses());
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Load expenses when the page opens
  useEffect(() => {
    let ignore = false;
    getExpenses()
      .then((data) => {
        if (!ignore) setExpenses(data);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  // Returns true when the save succeeded so the form knows it can clear itself
  async function handleSave(form) {
    setSaving(true);
    setSuccess("");
    setError("");
    try {
      if (selectedExpense) {
        await updateExpense(selectedExpense.id, form);
        setSuccess("Expense updated");
      } else {
        await createExpense(form);
        setSuccess("Expense added");
      }
      setSelectedExpense(null);
      await loadExpenses();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setSaving(true);
    setSuccess("");
    setError("");
    try {
      await deleteExpense(id);
      if (selectedExpense && selectedExpense.id === id) setSelectedExpense(null);
      setSuccess("Expense deleted");
      await loadExpenses();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(expense) {
    setSuccess("");
    setSelectedExpense(expense);
  }

  return (
    <main className="container">
      <h1>Expense Tracker</h1>

      {error && <p className="error" role="alert">{error}</p>}
      {success && <p className="success" role="status">{success}</p>}

      <ExpenseForm
        key={selectedExpense ? selectedExpense.id : "new"}
        selectedExpense={selectedExpense}
        onSave={handleSave}
        onCancel={() => setSelectedExpense(null)}
        saving={saving}
      />

      <h2>Expenses</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ExpenseList expenses={expenses} onEdit={handleEdit} onDelete={handleDelete} disabled={saving} />
      )}
    </main>
  );
}

export default App;
