import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, CreditCard, UserRound } from 'lucide-react';
import { DashboardShell } from '../components/DashboardShell.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { getDashboard } from '../api/client.js';

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
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    getDashboard().then((data) => {
      if (data?.role === 'consultant') setDashboard(data);
    });
  }, []);

  const sessions = useMemo(
    () =>
      dashboard?.consultations?.length
        ? dashboard.consultations.map(sessionFromConsultation)
        : fallbackSessions,
    [dashboard]
  );
  const earnings =
    dashboard?.earnings ??
    sessions
      .filter((session) => ['confirmed', 'completed'].includes(session.status))
      .reduce((sum, session) => sum + Number(session.amount || 0), 0);

  return (
    <DashboardShell title="PCB consulting workspace" subtitle="Track bookings, client requests, earnings, and preparation notes.">
      <div className="metric-grid">
        <MetricCard label="Requests" value={sessions.length} detail="Bookings and inquiries" />
        <MetricCard label="Confirmed revenue" value={formatMoney(earnings)} detail="Consulting payments" />
        <MetricCard label="Open follow-ups" value={sessions.filter((session) => session.status === 'pending').length} detail="Needs action" />
        <MetricCard label="Response target" value="24h" detail="Client follow-up" />
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
    </DashboardShell>
  );
};
