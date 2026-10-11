function ExpenseCard({ expense, onEdit, onDelete }) {
  return (
    <li className="card">
      <div>
        <strong>{expense.title}</strong> - ₹{expense.amount}
        <br />
        <small>{expense.category} | {expense.date}</small>
        {expense.description && <p>{expense.description}</p>}
      </div>
      <div className="actions">
        <button onClick={() => onEdit(expense)}>Edit</button>
        <button onClick={() => onDelete(expense.id)}>Delete</button>
      </div>
    </li>
  );
}

export default ExpenseCard;
