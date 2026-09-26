import { Enrollment } from '../models/Enrollment.js';
import { Course } from '../models/Course.js';
import { Progress } from '../models/Progress.js';
import { User } from '../models/User.js';
import { accessSummary, coursePricing } from '../utils/coursePricing.js';

export const isEnrollmentActive = (enrollment) =>
  Boolean(
    enrollment &&
      enrollment.status === 'active' &&
      (!enrollment.expiresAt || enrollment.expiresAt > new Date())
  );

export const hasCourseAccess = async ({ user, courseId }) => {
  if (!user || !courseId) return false;
  if (user.role === 'admin') return true;

  const enrollment = await Enrollment.findOne({
    user: user._id,
    course: courseId,
    status: 'active',
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }]
  });

  return isEnrollmentActive(enrollment);
};

export const grantCourseAccess = async ({ userId, course, order, source = 'payment_webhook', price }) => {
  const access = accessSummary(course);
  const pricing = coursePricing(course);
  const accessType = access.type === 'limited' ? 'limited' : 'lifetime';
  const expiresAt =
    access.type === 'limited' && access.days
      ? new Date(Date.now() + access.days * 24 * 60 * 60 * 1000)
      : undefined;
  const existing = await Enrollment.findOne({ user: userId, course: course._id });

  const enrollment = await Enrollment.findOneAndUpdate(
    { user: userId, course: course._id },
    {
      $set: {
        user: userId,
        course: course._id,
        order: order?._id,
        accessType,
        accessDurationDays: access.days,
        purchasedPrice: Number(price ?? order?.amount ?? pricing.finalPrice ?? 0),
        currency: course.currency || 'USD',
        status: 'active',
        startsAt: new Date(),
        expiresAt,
        source,
        revokedAt: undefined,
        revokeReason: undefined
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Promise.all([
    User.findByIdAndUpdate(userId, { $addToSet: { ownedCourses: course._id } }),
    !isEnrollmentActive(existing)
      ? Course.findByIdAndUpdate(course._id, { $inc: { studentsEnrolled: 1 } })
      : Promise.resolve(),
    Progress.findOneAndUpdate(
      { user: userId, course: course._id },
      { $setOnInsert: { user: userId, course: course._id, percentComplete: 0 } },
      { upsert: true, new: true }
    )
  ]);

  return enrollment;
};
