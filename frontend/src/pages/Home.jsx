import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScoutLogo from '../components/ScoutLogo';

// Svenska scouters programgrenar — ikoner och åldrar för kända avdelningsnamn
const GROUP_META = {
  'bävrar':        { icon: '🦫', ages: '6–8 år',   desc: 'Leka och utforska naturen' },
  'kornet':        { icon: '🌱', ages: '6–8 år',   desc: 'Första steget i scoutlivet' },
  'spårare':       { icon: '🔭', ages: '8–10 år',  desc: 'Spår och äventyr' },
  'spejare':       { icon: '🔭', ages: '10–12 år', desc: 'Äventyr och samarbete' },
  'upptäckare':    { icon: '🏕️', ages: '10–12 år', desc: 'Utforska och samarbeta' },
  'äventyrare':    { icon: '🧭', ages: '12–15 år', desc: 'Utforska världen' },
  'utmanare':      { icon: '🧗', ages: '15–19 år', desc: 'Utmana dig själv' },
  'utmanarna':     { icon: '🧗', ages: '15–19 år', desc: 'Utmana dig själv' },
  'rovare':        { icon: '⚜️', ages: '18+ år',   desc: 'Ledarskap och service' },
  'roverutmaning': { icon: '⚜️', ages: '18+ år',   desc: 'Samhällsengagemang' },
  'ledarna':       { icon: '🎖️', ages: 'Ledare',   desc: 'Kårens ledare' },
  'ledarbarn':     { icon: '👶', ages: 'Barn',      desc: 'Ledarnas barn' },
  'stödmedlemmar': { icon: '🤝', ages: 'Stöd',     desc: 'Stödmedlemmar' },
};

function groupMeta(name) {
  return GROUP_META[name.toLowerCase()] || { icon: '⚜️', ages: '', desc: '' };
}

export default function Home() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/members/groups')
      .then(r => r.json())
      .then(data => { setGroups(data); setLoading(false); })
      .catch(() => { setError('Kunde inte hämta grupper'); setLoading(false); });
  }, []);

  function handleLogout() {
    fetch('/api/auth/logout', { method: 'POST' }).then(() => window.location.reload());
  }

  return (
    <div className="min-h-screen bg-scout-50">
      {/* Header */}
      <header className="bg-scout-700 text-white">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ScoutLogo size={36} white />
            <div>
              <h1 className="text-lg font-bold leading-tight">Scouterna Mellerud</h1>
              <p className="text-scout-200 text-xs">34008 · Melleruds Scoutkår</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-scout-200 hover:text-white text-xs underline"
          >
            Logga ut
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-scout-800 text-sm mb-5 font-medium">Välj avdelning</p>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-scout-200 border-t-scout-600 rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
        )}

        {!loading && !error && groups.length === 0 && (
          <div className="bg-white rounded-2xl border border-scout-100 p-6 text-center">
            <p className="text-gray-500 text-sm">Inga avdelningar hittade.</p>
            <p className="text-gray-400 text-xs mt-1">
              Gå till adminpanelen och importera en Excel-fil från ScoutNet.
            </p>
            <button
              onClick={() => navigate('/admin')}
              className="mt-4 bg-scout-700 text-white rounded-xl px-5 py-2 text-sm font-medium hover:bg-scout-800"
            >
              Öppna adminpanel
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {groups.map(g => {
            const meta = groupMeta(g);
            return (
              <button
                key={g}
                onClick={() => navigate(`/group/${encodeURIComponent(g)}`)}
                className="bg-white border border-scout-100 rounded-2xl p-5 text-left hover:border-scout-400 hover:shadow-md transition-all active:scale-[0.98] group"
              >
                <div className="text-3xl mb-2">{meta.icon}</div>
                <div className="text-base font-semibold text-scout-900 group-hover:text-scout-700">
                  {g}
                </div>
                {meta.ages && (
                  <div className="text-xs text-scout-500 mt-0.5">{meta.ages}</div>
                )}
                {meta.desc && (
                  <div className="text-xs text-gray-400 mt-1">{meta.desc}</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Snabblänkar */}
        <div className="mt-8 border-t border-scout-100 pt-6 space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Snabblänkar</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href="https://www.scoutnet.se/f/login"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-scout-700 hover:text-scout-900 bg-white border border-scout-100 rounded-xl px-4 py-2.5 hover:border-scout-300 transition-colors"
            >
              <span>🌐</span> ScoutNet — Logga in
            </a>
            <a
              href="https://www.scoutnet.se/reports/groups/members"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-scout-700 hover:text-scout-900 bg-white border border-scout-100 rounded-xl px-4 py-2.5 hover:border-scout-300 transition-colors"
            >
              <span>📋</span> Hämta medlemslista
            </a>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/admin')}
            className="text-xs text-scout-400 hover:text-scout-700 underline"
          >
            Adminpanel
          </button>
        </div>
      </main>
    </div>
  );
}
