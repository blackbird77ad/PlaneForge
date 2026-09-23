import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, CreditCard, UserRound } from 'lucide-react';
import { DashboardShell } from '../components/DashboardShell.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { getDashboard, withdrawEarning } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const fallbackSessions = [
  {
    student: 'Maya Okafor',
    service: 'PCB design review',
    time: 'Tuesday, 10:00',
    amount: 250,
    currency: 'USD',
    status: 'confirmed'
  },
  {
    student: 'BridgeWorks Studio',
    service: 'Hardware bring-up planning',
    time: 'Thursday, 15:00',
    amount: 250,
    currency: 'USD',
    status: 'pending'
  }
];

const formatDate = (value) => {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

const formatMoney = (amount = 0, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(Number(amount || 0));
  } catch {
    return `${currency || 'USD'} ${Number(amount || 0).toFixed(2)}`;
  }
};

const sessionFromConsultation = (consultation) => ({
  id: consultation._id,
  student: consultation.student?.name || consultation.student?.email || 'Client',
  service: consultation.service,
  time: formatDate(consultation.scheduledAt),
  amount: consultation.amount,
  currency: consultation.currency || 'USD',
  status: consultation.status
});

export const ConsultantDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    getDashboard().then((data) => {
      if (data?.role === 'consultant') setDashboard(data);
    });
  }, []);

  const requestWithdrawal = async (earningId) => {
    const data = await withdrawEarning(earningId);
    setDashboard((current) => ({
      ...current,
      earnings: (current?.earnings || []).map((earning) =>
        earning._id === earningId ? data.earning : earning
      )
    }));
    setNotice('Withdrawal request recorded.');
  };

  const sessions = useMemo(
    () =>
      dashboard?.consultations?.length
        ? dashboard.consultations.map(sessionFromConsultation)
        : fallbackSessions,
    [dashboard]
  );
  const earnings =
    dashboard?.confirmedRevenue ??
    sessions
      .filter((session) => ['confirmed', 'completed'].includes(session.status))
      .reduce((sum, session) => sum + Number(session.amount || 0), 0);

  return (
    <DashboardShell title="PCB consulting workspace" subtitle="Track bookings, client requests, earnings, and preparation notes.">
      <div className="metric-grid">
        <MetricCard label="Requests" value={sessions.length} detail="Bookings and inquiries" />
        <MetricCard label="Confirmed revenue" value={formatMoney(earnings)} detail="Consulting payments" />
        <MetricCard label="Available earnings" value={formatMoney(dashboard?.availableEarnings)} detail="Ready to withdraw" />
        <MetricCard label="Open follow-ups" value={sessions.filter((session) => session.status === 'pending').length} detail="Needs action" />
        <MetricCard label="Fee status" value={user?.consultationFeeStatus || 'not set'} detail={user?.requestedConsultationFee ? formatMoney(user.requestedConsultationFee) : 'Submit in profile'} />
      </div>

      <section className="dashboard-section">
        <h2>
          <CalendarDays size={20} /> Consulting activity
        </h2>
        <div className="table-list">
          {sessions.map((session) => (
            <article key={session.id || `${session.student}-${session.time}`}>
              <span>
                <UserRound size={17} /> {session.student}
              </span>
              <span>{session.service}</span>
              <span>
                <Clock size={17} /> {session.time}
              </span>
              <strong>
                <CreditCard size={17} /> {formatMoney(session.amount, session.currency)}
              </strong>
              <em>{session.status}</em>
            </article>
          ))}
        </div>
      </section>
      <section className="dashboard-section">
        <h2>
          <CreditCard size={20} /> Earnings
        </h2>
        <div className="table-list">
          {(dashboard?.earnings || []).map((earning) => (
            <article key={earning._id}>
              <span>{earning.sourceType}</span>
              <strong>{formatMoney(earning.amount, earning.currency)}</strong>
              <span>{earning.status}</span>
              <button
                className="button ghost small"
                type="button"
                disabled={earning.status !== 'available'}
                onClick={() => requestWithdrawal(earning._id)}
              >
                Withdraw
              </button>
            </article>
          ))}
          {!(dashboard?.earnings || []).length && <p className="admin-empty">No consulting earnings yet.</p>}
        </div>
        {notice && <p className="form-success">{notice}</p>}
      </section>
    </DashboardShell>
  );
};
