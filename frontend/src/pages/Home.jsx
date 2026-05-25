import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScoutLogo from '../components/ScoutLogo';

// Map age categories to branding themes
function getGroupBadgeMeta(groupName) {
  const normalized = groupName.toLowerCase();
  if (normalized.includes('familj')) return { bg: 'bg-orange-100 text-orange-800 border-orange-200', icon: '⛺' };
  if (normalized.includes('spår')) return { bg: 'bg-green-100 text-green-800 border-green-200', icon: '🌱' };
  if (normalized.includes('upptäck')) return { bg: 'bg-blue-100 text-blue-800 border-blue-200', icon: '🧭' };
  if (normalized.includes('äventyr')) return { bg: 'bg-purple-100 text-purple-800 border-purple-200', icon: '🧗' };
  if (normalized.includes('utman')) return { bg: 'bg-pink-100 text-pink-800 border-pink-200', icon: '🔥' };
  if (normalized.includes('rover')) return { bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: '🌍' };
  return { bg: 'bg-gray-100 text-gray-800 border-gray-200', icon: '⚜️' };
}

export default function Home() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function loadGroups() {
    try {
      // Endpoint filters groups implicitly on active configuration mappings
      const res = await fetch('/api/members/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGroups();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-scout-700 text-white shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ScoutLogo size={32} white />
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none">Närvarokollen</h1>
              <p className="text-scout-200 text-xs mt-0.5">Melleruds Scoutkår</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/admin')}
            className="text-xs bg-scout-600 border border-scout-500 hover:bg-scout-500 px-3 py-1.5 rounded-xl font-bold transition-all"
          >
            Inställningar ⚙️
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Dina Avdelningar</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-scout-200 border-t-scout-700 rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white border rounded-2xl p-8 text-center text-gray-500 text-sm">
            Inga aktiva avdelningar hittades. Gå till inställningar för att aktivera åldersgrupper eller ladda upp medlemmar.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {groups.map(group => {
              const meta = getGroupBadgeMeta(group);
              return (
                <button
                  key={group}
                  onClick={() => navigate(`/group/${encodeURIComponent(group)}`)}
                  className="bg-white border border-gray-100 hover:border-scout-300 rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{meta.icon}</span>
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-scout-700 transition-colors">{group}</h3>
                      <span className={`inline-block text-[10px] uppercase tracking-wide font-extrabold px-2 py-0.5 mt-1 rounded-md border ${meta.bg}`}>
                        Programgrupp
                      </span>
                    </div>
                  </div>
                  <span className="text-gray-300 group-hover:text-scout-600 transition-colors text-lg font-bold">→</span>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
