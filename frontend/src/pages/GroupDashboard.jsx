import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ScoutLogo from '../components/ScoutLogo';

// SMS-mall på svenska
function smsTemplate(firstName) {
  return `Hej! Vi har märkt att ${firstName} inte har varit med på de senaste mötena. Vi saknar er och hoppas att allt är bra. Hör gärna av er om ni har frågor eller om ${firstName} vill sluta. Hälsningar, Scouterna i Mellerud`;
}

// Formatera telefonnummer för visning
function displayPhone(phone) {
  if (!phone) return null;
  return phone.replace(/^(\+46)(\d{2})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4 $5');
}

// SMS-modal med två alternativ: 46elks API eller enhetens SMS-app
function SmsModal({ member, onClose, onSent }) {
  const [activeGuardian, setActiveGuardian] = useState(
    member.parent_phone ? 1 : member.parent_phone_2 ? 2 : 1
  );
  const [message, setMessage] = useState(smsTemplate(member.first_name));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const phone1 = member.parent_phone;
  const phone2 = member.parent_phone_2;
  const name1  = member.parent_name_1 || 'Anhörig 1';
  const name2  = member.parent_name_2 || 'Anhörig 2';

  const activePhone = useCustom ? customPhone : (activeGuardian === 1 ? phone1 : phone2);
  const hasPhone = !!activePhone;

  // SMS via 46elks API
  async function sendViaApi() {
    if (!hasPhone) return setError('Inget telefonnummer valt');
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id, phone: activePhone, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fel vid sändning');
      onSent('api');
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  // SMS via enhetens SMS-app (deeplink)
  function sendViaPhone() {
    if (!hasPhone) return setError('Inget telefonnummer valt');
    const encoded = encodeURIComponent(message);
    const to = activePhone.replace(/\s/g, '');
    window.location.href = `sms:${to}?body=${encoded}`;
    onSent('phone');
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">
              Kontakta angående {member.first_name}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Missat {member.consecutive_missed} möten i rad
          </p>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Välj anhörig */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Skicka till</p>
            <div className="space-y-2">
              {phone1 && (
                <button
                  onClick={() => { setActiveGuardian(1); setUseCustom(false); }}
                  className={`w-full text-left border rounded-xl px-4 py-3 transition-colors ${
                    activeGuardian === 1 && !useCustom
                      ? 'border-scout-500 bg-scout-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium text-sm text-gray-800">{name1}</span>
                  <span className="block text-xs text-gray-500 mt-0.5 font-mono">{displayPhone(phone1)}</span>
                </button>
              )}
              {phone2 && (
                <button
                  onClick={() => { setActiveGuardian(2); setUseCustom(false); }}
                  className={`w-full text-left border rounded-xl px-4 py-3 transition-colors ${
                    activeGuardian === 2 && !useCustom
                      ? 'border-scout-500 bg-scout-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium text-sm text-gray-800">{name2}</span>
                  <span className="block text-xs text-gray-500 mt-0.5 font-mono">{displayPhone(phone2)}</span>
                </button>
              )}
              {!phone1 && !phone2 && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  Inga telefonnummer sparade. Fyll i nedan eller importera från ScoutNet.
                </p>
              )}
              {/* Annat nummer */}
              <div>
                <button
                  onClick={() => setUseCustom(v => !v)}
                  className={`text-xs font-medium text-scout-600 hover:text-scout-800 ${useCustom ? 'underline' : ''}`}
                >
                  {useCustom ? '▾' : '▸'} Ange annat nummer
                </button>
                {useCustom && (
                  <input
                    className="mt-2 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-scout-400"
                    placeholder="+46701234567"
                    value={customPhone}
                    onChange={e => setCustomPhone(e.target.value)}
                    type="tel"
                    autoFocus
                  />
                )}
              </div>
            </div>
          </div>

          {/* Meddelandetext */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Meddelande</p>
            <textarea
              className="w-full border border-gray-300 rounded-xl p-3 text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-scout-400"
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">{message.length} tecken</p>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
          )}

          {/* Knappar */}
          <div className="space-y-2 pb-2">
            <button
              onClick={sendViaPhone}
              disabled={!hasPhone}
              className="w-full bg-scout-700 text-white rounded-xl py-3 font-semibold text-sm hover:bg-scout-800 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <span>📱</span> Skicka från min telefon
            </button>
            <button
              onClick={sendViaApi}
              disabled={sending || !hasPhone}
              className="w-full bg-white border border-scout-300 text-scout-700 rounded-xl py-3 font-semibold text-sm hover:bg-scout-50 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <span>⚡</span> {sending ? 'Skickar...' : 'Skicka via 46elks API'}
            </button>
            <button
              onClick={onClose}
              className="w-full text-gray-400 hover:text-gray-600 text-sm py-2"
            >
              Avbryt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal för nytt meddelande
function AnnouncementModal({ groupName, onClose, onPosted }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function post() {
    if (!title || !body) return setError('Fyll i titel och text');
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_name: groupName, title, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onPosted();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">Nytt meddelande</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <input
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-scout-400"
          placeholder="Titel"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm h-28 resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-scout-400"
          placeholder="Skriv meddelandet här..."
          value={body}
          onChange={e => setBody(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={post}
            disabled={saving}
            className="flex-1 bg-scout-700 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-scout-800 disabled:opacity-50"
          >
            {saving ? 'Sparar...' : 'Publicera'}
          </button>
          <button onClick={onClose} className="px-4 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 text-sm">
            Avbryt
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GroupDashboard() {
  const { groupName } = useParams();
  const navigate = useNavigate();

  const [flagged, setFlagged] = useState([]);
  const [members, setMembers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [smsTarget, setSmsTarget] = useState(null);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [toast, setToast] = useState('');

  // --- NYA STATE-VARIABLER FÖR MANUELL NÄRVARO ---
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceSheet, setAttendanceSheet] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [fRes, mRes, aRes] = await Promise.all([
        fetch(`/api/members/flagged?group=${encodeURIComponent(groupName)}`),
        fetch(`/api/members?group=${encodeURIComponent(groupName)}`),
        fetch(`/api/announcements?group=${encodeURIComponent(groupName)}`),
      ]);
      const flaggedData = await fRes.json();
      const membersData = await mRes.json();
      const announcementsData = await aRes.json();

      setFlagged(flaggedData);
      setMembers(membersData);
      setAnnouncements(announcementsData);
    } finally {
      setLoading(false);
    }
  }

  // Hämta sparat närvarodata när datum ändras
  async function fetchAttendanceForDate() {
    if (!groupName || !selectedDate) return;
    try {
      const res = await fetch(`/api/members/attendance-date?group=${encodeURIComponent(groupName)}&date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        // data förväntas vara ett objekt: { member_id: true/false }
        setAttendanceSheet(data);
      }
    } catch (e) {
      console.error("Fel vid hämtning av närvaro för datum:", e);
    }
  }

  useEffect(() => { load(); }, [groupName]);

  useEffect(() => {
    fetchAttendanceForDate();
  }, [selectedDate, members]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  function handleSmsSent(method) {
    setSmsTarget(null);
    showToast(method === 'api' ? '✓ SMS skickat via 46elks' : '📱 SMS-app öppnad');
  }

  // Ändra checkbox-status lokalt
  function handleCheckboxChange(memberId) {
    setAttendanceSheet(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  }

  // Spara närvaro till backend databasen
  async function saveAttendance() {
    setSavingAttendance(true);
    try {
      const res = await fetch('/api/members/attendance-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_name: groupName,
          date: selectedDate,
          attendance: attendanceSheet
        })
      });
      if (!res.ok) throw new Error('Kunde inte spara närvaro');
      showToast('✓ Närvarolistan har sparats!');
      load(); // Ladda om statistiken på skärmen
    } catch (e) {
      showToast('❌ Fel: ' + e.message);
    } finally {
      setSavingAttendance(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {smsTarget && (
        <SmsModal
          member={smsTarget}
          onClose={() => setSmsTarget(null)}
          onSent={handleSmsSent}
        />
      )}
      {showAnnouncement && (
        <AnnouncementModal
          groupName={groupName}
          onClose={() => setShowAnnouncement(false)}
          onPosted={() => { setShowAnnouncement(false); load(); }}
        />
      )}

      {/* Header */}
      <header className="bg-scout-700 text-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-scout-200 hover:text-white p-1"
            aria-label="Tillbaka"
          >
            ←
          </button>
          <ScoutLogo size={28} white />
          <div>
            <h1 className="text-base font-bold leading-tight">{groupName}</h1>
            <p className="text-scout-200 text-xs">Melleruds Scoutkår</p>
          </div>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm rounded-2xl px-5 py-3 shadow-xl">
          {toast}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-6">

        {/* Flaggade — behöver uppmärksamhet */}
        {flagged.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Saknas från möten
            </h2>
            <div className="space-y-2">
              {flagged.map(m => (
                <div
                  key={m.id}
                  className="bg-white border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{m.first_name} {m.last_name}</p>
                    <p className="text-xs text-red-600 mt-0.5">
                      Borta {m.consecutive_missed} möten i rad
                    </p>
                    {(m.parent_name_1 || m.parent_phone) && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {m.parent_name_1 && <span>{m.parent_name_1} · </span>}
                        {m.parent_phone && <span className="font-mono">{displayPhone(m.parent_phone)}</span>}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSmsTarget(m)}
                    className="bg-scout-700 text-white text-xs rounded-xl px-3.5 py-2 hover:bg-scout-800 active:scale-95 transition-all shrink-0 font-medium"
                  >
                    Var är {m.first_name}?
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Alla medlemmar & Närvarohantering */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Alla medlemmar ({members.length})
            </h2>
            
            {/* NYTT: DATUMVÄLJARE OCH SPARA-KNAPP */}
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-medium focus:outline-none text-gray-700 px-2 py-1"
              />
              <button
                onClick={saveAttendance}
                disabled={savingAttendance || members.length === 0}
                className="bg-green-600 text-white text-xs rounded-lg px-3 py-1.5 hover:bg-green-700 font-semibold disabled:opacity-50 transition-colors"
              >
                {savingAttendance ? 'Sparar...' : 'Spara närvaro'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-scout-200 border-t-scout-600 rounded-full animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="bg-white rounded-2xl border p-5 text-center">
              <p className="text-gray-500 text-sm">Inga medlemmar i denna avdelning.</p>
              <p className="text-gray-400 text-xs mt-1">Importera Excel-fil i adminpanelen.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {/* NYTT: KOLUMN FÖR CHECKBOX */}
                    <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide w-16">Här</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Namn</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden sm:table-cell">Kontakt</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Närvaro</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden sm:table-cell">Senast</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {members.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      {/* NYTT: CHECKBOX CELL */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={!!attendanceSheet[m.id]}
                          onChange={() => handleCheckboxChange(m.id)}
                          className="w-5 h-5 rounded border-gray-300 text-scout-700 focus:ring-scout-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{m.first_name} {m.last_name}</p>
                        {/* Visa kontakt på mobil */}
                        {(m.parent_name_1 || m.parent_phone) && (
                          <p className="text-xs text-gray-400 mt-0.5 sm:hidden truncate">
                            {m.parent_name_1 || displayPhone(m.parent_phone)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {m.parent_phone ? (
                          <div>
                            {m.parent_name_1 && <p className="text-xs text-gray-600">{m.parent_name_1}</p>}
                            <a
                              href={`tel:${m.parent_phone}`}
                              className="text-xs text-scout-600 font-mono hover:underline"
                            >
                              {displayPhone(m.parent_phone)}
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 tabular-nums text-xs">
                        {m.attended ?? 0}/{m.total_meetings ?? 0}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 text-xs hidden sm:table-cell">
                        {m.last_seen ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Meddelanden */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Meddelanden
            </h2>
            <button
              onClick={() => setShowAnnouncement(true)}
              className="bg-scout-700 text-white text-xs rounded-xl px-3.5 py-2 hover:bg-scout-800 font-medium"
            >
              + Nytt
            </button>
          </div>
          {announcements.length === 0 ? (
            <p className="text-gray-400 text-sm">Inga medmeldanden ännu.</p>
          ) : (
            <div className="space-y-2">
              {announcements.map(a => (
                <div key={a.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <p className="font-semibold text-gray-900 text-sm">{a.title}</p>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{a.body}</p>
                  <p className="text-xs text-gray-300 mt-2">
                    {new Date(a.created_at).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
