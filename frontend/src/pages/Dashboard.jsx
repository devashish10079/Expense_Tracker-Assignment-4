import { useState, useEffect } from "react";
import ExpenseForm from "../components/ExpenseForm.jsx";
import ExpenseList from "../components/ExpenseList.jsx";
import ExpenseSummary from "../components/ExpenseSummary.jsx";
import CategoryFilter from "../components/CategoryFilter.jsx";
import { getExpenses, createExpense, updateExpense, deleteExpense } from "../api/expenseApi.js";

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [category, setCategory] = useState("All");

  // Only show expenses of the chosen category
  const filteredExpenses =
    category === "All" ? expenses : expenses.filter((e) => e.category === category);

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
        key={selectedExpense ? selectedExpense.id : "new"}
        selectedExpense={selectedExpense}
        onSave={handleSave}
        onCancel={() => setSelectedExpense(null)}
        loading={loading}
      />

      <ExpenseSummary expenses={filteredExpenses} />

      <div className="list-header">
        <h2>Expenses</h2>
        <CategoryFilter value={category} onChange={setCategory} />
      </div>

      {loading && <p>Loading...</p>}
      <ExpenseList expenses={filteredExpenses} onEdit={setSelectedExpense} onDelete={handleDelete} />
    </div>
  );
}

export default Dashboard;
