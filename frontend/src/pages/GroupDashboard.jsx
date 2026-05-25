import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ScoutLogo from '../components/ScoutLogo';

function smsTemplate(firstName) {
  return `Hej! Vi har märkt att ${firstName} inte har varit med på de senaste mötena. Vi saknar er och hoppas att allt är bra. Hör gärna av er om ni har frågor eller om ${firstName} vill sluta. Hälsningar, Scouterna i Mellerud`;
}

function displayPhone(phone) {
  if (!phone) return null;
  return phone.replace(/^(\+46)(\d{2})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4 $5');
}

function openScoutnetProfile(scoutnetId) {
  if (!scoutnetId) return;
  const confirmOpen = window.confirm("Öppna Scoutnet?");
  if (confirmOpen) {
    window.open(`https://www.scoutnet.se/organisation/user/${scoutnetId}`, '_blank');
  }
}

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
            <button onClick={onClose} className="w-full text-gray-400 hover:text-gray-600 text-sm py-2">
              Avbryt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    } Object.entries(attendanceSheet)
    finally {
      setLoading(false);
    }
  }

  async function fetchAttendanceForDate() {
    if (!groupName || !selectedDate) return;
    try {
      const res = await fetch(`/api/members/attendance-date?group=${encodeURIComponent(groupName)}&date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setAttendanceSheet(data);
      }
    } catch (e) {
      console.error(e);
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

  function handleCheckboxChange(memberId) {
    setAttendanceSheet(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  }

  // Funktion för att bocka i ALLA eller ur ALLA medlemmar på en gång
  function toggleSelectAll(checked) {
    const nextSheet = {};
    members.forEach(m => {
      nextSheet[m.id] = checked;
    });
    setAttendanceSheet(nextSheet);
  }

  // Kollar om ALLA är ikryssade i nuläget
  const isAllSelected = members.length > 0 && members.every(m => !!attendanceSheet[m.id]);

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
      load();
    } catch (e) {
      showToast('❌ Fel: ' + e.message);
    } finally {
      setSavingAttendance(false);
    }
  }

  function renderContactCell(m) {
    // 1. Kolla om scouten har ett eget mobilnummer registrerat
    if (m.scout_phone) {
      return (
        <div>
          <p className="text-xs font-semibold text-gray-500">Egen mobil</p>
          <a href={`tel:${m.scout_phone}`} className="text-xs text-scout-600 font-mono hover:underline">
            {displayPhone(m.scout_phone)}
          </a>
        </div>
      );
    }
    // 2. Om eget saknas, backa upp på Anhörig 1
    if (m.parent_name_1 || m.parent_phone) {
      return (
        <div>
          <p className="text-xs text-gray-600 truncate max-w-[120px] font-medium">{m.parent_name_1 || 'Anhörig 1'}</p>
          {m.parent_phone ? (
            <a href={`tel:${m.parent_phone}`} className="text-xs text-scout-600 font-mono hover:underline">
              {displayPhone(m.parent_phone)}
            </a>
          ) : (
            <span className="text-[10px] text-red-500 font-semibold bg-red-50 border border-red-100 px-1 rounded block w-max">Nummer saknas</span>
          )}
        </div>
      );
    }
    // 3. Om Anhörig 1 saknas, kolla Anhörig 2
    if (m.parent_name_2 || m.parent_phone_2) {
      return (
        <div>
          <p className="text-xs text-gray-600 truncate max-w-[120px] font-medium">{m.parent_name_2 || 'Anhörig 2'}</p>
          {m.parent_phone_2 ? (
            <a href={`tel:${m.parent_phone_2}`} className="text-xs text-scout-600 font-mono hover:underline">
              {displayPhone(m.parent_phone_2)}
            </a>
          ) : (
            <span className="text-[10px] text-red-500 font-semibold bg-red-50 border border-red-100 px-1 rounded block w-max">Nummer saknas</span>
          )}
        </div>
      );
    }
    // 4. Det finns inga uppgifter alls i systemet
    return (
      <span className="text-xs font-medium text-red-500 bg-red-50 border border-red-100 rounded px-1.5 py-0.5">
        ⚠️ Saknas helt i ScoutNet
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {smsTarget && (
        <SmsModal member={smsTarget} onClose={() => setSmsTarget(null)} onSent={handleSmsSent} />
      )}
      {showAnnouncement && (
        <AnnouncementModal groupName={groupName} onClose={() => setShowAnnouncement(false)} onPosted={() => { setShowAnnouncement(false); load(); }} />
      )}

      <header className="bg-scout-700 text-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-scout-200 hover:text-white p-1">←</button>
          <ScoutLogo size={28} white />
          <div>
            <h1 className="text-base font-bold leading-tight">{groupName}</h1>
            <p className="text-scout-200 text-xs">Melleruds Scoutkår</p>
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm rounded-2xl px-5 py-3 shadow-xl">
          {toast}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-6">
        {flagged.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Saknas från möten</h2>
            <div className="space-y-2">
              {flagged.map(m => (
                <div key={m.id} className="bg-white border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
                  <div className="min-w-0">
                    <p 
                      onClick={() => openScoutnetProfile(m.scoutnet_member_id)}
                      className="font-semibold text-gray-900 cursor-pointer hover:text-scout-700 hover:underline"
                    >
                      {m.first_name} {m.last_name} 🔗
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">Borta {m.consecutive_missed} möten i rad</p>
                  </div>
                  <button onClick={() => setSmsTarget(m)} className="bg-scout-700 text-white text-xs rounded-xl px-3.5 py-2 hover:bg-scout-800 font-medium">
                    Var är {m.first_name}?
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Alla medlemmar ({members.length})</h2>
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="text-xs font-medium focus:outline-none text-gray-700 px-2 py-1" />
              <button onClick={saveAttendance} disabled={savingAttendance || members.length === 0} className="bg-green-600 text-white text-xs rounded-lg px-3 py-1.5 hover:bg-green-700 font-semibold disabled:opacity-50 transition-colors">
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
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide w-16">
                      <input 
                        type="checkbox" 
                        checked={isAllSelected}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-scout-700 focus:ring-scout-500 cursor-pointer"
                        title="Markera / avmarkera alla medlemmar"
                      />
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Namn</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Kontakt</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Närvaro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {members.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-center">
                        <input type="checkbox" checked={!!attendanceSheet[m.id]} onChange={() => handleCheckboxChange(m.id)} className="w-5 h-5 rounded border-gray-300 text-scout-700 focus:ring-scout-500 cursor-pointer" />
                      </td>
                      <td className="px-4 py-3">
                        <p 
                          onClick={() => openScoutnetProfile(m.scoutnet_member_id)}
                          className="font-bold text-gray-900 cursor-pointer hover:text-scout-700 hover:underline inline-flex items-center gap-1"
                        >
                          {m.first_name} {m.last_name} <span className="text-gray-300 text-xs">🔗</span>
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {renderContactCell(m)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 tabular-nums text-xs">
                        {m.attended ?? 0}/{m.total_meetings ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Meddelanden</h2>
            <button onClick={() => setShowAnnouncement(true)} className="bg-scout-700 text-white text-xs rounded-xl px-3.5 py-2 hover:bg-scout-800 font-medium">+ Nytt</button>
          </div>
          {announcements.length === 0 ? (
            <p className="text-gray-400 text-sm">Inga meddelanden ännu.</p>
          ) : (
            <div className="space-y-2">
              {announcements.map(a => (
                <div key={a.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <p className="font-semibold text-gray-900 text-sm">{a.title}</p>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{a.body}</p>
                  <p className="text-xs text-gray-300 mt-2">{new Date(a.created_at).toLocaleDateString('sv-SE')}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
