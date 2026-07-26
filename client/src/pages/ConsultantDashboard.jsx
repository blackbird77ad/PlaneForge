import { CalendarDays, Clock, CreditCard, UserRound } from 'lucide-react';
import { DashboardShell } from '../components/DashboardShell.jsx';
import { MetricCard } from '../components/MetricCard.jsx';

const sessions = [
  {
    student: 'Maya Okafor',
    service: 'PLC project advisory',
    time: 'Tuesday, 10:00',
    amount: 250,
    status: 'confirmed'
  },
  {
    student: 'BridgeWorks Studio',
    service: 'Automation research review',
    time: 'Thursday, 15:00',
    amount: 250,
    status: 'pending'
  }
];

export const ConsultantDashboard = () => (
  <DashboardShell title="CEO consulting workspace" subtitle="Manage company requests, availability, earnings, and PLC advisory preparation.">
    <div className="metric-grid">
      <MetricCard label="Upcoming requests" value={sessions.length} detail="Next 7 days" />
      <MetricCard label="Confirmed revenue" value="$500" detail="Mock local payments" />
      <MetricCard label="Profile views" value="184" detail="This month" />
      <MetricCard label="Response target" value="24h" detail="Client follow-up" />
    </div>

    <section className="dashboard-section">
      <h2>
        <CalendarDays size={20} /> Company requests
      </h2>
      <div className="table-list">
        {sessions.map((session) => (
          <article key={session.student}>
            <span>
              <UserRound size={17} /> {session.student}
            </span>
            <span>{session.service}</span>
            <span>
              <Clock size={17} /> {session.time}
            </span>
            <strong>
              <CreditCard size={17} /> ${session.amount}
            </strong>
            <em>{session.status}</em>
          </article>
        ))}
      </div>
    </section>
  </DashboardShell>
);
