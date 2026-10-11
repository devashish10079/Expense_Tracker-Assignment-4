import { useState, useEffect } from "react";
import ExpenseForm from "./components/ExpenseForm.jsx";
import ExpenseList from "./components/ExpenseList.jsx";
import { getExpenses, createExpense, updateExpense, deleteExpense } from "./api/expenseApi.js";

function App() {
  const [expenses, setExpenses] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load expenses when the page opens
  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    setLoading(true);
    try {
      const data = await getExpenses();
      setExpenses(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleSave(form) {
    setLoading(true);
    setSuccess("");
    try {
      if (selectedExpense) {
        await updateExpense(selectedExpense.id, form);
        setSuccess("Expense updated");
      } else {
        await createExpense(form);
        setSuccess("Expense added");
      }
      setSelectedExpense(null);
      setError("");
      await loadExpenses();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    setLoading(true);
    setSuccess("");
    try {
      await deleteExpense(id);
      setSuccess("Expense deleted");
      setError("");
      await loadExpenses();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="container">
      <h1>Expense Tracker</h1>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      <ExpenseForm
        selectedExpense={selectedExpense}
        onSave={handleSave}
        onCancel={() => setSelectedExpense(null)}
        loading={loading}
      />

      <h2>Expenses</h2>
      {loading && <p>Loading...</p>}
      <ExpenseList expenses={expenses} onEdit={setSelectedExpense} onDelete={handleDelete} />
    </div>
  );
}

export default App;
