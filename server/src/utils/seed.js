import { connectDb } from '../config/db.js';
import { env } from '../config/env.js';
import { AuthSession } from '../models/AuthSession.js';
import { BlogPost } from '../models/BlogPost.js';
import { CartItem } from '../models/CartItem.js';
import { Certificate } from '../models/Certificate.js';
import { Consultation } from '../models/Consultation.js';
import { ContactInquiry } from '../models/ContactInquiry.js';
import { Course } from '../models/Course.js';
import { CourseComment } from '../models/CourseComment.js';
import { Enrollment } from '../models/Enrollment.js';
import { LoginChallenge } from '../models/LoginChallenge.js';
import { NewsletterSubscription } from '../models/NewsletterSubscription.js';
import { Order } from '../models/Order.js';
import { PasswordResetChallenge } from '../models/PasswordResetChallenge.js';
import { Progress } from '../models/Progress.js';
import { Product } from '../models/Product.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { User } from '../models/User.js';

const catalogConsultants = [
  {
    name: 'Honu Evans',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    title: 'Principal PCB Design Consultant',
    specialty: 'PCB Design & Hardware Engineering',
    bio:
      'Honu helps learners and product teams move from rough board ideas to review-ready schematics, layouts, and bring-up plans.',
    qualifications: ['PCB Design', 'Embedded Hardware', 'DFM Review', 'Board Bring-Up'],
    experienceYears: 14,
    consultationFee: 250,
    languages: ['English'],
    availability: [
      { day: 'Tuesday', slots: ['10:00', '14:00'] },
      { day: 'Thursday', slots: ['09:00', '15:00'] }
    ]
  }
];

const lessonSet = (courseTitle) => [
  {
    title: 'Project Brief and Board Architecture',
    description: `Define the constraints, blocks, components, and design choices for ${courseTitle}.`,
    order: 1,
    lessons: [
      {
        title: `What ${courseTitle} teaches`,
        duration: '10 min',
        durationSeconds: 600,
        isPreview: true,
        order: 1,
        resources: [{ label: 'Project brief checklist', type: 'pdf', downloadable: true }]
      },
      {
        title: 'Requirements, block diagram, and bill of materials',
        duration: '18 min',
        durationSeconds: 1080,
        order: 2
      }
    ]
  },
  {
    title: 'Schematic, Layout, Fabrication, and Bring-Up',
    description: 'Move from schematic capture to routing, DFM review, output generation, and test planning.',
    order: 2,
    lessons: [
      {
        title: 'Schematic capture and electrical review',
        duration: '26 min',
        durationSeconds: 1560,
        order: 1
      },
      {
        title: 'Layout review and release package',
        duration: '32 min',
        durationSeconds: 1920,
        order: 2
      }
    ]
  }
];

const catalogCourses = [
  {
    title: 'PCB Design Fundamentals',
    subtitle: 'Build clean two-layer boards from schematic to fabrication files.',
    description:
      'A practical beginner path for learning component selection, schematic capture, PCB layout, and manufacturing outputs.',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=84',
    bannerImage: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1400&q=84',
    category: 'PCB Design',
    discipline: 'Hardware Engineering',
    difficulty: 'Beginner',
    price: 79,
    currency: 'USD',
    purchaseType: 'one_time',
    duration: '4h 30m',
    language: 'English',
    rating: 4.8,
    studentsEnrolled: 184,
    outcomes: ['Create a schematic', 'Route a two-layer PCB', 'Export fabrication files'],
    skills: ['KiCad', 'PCB Layout', 'DFM', 'Board Bring-Up'],
    requirements: ['Basic electronics curiosity', 'A laptop that can run PCB design software'],
    targetAudience: ['Students', 'Makers', 'Early-career hardware engineers'],
    modules: lessonSet('PCB Design Fundamentals'),
    isFeatured: true,
    certificateAvailable: true
  },
  {
    title: 'STM32 Hardware Project Lab',
    subtitle: 'Design and review an embedded controller board around STM32.',
    description:
      'An intermediate project course covering MCU support circuitry, power rails, programming headers, IO planning, and test strategy.',
    thumbnail: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1000&q=84',
    bannerImage: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1400&q=84',
    category: 'Embedded Systems',
    discipline: 'Hardware Engineering',
    difficulty: 'Intermediate',
    price: 129,
    currency: 'USD',
    purchaseType: 'one_time',
    duration: '6h 10m',
    language: 'English',
    rating: 4.7,
    studentsEnrolled: 96,
    outcomes: ['Plan MCU pin usage', 'Design power and programming sections', 'Prepare a bring-up checklist'],
    skills: ['STM32', 'Schematic Review', 'Power Integrity', 'Debug Headers'],
    requirements: ['Comfort with schematic symbols', 'Basic PCB routing experience'],
    targetAudience: ['Embedded developers', 'Robotics teams', 'Hardware founders'],
    modules: lessonSet('STM32 Hardware Project Lab'),
    isFeatured: true,
    certificateAvailable: true
  },
  {
    title: 'CPLD Board Design Capstone',
    subtitle: 'Take a programmable logic board from specification to release review.',
    description:
      'A capstone course for advanced learners who need a rigorous hardware review flow for programmable logic projects.',
    thumbnail: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1000&q=84',
    bannerImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=84',
    category: 'Programmable Logic',
    discipline: 'Digital Hardware',
    difficulty: 'Capstone',
    price: 199,
    currency: 'USD',
    purchaseType: 'subscription',
    subscriptionDurationDays: 180,
    duration: '8h 45m',
    language: 'English',
    rating: 4.9,
    studentsEnrolled: 51,
    outcomes: ['Scope a CPLD board', 'Review clock/reset strategy', 'Prepare release documentation'],
    skills: ['CPLD', 'Digital Design', 'Signal Planning', 'Release Review'],
    requirements: ['Prior board project experience', 'Ability to read component datasheets'],
    targetAudience: ['Advanced learners', 'Digital hardware engineers', 'Product teams'],
    modules: lessonSet('CPLD Board Design Capstone'),
    isFeatured: false,
    certificateAvailable: true
  }
];

const catalogArticles = [
  {
    title: 'How to Review a PCB Before Fabrication',
    excerpt: 'A practical checklist for catching avoidable board issues before you release manufacturing files.',
    body:
      'A good pre-fabrication review checks constraints, power, connectors, mechanical fit, footprints, test points, and fabrication outputs before the board leaves your desk.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=84',
    category: 'PCB Design',
    readingTime: '6 min',
    status: 'published'
  },
  {
    title: 'Planning a Useful Hardware Bring-Up Session',
    excerpt: 'The work you do before powering the board often decides how quickly the first prototype comes alive.',
    body:
      'Bring-up plans should include inspection steps, current-limited power checks, rail measurements, programming flow, IO tests, and a log of expected observations.',
    image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1000&q=84',
    category: 'Consulting',
    readingTime: '5 min',
    status: 'published'
  },
  {
    title: 'What Makes Project-Based PCB Training Stick',
    excerpt: 'Learners retain more when every lesson moves a real board closer to fabrication.',
    body:
      'Project-based training gives learners a repeated workflow: clarify requirements, design, review, export, test, and reflect.',
    image: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1000&q=84',
    category: 'Learning',
    readingTime: '4 min',
    status: 'draft'
  }
];

const catalogProducts = [
  {
    title: 'PCB Bring-Up Checklist Pack',
    description: 'A printable checklist pack for first-power, rail measurements, programming, and issue logging.',
    category: 'Templates',
    sku: 'PF-CHECKLIST-001',
    productType: 'digital',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=84',
    images: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=84'],
    price: 19,
    currency: 'USD',
    status: 'published',
    isFeatured: true
  },
  {
    title: 'Starter PCB Review Kit',
    description: 'A small hardware review kit for practicing schematic checks, layout notes, and board bring-up planning.',
    category: 'Hardware Kits',
    sku: 'PF-KIT-STARTER',
    productType: 'physical',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=84',
    images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=84'],
    price: 49,
    currency: 'USD',
    inventory: {
      track: true,
      quantity: 25
    },
    status: 'published'
  }
];

if (env.demoBackend) {
  console.log('DEMO_BACKEND=true; Mongo seed skipped because the demo backend uses in-memory data.');
  console.log('Set DEMO_BACKEND=false and run npm run seed when you want to seed MongoDB.');
  process.exit(0);
}

await connectDb();

const passwordHash = await User.hashPassword('Password123!');
const planeforgeConsultantProfile = catalogConsultants[0];

await Promise.all([
  AuthSession.deleteMany({}),
  BlogPost.deleteMany({}),
  CartItem.deleteMany({}),
  Certificate.deleteMany({}),
  Consultation.deleteMany({}),
  ContactInquiry.deleteMany({}),
  Course.deleteMany({}),
  CourseComment.deleteMany({}),
  Enrollment.deleteMany({}),
  LoginChallenge.deleteMany({}),
  NewsletterSubscription.deleteMany({}),
  Order.deleteMany({}),
  PasswordResetChallenge.deleteMany({}),
  Progress.deleteMany({}),
  Product.deleteMany({}),
  SystemSetting.deleteMany({}),
  User.deleteMany({})
]);

const users = await User.insertMany([
  {
    name: 'Maya Okafor',
    email: 'student@planeforge.test',
    contactNumber: '+233 555 010 100',
    dateOfBirth: new Date('2001-05-14T00:00:00.000Z'),
    passwordHash,
    role: 'user',
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
    contactNumber: '+233 555 010 200',
    dateOfBirth: new Date('1987-11-08T00:00:00.000Z'),
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
    contactNumber: '+233 555 010 300',
    dateOfBirth: new Date('1990-02-22T00:00:00.000Z'),
    passwordHash,
    role: 'partner',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    title: 'Training Partnerships Lead',
    partnerCode: 'PF-PARTNER-NORA',
    commissionRate: 8
  },
  {
    name: 'PlaneForge Admin',
    email: 'admin@planeforge.test',
    contactNumber: '+233 555 010 400',
    dateOfBirth: new Date('1985-09-12T00:00:00.000Z'),
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
const products = await Product.create(catalogProducts);

await User.findByIdAndUpdate(student._id, { $addToSet: { ownedCourses: courses[0]._id } });
const paidOrder = await Order.create({
  user: student._id,
  course: courses[0]._id,
  amount: courses[0].price,
  currency: courses[0].currency,
  provider: 'mock',
  status: 'paid',
  paymentRef: `seed_paid_${Date.now()}`,
  couponCode: 'FORGE10',
  invoiceNumber: 'PF-SEED-PAID-001',
  verifiedAt: new Date(),
  accessGrantedAt: new Date(),
  invoice: {
    customerName: student.name,
    customerEmail: student.email,
    itemName: courses[0].title,
    issuedAt: new Date(),
    html: `<h1>PlaneForge Invoice PF-SEED-PAID-001</h1><p>${courses[0].title}</p>`
  }
});

await Order.create([
  {
    user: student._id,
    course: courses[1]?._id || courses[0]._id,
    amount: courses[1]?.price || courses[0].price,
    currency: courses[1]?.currency || courses[0].currency,
    provider: 'mock',
    status: 'payment_initialized',
    paymentRef: `seed_pending_${Date.now()}`,
    invoiceNumber: 'PF-SEED-PENDING-001',
    invoice: {
      customerName: student.name,
      customerEmail: student.email,
      itemName: courses[1]?.title || courses[0].title,
      issuedAt: new Date(),
      html: `<h1>PlaneForge Invoice PF-SEED-PENDING-001</h1><p>${courses[1]?.title || courses[0].title}</p>`
    }
  },
  {
    user: student._id,
    course: courses[2]?._id || courses[0]._id,
    amount: courses[2]?.price || courses[0].price,
    currency: courses[2]?.currency || courses[0].currency,
    provider: 'mock',
    status: 'refunded',
    paymentRef: `seed_refunded_${Date.now()}`,
    invoiceNumber: 'PF-SEED-REFUND-001',
    verifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    invoice: {
      customerName: student.name,
      customerEmail: student.email,
      itemName: courses[2]?.title || courses[0].title,
      issuedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
      html: `<h1>PlaneForge Invoice PF-SEED-REFUND-001</h1><p>${courses[2]?.title || courses[0].title}</p>`
    }
  }
]);

await Enrollment.create({
  user: student._id,
  course: courses[0]._id,
  order: paidOrder._id,
  accessType: 'one_time',
  status: 'active',
  source: 'mock_verification'
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

await CartItem.create({
  user: student._id,
  itemType: 'course',
  course: courses[1]._id,
  quantity: 1,
  unitPrice: courses[1].price,
  currency: courses[1].currency,
  status: 'active',
  source: 'course_detail'
});

await CartItem.create({
  user: student._id,
  itemType: 'product',
  product: products[0]._id,
  productName: products[0].title,
  quantity: 1,
  unitPrice: products[0].price,
  currency: products[0].currency,
  status: 'active',
  source: 'product_catalog'
});

await CourseComment.create({
  user: student._id,
  course: courses[0]._id,
  lessonId: courses[0].modules[0].lessons[0]._id.toString(),
  lessonTitle: courses[0].modules[0].lessons[0].title,
  message: 'Can you explain how to decide trace width before sending the board for fabrication?',
  source: 'tutor_request'
});

await BlogPost.create(
  catalogArticles.map(({ id, _id, ...article }) => ({
    ...article,
    author: article.category === 'Consulting' ? planeforgeConsultant._id : admin._id
  }))
);

await NewsletterSubscription.create([
  {
    email: 'maya.okafor@example.com',
    source: 'course_launch',
    status: 'active'
  },
  {
    email: 'ops@bridgeworks.example',
    source: 'enterprise_training',
    status: 'active'
  },
  {
    email: 'old.subscriber@example.com',
    source: 'website',
    status: 'unsubscribed'
  }
]);

await ContactInquiry.create([
  {
    intent: 'course_support',
    topic: 'Course access',
    name: 'Maya Okafor',
    email: 'student@planeforge.test',
    organization: 'BridgeWorks Studio',
    role: 'Electrical engineering student',
    subject: 'Need help opening a lesson stream',
    message: 'The checkout completed and I want to confirm my course stream is unlocked.',
    status: 'new',
    priority: 'normal'
  },
  {
    intent: 'b2b',
    topic: 'Enterprise training',
    name: 'Nora Patel',
    email: 'partner@planeforge.test',
    organization: 'Northline Automation',
    role: 'Training partnerships lead',
    subject: 'Request for a company PCB training plan',
    message: 'We want a blended course and consultation package for a team of embedded engineers.',
    status: 'in_review',
    priority: 'high'
  },
  {
    intent: 'consulting',
    topic: 'PCB design review',
    name: 'Samuel Reed',
    email: 'samuel.reed@example.com',
    organization: 'Prototype Works',
    role: 'Hardware founder',
    subject: 'Board bring-up risk review',
    message: 'We need an expert to review our schematic and layout before fabrication.',
    status: 'responded',
    priority: 'high'
  },
  {
    intent: 'general',
    topic: 'Certification',
    name: 'Aisha Mensah',
    email: 'aisha.mensah@example.com',
    organization: '',
    role: 'Learner',
    subject: 'Certificate requirements',
    message: 'Can I earn a certificate after finishing the full course?',
    status: 'closed',
    priority: 'low'
  }
]);

await SystemSetting.create([
  {
    key: 'platform',
    description: 'Default commercial settings',
    value: {
      consultationCurrency: 'USD',
      certificateIssuer: 'PlaneForge Academy',
      newsletterEnabled: true,
      launchLearnerCapacity: 100
    }
  },
  {
    key: 'payments',
    description: 'Local payment gateway preferences',
    value: {
      defaultProvider: 'mock',
      acceptedProviders: ['stripe', 'paystack', 'mock'],
      couponCodes: ['FORGE10']
    }
  },
  {
    key: 'support',
    description: 'Admin inbox routing rules',
    value: {
      highPriorityIntents: ['b2b', 'consulting', 'collaboration', 'partnership'],
      responseTargetHours: 24
    }
  }
]);

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
console.log('Test accounts use Password123!');
console.log('student@planeforge.test | consultant@planeforge.test | partner@planeforge.test | admin@planeforge.test');
console.log('Local dev login codes are returned in the API response when RESEND_API_KEY is empty.');

process.exit(0);
