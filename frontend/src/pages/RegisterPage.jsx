import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', first_name: '', last_name: '', email: '', password: '', password_confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1400);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail && typeof detail === 'object') {
        setErrors(detail);
      } else {
        setErrors({ non_field: 'Registration failed. Please check your details.' });
      }
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="auth-subtitle">Customer accounts can raise and track support tickets.</p>

        {success && <div className="form-success-banner">Account created — redirecting to log in…</div>}
        {errors.non_field && <div className="form-error-banner">{errors.non_field}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field">
              <label htmlFor="first_name">First name</label>
              <input id="first_name" required value={form.first_name} onChange={update('first_name')} />
            </div>
            <div className="field">
              <label htmlFor="last_name">Last name</label>
              <input id="last_name" required value={form.last_name} onChange={update('last_name')} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="username">Username</label>
            <input id="username" required value={form.username} onChange={update('username')} />
            {errors.username && <div className="field-error">{errors.username[0]}</div>}
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={form.email} onChange={update('email')} />
            {errors.email && <div className="field-error">{errors.email[0]}</div>}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" required value={form.password} onChange={update('password')} />
            {errors.password && <div className="field-error">{errors.password[0]}</div>}
          </div>

          <div className="field">
            <label htmlFor="password_confirm">Confirm password</label>
            <input
              id="password_confirm" type="password" required
              value={form.password_confirm} onChange={update('password_confirm')}
            />
            {errors.password_confirm && <div className="field-error">{errors.password_confirm[0]}</div>}
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
