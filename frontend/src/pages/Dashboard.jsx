import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';

const activityLabels = {
  STUDENT_CHECKIN: 'Student checked in',
  PAYMENT_RECEIVED: 'Payment received',
  VEHICLE_DEPARTURE: 'Vehicle departed',
  GPS_UPDATE: 'GPS update',
  COMPLIANCE_ALERT: 'Compliance alert',
  SYSTEM_EVENT: 'System event',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 5;
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-display font-semibold text-ink">Overview</h1>
        <p className="text-slate text-xs sm:text-sm mt-1">
          {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          label="Active Vehicles"
          value={loading ? '…' : stats?.active_vehicles ?? 0}
          color="sage"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 17l4 4 4-4m-4-5v9m6-10.5A2.5 2.5 0 0016 6H8a2.5 2.5 0 00-2 4.5" />
            </svg>
          }
        />
        <StatCard
          label="Total Students"
          value={loading ? '…' : stats?.total_students ?? 0}
          color="success"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatCard
          label="Pending Payments"
          value={loading ? '…' : stats?.pending_payments_count ?? 0}
          sub={stats ? `KES ${Number(stats.pending_payments_amount).toLocaleString()}` : undefined}
          color="warning"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Total Parents"
          value={loading ? '…' : stats?.total_parents ?? 0}
          color="terracotta"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-cloud shadow-sm">
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-cloud">
            <h2 className="font-semibold text-ink text-sm sm:text-base">Recent Activity</h2>
          </div>
          <div className="divide-y divide-cloud">
            {activity.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-slate text-sm">No activity yet.</p>
                <p className="text-slate/60 text-xs mt-1">Actions like student check-ins and payments will appear here.</p>
              </div>
            ) : (
              pageActivity.map((log) => (
                <div key={log.id} className="px-4 sm:px-5 py-3 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-sage-500 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink">{log.description}</p>
                    <p className="text-xs text-slate mt-0.5">
                      {activityLabels[log.event_type] || log.event_type}
                      {log.vehicle && ` · ${log.vehicle.license_plate}`}
                    </p>
                  </div>
                  <span className="text-xs text-slate flex-shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
          {totalPages > 1 && (
            <div className="px-4 sm:px-5 py-3 border-t border-cloud flex items-center justify-between">
              <span className="text-xs text-slate">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, activity.length)} of {activity.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-slate hover:text-ink hover:bg-cloud disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs font-medium text-ink px-2">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-slate hover:text-ink hover:bg-cloud disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-cloud shadow-sm self-start">
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-cloud">
            <h2 className="font-semibold text-ink text-sm sm:text-base">Quick Actions</h2>
          </div>
          <div className="p-4 sm:p-5 grid grid-cols-2 lg:grid-cols-1 gap-3">
            <Button
              variant="primary"
              className="w-full justify-start gap-3"
              onClick={() => navigate('/dashboard/vehicles')}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Vehicle
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start gap-3"
              onClick={() => navigate('/dashboard/parents')}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Parent
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start gap-3"
              onClick={() => navigate('/dashboard/payments')}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              Payments
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start gap-3"
              onClick={() => navigate('/dashboard/compliance')}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Upload Doc
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
