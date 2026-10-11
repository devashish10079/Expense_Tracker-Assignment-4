const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Expenses are kept in memory (they reset when the server restarts)
let expenses = [];
let nextId = 1;

// Get all expenses
app.get("/api/expenses", (req, res) => {
  res.json(expenses);
});

// Get one expense
app.get("/api/expenses/:id", (req, res) => {
  const expense = expenses.find((e) => e.id === Number(req.params.id));
  if (!expense) return res.status(404).json({ message: "Expense not found" });
  res.json(expense);
});

// Create an expense
app.post("/api/expenses", (req, res) => {
  const { title, amount, category, date, description } = req.body;
  if (!title || !amount || !category || !date) {
    return res.status(400).json({ message: "Title, amount, category and date are required" });
  }
  const expense = { id: nextId++, title, amount: Number(amount), category, date, description };
  expenses.push(expense);
  res.status(201).json(expense);
});

// Update an expense
app.put("/api/expenses/:id", (req, res) => {
  const index = expenses.findIndex((e) => e.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ message: "Expense not found" });
  expenses[index] = { ...expenses[index], ...req.body, amount: Number(req.body.amount) };
  res.json(expenses[index]);
});

// Delete an expense
app.delete("/api/expenses/:id", (req, res) => {
  const exists = expenses.some((e) => e.id === Number(req.params.id));
  if (!exists) return res.status(404).json({ message: "Expense not found" });
  expenses = expenses.filter((e) => e.id !== Number(req.params.id));
  res.json({ message: "Expense deleted" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
