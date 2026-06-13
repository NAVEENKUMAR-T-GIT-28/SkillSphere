import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDevAccounts, setShowDevAccounts] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(email, password);
      const role = userData.baseRole || userData.base_role;
      if (role === 'hod') {
        navigate('/hod/dashboard');
      } else if (role === 'faculty') {
        navigate('/faculty/queue');
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const devAccounts = [
    { email: 'student@skillsphere.dev', password: 'Password123', role: 'Student' },
    { email: 'faculty@skillsphere.dev', password: 'Password123', role: 'Faculty' },
    { email: 'hod@skillsphere.dev', password: 'Password123', role: 'HOD' },
    { email: 'admin@skillsphere.dev', password: 'Password123', role: 'Admin' },
  ];

  const fillDevAccount = (devEmail, devPassword) => {
    setEmail(devEmail);
    setPassword(devPassword);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">SkillSphere</h1>
          <p className="text-text-secondary">Student placement intelligence platform</p>
        </div>

        {/* Login Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Dev Accounts */}
        {import.meta.env.DEV && (
          <div className="mt-6">
            <button
              onClick={() => setShowDevAccounts(!showDevAccounts)}
              className="text-sm text-primary hover:underline w-full text-center"
            >
              {showDevAccounts ? 'Hide' : 'Show'} dev accounts
            </button>

            {showDevAccounts && (
              <div className="mt-4 space-y-2">
                {devAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => fillDevAccount(acc.email, acc.password)}
                    className="w-full card-compact hover:bg-gray-50 transition-colors text-left text-sm"
                  >
                    <p className="font-medium text-text-primary">{acc.role}</p>
                    <p className="text-text-muted text-xs">{acc.email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
