import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Star, Users } from 'lucide-react';

const money = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value || 0));

export const CourseCard = ({ course }) => {
  const safeCourse = course || {};
  const hasRating = Number(safeCourse.rating) > 0;
  const studentsEnrolled = Number(safeCourse.studentsEnrolled || 0);
  const hasStudents = studentsEnrolled > 0;
  const title = safeCourse.title || 'PlaneForge course';
  const slug = safeCourse.slug || safeCourse._id || safeCourse.id || 'courses';

  return (
    <article className="course-card">
      <img
        src={safeCourse.thumbnail || safeCourse.bannerImage || '/favicon.png'}
        alt={`${title} course preview`}
        loading="lazy"
        decoding="async"
      />
      <div className="course-card-body">
        <div className="meta-row">
          <span>{safeCourse.discipline || safeCourse.category || 'PCB Design'}</span>
          <span>{safeCourse.difficulty || 'Course'}</span>
        </div>
        <h3>{title}</h3>
        <p>{safeCourse.subtitle || safeCourse.description || 'Build practical hardware skills with PlaneForge.'}</p>
        <div className="course-facts">
          {hasRating && (
            <span>
              <Star size={16} fill="currentColor" /> {safeCourse.rating}
            </span>
          )}
          {hasStudents && (
            <span>
              <Users size={16} /> {studentsEnrolled.toLocaleString()} learners
            </span>
          )}
          <span>
            <Clock size={16} /> {safeCourse.duration || 'Self-paced'}
          </span>
        </div>
        <div className="card-footer">
          <strong>
            {safeCourse.price == null
              ? 'Course access'
              : Number(safeCourse.price)
                ? money(safeCourse.price, safeCourse.currency)
                : 'Free'}
            {safeCourse.purchaseType === 'subscription' ? ' / course pass' : ''}
          </strong>
          <Link className="button ghost small" to={`/courses/${slug}`}>
            View Details
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
};
