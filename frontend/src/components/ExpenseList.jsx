import ExpenseCard from "./ExpenseCard.jsx";

function ExpenseList({ expenses, onEdit, onDelete, disabled }) {
  if (expenses.length === 0) return <p className="empty">No expenses found.</p>;

  return (
    <ul className="list">
      {expenses.map((expense) => (
        <ExpenseCard key={expense.id} expense={expense} onEdit={onEdit} onDelete={onDelete} disabled={disabled} />
      ))}
    </ul>
  );
}

export default ExpenseList;
