import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Award, CheckCircle, Clock, CreditCard, Lock, PlayCircle, Star, Users } from 'lucide-react';
import { getCourse } from '../api/client.js';
import { CourseCard } from '../components/CourseCard.jsx';
import { courses as allCourses } from '../data/catalog.js';
import { useAuth } from '../context/AuthContext.jsx';

const money = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

export const CourseDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [openModule, setOpenModule] = useState(0);

  useEffect(() => {
    getCourse(slug).then((data) => setCourse(data.course));
  }, [slug]);

  if (!course) {
    return <main className="section page">Loading course...</main>;
  }

  const ownedCourses = user?.ownedCourses || [];
  const ownsCourse = ownedCourses.includes(course.slug) || ownedCourses.includes(course._id);
  const related = allCourses.filter((item) => item.slug !== course.slug).slice(0, 3);

  const enroll = () => {
    if (!user) {
      navigate('/login', { state: { from: `/checkout/${course.slug}` } });
      return;
    }
    navigate(`/checkout/${course.slug}`);
  };

  return (
    <main>
      <section
        className="course-hero"
        style={{ backgroundImage: `linear-gradient(90deg, rgba(5, 24, 32, 0.9), rgba(5, 24, 32, 0.45)), url(${course.bannerImage || course.thumbnail})` }}
      >
        <div>
          <p className="eyebrow">{course.discipline}</p>
          <h1>{course.title}</h1>
          <p>{course.subtitle || course.description}</p>
          <div className="hero-stats">
            <span>
              <Star size={17} fill="currentColor" /> {course.rating}
            </span>
            <span>
              <Users size={17} /> {course.studentsEnrolled?.toLocaleString()} students
            </span>
            <span>
              <Clock size={17} /> {course.duration}
            </span>
            <span>{course.language}</span>
          </div>
        </div>
        <aside className="enroll-panel">
          <strong>{money(course.price, course.currency)}</strong>
          <p>Instructor: {course.instructor?.name || course.instructorName}</p>
          <button className="button primary full" type="button" onClick={enroll}>
            <CreditCard size={18} />
            {ownsCourse ? 'Open Checkout Again' : 'Enroll Now'}
          </button>
          <span>
            <Award size={16} /> Certificate available
          </span>
        </aside>
      </section>

      <section className="section detail-grid">
        <article>
          <h2>Course Description</h2>
          <p>{course.description}</p>

          <h2>Learning Outcomes</h2>
          <div className="check-grid">
            {course.outcomes?.map((item) => (
              <span key={item}>
                <CheckCircle size={17} /> {item}
              </span>
            ))}
          </div>

          <h2>Requirements</h2>
          <ul className="clean-list">
            {course.requirements?.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h2>Curriculum</h2>
          <div className="curriculum">
            {course.modules?.map((module, index) => (
              <article key={module._id || module.title}>
                <button type="button" onClick={() => setOpenModule(openModule === index ? -1 : index)}>
                  <span>{module.title}</span>
                  <strong>{module.lessons?.length || 0} lessons</strong>
                </button>
                {openModule === index && (
                  <div className="lesson-list">
                    {module.lessons?.map((lesson) => (
                      <div key={lesson._id || lesson.title}>
                        <span>
                          {lesson.isPreview || ownsCourse ? <PlayCircle size={17} /> : <Lock size={17} />}
                          {lesson.title}
                        </span>
                        <small>{lesson.isPreview ? 'Free Preview' : lesson.duration}</small>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>

          <h2>Reviews</h2>
          <div className="review-list">
            {course.reviews?.map((review) => (
              <article key={review.studentName}>
                <strong>{review.studentName}</strong>
                <span>{review.occupation}</span>
                <p>{review.comment}</p>
              </article>
            ))}
          </div>
        </article>

        <aside className="instructor-panel">
          <img src={course.instructor?.avatar} alt="" />
          <p className="eyebrow">Instructor</p>
          <h3>{course.instructor?.name || course.instructorName}</h3>
          <p>{course.instructor?.bio || 'PlaneForge faculty member with practical PLC and industrial automation experience.'}</p>
          <ul className="clean-list">
            {course.instructor?.qualifications?.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Related courses</p>
          <h2>Keep building your PLC and automation toolkit</h2>
        </div>
        <div className="course-grid">
          {related.map((item) => (
            <CourseCard key={item.slug} course={item} />
          ))}
        </div>
      </section>
    </main>
  );
};
