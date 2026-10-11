import ExpenseCard from "./ExpenseCard.jsx";

function ExpenseList({ expenses, onEdit, onDelete }) {
  if (expenses.length === 0) return <p className="empty">No expenses found.</p>;

  return (
    <ul className="list">
      {expenses.map((expense) => (
        <ExpenseCard key={expense.id} expense={expense} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  );
}

export default ExpenseList;
