import categories from "../categories.js";

function CategoryFilter({ value, onChange }) {
  return (
    <select aria-label="Filter by category" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="All">All categories</option>
      {categories.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
}

export default CategoryFilter;
