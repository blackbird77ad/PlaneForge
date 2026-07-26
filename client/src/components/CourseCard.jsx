import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Star, Users } from 'lucide-react';

const money = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

export const CourseCard = ({ course }) => (
  <article className="course-card">
    <img src={course.thumbnail} alt="" />
    <div className="course-card-body">
      <div className="meta-row">
        <span>{course.discipline}</span>
        <span>{course.difficulty}</span>
      </div>
      <h3>{course.title}</h3>
      <p>{course.subtitle || course.description}</p>
      <div className="course-facts">
        <span>
          <Star size={16} fill="currentColor" /> {course.rating}
        </span>
        <span>
          <Users size={16} /> {course.studentsEnrolled?.toLocaleString()} students
        </span>
        <span>
          <Clock size={16} /> {course.duration}
        </span>
      </div>
      <div className="card-footer">
        <strong>{course.price ? money(course.price, course.currency) : 'Free'}</strong>
        <Link className="button ghost small" to={`/courses/${course.slug}`}>
          View Details
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  </article>
);
