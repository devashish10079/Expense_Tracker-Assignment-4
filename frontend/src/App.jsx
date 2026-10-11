import { useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getStoredUser = () => {
  const savedUser = localStorage.getItem('expenseTrackerUser');

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch (error) {
    return null;
  }
};

const getStoredToken = () => localStorage.getItem('expenseTrackerToken');

const saveAuth = (token, user) => {
  localStorage.setItem('expenseTrackerToken', token);
  localStorage.setItem('expenseTrackerUser', JSON.stringify(user));
};

const clearAuth = () => {
  localStorage.removeItem('expenseTrackerToken');
  localStorage.removeItem('expenseTrackerUser');
};

const authRequest = async (path, method = 'GET', body = null) => {
  const token = getStoredToken();
  const headers = { 'Content-Type': 'application/json' };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  const data = await response.json().catch(() => ({ message: 'Request failed' }));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

const ProtectedRoute = ({ children }) => {
  const user = getStoredUser();
  const token = getStoredToken();
  const location = useLocation();

  if (!user || !token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

const DashboardPage = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="page">
      <div className="card">
        <h1>Dashboard</h1>
        <p>Welcome, {user.name}</p>
        <p>{user.email}</p>
        <div className="button-row">
          <Link to="/expenses" className="button secondary">Expenses</Link>
          <button type="button" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </div>
  );
};

const ExpensesPage = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="page">
      <div className="card">
        <h1>Expense Tracker</h1>
        <p>{user.name}, your expense management page is ready.</p>
        <div className="button-row">
          <Link to="/dashboard" className="button secondary">Dashboard</Link>
          <button type="button" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </div>
  );
};

const LoginPage = ({ onLogin, user }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const data = await authRequest('/auth/login', 'POST', { email, password });
      saveAuth(data.token, data.user);
      onLogin(data.user);
      navigate('/dashboard');
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <div className="page">
      <form className="card" onSubmit={handleSubmit}>
        <h1>Login</h1>
        {error && <p className="error">{error}</p>}
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        <button type="submit">Login</button>
        <p className="switch-link">
          Need an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
};

const RegisterPage = ({ onLogin, user }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const data = await authRequest('/auth/register', 'POST', { name, email, password });
      saveAuth(data.token, data.user);
      onLogin(data.user);
      navigate('/dashboard');
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <div className="page">
      <form className="card" onSubmit={handleSubmit}>
        <h1>Register</h1>
        {error && <p className="error">{error}</p>}
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} type="text" required />
        </label>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        <button type="submit">Create account</button>
        <p className="switch-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(getStoredUser());

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage onLogin={handleLogin} user={user} />} />
      <Route path="/register" element={<RegisterPage onLogin={handleLogin} user={user} />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage user={user} onLogout={handleLogout} /></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute><ExpensesPage user={user} onLogout={handleLogout} /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
};

export default App;
