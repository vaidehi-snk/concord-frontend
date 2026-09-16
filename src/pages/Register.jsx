import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';

export default function Register() {
  const [companyName, setCompanyName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ companyName, name, email, password });
      navigate('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-7 h-7 rounded-md bg-navy flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
              <path d="M4 12L10 18L20 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-semibold text-lg text-ink tracking-tight">Concord</span>
        </div>

        <div className="bg-white border border-line rounded-xl p-7 shadow-[0_1px_2px_rgba(20,23,31,0.04)]">
          <h1 className="text-xl font-semibold text-ink mb-1">Create your account</h1>
          <p className="text-sm text-muted mb-6">You'll be the admin for your company's account — you can invite teammates after.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Company name</label>
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Your name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-shadow"
              />
              <div className="text-xs text-muted mt-1">At least 8 characters.</div>
            </div>
            {error && <div className="text-sm text-danger">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy text-white px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-navy-light transition-colors shadow-sm"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="text-sm text-muted text-center mt-5">
            Already have an account? <Link to="/login" className="text-navy font-medium hover:underline">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
