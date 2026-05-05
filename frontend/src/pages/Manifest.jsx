import { useEffect, useMemo, useState } from 'react';
import { parentsAPI, vehiclesAPI, schoolsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';

const todayDate = () => new Date().toISOString().slice(0, 10);
const todayLabel = () => new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const nowTime = () => new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });

const CHECKIN_KEY = () => `manifest_ci_${todayDate()}`;
const NOTIFIED_KEY = () => `manifest_nt_${todayDate()}`;

const readLS = (key) => { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } };
const writeLS = (key, val) => localStorage.setItem(key, JSON.stringify(val));

const formatPhone = (phone) => {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('254')) return clean;
  if (clean.startsWith('0')) return '254' + clean.slice(1);
  return '254' + clean;
};
const waLink = (phone, msg) => `https://wa.me/${formatPhone(phone)}?text=${encodeURIComponent(msg)}`;

const WaIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// ── Notify Modal ───────────────────────────────────────────
const NotifyModal = ({ parents, checkIns, notified, onNotified, onClose, operator }) => {
  const arrivedParents = parents.filter((parent) =>
    (parent.children || []).some((c) => checkIns[c.id]?.arrived)
  );
  const unnotified = arrivedParents.filter((p) => !notified[p.id]);
  const alreadyNotified = arrivedParents.filter((p) => notified[p.id]);

  const buildMsg = (parent) => {
    const kids = (parent.children || []).filter((c) => checkIns[c.id]?.arrived);
    const list = kids.map((c) => `• ${c.full_name}${checkIns[c.id]?.time ? ` (arrived ${checkIns[c.id].time})` : ''}`).join('\n');
    return `Hello ${parent.full_name},\n\nYour child${kids.length > 1 ? 'ren have' : ' has'} safely arrived at school today (${todayDate()}).\n\n${list}\n\nHave a great day!\n${operator?.business_name || 'ShuleRyde'}`;
  };

  const ParentRow = ({ parent, variant }) => {
    const kids = (parent.children || []).filter((c) => checkIns[c.id]?.arrived);
    const isPending = variant === 'pending';
    return (
      <div className={`rounded-xl p-3 flex items-center justify-between gap-3 border ${isPending ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
        <div className="min-w-0">
          <p className="font-medium text-ink text-sm">{parent.full_name}</p>
          <p className="text-xs text-slate">{parent.phone}</p>
          <p className={`text-xs mt-0.5 ${isPending ? 'text-amber-700' : 'text-blue-700'}`}>
            {kids.map((c) => c.full_name).join(', ')}
          </p>
          {!isPending && notified[parent.id]?.time && (
            <p className="text-xs text-blue-500 mt-0.5">Notified at {notified[parent.id].time}</p>
          )}
        </div>
        <a
          href={waLink(parent.phone, buildMsg(parent))}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onNotified(parent.id, kids.map((c) => c.id))}
          className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white rounded-lg transition-colors ${isPending ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'}`}
        >
          <WaIcon />
          {isPending ? 'Send' : 'Re-send'}
        </a>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 px-0 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-cloud sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-semibold text-ink">Notify Parents</h2>
            <p className="text-xs text-slate mt-0.5">{arrivedParents.length} parent{arrivedParents.length !== 1 ? 's' : ''} with arrived students</p>
          </div>
          <button onClick={onClose} className="text-slate hover:text-ink p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          {arrivedParents.length === 0 && (
            <p className="text-slate text-sm text-center py-10">No students have been marked as arrived yet.</p>
          )}
          {unnotified.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate mb-2">Pending ({unnotified.length})</p>
              <div className="space-y-2">
                {unnotified.map((p) => <ParentRow key={p.id} parent={p} variant="pending" />)}
              </div>
            </div>
          )}
          {alreadyNotified.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate mb-2">Notified ({alreadyNotified.length})</p>
              <div className="space-y-2">
                {alreadyNotified.map((p) => <ParentRow key={p.id} parent={p} variant="sent" />)}
              </div>
            </div>
          )}
        </div>
        <div className="px-5 pb-5">
          <Button variant="secondary" onClick={onClose} className="w-full">Close</Button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ───────────────────────────────────────────────
const Manifest = () => {
  const { operator } = useAuth();
  const [parents, setParents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('vehicle');
  const [search, setSearch] = useState('');
  const [showNotify, setShowNotify] = useState(false);
  const [checkIns, setCheckIns] = useState(() => readLS(CHECKIN_KEY()));
  const [notified, setNotified] = useState(() => readLS(NOTIFIED_KEY()));

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: pd }, { data: vd }, { data: sd }] = await Promise.all([
          parentsAPI.getAll(),
          vehiclesAPI.getAll(),
          schoolsAPI.getAll(),
        ]);
        setParents(pd.parents || []);
        setVehicles(vd.vehicles || []);
        setSchools(sd.schools || []);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Flatten all students
  const allStudents = useMemo(() =>
    parents.flatMap((parent) =>
      (parent.children || []).map((child) => ({ ...child, parent }))
    ), [parents]
  );

  // Filter by search
  const filtered = useMemo(() =>
    allStudents.filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return s.full_name.toLowerCase().includes(q) || s.parent.full_name.toLowerCase().includes(q);
    }), [allStudents, search]
  );

  // Group
  const groups = useMemo(() => {
    if (groupBy === 'all') return [{ key: 'all', label: 'All Students', students: filtered }];
    if (groupBy === 'school') {
      const map = new Map();
      filtered.forEach((s) => {
        const sid = s.school_id || 'none';
        const school = schools.find((sc) => sc.id === s.school_id);
        const label = school?.name || 'Unknown School';
        if (!map.has(sid)) map.set(sid, { key: sid, label, students: [] });
        map.get(sid).students.push(s);
      });
      return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
    }
    // vehicle
    const map = new Map();
    filtered.forEach((s) => {
      const vid = s.vehicle_id || 'none';
      const vehicle = vehicles.find((v) => v.id === s.vehicle_id);
      const label = vehicle
        ? `${vehicle.make || ''} ${vehicle.model || ''} · ${vehicle.registration_number || ''}`.trim().replace(/^·\s*/, '')
        : 'Unassigned Vehicle';
      if (!map.has(vid)) map.set(vid, { key: vid, label, students: [] });
      map.get(vid).students.push(s);
    });
    return Array.from(map.values());
  }, [filtered, groupBy, vehicles, schools]);

  const markArrived = (childId) => {
    const next = { ...checkIns, [childId]: { arrived: true, time: nowTime() } };
    setCheckIns(next);
    writeLS(CHECKIN_KEY(), next);
  };

  const undoArrived = (childId) => {
    const next = { ...checkIns };
    delete next[childId];
    setCheckIns(next);
    writeLS(CHECKIN_KEY(), next);
  };

  const handleNotified = (parentId, childIds) => {
    const next = { ...notified, [parentId]: { time: nowTime(), childIds } };
    setNotified(next);
    writeLS(NOTIFIED_KEY(), next);
  };

  const totalStudents = allStudents.length;
  const arrivedCount = allStudents.filter((s) => checkIns[s.id]?.arrived).length;
  const notifiedCount = parents.filter((p) => notified[p.id]).length;
  const pendingNotifyCount = parents.filter((p) => !notified[p.id] && (p.children || []).some((c) => checkIns[c.id]?.arrived)).length;

  return (
    <div className="max-w-4xl mx-auto">
      {showNotify && (
        <NotifyModal
          parents={parents}
          checkIns={checkIns}
          notified={notified}
          onNotified={handleNotified}
          onClose={() => setShowNotify(false)}
          operator={operator}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-semibold text-ink">Arrival Manifest</h1>
          <p className="text-slate text-xs sm:text-sm mt-0.5">{todayLabel()}</p>
        </div>
        <Button onClick={() => setShowNotify(true)} className="self-start sm:self-auto flex items-center gap-2">
          <WaIcon />
          Notify Parents
          {pendingNotifyCount > 0 && (
            <span className="bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingNotifyCount}</span>
          )}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-cloud p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-ink">{totalStudents}</p>
          <p className="text-xs text-slate mt-0.5">Total</p>
        </div>
        <div className="bg-white rounded-xl border border-cloud p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-green-600">{arrivedCount}</p>
          <p className="text-xs text-slate mt-0.5">Arrived</p>
        </div>
        <div className="bg-white rounded-xl border border-cloud p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{notifiedCount}</p>
          <p className="text-xs text-slate mt-0.5">Notified</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Search student or parent…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 w-52"
        />
        <div className="flex rounded-lg border border-border overflow-hidden bg-white ml-auto">
          {[{ id: 'vehicle', label: 'By Vehicle' }, { id: 'school', label: 'By School' }, { id: 'all', label: 'All' }].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setGroupBy(opt.id)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${groupBy === opt.id ? 'bg-ink text-white' : 'text-slate hover:bg-paper'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-sage-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : totalStudents === 0 ? (
        <div className="bg-white rounded-xl border border-cloud p-10 text-center">
          <p className="text-slate">No students found. Add parents with children to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.key} className="bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
              {/* Group header */}
              <div className="px-4 py-3 bg-paper/60 border-b border-cloud flex items-center justify-between">
                <p className="font-semibold text-ink text-sm">{group.label}</p>
                <p className="text-xs text-slate">
                  {group.students.filter((s) => checkIns[s.id]?.arrived).length}/{group.students.length} arrived
                </p>
              </div>
              {/* Students */}
              <div className="divide-y divide-cloud/60">
                {group.students.map((student) => {
                  const ci = checkIns[student.id];
                  const nt = notified[student.parent.id];
                  const arrived = !!ci?.arrived;
                  const wasNotified = !!nt;
                  return (
                    <div key={student.id} className={`flex items-center justify-between px-4 py-3 gap-3 transition-colors ${arrived ? 'bg-green-50/40' : ''}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Status dot */}
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${arrived ? (wasNotified ? 'bg-blue-500' : 'bg-green-500') : 'bg-cloud border border-slate/20'}`} />
                        <div className="min-w-0">
                          <p className="font-medium text-ink text-sm truncate">{student.full_name}</p>
                          <p className="text-xs text-slate truncate">
                            {student.parent.full_name} · {student.parent.phone}
                          </p>
                          {arrived && (
                            <p className={`text-xs mt-0.5 ${wasNotified ? 'text-blue-600' : 'text-green-600'}`}>
                              Arrived {ci.time}{wasNotified ? ` · Parent notified ${nt.time}` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {arrived ? (
                          <button
                            onClick={() => undoArrived(student.id)}
                            className="text-xs text-slate hover:text-error underline"
                          >
                            Undo
                          </button>
                        ) : (
                          <Button size="sm" onClick={() => markArrived(student.id)}>
                            Mark Arrived
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Manifest;
