import { useEffect, useState } from 'react';
import { BriefcaseBusiness, CreditCard, FileText, Users } from 'lucide-react';
import { DashboardShell } from '../components/DashboardShell.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { getDashboard, withdrawEarning } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const formatMoney = (amount = 0) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Number(amount || 0));
  } catch {
    return `$${Number(amount || 0).toFixed(2)}`;
  }
};

export const PartnerDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [notice, setNotice] = useState('');
  const resources = dashboard?.resources || ['Course bundles', 'Enterprise training proposal template', 'Consultation package overview'];

  useEffect(() => {
    getDashboard().then((data) => {
      if (data?.role === 'partner') setDashboard(data);
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

  return (
    <DashboardShell title="Partner portal" subtitle="Track platform activity, attributed revenue, and commission without admin controls.">
      <div className="metric-grid">
        <MetricCard label="Site orders" value={dashboard?.siteOrders ?? 0} detail="Read-only platform view" />
        <MetricCard label="Paid orders" value={dashboard?.paidOrders ?? 0} detail="Eligible sales" />
        <MetricCard label="Estimated commission" value={formatMoney(dashboard?.estimatedCommission)} detail={`${dashboard?.commissionRate ?? user?.commissionRate ?? 0}% rate`} />
        <MetricCard label="Available earnings" value={formatMoney(dashboard?.availableEarnings)} detail="Ready to withdraw" />
        <MetricCard label="Partner code" value={dashboard?.partnerCode || user?.partnerCode || 'Not set'} detail="Assigned by admin" />
      </div>

      <section className="dashboard-section two-column">
        <article>
          <h2>
            <BriefcaseBusiness size={20} /> Partner actions
          </h2>
          <p>Share assigned links, review eligible sales, and request support for partnership opportunities.</p>
          <button className="button primary small" type="button">
            <Users size={16} />
            Create Referral Link
          </button>
        </article>
        <article>
          <h2>
            <FileText size={20} /> Resources
          </h2>
          {resources.map((resource) => (
            <p key={resource}>{resource}</p>
          ))}
        </article>
      </section>
      <section className="dashboard-section">
        <h2>
          <CreditCard size={20} /> Earnings
        </h2>
        <div className="table-list">
          {(dashboard?.earnings || []).map((earning) => (
            <article key={earning._id}>
              <span>{earning.sourceType}</span>
              <strong>{formatMoney(earning.amount)}</strong>
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
          {!(dashboard?.earnings || []).length && <p className="admin-empty">No partner earnings yet.</p>}
        </div>
        {notice && <p className="form-success">{notice}</p>}
      </section>
    </DashboardShell>
  );
};
