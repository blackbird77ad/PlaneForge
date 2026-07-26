import { Award, BookOpen, CalendarDays, ShieldCheck } from 'lucide-react';

export const About = () => (
  <main className="section page">
    <div className="page-heading">
      <p className="eyebrow">About Us</p>
      <h1>PlaneForge connects PLC learning with company consulting and builds</h1>
      <p>
        The platform is designed for PLC learners, technicians, working engineers, companies, partners,
        and administrators who need practical automation training and project support.
      </p>
    </div>
    <section className="value-grid">
      <article>
        <BookOpen size={24} />
        <h2>PLC learning</h2>
        <p>Courses support PLC lessons, downloadable resources, progress tracking, and certificates.</p>
      </article>
      <article>
        <CalendarDays size={24} />
        <h2>PLC consulting and builds</h2>
        <p>Companies can consult with PlaneForge for PLC projects, products, automation research, feasibility, builds, and technical support.</p>
      </article>
      <article>
        <ShieldCheck size={24} />
        <h2>Business operations</h2>
        <p>Orders, invoices, email confirmations, payments, content, partners, and settings are admin-ready.</p>
      </article>
      <article>
        <Award size={24} />
        <h2>Role-specific dashboards</h2>
        <p>Students, consultants, partners, and administrators see only the actions that belong to their role.</p>
      </article>
    </section>
  </main>
);
