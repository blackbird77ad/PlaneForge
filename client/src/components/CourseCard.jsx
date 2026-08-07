import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Star, Users } from 'lucide-react';

const money = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

export const CourseCard = ({ course }) => {
  const hasRating = Number(course.rating) > 0;
  const hasStudents = Number(course.studentsEnrolled) > 0;

  return (
    <article className="course-card">
      <img
        src={course.thumbnail}
        alt={`${course.title} course preview`}
        loading="lazy"
        decoding="async"
      />
      <div className="course-card-body">
        <div className="meta-row">
          <span>{course.discipline}</span>
          <span>{course.difficulty}</span>
        </div>
        <h3>{course.title}</h3>
        <p>{course.subtitle || course.description}</p>
        <div className="course-facts">
          {hasRating && (
            <span>
              <Star size={16} fill="currentColor" /> {course.rating}
            </span>
          )}
          {hasStudents && (
            <span>
              <Users size={16} /> {course.studentsEnrolled.toLocaleString()} learners
            </span>
          )}
          <span>
            <Clock size={16} /> {course.duration}
          </span>
        </div>
        <div className="card-footer">
          <strong>
            {course.price == null
              ? 'Course access'
              : course.price
                ? money(course.price, course.currency)
                : 'Free'}
            {course.purchaseType === 'subscription' ? ' / course pass' : ''}
          </strong>
          <Link className="button ghost small" to={`/courses/${course.slug}`}>
            View Details
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
};
