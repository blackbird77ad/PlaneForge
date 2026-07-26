import { Award, BookOpen, CalendarDays, Download, FileText } from 'lucide-react';
import { DashboardShell } from '../components/DashboardShell.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { CourseCard } from '../components/CourseCard.jsx';
import { courses } from '../data/catalog.js';
import { useAuth } from '../context/AuthContext.jsx';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const owned = user?.ownedCourses || [];
  const enrolled = courses.filter((course) => owned.includes(course.slug) || owned.includes(course._id));
  const activeCourses = enrolled.length ? enrolled : courses.slice(0, 1);
  const orders = user?.orders || [];

  return (
    <DashboardShell title="PLC learning command center" subtitle="Continue courses, track progress, download resources, and view invoices.">
      <div className="metric-grid">
        <MetricCard label="Active courses" value={activeCourses.length} detail="Protected lessons unlocked" />
        <MetricCard label="Average progress" value="42%" detail="Across enrolled courses" />
        <MetricCard label="Certificates" value="1" detail="Available after completion" />
        <MetricCard label="Consultations" value="1" detail="Upcoming CEO advisory" />
      </div>

      <section className="dashboard-section">
        <h2>
          <BookOpen size={20} /> My courses
        </h2>
        <div className="course-grid compact-grid">
          {activeCourses.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <h2>
          <CalendarDays size={20} /> Learning progress
        </h2>
        {activeCourses.map((course, index) => (
          <article className="progress-row" key={course.slug}>
            <span>{course.title}</span>
            <div>
              <i style={{ width: `${index === 0 ? 58 : 22}%` }} />
            </div>
            <strong>{index === 0 ? 58 : 22}%</strong>
          </article>
        ))}
      </section>

      <section className="dashboard-section two-column" id="certificates">
        <article>
          <h2>
            <Award size={20} /> Certificates
          </h2>
          <p>Programmable Logic Controller (PLC) Fundamentals</p>
          <button className="button ghost small" type="button">
            <Download size={16} />
            Download
          </button>
        </article>
        <article id="orders">
          <h2>
            <FileText size={20} /> Purchase history
          </h2>
          {(orders.length ? orders : [{ invoiceNumber: 'PF-20260725-DEMO01', courseTitle: activeCourses[0]?.title, amount: activeCourses[0]?.price || 129, status: 'paid' }]).map((order) => (
            <p key={order.invoiceNumber}>
              {order.invoiceNumber} - {order.courseTitle} - ${order.amount} - {order.status}
            </p>
          ))}
        </article>
      </section>
    </DashboardShell>
  );
};
