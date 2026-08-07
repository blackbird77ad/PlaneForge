import { useEffect, useMemo, useState } from 'react';
import { Award, BookOpen, CalendarDays, FileText } from 'lucide-react';
import { DashboardShell } from '../components/DashboardShell.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { CourseCard } from '../components/CourseCard.jsx';
import { courses } from '../data/catalog.js';
import { getDashboard } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const courseFromProgress = (item) => {
  const fallback = courses.find((course) => course.slug === item.course?.slug);
  return fallback || item.course;
};

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    getDashboard().then((data) => {
      if (data) setDashboard(data);
    });
  }, []);

  const owned = (user?.ownedCourses || []).map(String);
  const localCourses = courses.filter(
    (course) => owned.includes(String(course.slug)) || owned.includes(String(course._id || course.id))
  );
  const progress = dashboard?.progress || [];
  const orders = dashboard?.orders || user?.orders || [];
  const certificates = dashboard?.certificates || [];
  const activeCourses = progress.length
    ? progress.map(courseFromProgress).filter(Boolean)
    : localCourses;
  const averageProgress = useMemo(() => {
    if (!progress.length) return 0;
    return Math.round(progress.reduce((sum, item) => sum + (item.percentComplete || 0), 0) / progress.length);
  }, [progress]);

  return (
    <DashboardShell title="Learning command center" subtitle="Continue courses, track progress, and review verified purchases.">
      <div className="metric-grid">
        <MetricCard label="Active courses" value={activeCourses.length} detail="Verified course access" />
        <MetricCard label="Average progress" value={`${averageProgress}%`} detail="Across enrolled courses" />
        <MetricCard label="Certificates" value={certificates.length} detail="Issued after completion" />
        <MetricCard label="Purchases" value={orders.length} detail="Payment history" />
      </div>

      <section className="dashboard-section">
        <h2>
          <BookOpen size={20} /> My courses
        </h2>
        {activeCourses.length ? (
          <div className="course-grid compact-grid">
            {activeCourses.map((course) => (
              <CourseCard key={course.slug || course._id} course={course} />
            ))}
          </div>
        ) : (
          <p>No verified course access yet.</p>
        )}
      </section>

      {!!progress.length && (
        <section className="dashboard-section">
          <h2>
            <CalendarDays size={20} /> Learning progress
          </h2>
          {progress.map((item) => (
            <article className="progress-row" key={item._id || item.course?.slug}>
              <span>{item.course?.title}</span>
              <div>
                <i style={{ width: `${item.percentComplete || 0}%` }} />
              </div>
              <strong>{item.percentComplete || 0}%</strong>
            </article>
          ))}
        </section>
      )}

      <section className="dashboard-section two-column" id="certificates">
        <article>
          <h2>
            <Award size={20} /> Certificates
          </h2>
          {certificates.length ? (
            certificates.map((certificate) => (
              <p key={certificate._id || certificate.certificateId}>
                {certificate.certificateId} - {certificate.course?.title}
              </p>
            ))
          ) : (
            <p>Certificates appear here after course completion.</p>
          )}
        </article>
        <article id="orders">
          <h2>
            <FileText size={20} /> Purchase history
          </h2>
          {orders.length ? (
            orders.map((order) => (
              <p key={order._id || order.invoiceNumber}>
                {order.invoiceNumber} - {order.course?.title || order.courseTitle} - {order.amount} {order.currency || 'USD'} - {order.status}
              </p>
            ))
          ) : (
            <p>Verified purchases and invoices appear here.</p>
          )}
        </article>
      </section>
    </DashboardShell>
  );
};
