import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScoutLogo from '../components/ScoutLogo';

export default function Admin() {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState([]);
  const [lastImportDate, setLastImportDate] = useState(null);
  const [file, setFile] = useState(null);
  const [importType, setImportType] = useState('csv');
  const [importing, setImporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  async function loadAdminData() {
    try {
      const configRes = await fetch('/api/members/age-configs');
      if (configRes.ok) {
        const data = await configRes.json();
        setConfigs(data);
      }

      const statusRes = await fetch('/api/members/import-status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setLastImportDate(statusData.last_import);
      }
    } catch (e) {
      console.error('Kunde inte läsa in administrativ data', e);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function toggleGroup(groupName, currentStatus) {
    const nextStatus = currentStatus === 1 ? 0 : 1;
    setConfigs(prev => prev.map(c => c.group_name === groupName ? { ...c, is_active: nextStatus } : c));

    try {
      await fetch('/api/members/age-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_name: groupName, is_active: nextStatus }),
      });
    } catch (e) {
      console.error(e);
    }
  }

  async function handleImportSubmit(e) {
    e.preventDefault();
    if (!file) return;

    setImporting(true);
    setStatusMsg('');
    
    const formData = new FormData();
    formData.append('file', file);

    const endpoint = importType === 'excel' ? '/api/import/excel' : '/api/import/csv';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(`✓ Lyckades! Importerade/uppdaterade ${data.count || 0} medlemmar framgångsrikt.`);
        setFile(null);
        loadAdminData();
      } else {
        setStatusMsg(`❌ Fel vid import: ${data.error || 'Okänt fel'}`);
      }
    } catch (err) {
      setStatusMsg(`❌ Kommunikationsfel: ${err.message}`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-scout-700 text-white shadow-md">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-scout-200 hover:text-white p-1 text-lg">←</button>
          <ScoutLogo size={28} white />
          <div>
            <h1 className="text-base font-bold leading-tight">Inställningar</h1>
            <p className="text-scout-200 text-xs">Konfigurera din kår-applikation</p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
        
        {/* Sektion 1: Filtrera kårens verkliga avdelningar */}
        <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-1">Synliga avdelningar i kåren</h2>
          <p className="text-xs text-gray-400 mb-4">Här visas de avdelningar som hittades i din medlemsfil. Bocka ur de du vill dölja från startsidan.</p>
          
          {configs.length === 0 ? (
            <p className="text-xs text-gray-400 italic bg-gray-50 border rounded-xl p-4 text-center">Inga avdelningar inlästa ännu. Ladda upp en medlemsfil nedan.</p>
          ) : (
            <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden bg-white shadow-inner max-h-64 overflow-y-auto">
              {configs.map(c => (
                <label key={c.group_name} className="flex items-center justify-between p-3.5 hover:bg-gray-50 cursor-pointer transition-colors">
                  <span className="text-sm font-medium text-gray-700">{c.group_name}</span>
                  <input
                    type="checkbox"
                    checked={c.is_active === 1}
                    onChange={() => toggleGroup(c.group_name, c.is_active)}
                    className="w-5 h-5 rounded border-gray-300 text-scout-700 focus:ring-scout-500 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          )}
        </section>

        {/* Sektion 2: Filimport */}
        <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-1">Synkronisera ScoutNet</h2>
          <p className="text-xs text-gray-400 mb-4">Ladda upp kårens senaste medlemsregister för att hålla listan uppdaterad.</p>
          
          <form onSubmit={handleImportSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Filformat</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImportType('csv')}
                  className={`py-2 px-3 border text-xs font-semibold rounded-xl transition-all ${
                    importType === 'csv' ? 'border-scout-600 bg-scout-50 text-scout-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  ScoutNet CSV-export (.csv)
                </button>
                <button
                  type="button"
                  onClick={() => setImportType('excel')}
                  className={`py-2 px-3 border text-xs font-semibold rounded-xl transition-all ${
                    importType === 'excel' ? 'border-scout-600 bg-scout-50 text-scout-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Excel-ark (.xlsx)
                </button>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors relative">
              <input
                type="file"
                accept={importType === 'excel' ? '.xlsx' : '.csv'}
                onChange={e => setFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <span className="text-2xl block mb-1">📁</span>
              <p className="text-xs font-medium text-gray-700 truncate">
                {file ? file.name : `Klicka för att välja din ${importType.toUpperCase()}-fil`}
              </p>
            </div>

            {statusMsg && (
              <p className="text-xs font-medium bg-gray-50 border border-gray-100 rounded-xl p-3 text-gray-700 leading-relaxed">
                {statusMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={importing || !file}
              className="w-full bg-scout-700 text-white rounded-xl py-3 font-semibold text-sm hover:bg-scout-800 disabled:opacity-40 transition-all shadow-sm"
            >
              {importing ? 'Importerar medlemsdata...' : 'Kör Import 🚀'}
            </button>
          </form>
        </section>

        {/* Statusruta för senaste importen */}
        <div className="text-center bg-gray-100/70 border rounded-xl py-3 px-4">
          <p className="text-xs text-gray-500 font-medium">
            📅 Senaste ScoutNet-importen gjordes:{' '}
            <span className="font-bold text-gray-800">
              {lastImportDate ? new Date(lastImportDate).toLocaleString('sv-SE') : 'Aldrig kört'}
            </span>
          </p>
        </div>

      </main>
    </div>
  );
}
