function ExpenseSummary({ expenses }) {
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="summary">
      <p>Total Expenses</p>
      <h2>₹{total.toFixed(2)}</h2>
      <small>{expenses.length} expense(s)</small>
    </div>
  );
}

export default ExpenseSummary;
