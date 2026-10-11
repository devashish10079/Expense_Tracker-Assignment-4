import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  deleteAdminExpense,
  getAdminExpenses,
  updateAdminExpense
} from '../api/expenseApi.js';

const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Other'];
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

function formatAmount(amount) {
  const value = Number(amount);
  return Number.isFinite(value) ? currency.format(value) : '-';
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr).slice(0, 10);
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return String(dateStr).slice(0, 10);
  }
}

function getOwnerInfo(user) {
  if (!user) {
    return { name: 'Unknown User', email: '', role: 'user', id: 'N/A' };
  }
  if (typeof user === 'object') {
    return {
      name: user.name || 'Unnamed User',
      email: user.email || '',
      role: user.role || 'user',
      id: user._id || user.id || 'N/A'
    };
  }
  return { name: String(user), email: '', role: 'user', id: String(user) };
}

function ExpenseDetailModal({ expense, onClose, onEdit, onDelete, disabled }) {
  if (!expense) return null;
  const owner = getOwnerInfo(expense.user);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-card">
        <header className="modal-header">
          <div className="badge admin-pill">Expense Details</div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close dialog">
            &times;
          </button>
        </header>

        <h2 id="modal-title" className="modal-title">{expense.title}</h2>
        <div className="modal-amount">{formatAmount(expense.amount)}</div>

        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Category</span>
            <span className="category-pill">{expense.category || 'Other'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Date</span>
            <span className="detail-value">{formatDate(expense.date)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Owner Name</span>
            <span className="detail-value font-medium">{owner.name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Owner Email</span>
            <span className="detail-value">{owner.email || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Owner Role</span>
            <span className={`badge ${owner.role === 'admin' ? 'admin-badge' : 'user-badge'}`}>
              {owner.role}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Expense ID</span>
            <span className="detail-value mono-text">{expense._id || expense.id}</span>
          </div>
        </div>

        <div className="detail-description-block">
          <span className="detail-label">Description</span>
          <p className="detail-description-text">
            {expense.description ? expense.description : <em>No description provided</em>}
          </p>
        </div>

        <footer className="modal-actions">
          <button
            type="button"
            className="button secondary"
            onClick={() => onEdit(expense)}
            disabled={disabled}
          >
            Edit Expense
          </button>
          <button
            type="button"
            className="button danger"
            onClick={() => onDelete(expense)}
            disabled={disabled}
          >
            Delete Expense
          </button>
          <button type="button" className="button ghost" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

function AdminEditModal({ expense, onSave, onClose, saving }) {
  const [form, setForm] = useState(() => ({
    title: expense?.title ?? '',
    amount: expense?.amount != null ? String(expense.amount) : '',
    category: expense?.category ?? 'Food',
    date: expense?.date ? String(expense.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
    description: expense?.description ?? ''
  }));
  const [error, setError] = useState('');
  const owner = getOwnerInfo(expense?.user);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validate() {
    if (!form.title.trim()) return 'Title is required';
    const amount = Number(form.amount);
    if (form.amount.trim() === '' || !Number.isFinite(amount) || amount <= 0) {
      return 'Amount must be a positive number';
    }
    if (!CATEGORIES.includes(form.category)) return 'Please select a valid category';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date) || isNaN(new Date(form.date))) {
      return 'Please enter a valid date';
    }
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const msg = validate();
    if (msg) return setError(msg);
    setError('');

    const payload = {
      title: form.title.trim(),
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
      description: form.description.trim()
    };

    const success = await onSave(expense._id || expense.id, payload);
    if (success) onClose();
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
      <div className="modal-card">
        <header className="modal-header">
          <div className="badge admin-pill">Admin Management</div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close dialog">
            &times;
          </button>
        </header>

        <h2 id="edit-modal-title" className="modal-title">Edit User Expense</h2>
        <div className="owner-banner">
          <span>Editing expense owned by: <strong>{owner.name}</strong> ({owner.email || 'No email'})</span>
        </div>

        {error && <p className="error" role="alert">{error}</p>}

        <form onSubmit={handleSubmit} className="admin-edit-form" noValidate>
          <label>
            Title
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              disabled={saving}
              required
            />
          </label>
          <label>
            Amount (₹)
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              disabled={saving}
              required
            />
          </label>
          <label>
            Category
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              disabled={saving}
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              disabled={saving}
              required
            />
          </label>
          <label>
            Description (optional)
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              disabled={saving}
              rows="3"
            />
          </label>

          <footer className="modal-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Saving changes...' : 'Save Changes'}
            </button>
            <button type="button" className="button secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default function AdminDashboardPage({ user, onLogout }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [detailExpense, setDetailExpense] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const navigate = useNavigate();

  async function refreshExpenses() {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminExpenses();
      setExpenses(data);
    } catch (err) {
      if (err.status === 401) {
        onLogout();
        navigate('/login');
        return;
      }
      setError(err.message || 'Failed to load platform expenses');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    getAdminExpenses()
      .then((data) => {
        if (!cancelled) setExpenses(data);
      })
      .catch((err) => {
        if (!cancelled) {
          if (err.status === 401) {
            onLogout();
            navigate('/login');
            return;
          }
          setError(err.message || 'Failed to load platform expenses');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, onLogout]);

  function handleLogout() {
    onLogout();
    navigate('/login');
  }

  // Summary Metrics calculations
  const stats = useMemo(() => {
    const totalCount = expenses.length;
    const totalAmount = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const uniqueOwners = new Set(
      expenses.map((item) => {
        const owner = getOwnerInfo(item.user);
        return owner.id !== 'N/A' ? owner.id : owner.name;
      })
    ).size;
    const avgAmount = totalCount > 0 ? totalAmount / totalCount : 0;

    return { totalCount, totalAmount, uniqueOwners, avgAmount };
  }, [expenses]);

  // Filtered expenses based on search and category
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const owner = getOwnerInfo(item.user);
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const q = search.trim().toLowerCase();
      if (!q) return matchesCategory;

      const matchesSearch =
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (owner.name && owner.name.toLowerCase().includes(q)) ||
        (owner.email && owner.email.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [expenses, search, selectedCategory]);

  async function handleAdminSave(id, form) {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await updateAdminExpense(id, form);
      setSuccess(`Expense "${updated.title}" updated successfully.`);
      // Update local state directly & reload
      setExpenses((prev) =>
        prev.map((e) => ((e._id || e.id) === id ? { ...e, ...updated } : e))
      );
      if (detailExpense && (detailExpense._id || detailExpense.id) === id) {
        setDetailExpense({ ...detailExpense, ...updated });
      }
      return true;
    } catch (err) {
      setError(err.message || 'Failed to update expense');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleAdminDelete(expense) {
    const id = expense._id || expense.id;
    const owner = getOwnerInfo(expense.user);
    if (!id) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete expense "${expense.title}" owned by ${owner.name}? This action cannot be undone.`
    );
    if (!confirmed) return;

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await deleteAdminExpense(id);
      setSuccess(`Expense "${expense.title}" was permanently deleted.`);
      setExpenses((prev) => prev.filter((e) => (e._id || e.id) !== id));
      if (detailExpense && (detailExpense._id || detailExpense.id) === id) {
        setDetailExpense(null);
      }
      if (editingExpense && (editingExpense._id || editingExpense.id) === id) {
        setEditingExpense(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete expense');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="container admin-container">
      <header className="page-header admin-header">
        <div>
          <div className="admin-title-row">
            <h1>Admin Dashboard</h1>
            <span className="badge admin-badge">Platform Administrator</span>
          </div>
          <p className="admin-subtitle">
            System overview and cross-user expense management ({user?.name || 'Admin'})
          </p>
        </div>
        <div className="button-row">
          <Link to="/expenses" className="button secondary">My Expenses</Link>
          <Link to="/dashboard" className="button secondary">Dashboard</Link>
          <button type="button" className="button ghost" onClick={refreshExpenses} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button type="button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {error && <p className="error" role="alert">{error}</p>}
      {success && <p className="success" role="status">{success}</p>}

      {/* Overview Metrics Cards */}
      <section className="stats-grid" aria-label="System Metrics">
        <div className="stat-card">
          <div className="stat-label">Total Platform Expenses</div>
          <div className="stat-value">{stats.totalCount}</div>
          <div className="stat-meta">across all registered accounts</div>
        </div>
        <div className="stat-card stat-accent">
          <div className="stat-label">Total Platform Volume</div>
          <div className="stat-value">{formatAmount(stats.totalAmount)}</div>
          <div className="stat-meta">cumulative platform expenditures</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Users</div>
          <div className="stat-value">{stats.uniqueOwners}</div>
          <div className="stat-meta">with logged expenses</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Average Expense</div>
          <div className="stat-value">{formatAmount(stats.avgAmount)}</div>
          <div className="stat-meta">per recorded transaction</div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="admin-controls-card">
        <div className="admin-controls-row">
          <div className="search-group">
            <label htmlFor="admin-search" className="sr-only">Search expenses or owners</label>
            <input
              id="admin-search"
              type="text"
              placeholder="Search by title, owner name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
            />
            {search && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
          </div>

          <div className="filter-group">
            <label htmlFor="admin-category-filter">Category:</label>
            <select
              id="admin-category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="admin-filter-select"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Cross-User Expenses Table */}
      <section className="admin-table-section">
        <div className="admin-table-header-row">
          <h2>Platform Expenses ({filteredExpenses.length})</h2>
          {search || selectedCategory !== 'All' ? (
            <span className="filter-tag">
              Showing filtered results ({filteredExpenses.length} of {expenses.length})
            </span>
          ) : null}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading all platform expenses from MongoDB...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="empty">
            {expenses.length === 0
              ? 'No expenses recorded in the platform yet.'
              : 'No expenses match the current search and filter criteria.'}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Owner</th>
                  <th scope="col">Title</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Category</th>
                  <th scope="col">Date</th>
                  <th scope="col">Description</th>
                  <th scope="col" className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => {
                  const owner = getOwnerInfo(expense.user);
                  const id = expense._id || expense.id;
                  return (
                    <tr key={id}>
                      <td className="owner-cell">
                        <div className="owner-name font-semibold">{owner.name}</div>
                        {owner.email && <div className="owner-email">{owner.email}</div>}
                      </td>
                      <td className="title-cell font-medium">
                        {expense.title}
                      </td>
                      <td className="amount-cell font-semibold">
                        {formatAmount(expense.amount)}
                      </td>
                      <td>
                        <span className="category-pill">{expense.category || 'Other'}</span>
                      </td>
                      <td className="date-cell">
                        {formatDate(expense.date)}
                      </td>
                      <td className="desc-cell" title={expense.description || ''}>
                        {expense.description ? (
                          expense.description.length > 35
                            ? `${expense.description.slice(0, 35)}...`
                            : expense.description
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="actions-cell text-right">
                        <div className="table-action-btns">
                          <button
                            type="button"
                            className="button-sm secondary"
                            onClick={() => setDetailExpense(expense)}
                            aria-label={`View details for ${expense.title}`}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="button-sm"
                            onClick={() => setEditingExpense(expense)}
                            disabled={saving}
                            aria-label={`Edit expense ${expense.title}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="button-sm danger"
                            onClick={() => handleAdminDelete(expense)}
                            disabled={saving}
                            aria-label={`Delete expense ${expense.title}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Detail Modal */}
      {detailExpense && (
        <ExpenseDetailModal
          expense={detailExpense}
          onClose={() => setDetailExpense(null)}
          onEdit={(exp) => {
            setDetailExpense(null);
            setEditingExpense(exp);
          }}
          onDelete={handleAdminDelete}
          disabled={saving}
        />
      )}

      {/* Edit Modal */}
      {editingExpense && (
        <AdminEditModal
          expense={editingExpense}
          onSave={handleAdminSave}
          onClose={() => setEditingExpense(null)}
          saving={saving}
        />
      )}
    </main>
  );
}
