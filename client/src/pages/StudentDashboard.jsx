import { useEffect, useMemo, useState } from 'react';
import { Award, BookOpen, CalendarDays, FileText, MessageSquare } from 'lucide-react';
import { DashboardShell } from '../components/DashboardShell.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { CourseCard } from '../components/CourseCard.jsx';
import { getDashboard } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const courseFromProgress = (item) => item.course;

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    getDashboard().then((data) => {
      if (data) setDashboard(data);
    });
  }, []);

  const progress = dashboard?.progress || [];
  const orders = dashboard?.orders || user?.orders || [];
  const certificates = dashboard?.certificates || [];
  const consultations = dashboard?.consultations || [];
  const comments = dashboard?.comments || [];
  const cartItems = dashboard?.cartItems || [];
  const hasAccountActivity = consultations.length || comments.length || cartItems.length;
  const activeCourses = progress.map(courseFromProgress).filter(Boolean);
  const averageProgress = useMemo(() => {
    if (!progress.length) return 0;
    return Math.round(progress.reduce((sum, item) => sum + (item.percentComplete || 0), 0) / progress.length);
  }, [progress]);

  return (
    <DashboardShell title="Account dashboard" subtitle="Continue courses, track progress, and review PlaneForge activity tied to this email.">
      <div className="metric-grid">
        <MetricCard label="Active courses" value={activeCourses.length} detail="Verified course access" />
        <MetricCard label="Average progress" value={`${averageProgress}%`} detail="Across enrolled courses" />
        <MetricCard label="Certificates" value={certificates.length} detail="Issued after completion" />
        <MetricCard label="Purchases" value={orders.length} detail="Payment history" />
        <MetricCard label="Messages" value={consultations.length + comments.length} detail="Consulting and course requests" />
        <MetricCard label="Cart" value={cartItems.filter((item) => item.status === 'active').length} detail="Saved course items" />
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

      <section className="dashboard-section" id="activity">
        <h2>
          <MessageSquare size={20} /> Account activity
        </h2>
        {hasAccountActivity ? (
          <div className="table-list learner-activity-list">
            {consultations.map((consultation) => (
              <article key={consultation._id}>
                <span>{consultation.service}</span>
                <span>{consultation.consultant?.name || 'PlaneForge consultant'}</span>
                <em>{consultation.status}</em>
              </article>
            ))}
            {comments.map((comment) => (
              <article key={comment._id}>
                <span>{comment.source === 'tutor_request' ? 'Tutor request' : 'Course comment'}</span>
                <span>{comment.course?.title || 'Course'}</span>
                <em>{comment.status}</em>
              </article>
            ))}
            {cartItems.map((item) => (
              <article key={item._id}>
                <span>Cart activity</span>
                <span>{item.course?.title || item.productName || 'Item'}</span>
                <em>{item.status}</em>
              </article>
            ))}
          </div>
        ) : (
          <p>Consulting bookings and support requests appear here.</p>
        )}
      </section>

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
                {order.invoiceNumber} - {order.course?.title || order.product?.title || order.invoice?.itemName || order.courseTitle} - {order.amount} {order.currency || 'USD'} - {order.status}
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
