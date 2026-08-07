import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Award,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Lock,
  PlayCircle,
  Star,
  Users
} from 'lucide-react';
import { getCourse } from '../api/client.js';
import { CourseCard } from '../components/CourseCard.jsx';
import { courses as allCourses } from '../data/catalog.js';
import { useAuth } from '../context/AuthContext.jsx';

const money = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

const owns = (user, course) => {
  const ownedCourses = (user?.ownedCourses || []).map(String);
  return ownedCourses.includes(String(course.slug)) || ownedCourses.includes(String(course._id || course.id));
};

const lessonState = (lesson, ownsCourse) => {
  if (lesson.isPreview) return 'Preview';
  if (!ownsCourse) return 'Locked';
  if (lesson.stream?.status && lesson.stream.status !== 'ready') return 'Stream preparing';
  return lesson.duration;
};

const findCatalogCourse = (slug) => allCourses.find((course) => course.slug === slug);

export const CourseDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const initialCourse = findCatalogCourse(slug);
  const [course, setCourse] = useState(initialCourse || null);
  const [status, setStatus] = useState(initialCourse ? 'ready' : 'loading');
  const [openModule, setOpenModule] = useState(0);

  useEffect(() => {
    const localCourse = findCatalogCourse(slug);
    setCourse(localCourse || null);
    setStatus(localCourse ? 'ready' : 'loading');
    getCourse(slug)
      .then((data) => {
        const nextCourse = data.course || localCourse || null;
        setCourse(nextCourse);
        setStatus(nextCourse ? 'ready' : 'not-found');
      })
      .catch(() => {
        setCourse(localCourse || null);
        setStatus(localCourse ? 'ready' : 'not-found');
      });
  }, [slug]);

  if (status === 'loading') {
    return <main className="section page">Loading course...</main>;
  }

  if (!course) {
    return (
      <main className="section page">
        <div className="page-heading">
          <p className="eyebrow">Course not found</p>
          <h1>This PCB course is not available</h1>
          <p>It may have moved, or the catalog may still be syncing.</p>
          <Link className="button primary" to="/courses">
            Browse Courses
          </Link>
        </div>
      </main>
    );
  }

  const ownsCourse = owns(user, course);
  const related = allCourses.filter((item) => item.slug !== course.slug).slice(0, 3);
  const hasRating = Number(course.rating) > 0;
  const hasStudents = Number(course.studentsEnrolled) > 0;

  const action = () => {
    if (ownsCourse) {
      navigate(`/learn/${course.slug}`);
      return;
    }

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
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(5, 24, 32, 0.9), rgba(5, 24, 32, 0.45)), url(${course.bannerImage || course.thumbnail})`
        }}
      >
        <div>
          <p className="eyebrow">{course.discipline}</p>
          <h1>{course.title}</h1>
          <p>{course.subtitle || course.description}</p>
          <div className="hero-stats">
            {hasRating && (
              <span>
                <Star size={17} fill="currentColor" /> {course.rating}
              </span>
            )}
            {hasStudents && (
              <span>
                <Users size={17} /> {course.studentsEnrolled.toLocaleString()} students
              </span>
            )}
            <span>
              <Clock size={17} /> {course.duration}
            </span>
            <span>{course.language}</span>
          </div>
        </div>
        <aside className="enroll-panel">
          <strong>{money(course.price, course.currency)}</strong>
          <p>{course.purchaseType === 'subscription' ? 'Subscription access for this course' : 'One-time course access'}</p>
          <p>Instructor: {course.instructor?.name || course.instructorName}</p>
          <button className="button primary full" type="button" onClick={action}>
            {ownsCourse ? <PlayCircle size={18} /> : <CreditCard size={18} />}
            {ownsCourse ? 'Continue Learning' : 'Enroll Now'}
          </button>
          <span>
            <Award size={16} /> {course.certificateAvailable ? 'Certificate available' : 'Certificate not included'}
          </span>
        </aside>
      </section>

      <section className="section detail-grid">
        <article>
          <h2>Course Description</h2>
          <p>{course.description}</p>

          {!!course.outcomes?.length && (
            <>
              <h2>Learning Outcomes</h2>
              <div className="check-grid">
                {course.outcomes.map((item) => (
                  <span key={item}>
                    <CheckCircle size={17} /> {item}
                  </span>
                ))}
              </div>
            </>
          )}

          {!!course.requirements?.length && (
            <>
              <h2>Requirements</h2>
              <ul className="clean-list">
                {course.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          )}

          {!!course.targetAudience?.length && (
            <>
              <h2>Who This Is For</h2>
              <div className="check-grid">
                {course.targetAudience.map((item) => (
                  <span key={item}>
                    <Users size={17} /> {item}
                  </span>
                ))}
              </div>
            </>
          )}

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
                    {module.lessons?.map((lesson) => {
                      const accessible = lesson.isPreview || ownsCourse;
                      return (
                        <div key={lesson._id || lesson.title}>
                          <span>
                            {accessible ? <PlayCircle size={17} /> : <Lock size={17} />}
                            {lesson.title}
                          </span>
                          <small>{lessonState(lesson, ownsCourse)}</small>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            ))}
          </div>

          {!!course.reviews?.length && (
            <>
              <h2>Reviews</h2>
              <div className="review-list">
                {course.reviews.map((review) => (
                  <article key={review.studentName}>
                    <strong>{review.studentName}</strong>
                    <span>{review.occupation}</span>
                    <p>{review.comment}</p>
                  </article>
                ))}
              </div>
            </>
          )}

          {!!course.faqs?.length && (
            <>
              <h2>Course FAQ</h2>
              <div className="faq-list compact">
                {course.faqs.map((item) => (
                  <details key={item.question}>
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            </>
          )}
        </article>

        <aside className="instructor-panel">
          {course.instructor?.avatar && (
            <img src={course.instructor.avatar} alt="" loading="lazy" decoding="async" />
          )}
          <p className="eyebrow">Instructor</p>
          <h3>{course.instructor?.name || course.instructorName}</h3>
          <p>
            {course.instructor?.bio ||
              'PlaneForge faculty member with practical engineering project experience.'}
          </p>
          <ul className="clean-list">
            {course.instructor?.qualifications?.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {!!course.resources?.length && (
            <div className="resource-list">
              <p className="eyebrow">Included</p>
              {course.resources.map((item) => (
                <span key={item.label}>
                  <FileText size={16} />
                  {item.label}
                </span>
              ))}
            </div>
          )}
        </aside>
      </section>

      {!!related.length && (
        <section className="section">
          <div className="section-heading">
            <p className="eyebrow">Related courses</p>
            <h2>Keep building your engineering toolkit</h2>
          </div>
          <div className="course-grid">
            {related.map((item) => (
              <CourseCard key={item.slug} course={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};
