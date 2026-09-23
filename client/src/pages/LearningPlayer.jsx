import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Lock, MessageSquare, PlayCircle, Send, ShieldCheck } from 'lucide-react';
import {
  createCourseComment,
  getCourseComments,
  getLearningCourse,
  getLessonPlayback,
  saveLessonProgress
} from '../api/client.js';

const firstLesson = (course) => {
  const module = course?.modules?.find((item) => item.lessons?.length);
  return module?.lessons?.[0] ? { module, lesson: module.lessons[0] } : null;
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

  const syncProgress = async ({ currentTime, duration, completed = false }) => {
    if (!course?._id || !active?.lesson?._id || saving) return;
    setSaving(true);
    try {
      await saveLessonProgress({
        courseId: course._id,
        lessonId: active.lesson._id,
        positionSeconds: Math.floor(currentTime || 0),
        watchedSeconds: Math.floor(currentTime || 0),
        durationSeconds: Math.floor(duration || active.lesson.durationSeconds || 0),
        completed
      });
    } catch {
      // Progress will retry on the next player event.
    } finally {
      setSaving(false);
    }
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
        </div>
        <nav>
          {lessons.map(({ module, lesson }) => {
            const selected = active?.lesson?._id === lesson._id;
            return (
              <button
                type="button"
                key={lesson._id || lesson.title}
                className={selected ? 'active' : ''}
                onClick={() => setActive({ module, lesson })}
              >
                <PlayCircle size={17} />
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

        <section className="dashboard-section">
          <h2>
            <CheckCircle size={20} /> Lesson Notes
          </h2>
          <p>{active?.lesson?.description || course.description}</p>
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
      </section>
    </main>
  );
};
