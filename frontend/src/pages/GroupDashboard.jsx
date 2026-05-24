import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const GROUP_LABELS = {
  baver: 'Bäver',
  spejare: 'Spejare',
  aventyrare: 'Äventyrare',
  rovare: 'Rovare',
};

function SmsModal({ member, onClose, onSent }) {
  const template = `Hej! Vi har märkt att ${member.first_name} inte har varit med på de senaste mötena. Vi saknar er och undrar om allt är okej. Hör gärna av er till oss om ni har frågor eller om ${member.first_name} vill sluta. Hälsningar, Scouterna i Mellerud`;
  const [phone, setPhone] = useState(member.parent_phone || '');
  const [message, setMessage] = useState(template);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function send() {
    if (!phone) return setError('Ange ett telefonnummer');
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id, phone, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fel vid sändning');
      onSent();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Skicka SMS till {member.first_name}s förälder
        </h2>
        <label className="block text-sm font-medium text-gray-700 mb-1">Telefonnummer</label>
        <input
          className="w-full border rounded-lg p-2 mb-4 text-sm"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+46701234567"
        />
        <label className="block text-sm font-medium text-gray-700 mb-1">Meddelande</label>
        <textarea
          className="w-full border rounded-lg p-2 mb-4 text-sm h-32 resize-none"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={send}
            disabled={sending}
            className="flex-1 bg-green-600 text-white rounded-lg py-2 font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {sending ? 'Skickar...' : 'Skicka SMS'}
          </button>
          <button
            onClick={onClose}
            className="px-4 border rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Avbryt
          </button>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Nytt meddelande</h2>
        <input
          className="w-full border rounded-lg p-2 mb-3 text-sm"
          placeholder="Titel"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          className="w-full border rounded-lg p-2 mb-4 text-sm h-28 resize-none"
          placeholder="Skriv meddelandet här..."
          value={body}
          onChange={e => setBody(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={post}
            disabled={saving}
            className="flex-1 bg-green-600 text-white rounded-lg py-2 font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Sparar...' : 'Publicera'}
          </button>
          <button onClick={onClose} className="px-4 border rounded-lg text-gray-600 hover:bg-gray-50">
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
  const label = GROUP_LABELS[groupName] || groupName;

  const [flagged, setFlagged] = useState([]);
  const [members, setMembers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [smsTarget, setSmsTarget] = useState(null);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [fRes, mRes, aRes] = await Promise.all([
        fetch(`/api/members/flagged?group=${groupName}`),
        fetch(`/api/members?group=${groupName}`),
        fetch(`/api/announcements?group=${groupName}`),
      ]);
      setFlagged(await fRes.json());
      setMembers(await mRes.json());
      setAnnouncements(await aRes.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [groupName]);

  function handleSmsSent() {
    setSmsTarget(null);
    setSmsSent(true);
    setTimeout(() => setSmsSent(false), 3000);
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
      <div className="bg-green-700 text-white px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-green-200 hover:text-white text-sm">
            ← Tillbaka
          </button>
          <h1 className="text-xl font-bold">{label}</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {smsSent && (
          <div className="bg-green-100 border border-green-300 text-green-800 rounded-lg p-3 text-sm">
            SMS skickades!
          </div>
        )}

        {/* Flagged members */}
        {flagged.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Behöver uppmärksamhet</h2>
            <div className="space-y-3">
              {flagged.map(m => (
                <div key={m.id} className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-red-900">{m.first_name} {m.last_name}</p>
                    <p className="text-sm text-red-600">
                      Missat {m.consecutive_missed} möten i rad
                    </p>
                  </div>
                  <button
                    onClick={() => setSmsTarget(m)}
                    className="bg-red-600 text-white text-sm rounded-lg px-3 py-2 hover:bg-red-700 shrink-0"
                  >
                    Skicka SMS
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Full attendance list */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Alla medlemmar</h2>
          {loading ? (
            <p className="text-gray-500 text-sm">Laddar...</p>
          ) : members.length === 0 ? (
            <p className="text-gray-500 text-sm">Inga medlemmar hittade. Importera data i adminpanelen.</p>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-600">Namn</th>
                    <th className="text-right p-3 font-medium text-gray-600">Närvaro</th>
                    <th className="text-right p-3 font-medium text-gray-600">Senast sedd</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">
                        {m.first_name} {m.last_name}
                      </td>
                      <td className="p-3 text-right text-gray-600">
                        {m.attended ?? 0}/{m.total_meetings ?? 0}
                      </td>
                      <td className="p-3 text-right text-gray-500">
                        {m.last_seen ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Announcements */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Meddelanden</h2>
            <button
              onClick={() => setShowAnnouncement(true)}
              className="bg-green-600 text-white text-sm rounded-lg px-3 py-2 hover:bg-green-700"
            >
              + Nytt meddelande
            </button>
          </div>
          {announcements.length === 0 ? (
            <p className="text-gray-500 text-sm">Inga meddelanden ännu.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="bg-white border rounded-xl p-4">
                  <p className="font-semibold text-gray-900">{a.title}</p>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{a.body}</p>
                  <p className="text-xs text-gray-400 mt-2">
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
