import { useNavigate } from 'react-router-dom';

const GROUPS = [
  { name: 'baver', label: 'Bäver', emoji: '🦫', ages: '6–8 år' },
  { name: 'spejare', label: 'Spejare', emoji: '🔭', ages: '10–12 år' },
  { name: 'aventyrare', label: 'Äventyrare', emoji: '🏕️', ages: '12–15 år' },
  { name: 'rovare', label: 'Rovare', emoji: '⚜️', ages: '15–18 år' },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-green-900">Scouterna i Mellerud</h1>
        <p className="text-green-700 mt-2">Välj din grupp för att se närvaro och meddelanden</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
        {GROUPS.map(g => (
          <button
            key={g.name}
            onClick={() => navigate(`/group/${g.name}`)}
            className="bg-white border-2 border-green-200 rounded-2xl p-6 text-left hover:border-green-500 hover:shadow-md transition-all active:scale-95"
          >
            <div className="text-4xl mb-2">{g.emoji}</div>
            <div className="text-xl font-semibold text-green-900">{g.label}</div>
            <div className="text-sm text-green-600 mt-1">{g.ages}</div>
          </button>
        ))}
      </div>

      <button
        onClick={() => navigate('/admin')}
        className="mt-10 text-sm text-green-600 underline hover:text-green-800"
      >
        Adminpanel
      </button>
    </div>
  );
}
