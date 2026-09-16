import { useState } from 'react';
import { getSession } from '../api/auth';
import { inviteTeammate } from '../api/auth';

export default function Settings() {
  const session = getSession();
  const isAdmin = session?.user?.role === 'admin';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleInvite(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setInviting(true);
    try {
      const teammate = await inviteTeammate({ name, email, password, role });
      setSuccess(`${teammate.name} added as ${teammate.role}.`);
      setName('');
      setEmail('');
      setPassword('');
      setRole('member');
    } catch (err) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold text-ink tracking-tight mb-2">Settings</h1>

      <div className="border border-line rounded-xl p-5 bg-white mb-6 shadow-[0_1px_2px_rgba(20,23,31,0.04)]">
        <div className="text-sm font-semibold text-ink mb-3">Your account</div>
        <div className="text-sm space-y-1.5">
          <div className="flex justify-between"><span className="text-muted">Name</span><span className="text-ink font-medium">{session?.user?.name}</span></div>
          <div className="flex justify-between"><span className="text-muted">Email</span><span className="text-ink font-medium">{session?.user?.email}</span></div>
          <div className="flex justify-between"><span className="text-muted">Role</span><span className="text-ink font-medium capitalize">{session?.user?.role}</span></div>
          <div className="flex justify-between"><span className="text-muted">Company</span><span className="text-ink font-medium">{session?.company?.name}</span></div>
        </div>
      </div>

      {isAdmin ? (
        <div className="border border-line rounded-xl p-5 bg-white shadow-[0_1px_2px_rgba(20,23,31,0.04)]">
          <div className="text-sm font-semibold text-ink mb-1">Add a teammate</div>
          <p className="text-xs text-muted mb-4">
            Only admins can add team members. Roles matter once approval workflows are in place — a
            manager will be able to review before an AI-drafted email sends.
          </p>
          <form onSubmit={handleInvite} className="space-y-3">
            <input
              required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-shadow"
            />
            <input
              required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-shadow"
            />
            <input
              required type="password" minLength={8} placeholder="Temporary password (8+ chars)" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-shadow"
            />
            <select
              value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-shadow"
            >
              <option value="member">Member</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            {error && <div className="text-sm text-danger">{error}</div>}
            {success && <div className="text-sm text-success">{success}</div>}
            <button
              type="submit" disabled={inviting}
              className="bg-navy text-white px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-navy-light transition-colors"
            >
              {inviting ? 'Adding…' : 'Add teammate'}
            </button>
          </form>
        </div>
      ) : (
        <div className="text-sm text-muted">Only admins can add team members.</div>
      )}
    </div>
  );
}
