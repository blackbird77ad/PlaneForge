import { articles as catalogArticles, consultants as catalogConsultants, courses as catalogCourses } from '../../../client/src/data/catalog.js';
import { connectDb } from '../config/db.js';
import { AuthSession } from '../models/AuthSession.js';
import { BlogPost } from '../models/BlogPost.js';
import { Certificate } from '../models/Certificate.js';
import { Consultation } from '../models/Consultation.js';
import { ContactInquiry } from '../models/ContactInquiry.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { LoginChallenge } from '../models/LoginChallenge.js';
import { NewsletterSubscription } from '../models/NewsletterSubscription.js';
import { Order } from '../models/Order.js';
import { PasswordResetChallenge } from '../models/PasswordResetChallenge.js';
import { Progress } from '../models/Progress.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { User } from '../models/User.js';

await connectDb();

const passwordHash = await User.hashPassword('Password123!');
const planeforgeConsultantProfile = catalogConsultants[0];

await Promise.all([
  AuthSession.deleteMany({}),
  BlogPost.deleteMany({}),
  Certificate.deleteMany({}),
  Consultation.deleteMany({}),
  ContactInquiry.deleteMany({}),
  Course.deleteMany({}),
  Enrollment.deleteMany({}),
  LoginChallenge.deleteMany({}),
  NewsletterSubscription.deleteMany({}),
  Order.deleteMany({}),
  PasswordResetChallenge.deleteMany({}),
  Progress.deleteMany({}),
  SystemSetting.deleteMany({}),
  User.deleteMany({})
]);

const users = await User.insertMany([
  {
    name: 'Maya Okafor',
    email: 'student@planeforge.test',
    passwordHash,
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    title: 'PCB Design Learner',
    profile: {
      country: 'Ghana',
      organization: 'BridgeWorks Studio'
    }
  },
  {
    name: planeforgeConsultantProfile.name,
    email: 'consultant@planeforge.test',
    passwordHash,
    role: 'consultant',
    avatar: planeforgeConsultantProfile.avatar,
    title: planeforgeConsultantProfile.title,
    specialty: planeforgeConsultantProfile.specialty,
    bio: planeforgeConsultantProfile.bio,
    qualifications: planeforgeConsultantProfile.qualifications,
    experienceYears: planeforgeConsultantProfile.experienceYears,
    consultationFee: planeforgeConsultantProfile.consultationFee,
    languages: planeforgeConsultantProfile.languages,
    availability: planeforgeConsultantProfile.availability
  },
  {
    name: 'Nora Patel',
    email: 'partner@planeforge.test',
    passwordHash,
    role: 'partner',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    title: 'Training Partnerships Lead',
    partnerCode: 'PF-PARTNER-NORA'
  },
  {
    name: 'PlaneForge Admin',
    email: 'admin@planeforge.test',
    passwordHash,
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    title: 'Platform Administrator'
  }
]);

const [student, planeforgeConsultant, , admin] = users;

const coursePayloads = catalogCourses.map(({ id, _id, instructor, ...course }) => ({
  ...course,
  instructor: planeforgeConsultant._id,
  instructorName: planeforgeConsultant.name,
  modules: (course.modules || []).map((module) => ({
    ...module,
    lessons: (module.lessons || []).map((lesson) => ({
      ...lesson,
      stream: {
        provider: 'unconfigured',
        status: 'not_uploaded',
        signedPlaybackRequired: true
      }
    }))
  })),
  reviews: (course.reviews || []).map((review) => ({
    studentName: review.studentName,
    avatar: review.avatar,
    occupation: review.occupation,
    rating: review.rating,
    comment: review.comment
  }))
}));

const courses = await Course.create(coursePayloads);

await User.findByIdAndUpdate(student._id, { $addToSet: { ownedCourses: courses[0]._id } });
await Enrollment.create({
  user: student._id,
  course: courses[0]._id,
  accessType: 'one_time',
  status: 'active',
  source: 'admin'
});
await Progress.create({
  user: student._id,
  course: courses[0]._id,
  completedLessons: [
    {
      moduleId: courses[0].modules[0]._id.toString(),
      lessonId: courses[0].modules[0].lessons[0]._id.toString(),
      completedAt: new Date()
    }
  ],
  percentComplete: 8,
  lastAccessedAt: new Date()
});

await BlogPost.create(
  catalogArticles.map(({ id, _id, ...article }) => ({
    ...article,
    author: article.category === 'Consulting' ? planeforgeConsultant._id : admin._id
  }))
);

await SystemSetting.create({
  key: 'platform',
  description: 'Default commercial settings',
  value: {
    consultationCurrency: 'USD',
    certificateIssuer: 'PlaneForge Academy',
    newsletterEnabled: true,
    launchLearnerCapacity: 100
  }
});

await Consultation.create({
  student: student._id,
  consultant: planeforgeConsultant._id,
  service: 'PCB project review and build planning',
  category: 'PCB Design & Hardware Engineering',
  scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
  durationMinutes: 60,
  amount: planeforgeConsultant.consultationFee,
  provider: 'mock',
  paymentRef: `seed_${Date.now()}`,
  status: 'confirmed',
  notes: 'Review company PCB project scope, research needs, board architecture, and bring-up risks.'
});

console.log(`PlaneForge PCB seed data created with ${courses.length} courses.`);
console.log('Demo accounts use Password123!');
console.log('student@planeforge.test | consultant@planeforge.test | partner@planeforge.test | admin@planeforge.test');

process.exit(0);
