import { BlogPost } from '../models/BlogPost.js';
import { Course } from '../models/Course.js';
import { NewsletterSubscription } from '../models/NewsletterSubscription.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const homepage = asyncHandler(async (req, res) => {
  const [featuredCourses, consultants, articles] = await Promise.all([
    Course.find({ status: 'published', isFeatured: true }).limit(6).sort({ createdAt: -1 }),
    User.find({ role: 'consultant', status: 'active' })
      .select('name avatar title specialty experienceYears consultationFee')
      .limit(4),
    BlogPost.find({ status: 'published' }).limit(3).sort({ publishedAt: -1 })
  ]);

  res.json({ featuredCourses, consultants, articles });
});

export const listArticles = asyncHandler(async (req, res) => {
  const articles = await BlogPost.find({ status: 'published' }).sort({ publishedAt: -1 });
  res.json({ articles });
});

export const subscribeNewsletter = asyncHandler(async (req, res) => {
  const { email, source = 'website' } = req.body;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email || '')) {
    throw new ApiError(400, 'A valid email address is required');
  }

  await NewsletterSubscription.findOneAndUpdate(
    { email },
    { email, source, status: 'active' },
    { upsert: true, new: true }
  );

  res.status(201).json({ message: 'Newsletter subscription confirmed' });
});
