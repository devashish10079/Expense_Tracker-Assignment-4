const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

function formatAmount(amount) {
  const value = Number(amount);
  return Number.isFinite(value) ? currency.format(value) : "-";
}

function ExpenseList({ expenses, onEdit, onDelete, disabled }) {
  if (expenses.length === 0) return <p className="empty">No expenses yet. Add one above.</p>;

  function handleDelete(expense) {
    if (window.confirm(`Delete "${expense.title}"? This cannot be undone.`)) {
      onDelete(expense.id);
    }
  }

  return (
    <ul className="list">
      {expenses.map((expense) => (
        <li key={expense.id}>
          <div className="item-info">
            <strong>{expense.title}</strong> - {formatAmount(expense.amount)}
            <br />
            <small>{expense.category} | {expense.date}</small>
            {expense.description && <p>{expense.description}</p>}
          </div>
          <div className="item-actions">
            <button
              type="button"
              onClick={() => onEdit(expense)}
              disabled={disabled}
              aria-label={`Edit expense ${expense.title}`}
            >
              Edit
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => handleDelete(expense)}
              disabled={disabled}
              aria-label={`Delete expense ${expense.title}`}
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default ExpenseList;
