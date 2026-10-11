import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { createExpense, deleteExpense, getExpenses, updateExpense } from './api/expenseApi.js';
import ExpenseForm from './components/ExpenseForm.jsx';
import ExpenseList from './components/ExpenseList.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('expenseTrackerUser'));
  } catch {
    return null;
  }
}

function getStoredToken() {
  return localStorage.getItem('expenseTrackerToken');
}

function saveAuth(token, user) {
  localStorage.setItem('expenseTrackerToken', token);
  localStorage.setItem('expenseTrackerUser', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('expenseTrackerToken');
  localStorage.removeItem('expenseTrackerUser');
}

async function authRequest(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

function ProtectedRoute({ children, user }) {
  const location = useLocation();

  if (!user || !getStoredToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function DashboardPage({ user, onLogout }) {
  const navigate = useNavigate();

  function handleLogout() {
    onLogout();
    navigate('/login');
  }

  return (
    <div className="page">
      <section className="card">
        <h1>Dashboard</h1>
        <p>Welcome, {user.name}</p>
        <p>{user.email}</p>
        <div className="button-row">
          <Link to="/expenses" className="button secondary">Manage expenses</Link>
          <button type="button" onClick={handleLogout}>Logout</button>
        </div>
      </section>
    </div>
  );
}

function ExpensesPage({ user, onLogout }) {
  const [expenses, setExpenses] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    getExpenses()
      .then((data) => {
        if (!cancelled) setExpenses(data);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function reloadExpenses() {
    setExpenses(await getExpenses());
  }

  async function handleSave(form) {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (selectedExpense) {
        const id = selectedExpense._id || selectedExpense.id;
        if (!id) {
          throw new Error('Invalid expense ID');
        }
        await updateExpense(id, form);
        setSuccess('Expense updated');
      } else {
        await createExpense(form);
        setSuccess('Expense added');
      }
      setSelectedExpense(null);
      await reloadExpenses();
      return true;
    } catch (saveError) {
      setError(saveError.message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!id) {
      setError('Invalid expense ID');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await deleteExpense(id);
      const selectedId = selectedExpense ? (selectedExpense._id || selectedExpense.id) : null;
      if (selectedId === id) setSelectedExpense(null);
      setSuccess('Expense deleted');
      await reloadExpenses();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    onLogout();
    navigate('/login');
  }

  return (
    <main className="container">
      <header className="page-header">
        <div>
          <h1>Expense Tracker</h1>
          <p>{user.name}</p>
        </div>
        <div className="button-row">
          <Link to="/dashboard" className="button secondary">Dashboard</Link>
          <button type="button" onClick={handleLogout}>Logout</button>
        </div>
      </header>
      {error && <p className="error" role="alert">{error}</p>}
      {success && <p className="success" role="status">{success}</p>}
      <ExpenseForm
        key={selectedExpense ? (selectedExpense._id || selectedExpense.id) : 'new'}
        selectedExpense={selectedExpense}
        onSave={handleSave}
        onCancel={() => setSelectedExpense(null)}
        saving={saving}
      />
      <h2>Expenses</h2>
      {loading ? <p>Loading...</p> : (
        <ExpenseList
          expenses={expenses}
          onEdit={(expense) => setSelectedExpense(expense)}
          onDelete={handleDelete}
          disabled={saving}
        />
      )}
    </main>
  );
}

function AuthPage({ mode, user, onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const isRegister = mode === 'register';

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data = await authRequest(`/auth/${mode}`, isRegister ? { name, email, password } : { email, password });
      saveAuth(data.token, data.user);
      onLogin(data.user);
      navigate('/dashboard');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <form className="card" onSubmit={handleSubmit}>
        <h1>{isRegister ? 'Create account' : 'Login'}</h1>
        {error && <p className="error" role="alert">{error}</p>}
        {isRegister && (
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} type="text" required />
          </label>
        )}
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Please wait...' : isRegister ? 'Create account' : 'Login'}
        </button>
        <p className="switch-link">
          {isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
          <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Login' : 'Register'}</Link>
        </p>
      </form>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(getStoredUser);

  function handleLogout() {
    clearAuth();
    setUser(null);
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="/login" element={<AuthPage mode="login" user={user} onLogin={setUser} />} />
      <Route path="/register" element={<AuthPage mode="register" user={user} onLogin={setUser} />} />
      <Route path="/dashboard" element={(
        <ProtectedRoute user={user}>
          <DashboardPage user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      )} />
      <Route path="/expenses" element={(
        <ProtectedRoute user={user}>
          <ExpensesPage user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      )} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default App;
