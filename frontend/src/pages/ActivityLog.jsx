import { useEffect, useState, useCallback } from 'react';
import { dashboardAPI } from '../services/api';

const EVENT_STYLES = {
  PAYMENT_RECEIVED: { dot: 'bg-green-500', label: 'Payment', labelCls: 'bg-green-100 text-green-700' },
  VEHICLE_ADDED:    { dot: 'bg-blue-500',  label: 'Vehicle',  labelCls: 'bg-blue-100 text-blue-700' },
  VEHICLE_UPDATED:  { dot: 'bg-blue-400',  label: 'Vehicle',  labelCls: 'bg-blue-100 text-blue-700' },
  STUDENT_ENROLLED: { dot: 'bg-purple-500', label: 'Student', labelCls: 'bg-purple-100 text-purple-700' },
  PARENT_ADDED:     { dot: 'bg-indigo-500', label: 'Parent',  labelCls: 'bg-indigo-100 text-indigo-700' },
  COMPLIANCE_ADDED: { dot: 'bg-amber-500',  label: 'Compliance', labelCls: 'bg-amber-100 text-amber-700' },
  GPS_UPDATE:       { dot: 'bg-sage-500',   label: 'GPS',     labelCls: 'bg-sage-100 text-sage-700' },
  SYSTEM_EVENT:     { dot: 'bg-slate-400',  label: 'System',  labelCls: 'bg-cloud text-slate' },
};

const PAGE_SIZE = 50;

const formatTs = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString('en-KE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const ActivityLog = () => {
  const [activity, setActivity] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (off = 0, append = false) => {
    if (off === 0) setLoading(true); else setLoadingMore(true);
    try {
      const { data } = await dashboardAPI.getActivity(PAGE_SIZE, off);
      setTotal(data.total);
      setActivity((prev) => append ? [...prev, ...data.activity] : data.activity);
      setOffset(off + data.activity.length);
    } catch {}
    finally { setLoading(false); setLoadingMore(false); }
  }, []);

  useEffect(() => { load(0); }, [load]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-display font-semibold text-ink">Activity Log</h1>
        <p className="text-slate text-xs sm:text-sm mt-0.5">
          {total > 0 ? `${total} events recorded` : 'All events across your account'}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-sage-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : activity.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cloud p-12 text-center">
          <div className="w-12 h-12 bg-cloud rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-ink font-medium">No activity yet</p>
          <p className="text-slate text-sm mt-1">Events will appear here as you use the platform.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cloud shadow-sm overflow-hidden">
          <ul className="divide-y divide-cloud">
            {activity.map((event) => {
              const style = EVENT_STYLES[event.event_type] || EVENT_STYLES.SYSTEM_EVENT;
              return (
                <li key={event.id} className="flex items-start gap-4 px-4 sm:px-5 py-3.5 hover:bg-paper transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${style.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.labelCls}`}>
                        {style.label}
                      </span>
                      <span className="text-xs text-slate">{formatTs(event.timestamp || event.created_at)}</span>
                    </div>
                    <p className="text-sm text-ink leading-snug">{event.description}</p>
                    {event.vehicles?.license_plate && (
                      <p className="text-xs text-slate mt-0.5">{event.vehicles.license_plate}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {offset < total && (
            <div className="px-5 py-4 border-t border-cloud flex items-center justify-between">
              <p className="text-sm text-slate">Showing {activity.length} of {total}</p>
              <button
                onClick={() => load(offset, true)}
                disabled={loadingMore}
                className="text-sm font-medium text-sage-600 hover:text-sage-700 disabled:opacity-50 transition-colors"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
