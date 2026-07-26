import { BarChart3, BookOpen, CreditCard, Settings, Users } from 'lucide-react';
import { DashboardShell } from '../components/DashboardShell.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { courses, consultants } from '../data/catalog.js';

export const AdminDashboard = () => {
  const revenue = courses.reduce((sum, course) => sum + course.price * Math.min(course.studentsEnrolled, 120), 0);

  return (
    <DashboardShell title="Platform administration" subtitle="Control courses, students, payments, consultations, partners, content, and settings.">
      <div className="metric-grid">
        <MetricCard label="Students" value="4,875" detail="Registered learners" />
        <MetricCard label="Courses" value={courses.length} detail="Published catalogue" />
        <MetricCard label="Consultants" value={consultants.length} detail="Active experts" />
        <MetricCard label="Revenue" value={`$${revenue.toLocaleString()}`} detail="Demo projection" />
      </div>

      <section className="dashboard-section" id="content">
        <h2>
          <BookOpen size={20} /> Course and content control
        </h2>
        <div className="table-list">
          {courses.slice(0, 5).map((course) => (
            <article key={course.slug}>
              <span>{course.title}</span>
              <span>{course.discipline}</span>
              <strong>${course.price}</strong>
              <em>{course.isFeatured ? 'featured' : 'published'}</em>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-section two-column">
        <article id="payments">
          <h2>
            <CreditCard size={20} /> Payments
          </h2>
          <p>Stripe, Paystack, invoices, order status, refunds, and purchase history are modeled in the API.</p>
        </article>
        <article>
          <h2>
            <Users size={20} /> Role governance
          </h2>
          <p>Student, consultant, partner, and administrator dashboards are independently protected.</p>
        </article>
        <article id="settings">
          <h2>
            <Settings size={20} /> System settings
          </h2>
          <p>Platform values, certificate issuer settings, newsletter state, and commercial settings have admin endpoints.</p>
        </article>
        <article>
          <h2>
            <BarChart3 size={20} /> Reporting
          </h2>
          <p>Admin overview aggregates students, consultants, partners, published courses, subscribers, bookings, and revenue.</p>
        </article>
      </section>
    </DashboardShell>
  );
};
