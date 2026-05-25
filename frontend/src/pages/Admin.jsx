import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ScoutLogo from '../components/ScoutLogo';

export default function Admin() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [importType, setImportType] = useState('excel');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [ageConfigs, setAgeConfigs] = useState([]);

  // Fetch visibility preferences
  async function fetchConfigs() {
    try {
      const res = await fetch('/api/members/age-configs');
      if (res.ok) {
        const data = await res.json();
        setAgeConfigs(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function toggleAgeGroup(groupName, currentStatus) {
    try {
      const res = await fetch('/api/members/age-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_name: groupName, is_active: currentStatus ? 0 : 1 })
      });
      if (res.ok) {
        fetchConfigs();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = importType === 'excel' ? '/api/import/excel' : '/api/import/csv';
      const res = await fetch(endpoint, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Importen misslyckades');
      setMessage(`✓ Klart! Importerade ${data.count || 0} medlemmar.`);
    } catch (err) {
      setMessage(`❌ Fel: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-scout-700 text-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-scout-200 hover:text-white font-medium">← Dashboard</button>
          <ScoutLogo size={24} white />
          <h1 className="text-base font-bold">Kår-Administration</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* SECTION 1: AGE GROUP FILTERS */}
        <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2">Aktiva Åldersgrupper</h2>
          <p className="text-xs text-gray-500 mb-4">
            Bocka ur de grupper som inte ska synas eller delta i den dagliga närvarorapporteringen (t.ex. bebisar, äldre passiva eller supportrar).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ageConfigs.map(cfg => (
              <label key={cfg.group_name} className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-800">{cfg.group_name}</span>
                </div>
                <input
                  type="checkbox"
                  checked={cfg.is_active === 1}
                  onChange={() => toggleAgeGroup(cfg.group_name, cfg.is_active === 1)}
                  className="w-5 h-5 rounded text-scout-700 focus:ring-scout-500 border-gray-300"
                />
              </label>
            ))}
          </div>
        </section>

        {/* SECTION 2: FILE IMPORT */}
        <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Importera Medlemsdata</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Formattyp</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                  <input type="radio" checked={importType === 'excel'} onChange={() => setImportType('excel')} className="text-scout-700 focus:ring-scout-500" />
                  Excel-fil (.xlsx)
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                  <input type="radio" checked={importType === 'csv'} onChange={() => setImportType('csv')} className="text-scout-700 focus:ring-scout-500" />
                  ScoutNet CSV-export
                </label>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-scout-400 transition-colors">
              <input type="file" onChange={e => setFile(e.target.files[0])} accept={importType === 'excel' ? '.xlsx' : '.csv'} className="text-xs text-gray-500 block w-full mx-auto" />
            </div>

            {message && <p className="text-sm font-medium">{message}</p>}

            <button type="submit" disabled={loading || !file} className="w-full bg-scout-700 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-scout-800 disabled:opacity-40 transition-colors">
              {loading ? 'Importerar...' : 'Kör Import'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
