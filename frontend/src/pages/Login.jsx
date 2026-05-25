import { useState } from 'react';
import ScoutLogo from '../components/ScoutLogo';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fel lösenord');
      onLogin();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-scout-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <ScoutLogo size={64} className="mb-4" />
          <h1 className="text-2xl font-bold text-scout-900">Scouterna Mellerud</h1>
          <p className="text-scout-600 text-sm mt-1">Ledarverktyg</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-scout-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lösenord
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Ange ledarnas lösenord"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-scout-400 focus:border-transparent"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-scout-700 text-white rounded-xl py-3 font-semibold text-base hover:bg-scout-800 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>
        </form>

        <p className="text-center text-xs text-scout-400 mt-6">
          Melleruds Scoutkår · Kårens interna app
        </p>
      </div>
    </div>
  );
}
