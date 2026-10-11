function ExpenseList({ expenses, onEdit, onDelete }) {
  if (expenses.length === 0) return <p>No expenses yet.</p>;

  return (
    <ul className="list">
      {expenses.map((expense) => (
        <li key={expense.id}>
          <div>
            <strong>{expense.title}</strong> - ₹{expense.amount}
            <br />
            <small>{expense.category} | {expense.date}</small>
            {expense.description && <p>{expense.description}</p>}
          </div>
          <div>
            <button onClick={() => onEdit(expense)}>Edit</button>
            <button onClick={() => onDelete(expense.id)}>Delete</button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default ExpenseList;
