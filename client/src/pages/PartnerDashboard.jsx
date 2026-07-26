import { BriefcaseBusiness, FileText, Users } from 'lucide-react';
import { DashboardShell } from '../components/DashboardShell.jsx';
import { MetricCard } from '../components/MetricCard.jsx';

export const PartnerDashboard = () => (
  <DashboardShell title="Partner portal" subtitle="Track referrals, training opportunities, commissions, and shared commercial resources.">
    <div className="metric-grid">
      <MetricCard label="Referrals" value="28" detail="Current quarter" />
      <MetricCard label="Enterprise leads" value="6" detail="Awaiting proposal" />
      <MetricCard label="Estimated commission" value="$2,480" detail="Projected" />
      <MetricCard label="Partner code" value="PF-NORA" detail="Active" />
    </div>

    <section className="dashboard-section two-column">
      <article>
        <h2>
          <BriefcaseBusiness size={20} /> Partner actions
        </h2>
        <p>Share course bundles, request enterprise pricing, and monitor referred student purchases.</p>
        <button className="button primary small" type="button">
          <Users size={16} />
          Create Referral Link
        </button>
      </article>
      <article>
        <h2>
          <FileText size={20} /> Resources
        </h2>
        <p>Co-branded course bundles</p>
        <p>Enterprise training proposal template</p>
        <p>Consultation package overview</p>
      </article>
    </section>
  </DashboardShell>
);
