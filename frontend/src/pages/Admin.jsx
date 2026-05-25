import { useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import ScoutLogo from '../components/ScoutLogo';

export default function Admin() {
  const navigate = useNavigate();
  const excelRef = useRef();
  const reportRef = useRef();
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');

  function resetMessages() { setStatus(''); setError(''); }

  // Importera Excel-fil (Kår Medlemslista från ScoutNet)
  async function uploadExcel(e) {
    const file = e.target.files[0];
    if (!file) return;
    resetMessages();
    setLoading('excel');
    const form = new FormData();
    form.append('excel', file);
    try {
      const res = await fetch('/api/import/excel', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(`✓ Importerade ${data.imported} medlemmar. Filen raderades direkt från servern (GDPR).`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading('');
      e.target.value = '';
    }
  }

  // Generera kommunrapport
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
      setStatus('✓ Rapport genererad och nedladdad.');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading('');
      e.target.value = '';
    }
  }

  function handleLogout() {
    fetch('/api/auth/logout', { method: 'POST' }).then(() => window.location.reload());
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-scout-700 text-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-scout-200 hover:text-white p-1" aria-label="Tillbaka">
            ←
          </button>
          <ScoutLogo size={28} white />
          <div className="flex-1">
            <h1 className="text-base font-bold leading-tight">Adminpanel</h1>
            <p className="text-scout-200 text-xs">Melleruds Scoutkår</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-scout-200 hover:text-white text-xs underline"
          >
            Logga ut
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {status && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-4 text-sm">
            {status}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-sm">
            {error}
          </div>
        )}

        {/* Steg 1: Hämta från ScoutNet */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <span className="bg-scout-100 text-scout-700 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Hämta medlemslista från ScoutNet</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Logga in på ScoutNet, gå till Kår Medlemslista och ladda ned Excel-filen.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 ml-10">
            <a
              href="https://www.scoutnet.se/f/login"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 text-sm font-medium text-scout-700 bg-scout-50 border border-scout-200 rounded-xl px-4 py-2.5 hover:bg-scout-100 transition-colors"
            >
              🌐 Logga in på ScoutNet
            </a>
            <a
              href="https://www.scoutnet.se/reports/groups/members"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 text-sm font-medium text-scout-700 bg-scout-50 border border-scout-200 rounded-xl px-4 py-2.5 hover:bg-scout-100 transition-colors"
            >
              📋 Kår Medlemslista
            </a>
          </div>
        </div>

        {/* Steg 2: Ladda upp Excel */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <span className="bg-scout-100 text-scout-700 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Importera Excel-filen</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Välj .xlsx-filen du laddade ned. Appen läser ut namn, avdelning och anhörigas telefonnummer.
                <strong className="block mt-1 text-gray-600">Personnummer och annan känslig data ignoreras och filen raderas omedelbart efter import.</strong>
              </p>
            </div>
          </div>
          <div className="ml-10">
            <input ref={excelRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={uploadExcel} />
            <button
              onClick={() => excelRef.current.click()}
              disabled={!!loading}
              className="flex items-center gap-2 bg-scout-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-scout-800 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading === 'excel' ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Importerar...
                </>
              ) : (
                <>📂 Välj Excel-fil (.xlsx)</>
              )}
            </button>
          </div>
        </div>

        {/* Kommunrapport */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <span className="bg-gray-100 text-gray-500 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">☆</span>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Generera kommunrapport</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Ladda upp en berikad Excel-fil från ScoutNet (med personnummer m.m.) för att generera
                en komplett närvaro-Excel-rapport till kommunen. Filen raderas efter generering.
              </p>
            </div>
          </div>
          <div className="ml-10">
            <input ref={reportRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={generateReport} />
            <button
              onClick={() => reportRef.current.click()}
              disabled={!!loading}
              className="flex items-center gap-2 bg-gray-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-gray-700 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading === 'report' ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Genererar...
                </>
              ) : (
                <>📊 Generera kommunrapport</>
              )}
            </button>
          </div>
        </div>

        {/* Info-ruta */}
        <div className="bg-scout-50 border border-scout-100 rounded-2xl p-4 text-xs text-scout-700 space-y-1">
          <p className="font-semibold">Om dataskydd (GDPR)</p>
          <p>Appen lagrar bara förnamn, efternamn, avdelning och anhörigas telefonnummer lokalt i databasen.</p>
          <p>Personnummer, kön, adress och e-post läses aldrig in. Uppladdade filer raderas omedelbart efter bearbetning.</p>
        </div>
      </div>
    </div>
  );
}
