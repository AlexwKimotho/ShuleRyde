import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import StatCard from '../components/ui/StatCard';

const activityLabels = {
  STUDENT_CHECKIN:   'Student checked in',
  PAYMENT_RECEIVED:  'Payment received',
  VEHICLE_DEPARTURE: 'Vehicle departed',
  GPS_UPDATE:        'GPS update',
  COMPLIANCE_ALERT:  'Compliance alert',
  SYSTEM_EVENT:      'System event',
};

const activityDot = {
  PAYMENT_RECEIVED:  'bg-sage-500',
  STUDENT_CHECKIN:   'bg-blue-400',
  VEHICLE_DEPARTURE: 'bg-amber-400',
  COMPLIANCE_ALERT:  'bg-red-400',
  default:           'bg-slate/40',
};

const QuickAction = ({ icon, label, description, onClick, accent = false }) => (
  <button
    onClick={onClick}
    className={`
      group w-full flex items-center gap-3 p-3.5 rounded-xl text-left
      transition-all duration-200 active:scale-[0.98]
      ${accent
        ? 'bg-sage-500 text-white hover:bg-sage-600 shadow-[0_2px_8px_rgba(107,144,128,0.35)]'
        : 'bg-black/[0.03] hover:bg-black/[0.06] text-ink'
      }
    `}
  >
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
      transition-transform duration-200 group-hover:scale-110
      ${accent ? 'bg-white/20' : 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]'}`}>
      <span className={accent ? 'text-white' : 'text-sage-600'}>{icon}</span>
    </div>
    <div className="min-w-0">
      <p className={`text-[13px] font-semibold leading-none ${accent ? 'text-white' : 'text-ink'}`}>{label}</p>
      {description && (
        <p className={`text-[11px] mt-0.5 truncate ${accent ? 'text-white/70' : 'text-slate'}`}>{description}</p>
      )}
    </div>
  </button>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 6;
  const totalPages = Math.ceil(activity.length / PAGE_SIZE);
  const pageActivity = activity.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(({ data }) => {
        setStats(data.stats);
        setActivity(data.recent_activity);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-display font-semibold text-ink tracking-tight">Overview</h1>
        <p className="text-slate text-sm mt-0.5">
          {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Active Vehicles"
          value={loading ? null : stats?.active_vehicles ?? 0}
          color="sage"
          icon={
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 17H6a2 2 0 01-2-2V9a2 2 0 012-2h1M8 17h8M8 17v-1a1 1 0 011-1h6a1 1 0 011 1v1m0 0h2a2 2 0 002-2V9a2 2 0 00-2-2h-1m-9 0V6a4 4 0 018 0v1m-8 0h8" />
            </svg>
          }
        />
        <StatCard
          label="Total Students"
          value={loading ? null : stats?.total_students ?? 0}
          color="blue"
          icon={
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatCard
          label="Pending Payments"
          value={loading ? null : stats?.pending_payments_count ?? 0}
          sub={stats ? `KES ${Number(stats.pending_payments_amount || 0).toLocaleString('en-KE')}` : undefined}
          color="warning"
          icon={
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Total Parents"
          value={loading ? null : stats?.total_parents ?? 0}
          color="terracotta"
          icon={
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
      </div>

      {/* Lower grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Activity feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl overflow-hidden
          shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]">
          <div className="px-5 py-4 border-b border-black/[0.05] flex items-center justify-between">
            <h2 className="font-semibold text-ink text-[15px] tracking-tight">Recent Activity</h2>
            {activity.length > 0 && (
              <span className="text-xs text-slate bg-black/[0.04] rounded-full px-2.5 py-0.5 font-medium">
                {activity.length} events
              </span>
            )}
          </div>

          <div className="divide-y divide-black/[0.04]">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="skeleton w-2 h-2 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-3/4 rounded" />
                    <div className="skeleton h-2.5 w-1/2 rounded" />
                  </div>
                  <div className="skeleton h-2.5 w-12 rounded" />
                </div>
              ))
            ) : activity.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="w-10 h-10 rounded-2xl bg-black/[0.04] flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-slate/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-ink/60">No activity yet</p>
                <p className="text-xs text-slate/60 mt-1">Check-ins and payments will appear here</p>
              </div>
            ) : (
              pageActivity.map((log) => {
                const dotColor = activityDot[log.event_type] || activityDot.default;
                return (
                  <div key={log.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-black/[0.015] transition-colors">
                    <div className={`w-1.5 h-1.5 rounded-full mt-[7px] flex-shrink-0 ${dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-ink font-medium leading-snug">{log.description}</p>
                      <p className="text-[11px] text-slate mt-0.5">
                        {activityLabels[log.event_type] || log.event_type}
                        {log.vehicle && <span className="text-slate/50"> · {log.vehicle.license_plate}</span>}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate/60 flex-shrink-0 tabular-nums">
                      {new Date(log.timestamp).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-black/[0.04] flex items-center justify-between">
              <span className="text-[11px] text-slate tabular-nums">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, activity.length)} of {activity.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 rounded-lg text-slate hover:text-ink hover:bg-black/[0.05] disabled:opacity-30 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-[11px] font-medium text-ink px-1 tabular-nums">{page}/{totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1 rounded-lg text-slate hover:text-ink hover:bg-black/[0.05] disabled:opacity-30 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl p-4 self-start
          shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]">
          <h2 className="font-semibold text-ink text-[15px] tracking-tight mb-3">Quick Actions</h2>
          <div className="flex flex-col gap-2">
            <QuickAction
              accent
              label="Add Vehicle"
              description="Register a new bus or van"
              onClick={() => navigate('/dashboard/vehicles')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            />
            <QuickAction
              label="Add Parent"
              description="Enrol a new client"
              onClick={() => navigate('/dashboard/parents')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            />
            <QuickAction
              label="View Payments"
              description="Invoices & receipts"
              onClick={() => navigate('/dashboard/payments')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              }
            />
            <QuickAction
              label="Upload Document"
              description="Compliance records"
              onClick={() => navigate('/dashboard/compliance')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
