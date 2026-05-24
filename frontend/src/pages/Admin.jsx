import { useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';

export default function Admin() {
  const navigate = useNavigate();
  const csvRef = useRef();
  const reportRef = useRef();
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');

  function resetMessages() { setStatus(''); setError(''); }

  async function triggerScrape() {
    resetMessages();
    setLoading('scrape');
    try {
      const res = await fetch('/api/import/trigger', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(`Importerade ${data.imported} poster, hoppade över ${data.skipped}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading('');
    }
  }

  async function uploadCsv(e) {
    const file = e.target.files[0];
    if (!file) return;
    resetMessages();
    setLoading('upload');
    const form = new FormData();
    form.append('csv', file);
    try {
      const res = await fetch('/api/import/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(`Importerade ${data.imported} poster, hoppade över ${data.skipped}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading('');
      e.target.value = '';
    }
  }

  async function generateReport(e) {
    const file = e.target.files[0];
    if (!file) return;
    resetMessages();
    setLoading('report');
    const form = new FormData();
    form.append('csv', file);
    try {
      const res = await fetch('/api/report/generate', { method: 'POST', body: form });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'narvaro-rapport.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      setStatus('Rapport genererad och nedladdad.');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading('');
      e.target.value = '';
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-700 text-white px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-green-200 hover:text-white text-sm">
            ← Tillbaka
          </button>
          <h1 className="text-xl font-bold">Adminpanel</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {status && (
          <div className="bg-green-100 border border-green-300 text-green-800 rounded-lg p-3 text-sm">
            {status}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-800 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {/* Scraper */}
        <div className="bg-white border rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Hämta data från ScalpNet</h2>
          <p className="text-sm text-gray-500 mb-4">
            Loggar in automatiskt och laddar ned senaste närvarodatan.
          </p>
          <button
            onClick={triggerScrape}
            disabled={!!loading}
            className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading === 'scrape' ? 'Hämtar...' : 'Hämta data'}
          </button>
        </div>

        {/* Manual CSV */}
        <div className="bg-white border rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Ladda upp CSV manuellt</h2>
          <p className="text-sm text-gray-500 mb-4">
            Om automatisk hämtning inte fungerar, ladda upp en CSV-fil från ScalpNet manuellt.
            Förväntade kolumner: Förnamn, Efternamn, Grupp, Datum, Närvarande
          </p>
          <input
            ref={csvRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={uploadCsv}
          />
          <button
            onClick={() => csvRef.current.click()}
            disabled={!!loading}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading === 'upload' ? 'Importerar...' : 'Välj CSV-fil'}
          </button>
        </div>

        {/* Municipal report */}
        <div className="bg-white border rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Generera kommunrapport</h2>
          <p className="text-sm text-gray-500 mb-4">
            Ladda upp en berikad CSV-fil från ScalpNet (med personnummer m.m.) för att generera
            en komplett närvaro-Excel-rapport.
          </p>
          <input
            ref={reportRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={generateReport}
          />
          <button
            onClick={() => reportRef.current.click()}
            disabled={!!loading}
            className="bg-orange-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
          >
            {loading === 'report' ? 'Genererar...' : 'Välj CSV och generera rapport'}
          </button>
        </div>
      </div>
    </div>
  );
}
