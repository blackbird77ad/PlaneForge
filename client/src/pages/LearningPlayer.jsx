import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, ChevronLeft, ChevronRight, Download, FileText, Lock, MessageSquare, PlayCircle, Send, ShieldCheck, Star } from 'lucide-react';
import {
  createCourseComment,
  getCourseComments,
  getLearningCourse,
  getLessonPlayback,
  saveLessonProgress,
  submitCourseReview
} from '../api/client.js';

const firstLesson = (course) => {
  const lessons =
    course?.modules?.flatMap((module) =>
      (module.lessons || []).map((lesson) => ({
        module,
        lesson
      }))
    ) || [];
  const currentLessonId = course?.progress?.currentLesson?.lessonId;
  return lessons.find(({ lesson }) => lesson._id === currentLessonId) || lessons[0] || null;
};

export const LearningPlayer = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [active, setActive] = useState(null);
  const [playback, setPlayback] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentForm, setCommentForm] = useState({ source: 'lesson_comment', message: '' });
  const [commentMessage, setCommentMessage] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    anonymous: false,
    displayNamePublic: true
  });
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const lastSyncRef = useRef(0);

  useEffect(() => {
    getLearningCourse(slug)
      .then((data) => {
        setCourse(data.course);
        setActive(firstLesson(data.course));
        return getCourseComments(slug);
      })
      .then((data) => setComments(data.comments || []))
      .catch((err) => {
        setError(err.message);
      });
  }, [slug]);

  useEffect(() => {
    if (document.querySelector('script[data-mux-player]')) return;
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://cdn.jsdelivr.net/npm/@mux/mux-player/+esm';
    script.dataset.muxPlayer = 'true';
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!active?.lesson?._id) return;

    setPlayback(null);
    setError('');
    lastSyncRef.current = 0;
    getLessonPlayback(slug, active.lesson._id)
      .then((data) => setPlayback(data.playback))
      .catch((err) => setError(err.message));
  }, [slug, active]);

  const lessons = useMemo(
    () =>
      course?.modules?.flatMap((module) =>
        (module.lessons || []).map((lesson) => ({
          module,
          lesson
        }))
      ) || [],
    [course]
  );
  const activeIndex = lessons.findIndex(({ lesson }) => lesson._id === active?.lesson?._id);
  const completedLessonIds = useMemo(
    () =>
      new Set([
        ...(course?.progress?.completedLessons || []).map((item) => item.lessonId),
        ...(course?.progress?.lessonProgress || [])
          .filter((item) => item.completedAt)
          .map((item) => item.lessonId)
      ]),
    [course]
  );
  const percentComplete = Number(course?.progress?.percentComplete || 0);
  const courseCompleted = percentComplete >= 100 || Boolean(course?.progress?.completedAt);
  const activeResources = active?.lesson?.resources || [];

  const moveLesson = (direction) => {
    const next = lessons[activeIndex + direction];
    if (next) setActive(next);
  };

  const syncProgress = async ({ currentTime, duration, completed = false }) => {
    if (!course?._id || !active?.lesson?._id || saving) return;
    setSaving(true);
    try {
      const data = await saveLessonProgress({
        courseId: course._id,
        lessonId: active.lesson._id,
        positionSeconds: Math.floor(currentTime || 0),
        watchedSeconds: Math.floor(currentTime || 0),
        durationSeconds: Math.floor(duration || active.lesson.durationSeconds || 0),
        completed
      });
      if (data.progress) {
        setCourse((current) => (current ? { ...current, progress: data.progress } : current));
      }
    } catch {
      // Progress will retry on the next player event.
    } finally {
      setSaving(false);
    }
  };

  const completeActiveLesson = async () => {
    await syncProgress({
      currentTime: active?.lesson?.durationSeconds || 0,
      duration: active?.lesson?.durationSeconds || 0,
      completed: true
    });
  };

  const submitComment = async (event) => {
    event.preventDefault();
    setCommentMessage('');
    setCommentError('');

    if (!commentForm.message.trim()) {
      setCommentError('Write a message before sending.');
      return;
    }

    setCommentBusy(true);
    try {
      const data = await createCourseComment(slug, {
        lessonId: active?.lesson?._id,
        source: commentForm.source,
        message: commentForm.message
      });
      if (data.comment) {
        setComments((current) => [data.comment, ...current]);
        setCommentForm((current) => ({ ...current, message: '' }));
        setCommentMessage(commentForm.source === 'tutor_request' ? 'Tutor request sent.' : 'Comment added.');
      }
    } catch (err) {
      setCommentError(err.message);
    } finally {
      setCommentBusy(false);
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    setReviewMessage('');
    setReviewError('');

    if (!courseCompleted) {
      setReviewError('Complete the course before submitting a review.');
      return;
    }

    setReviewBusy(true);
    try {
      const data = await submitCourseReview(slug, reviewForm);
      setReviewMessage(data.message || 'Review submitted for moderation.');
      setReviewForm((current) => ({ ...current, comment: '' }));
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewBusy(false);
    }
  };

  if (error && !course) {
    return (
      <main className="section page">
        <div className="locked-learning">
          <Lock size={28} />
          <h1>Course access is locked</h1>
          <p>{error}</p>
          <button className="button primary" type="button" onClick={() => navigate(`/checkout/${slug}`)}>
            Unlock course
          </button>
        </div>
      </main>
    );
  }

  if (!course) {
    return <main className="section page">Loading learning space...</main>;
  }

  return (
    <main className="learning-page">
      <aside className="lesson-sidebar">
        <Link to={`/courses/${course.slug}`} className="button ghost small">
          Course details
        </Link>
        <div>
          <p className="eyebrow">Now Learning</p>
          <h1>{course.title}</h1>
          <div className="learning-progress-meter">
            <span style={{ width: `${percentComplete}%` }} />
          </div>
          <small>{percentComplete}% complete</small>
        </div>
        <nav>
          {lessons.map(({ module, lesson }) => {
            const selected = active?.lesson?._id === lesson._id;
            const completed = completedLessonIds.has(lesson._id);
            return (
              <button
                type="button"
                key={lesson._id || lesson.title}
                className={selected ? 'active' : ''}
                onClick={() => setActive({ module, lesson })}
              >
                {completed ? <CheckCircle size={17} /> : <PlayCircle size={17} />}
                <span>
                  {lesson.title}
                  <small>{module.title}</small>
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="learning-main">
        <div className="player-heading">
          <div>
            <p className="eyebrow">{active?.module?.title}</p>
            <h2>{active?.lesson?.title || 'Select a lesson'}</h2>
          </div>
          <span>
            <ShieldCheck size={17} /> One active device
          </span>
        </div>

        <div className="player-shell">
          {playback?.configured && playback.provider === 'mux' && playback.playbackId ? (
            <mux-player
              playback-id={playback.playbackId}
              stream-type="on-demand"
              metadata-video-title={active?.lesson?.title || course.title}
              metadata-viewer-user-id={course.access === 'unlocked' ? 'planeforge-learner' : 'preview'}
              env-key={playback.dataEnvironmentKey || undefined}
              accent-color="#ff4b12"
              style={{ width: '100%', height: '100%' }}
              onTimeUpdate={(event) => {
                const video = event.currentTarget;
                if (video.currentTime - lastSyncRef.current >= 12) {
                  lastSyncRef.current = video.currentTime;
                  syncProgress({ currentTime: video.currentTime, duration: video.duration });
                }
              }}
              onEnded={(event) => {
                const video = event.currentTarget;
                syncProgress({
                  currentTime: video.duration || video.currentTime,
                  duration: video.duration,
                  completed: true
                });
              }}
            />
          ) : playback?.configured && playback.playbackUrl ? (
            <video
              src={playback.playbackUrl}
              controls
              controlsList="nodownload"
              disablePictureInPicture
              onTimeUpdate={(event) => {
                const video = event.currentTarget;
                if (video.currentTime - lastSyncRef.current >= 12) {
                  lastSyncRef.current = video.currentTime;
                  syncProgress({ currentTime: video.currentTime, duration: video.duration });
                }
              }}
              onEnded={(event) => {
                const video = event.currentTarget;
                syncProgress({
                  currentTime: video.duration || video.currentTime,
                  duration: video.duration,
                  completed: true
                });
              }}
            />
          ) : (
            <div className="stream-placeholder">
              <PlayCircle size={44} />
              <h3>{playback?.message || 'Preparing secure playback'}</h3>
              <p>{playback?.status ? `Stream status: ${playback.status}` : 'Select a lesson to request playback.'}</p>
            </div>
          )}
        </div>

        {error && <p className="form-error">{error}</p>}
        <p className="form-muted">
          {saving ? 'Saving progress...' : 'Progress saves while the lesson plays.'}
        </p>
        <div className="lesson-navigation-row">
          <button className="button ghost small" type="button" onClick={() => moveLesson(-1)} disabled={activeIndex <= 0}>
            <ChevronLeft size={16} />
            Previous
          </button>
          <button className="button secondary small" type="button" onClick={completeActiveLesson} disabled={saving || completedLessonIds.has(active?.lesson?._id)}>
            <CheckCircle size={16} />
            Mark Complete
          </button>
          <button className="button ghost small" type="button" onClick={() => moveLesson(1)} disabled={activeIndex < 0 || activeIndex >= lessons.length - 1}>
            Next
            <ChevronRight size={16} />
          </button>
        </div>

        <section className="dashboard-section">
          <h2>
            <CheckCircle size={20} /> Lesson Notes
          </h2>
          <p>{active?.lesson?.description || course.description}</p>
          {!!activeResources.length && (
            <div className="lesson-resource-grid">
              {activeResources.map((resource) => (
                <a
                  href={resource.url}
                  key={resource._id || resource.url || resource.label}
                  target="_blank"
                  rel="noreferrer"
                  download={resource.downloadable || undefined}
                >
                  {resource.downloadable ? <Download size={17} /> : <FileText size={17} />}
                  <span>{resource.label}</span>
                  <small>{resource.type || 'resource'}</small>
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-section lesson-comments">
          <h2>
            <MessageSquare size={20} /> Course discussion
          </h2>
          <form onSubmit={submitComment}>
            <fieldset className="segmented comment-mode">
              <legend>Message type</legend>
              <label>
                <input
                  type="radio"
                  name="comment-source"
                  value="lesson_comment"
                  checked={commentForm.source === 'lesson_comment'}
                  onChange={(event) => setCommentForm({ ...commentForm, source: event.target.value })}
                />
                <span>Comment</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="comment-source"
                  value="tutor_request"
                  checked={commentForm.source === 'tutor_request'}
                  onChange={(event) => setCommentForm({ ...commentForm, source: event.target.value })}
                />
                <span>Ask Tutor</span>
              </label>
            </fieldset>
            <label>
              Message
              <textarea
                value={commentForm.message}
                onChange={(event) => setCommentForm({ ...commentForm, message: event.target.value })}
                rows={4}
                maxLength={2000}
                required
              />
            </label>
            {commentMessage && <p className="form-success">{commentMessage}</p>}
            {commentError && <p className="form-error">{commentError}</p>}
            <button className="button primary small" type="submit" disabled={commentBusy}>
              <Send size={16} />
              {commentBusy ? 'Sending' : commentForm.source === 'tutor_request' ? 'Send Request' : 'Add Comment'}
            </button>
          </form>
          <div className="comment-list">
            {comments.map((comment) => (
              <article key={comment._id}>
                <div>
                  <strong>{comment.user?.name || 'PlaneForge account'}</strong>
                  <small>{comment.lessonTitle || comment.course?.title || course.title}</small>
                </div>
                <p>{comment.message}</p>
                <em>{comment.source === 'tutor_request' ? 'Tutor request' : 'Comment'}</em>
              </article>
            ))}
            {comments.length === 0 && <p className="form-muted">No messages yet.</p>}
          </div>
        </section>

        <section className="dashboard-section course-review-submit">
          <h2>
            <Star size={20} /> Course review
          </h2>
          <form onSubmit={submitReview}>
            <label>
              Rating
              <select
                value={reviewForm.rating}
                onChange={(event) => setReviewForm({ ...reviewForm, rating: Number(event.target.value) })}
                disabled={!courseCompleted}
              >
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option value={rating} key={rating}>
                    {rating} stars
                  </option>
                ))}
              </select>
            </label>
            <label>
              Review
              <textarea
                value={reviewForm.comment}
                onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })}
                rows={4}
                maxLength={1200}
                disabled={!courseCompleted}
                required
              />
            </label>
            <div className="review-privacy-row">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={reviewForm.displayNamePublic}
                  onChange={(event) =>
                    setReviewForm({
                      ...reviewForm,
                      displayNamePublic: event.target.checked,
                      anonymous: !event.target.checked
                    })
                  }
                  disabled={!courseCompleted}
                />
                <span>Show my first name publicly</span>
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={reviewForm.anonymous}
                  onChange={(event) =>
                    setReviewForm({
                      ...reviewForm,
                      anonymous: event.target.checked,
                      displayNamePublic: !event.target.checked
                    })
                  }
                  disabled={!courseCompleted}
                />
                <span>Post anonymously</span>
              </label>
            </div>
            {!courseCompleted && <p className="form-muted">Reviews open after the course reaches 100% completion.</p>}
            {reviewMessage && <p className="form-success">{reviewMessage}</p>}
            {reviewError && <p className="form-error">{reviewError}</p>}
            <button className="button primary small" type="submit" disabled={!courseCompleted || reviewBusy}>
              <Send size={16} />
              {reviewBusy ? 'Submitting' : 'Submit for moderation'}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
};
