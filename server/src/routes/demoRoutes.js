import crypto from 'crypto';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import slugify from 'slugify';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const demoRoutes = Router();

const demoPassword = 'Password123!';
const demoCode = '123456';
const demoAdminSetupCode = env.auth.adminSetupCode || 'PLANEFORGE-ADMIN-2026';

const roles = ['user', 'student', 'consultant', 'partner', 'admin'];
const adminCreatedRoles = ['user', 'consultant', 'partner'];
const userStatuses = ['active', 'suspended', 'pending'];
const inquiryStatuses = ['new', 'in_review', 'responded', 'closed'];
const inquiryPriorities = ['low', 'normal', 'high'];
const consultationStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
const orderStatuses = ['pending', 'payment_initialized', 'verified', 'paid', 'failed', 'refunded'];
const articleStatuses = ['draft', 'published'];
const productStatuses = ['draft', 'published', 'archived'];
const productTypes = ['physical', 'digital'];

const id = () => crypto.randomBytes(12).toString('hex');
const now = () => new Date();
const iso = (date = now()) => date.toISOString();
const future = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const clone = (value) => JSON.parse(JSON.stringify(value));

const makeSlug = (value) => slugify(value || `record-${Date.now()}`, { lower: true, strict: true });

const withDates = (record, daysAgo = 0) => ({
  ...record,
  createdAt: iso(new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)),
  updatedAt: iso()
});

const normalizeRole = (role) =>
  !role || ['learner', 'student', 'buyer'].includes(role) ? 'user' : role;
const accessRole = (role) => (['student', 'learner', 'buyer'].includes(role) ? 'user' : role);

const getDeviceId = (req) => {
  const value = req.headers['x-device-id'] || req.body?.deviceId || req.query?.deviceId;
  return Array.isArray(value) ? value[0] : value;
};

const publicUser = (user) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  contactNumber: user.contactNumber,
  dateOfBirth: user.dateOfBirth,
  role: accessRole(user.role),
  status: user.status,
  avatar: user.avatar,
  title: user.title,
  specialty: user.specialty,
  bio: user.bio,
  qualifications: user.qualifications || [],
  experienceYears: user.experienceYears || 0,
  consultationFee: user.consultationFee || 0,
  languages: user.languages || ['English'],
  availability: user.availability || [],
  ownedCourses: user.ownedCourses || [],
  partnerCode: user.partnerCode,
  commissionRate: user.commissionRate || 0,
  profile: user.profile || {},
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  lastLoginAt: user.lastLoginAt
});

const lessonSet = (courseTitle) => [
  {
    _id: id(),
    title: 'Project Brief and Board Architecture',
    description: `Define the constraints, blocks, components, and design choices for ${courseTitle}.`,
    order: 1,
    lessons: [
      {
        _id: id(),
        title: `What ${courseTitle} teaches`,
        description: 'Set up the project goals, scope, and review criteria.',
        duration: '10 min',
        durationSeconds: 600,
        isPreview: true,
        order: 1,
        stream: {
          provider: 'unconfigured',
          status: 'not_uploaded',
          signedPlaybackRequired: true,
          allowDownloads: false
        },
        resources: [{ label: 'Project brief checklist', type: 'pdf', downloadable: true }]
      },
      {
        _id: id(),
        title: 'Requirements, block diagram, and bill of materials',
        description: 'Translate project requirements into a clear architecture and BOM.',
        duration: '18 min',
        durationSeconds: 1080,
        isPreview: false,
        order: 2,
        stream: {
          provider: 'unconfigured',
          status: 'not_uploaded',
          signedPlaybackRequired: true,
          allowDownloads: false
        },
        resources: []
      }
    ]
  },
  {
    _id: id(),
    title: 'Schematic, Layout, Fabrication, and Bring-Up',
    description: 'Move from schematic capture to routing, DFM review, output generation, and test planning.',
    order: 2,
    lessons: [
      {
        _id: id(),
        title: 'Schematic capture and electrical review',
        description: 'Review nets, power flow, connectors, and datasheet requirements.',
        duration: '26 min',
        durationSeconds: 1560,
        isPreview: false,
        order: 1,
        stream: {
          provider: 'unconfigured',
          status: 'not_uploaded',
          signedPlaybackRequired: true,
          allowDownloads: false
        },
        resources: []
      },
      {
        _id: id(),
        title: 'Layout review and release package',
        description: 'Check footprints, routing, mechanical constraints, and release files.',
        duration: '32 min',
        durationSeconds: 1920,
        isPreview: false,
        order: 2,
        stream: {
          provider: 'unconfigured',
          status: 'not_uploaded',
          signedPlaybackRequired: true,
          allowDownloads: false
        },
        resources: []
      }
    ]
  }
];

const users = [
  withDates({
    _id: id(),
    name: 'Maya Okafor',
    email: 'student@planeforge.test',
    contactNumber: '+233 555 010 100',
    dateOfBirth: '2001-05-14',
    password: demoPassword,
    role: 'user',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    title: 'PCB Design Learner',
    ownedCourses: [],
    profile: {
      country: 'Ghana',
      organization: 'BridgeWorks Studio'
    }
  }, 18),
  withDates({
    _id: id(),
    name: 'Honu Evans',
    email: 'consultant@planeforge.test',
    contactNumber: '+233 555 010 200',
    dateOfBirth: '1987-11-08',
    password: demoPassword,
    role: 'consultant',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    title: 'Principal PCB Design Consultant',
    specialty: 'PCB Design & Hardware Engineering',
    bio: 'Honu helps teams move from rough board ideas to review-ready schematics, layouts, and bring-up plans.',
    qualifications: ['PCB Design', 'Embedded Hardware', 'DFM Review', 'Board Bring-Up'],
    experienceYears: 14,
    consultationFee: 250,
    languages: ['English'],
    availability: [
      { day: 'Tuesday', slots: ['10:00', '14:00'] },
      { day: 'Thursday', slots: ['09:00', '15:00'] }
    ],
    ownedCourses: [],
    profile: {}
  }, 16),
  withDates({
    _id: id(),
    name: 'Nora Patel',
    email: 'partner@planeforge.test',
    contactNumber: '+233 555 010 300',
    dateOfBirth: '1990-02-22',
    password: demoPassword,
    role: 'partner',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    title: 'Training Partnerships Lead',
    partnerCode: 'PF-PARTNER-NORA',
    commissionRate: 8,
    ownedCourses: [],
    profile: {}
  }, 14),
  withDates({
    _id: id(),
    name: 'PlaneForge Admin',
    email: 'admin@planeforge.test',
    contactNumber: '+233 555 010 400',
    dateOfBirth: '1985-09-12',
    password: demoPassword,
    role: 'admin',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    title: 'Platform Administrator',
    ownedCourses: [],
    profile: {}
  }, 12)
];

const consultant = users.find((user) => user.role === 'consultant');
const student = users.find((user) => accessRole(user.role) === 'user');

const courses = [
  withDates({
    _id: id(),
    title: 'PCB Design Fundamentals',
    slug: 'pcb-design-fundamentals',
    subtitle: 'Build clean two-layer boards from schematic to fabrication files.',
    description: 'A practical beginner path for component selection, schematic capture, PCB layout, and manufacturing outputs.',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=84',
    bannerImage: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1400&q=84',
    category: 'PCB Design',
    discipline: 'Hardware Engineering',
    difficulty: 'Beginner',
    instructor: consultant._id,
    instructorName: consultant.name,
    language: 'English',
    price: 79,
    currency: 'USD',
    purchaseType: 'one_time',
    subscriptionDurationDays: null,
    duration: '4h 30m',
    rating: 4.8,
    studentsEnrolled: 184,
    outcomes: ['Create a schematic', 'Route a two-layer PCB', 'Export fabrication files'],
    skills: ['KiCad', 'PCB Layout', 'DFM', 'Board Bring-Up'],
    requirements: ['Basic electronics curiosity', 'A laptop that can run PCB design software'],
    targetAudience: ['Students', 'Makers', 'Early-career hardware engineers'],
    modules: lessonSet('PCB Design Fundamentals'),
    resources: [],
    isFeatured: true,
    certificateAvailable: true,
    lastUpdated: iso(),
    status: 'published'
  }, 10),
  withDates({
    _id: id(),
    title: 'STM32 Hardware Project Lab',
    slug: 'stm32-hardware-project-lab',
    subtitle: 'Design and review an embedded controller board around STM32.',
    description: 'An intermediate project course covering MCU support circuitry, power rails, programming headers, IO planning, and test strategy.',
    thumbnail: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1000&q=84',
    bannerImage: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1400&q=84',
    category: 'Embedded Systems',
    discipline: 'Hardware Engineering',
    difficulty: 'Intermediate',
    instructor: consultant._id,
    instructorName: consultant.name,
    language: 'English',
    price: 129,
    currency: 'USD',
    purchaseType: 'one_time',
    subscriptionDurationDays: null,
    duration: '6h 10m',
    rating: 4.7,
    studentsEnrolled: 96,
    outcomes: ['Plan MCU pin usage', 'Design power and programming sections', 'Prepare a bring-up checklist'],
    skills: ['STM32', 'Schematic Review', 'Power Integrity', 'Debug Headers'],
    requirements: ['Comfort with schematic symbols', 'Basic PCB routing experience'],
    targetAudience: ['Embedded developers', 'Robotics teams', 'Hardware founders'],
    modules: lessonSet('STM32 Hardware Project Lab'),
    resources: [],
    isFeatured: true,
    certificateAvailable: true,
    lastUpdated: iso(),
    status: 'published'
  }, 8),
  withDates({
    _id: id(),
    title: 'CPLD Board Design Capstone',
    slug: 'cpld-board-design-capstone',
    subtitle: 'Take a programmable logic board from specification to release review.',
    description: 'A capstone course for advanced learners who need a rigorous review flow for programmable logic projects.',
    thumbnail: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1000&q=84',
    bannerImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=84',
    category: 'Programmable Logic',
    discipline: 'Digital Hardware',
    difficulty: 'Capstone',
    instructor: consultant._id,
    instructorName: consultant.name,
    language: 'English',
    price: 199,
    currency: 'USD',
    purchaseType: 'subscription',
    subscriptionDurationDays: 180,
    duration: '8h 45m',
    rating: 4.9,
    studentsEnrolled: 51,
    outcomes: ['Scope a CPLD board', 'Review clock/reset strategy', 'Prepare release documentation'],
    skills: ['CPLD', 'Digital Design', 'Signal Planning', 'Release Review'],
    requirements: ['Prior board project experience', 'Ability to read component datasheets'],
    targetAudience: ['Advanced learners', 'Digital hardware engineers', 'Product teams'],
    modules: lessonSet('CPLD Board Design Capstone'),
    resources: [],
    isFeatured: false,
    certificateAvailable: true,
    lastUpdated: iso(),
    status: 'draft'
  }, 6)
];

let products = [
  withDates({
    _id: id(),
    title: 'PCB Review Checklist Pack',
    slug: 'pcb-review-checklist-pack',
    description: 'Downloadable design review templates for schematic checks, layout checks, BOM readiness, and fabrication release.',
    category: 'Templates',
    sku: 'PF-DIG-PCB-CHECKLIST',
    productType: 'digital',
    thumbnail: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=84',
    images: ['https://images.unsplash.com/photo-1581092335878-6f8fa22b578f?auto=format&fit=crop&w=1400&q=84'],
    price: 39,
    currency: 'USD',
    inventory: { track: false, quantity: 0 },
    status: 'published',
    isFeatured: true,
    soldCount: 18
  }, 4),
  withDates({
    _id: id(),
    title: 'Hardware Bring-Up Lab Kit',
    slug: 'hardware-bring-up-lab-kit',
    description: 'A starter bench kit for PCB bring-up practice, including test leads, labeled jumpers, and project check sheets.',
    category: 'Lab Kits',
    sku: 'PF-KIT-BRINGUP-01',
    productType: 'physical',
    thumbnail: 'https://images.unsplash.com/photo-1581091215367-59ab6d01a44c?auto=format&fit=crop&w=1000&q=84',
    images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=84'],
    price: 149,
    currency: 'USD',
    inventory: { track: true, quantity: 24 },
    status: 'published',
    isFeatured: false,
    soldCount: 6
  }, 2)
];

student.ownedCourses = [courses[0]._id];

let orders = [
  withDates({
    _id: id(),
    user: student._id,
    itemType: 'course',
    course: courses[0]._id,
    quantity: 1,
    amount: 71.1,
    currency: 'USD',
    provider: 'mock',
    status: 'paid',
    paymentRef: `demo_paid_${Date.now()}`,
    couponCode: 'FORGE10',
    accessGrantedAt: iso(),
    verifiedAt: iso(),
    invoiceNumber: 'PF-DEMO-PAID-001',
    invoice: {
      customerName: student.name,
      customerEmail: student.email,
      itemName: courses[0].title,
      issuedAt: iso(),
      html: '<h1>PlaneForge Invoice PF-DEMO-PAID-001</h1>'
    }
  }, 5),
  withDates({
    _id: id(),
    user: student._id,
    itemType: 'course',
    course: courses[1]._id,
    quantity: 1,
    amount: courses[1].price,
    currency: 'USD',
    provider: 'mock',
    status: 'payment_initialized',
    paymentRef: `demo_pending_${Date.now()}`,
    invoiceNumber: 'PF-DEMO-PENDING-001',
    invoice: {
      customerName: student.name,
      customerEmail: student.email,
      itemName: courses[1].title,
      issuedAt: iso(),
      html: '<h1>PlaneForge Invoice PF-DEMO-PENDING-001</h1>'
    }
  }, 3),
  withDates({
    _id: id(),
    user: student._id,
    itemType: 'product',
    product: products[0]._id,
    quantity: 1,
    amount: products[0].price,
    currency: products[0].currency,
    provider: 'mock',
    status: 'paid',
    paymentRef: `demo_product_${Date.now()}`,
    fulfilledAt: iso(),
    verifiedAt: iso(),
    invoiceNumber: 'PF-DEMO-PRODUCT-001',
    invoice: {
      customerName: student.name,
      customerEmail: student.email,
      itemName: products[0].title,
      issuedAt: iso(),
      html: '<h1>PlaneForge Invoice PF-DEMO-PRODUCT-001</h1>'
    }
  }, 3)
];

let enrollments = [
  withDates({
    _id: id(),
    user: student._id,
    course: courses[0]._id,
    order: orders[0]._id,
    accessType: 'one_time',
    status: 'active',
    startsAt: iso(),
    expiresAt: null,
    source: 'mock_verification'
  }, 5)
];

let progress = [
  withDates({
    _id: id(),
    user: student._id,
    course: courses[0]._id,
    completedLessons: [
      {
        moduleId: courses[0].modules[0]._id,
        lessonId: courses[0].modules[0].lessons[0]._id,
        watchedSeconds: 600,
        durationSeconds: 600,
        completedAt: iso()
      }
    ],
    lessonProgress: [],
    currentLesson: {
      moduleId: courses[0].modules[0]._id,
      lessonId: courses[0].modules[0].lessons[0]._id
    },
    totalTimeSeconds: 600,
    percentComplete: 25,
    lastAccessedAt: iso(),
    certificateIssued: false
  }, 4)
];

let courseComments = [
  withDates({
    _id: id(),
    user: student._id,
    course: courses[0]._id,
    lessonId: courses[0].modules[0].lessons[0]._id,
    lessonTitle: courses[0].modules[0].lessons[0].title,
    message: 'Can you explain how to decide trace width before sending the board for fabrication?',
    status: 'open',
    source: 'tutor_request'
  }, 3)
];

let cartItems = [
  withDates({
    _id: id(),
    user: student._id,
    itemType: 'course',
    course: courses[1]._id,
    quantity: 1,
    unitPrice: courses[1].price,
    currency: courses[1].currency,
    status: 'active',
    source: 'course_detail'
  }, 2),
  withDates({
    _id: id(),
    user: student._id,
    itemType: 'product',
    product: products[1]._id,
    productId: products[1]._id,
    productName: products[1].title,
    quantity: 1,
    unitPrice: products[1].price,
    currency: products[1].currency,
    status: 'active',
    source: 'product_catalog'
  }, 2)
];

let consultations = [
  withDates({
    _id: id(),
    student: student._id,
    consultant: consultant._id,
    service: 'PCB project review and build planning',
    category: 'PCB Design & Hardware Engineering',
    scheduledAt: iso(future(5)),
    durationMinutes: 60,
    amount: consultant.consultationFee,
    currency: 'USD',
    provider: 'mock',
    paymentRef: `demo_consultation_${Date.now()}`,
    status: 'confirmed',
    notes: 'Review company PCB project scope, board architecture, and bring-up risks.'
  }, 2)
];

let inquiries = [
  withDates({
    _id: id(),
    intent: 'course_support',
    topic: 'Course access',
    topicSource: 'selected',
    name: 'Maya Okafor',
    email: 'student@planeforge.test',
    organization: 'BridgeWorks Studio',
    role: 'Electrical engineering student',
    subject: 'Need help opening a lesson stream',
    message: 'The checkout completed and I want to confirm my course stream is unlocked.',
    status: 'new',
    priority: 'normal',
    source: 'contact_page'
  }, 1),
  withDates({
    _id: id(),
    intent: 'b2b',
    topic: 'Enterprise training',
    topicSource: 'selected',
    name: 'Nora Patel',
    email: 'partner@planeforge.test',
    organization: 'Northline Automation',
    role: 'Training partnerships lead',
    subject: 'Request for a company PCB training plan',
    message: 'We want a blended course and consultation package for a team of embedded engineers.',
    status: 'in_review',
    priority: 'high',
    source: 'contact_page'
  }, 2),
  withDates({
    _id: id(),
    intent: 'consulting',
    topic: 'PCB design review',
    topicSource: 'custom',
    name: 'Samuel Reed',
    email: 'samuel.reed@example.com',
    organization: 'Prototype Works',
    role: 'Hardware founder',
    subject: 'Board bring-up risk review',
    message: 'We need an expert to review our schematic and layout before fabrication.',
    status: 'responded',
    priority: 'high',
    source: 'contact_page'
  }, 4)
];

let articles = [
  withDates({
    _id: id(),
    title: 'How to Review a PCB Before Fabrication',
    slug: 'how-to-review-a-pcb-before-fabrication',
    excerpt: 'A practical checklist for catching avoidable board issues before release.',
    body: 'A useful pre-fabrication review checks constraints, power, connectors, footprints, test points, and outputs.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=84',
    category: 'PCB Design',
    readingTime: '6 min',
    author: consultant._id,
    publishedAt: iso(),
    status: 'published'
  }, 5),
  withDates({
    _id: id(),
    title: 'Planning a Useful Hardware Bring-Up Session',
    slug: 'planning-a-useful-hardware-bring-up-session',
    excerpt: 'The work before powering the board often decides how quickly the prototype comes alive.',
    body: 'Bring-up plans should include inspection, current-limited power, rail checks, programming, IO tests, and logs.',
    image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1000&q=84',
    category: 'Consulting',
    readingTime: '5 min',
    author: consultant._id,
    publishedAt: iso(),
    status: 'published'
  }, 4)
];

let settings = [
  withDates({
    _id: id(),
    key: 'platform',
    description: 'Default commercial settings',
    value: {
      consultationCurrency: 'USD',
      certificateIssuer: 'PlaneForge Academy',
      newsletterEnabled: true,
      launchLearnerCapacity: 100
    }
  }, 7),
  withDates({
    _id: id(),
    key: 'payments',
    description: 'Local payment gateway preferences',
    value: {
      defaultProvider: 'mock',
      acceptedProviders: ['stripe', 'paystack', 'mock'],
      couponCodes: ['FORGE10']
    }
  }, 7)
];

let newsletterSubscriptions = [
  withDates({ _id: id(), email: 'maya.okafor@example.com', source: 'course_launch', status: 'active' }, 11),
  withDates({ _id: id(), email: 'ops@bridgeworks.example', source: 'enterprise_training', status: 'active' }, 9)
];

let certificates = [];
const loginChallenges = new Map();
const resetChallenges = new Map();
const sessions = new Map();

const findUser = (userId) => users.find((user) => user._id === userId);
const findCourse = (courseId) => courses.find((course) => course._id === courseId || course.slug === courseId);
const findProduct = (productId) => products.find((product) => product._id === productId || product.slug === productId);
const isActiveEnrollment = (enrollment) =>
  Boolean(enrollment && enrollment.status === 'active' && (!enrollment.expiresAt || new Date(enrollment.expiresAt) > now()));

const hasCourseAccess = (user, courseId) =>
  Boolean(
    user?.role === 'admin' ||
      user?.ownedCourses?.includes(courseId) ||
      enrollments.find((enrollment) => enrollment.user === user?._id && enrollment.course === courseId && isActiveEnrollment(enrollment))
  );

const populateOrder = (order) => ({
  ...order,
  user: publicUser(findUser(order.user)),
  course: findCourse(order.course),
  product: findProduct(order.product)
});

const populateConsultation = (consultation) => ({
  ...consultation,
  student: publicUser(findUser(consultation.student)),
  consultant: publicUser(findUser(consultation.consultant))
});

const populateCourseComment = (comment) => ({
  ...comment,
  user: publicUser(findUser(comment.user)),
  course: findCourse(comment.course)
});

const populateCartItem = (item) => ({
  ...item,
  user: publicUser(findUser(item.user)),
  course: findCourse(item.course),
  product: findProduct(item.product),
  order: orders.find((order) => order._id === item.order)
});

const userForAdmin = (user) => ({
  ...publicUser(user),
  ownedCourses: (user.ownedCourses || []).map(findCourse).filter(Boolean)
});

const paginate = (items, { page = 1, limit = 25, maxLimit = 100 } = {}) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), maxLimit);
  const currentPage = Math.max(Number(page) || 1, 1);
  const total = items.length;
  const start = (currentPage - 1) * safeLimit;

  return {
    items: items.slice(start, start + safeLimit),
    pagination: {
      page: currentPage,
      limit: safeLimit,
      total,
      pages: Math.max(Math.ceil(total / safeLimit), 1)
    }
  };
};

const contains = (value, search) => String(value || '').toLowerCase().includes(String(search || '').toLowerCase());

const compactString = (value, maxLength = 240) => {
  if (value == null) return '';
  return String(value).trim().slice(0, maxLength);
};

const normalizeContactNumber = (value) => compactString(value, 80);

const parseDateOfBirth = (value) => {
  const rawDate = compactString(value, 40);
  if (!rawDate) throw new ApiError(400, 'Date of birth is required');

  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) throw new ApiError(400, 'Use a valid date of birth');

  const [year, month, day] = rawDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new ApiError(400, 'Use a valid date of birth');
  }
  if (date > now()) throw new ApiError(400, 'Date of birth cannot be in the future');

  return rawDate;
};

const sanitizeStringList = (value) => {
  if (Array.isArray(value)) return value.map((item) => compactString(item, 80)).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => compactString(item, 80)).filter(Boolean);
  return [];
};

const sanitizeAvatar = (value) => {
  const avatar = compactString(value, 1_600_000);
  if (!avatar) return '';
  if (/^https?:\/\//i.test(avatar) || /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(avatar)) {
    return avatar;
  }
  throw new ApiError(400, 'Profile image must be a valid image URL or uploaded image data');
};

const profileStringFields = {
  organization: 240,
  country: 120,
  headline: 180,
  website: 240,
  city: 120,
  learningGoal: 400,
  experienceLevel: 80
};

const sanitizeProfile = (profile = {}) => {
  if (!profile || typeof profile !== 'object') return {};

  return Object.fromEntries(
    Object.entries(profileStringFields)
      .filter(([field]) => field in profile)
      .map(([field, maxLength]) => [field, compactString(profile[field], maxLength)])
  );
};

const groupBy = (items, keyGetter) => {
  const groups = new Map();
  for (const item of items) {
    const key = keyGetter(item);
    const stringKey = JSON.stringify(key);
    groups.set(stringKey, { _id: key, count: (groups.get(stringKey)?.count || 0) + 1 });
  }
  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
};

const findLesson = (course, lessonId) => {
  for (const module of course.modules || []) {
    const lesson = module.lessons?.find((item) => item._id === lessonId);
    if (lesson) return { module, lesson };
  }
  return null;
};

const normalizeModules = (modules = []) =>
  modules.map((module, moduleIndex) => ({
    _id: module._id || id(),
    title: module.title || `Module ${moduleIndex + 1}`,
    description: module.description || '',
    order: Number(module.order) || moduleIndex + 1,
    lessons: (module.lessons || []).map((lesson, lessonIndex) => ({
      _id: lesson._id || id(),
      title: lesson.title || `Lesson ${lessonIndex + 1}`,
      description: lesson.description || '',
      duration: lesson.duration || '8 min',
      durationSeconds: Number(lesson.durationSeconds) || 0,
      isPreview: Boolean(lesson.isPreview),
      order: Number(lesson.order) || lessonIndex + 1,
      stream: {
        provider: lesson.stream?.provider || 'unconfigured',
        status: lesson.stream?.status || 'not_uploaded',
        assetId: lesson.stream?.assetId || '',
        playbackId: lesson.stream?.playbackId || '',
        uploadId: lesson.stream?.uploadId || '',
        signedPlaybackRequired: lesson.stream?.signedPlaybackRequired !== false,
        allowDownloads: Boolean(lesson.stream?.allowDownloads)
      },
      resources: Array.isArray(lesson.resources) ? lesson.resources : []
    }))
  }));

const normalizeProductRecord = (body = {}, existing = {}) => {
  const title = String(body.title ?? existing.title ?? '').trim();
  const description = String(body.description ?? existing.description ?? '').trim();
  const category = String(body.category ?? existing.category ?? '').trim();
  const status = body.status ?? existing.status ?? 'published';
  const productType = body.productType ?? existing.productType ?? 'physical';

  if (!title || !description || !category) throw new ApiError(400, 'Title, description, and category are required');
  if (!productStatuses.includes(status)) throw new ApiError(400, 'Invalid product status');
  if (!productTypes.includes(productType)) throw new ApiError(400, 'Invalid product type');

  const inventory = body.inventory && typeof body.inventory === 'object' ? body.inventory : existing.inventory || {};

  return {
    ...existing,
    title,
    slug: body.slug || existing.slug || makeSlug(title),
    description,
    category,
    sku: String(body.sku ?? existing.sku ?? '').trim(),
    productType,
    thumbnail: String(body.thumbnail ?? existing.thumbnail ?? '').trim(),
    images: Array.isArray(body.images) ? body.images.filter(Boolean) : existing.images || [],
    price: Math.max(0, Number(body.price ?? existing.price ?? 0)),
    currency: String(body.currency ?? existing.currency ?? 'USD').trim().toUpperCase(),
    inventory: {
      track: Boolean(inventory.track),
      quantity: Math.max(0, Number(inventory.quantity || 0))
    },
    status,
    isFeatured: Boolean(body.isFeatured ?? existing.isFeatured),
    soldCount: Math.max(0, Number(body.soldCount ?? existing.soldCount ?? 0))
  };
};

const grantCourseAccess = ({ userId, courseId, orderId, source = 'admin', expiresAt }) => {
  const user = findUser(userId);
  const course = findCourse(courseId);
  if (!user) throw new ApiError(404, 'User not found');
  if (!course) throw new ApiError(404, 'Course not found');

  const existing = enrollments.find((enrollment) => enrollment.user === userId && enrollment.course === course._id);
  const wasActive = isActiveEnrollment(existing);
  const next = {
    ...(existing || { _id: id(), createdAt: iso() }),
    user: userId,
    course: course._id,
    order: orderId,
    accessType: source === 'admin' ? 'admin_grant' : course.purchaseType === 'subscription' ? 'subscription' : 'one_time',
    status: 'active',
    startsAt: iso(),
    expiresAt: expiresAt || null,
    source,
    revokedAt: null,
    revokeReason: null,
    updatedAt: iso()
  };

  if (existing) enrollments = enrollments.map((enrollment) => (enrollment._id === existing._id ? next : enrollment));
  else enrollments.push(next);

  if (!user.ownedCourses.includes(course._id)) user.ownedCourses.push(course._id);
  if (!wasActive) course.studentsEnrolled = Number(course.studentsEnrolled || 0) + 1;

  if (!progress.find((item) => item.user === userId && item.course === course._id)) {
    progress.push(
      withDates({
        _id: id(),
        user: userId,
        course: course._id,
        completedLessons: [],
        lessonProgress: [],
        currentLesson: null,
        totalTimeSeconds: 0,
        percentComplete: 0,
        certificateIssued: false
      })
    );
  }

  return next;
};

const completeOrder = (order, status = 'paid') => {
  const itemType = order.itemType || 'course';
  order.status = status;
  order.verifiedAt = order.verifiedAt || iso();

  if (itemType === 'course') {
    order.accessGrantedAt = order.accessGrantedAt || iso();
    grantCourseAccess({
      userId: order.user,
      courseId: order.course,
      orderId: order._id,
      source: 'mock_verification'
    });
  } else {
    const product = findProduct(order.product);
    if (product && !order.fulfilledAt) {
      const quantity = Math.max(1, Number(order.quantity || 1));
      product.soldCount = Number(product.soldCount || 0) + quantity;
      if (product.inventory?.track) {
        product.inventory.quantity = Math.max(0, Number(product.inventory.quantity || 0) - quantity);
      }
      product.updatedAt = iso();
      order.fulfilledAt = iso();
    }
  }

  cartItems
    .filter((item) => {
      if (item.user !== order.user || item.itemType !== itemType || item.status !== 'active') return false;
      return itemType === 'product' ? item.product === order.product : item.course === order.course;
    })
    .forEach((item) => {
      item.status = 'converted';
      item.order = order._id;
      item.convertedAt = iso();
      item.updatedAt = iso();
    });
  order.updatedAt = iso();
  return order;
};

const demoProtect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : null;
  if (!token) throw new ApiError(401, 'Authentication required');

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new ApiError(401, 'Authentication required');
  }
  const session = sessions.get(decoded.sessionId);
  const user = findUser(decoded.id);
  const requestDeviceId = getDeviceId(req);

  if (
    !session ||
    !user ||
    user.status !== 'active' ||
    session.revokedAt ||
    new Date(session.expiresAt) <= now() ||
    session.deviceId !== decoded.deviceId ||
    (requestDeviceId && requestDeviceId !== decoded.deviceId)
  ) {
    throw new ApiError(401, 'Session expired. Sign in with a new email code.');
  }

  session.lastActivityAt = iso();
  req.user = user;
  req.authSession = session;
  next();
});

const demoAllowRoles = (...allowedRoles) => (req, res, next) => {
  const normalizedAllowed = allowedRoles.map(accessRole);
  if (!req.user || !normalizedAllowed.includes(accessRole(req.user.role))) {
    throw new ApiError(403, 'You do not have permission to access this resource');
  }
  next();
};

const startLoginChallenge = ({ user, req }) => {
  const deviceId = getDeviceId(req);
  if (!deviceId) throw new ApiError(400, 'A device id is required to start a secure login');

  const challengeId = id();
  const expiresAt = future(0.007);
  loginChallenges.set(challengeId, {
    challengeId,
    userId: user._id,
    code: demoCode,
    deviceId,
    expiresAt
  });

  return {
    message: 'Demo login code ready.',
    requiresVerification: true,
    challengeId,
    expiresAt,
    tokenTtlDays: env.auth.sessionTtlDays,
    devCode: demoCode
  };
};

demoRoutes.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PlaneForge API',
    mode: 'demo',
    database: 'in-memory'
  });
});

demoRoutes.post('/auth/register', asyncHandler(async (req, res) => {
  const { name, email, contactNumber, dateOfBirth, password, role = 'user', adminSetupCode: submittedAdminSetupCode } = req.body;
  const normalizedRole = normalizeRole(role);
  const normalizedContactNumber = normalizeContactNumber(contactNumber);

  if (!name || !email || !normalizedContactNumber || !password) {
    throw new ApiError(400, 'Name, email, contact number and password are required');
  }
  if (password.length < 8) throw new ApiError(400, 'Use at least 8 characters for the password');
  if (!['user', 'consultant', 'partner', 'admin'].includes(normalizedRole)) {
    throw new ApiError(400, 'Registration is available for users, consultants, partners, and administrators');
  }
  if (normalizedRole === 'admin' && submittedAdminSetupCode !== demoAdminSetupCode) {
    throw new ApiError(403, 'Admin setup code is invalid');
  }
  if (users.some((user) => user.email === email.trim().toLowerCase())) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = withDates({
    _id: id(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    contactNumber: normalizedContactNumber,
    dateOfBirth: parseDateOfBirth(dateOfBirth),
    password,
    role: normalizedRole,
    status: ['consultant', 'partner'].includes(normalizedRole) ? 'pending' : 'active',
    ownedCourses: [],
    profile: {}
  });
  users.push(user);

  if (user.status === 'pending') {
    return res.status(202).json({
      message: 'Account request received. An admin must approve this account before sign in.',
      requiresApproval: true,
      role: user.role,
      status: user.status
    });
  }

  res.status(201).json(startLoginChallenge({ user, req }));
}));

demoRoutes.post('/auth/login', asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = users.find((item) => item.email === email.trim().toLowerCase());
  if (!user || user.password !== password) throw new ApiError(401, 'Invalid email or password');
  if (user.status === 'pending') throw new ApiError(401, 'Account is pending admin approval');
  if (user.status !== 'active') throw new ApiError(401, 'Account is not available');

  const expectedRole = normalizeRole(role);
  if (accessRole(user.role) !== expectedRole) {
    throw new ApiError(401, `This account is not registered as ${expectedRole}`);
  }

  res.json(startLoginChallenge({ user, req }));
}));

demoRoutes.post('/auth/verify-login', asyncHandler(async (req, res) => {
  const { challengeId, code } = req.body;
  const deviceId = getDeviceId(req);
  const challenge = loginChallenges.get(challengeId);

  if (!challenge || challenge.code !== code || challenge.deviceId !== deviceId || challenge.expiresAt <= now()) {
    throw new ApiError(401, 'Login code is invalid or has expired');
  }

  const user = findUser(challenge.userId);
  if (!user || user.status !== 'active') throw new ApiError(401, 'Account is not available');

  const sessionId = id();
  const session = {
    id: sessionId,
    _id: sessionId,
    user: user._id,
    deviceId,
    loginAt: iso(),
    lastActivityAt: iso(),
    expiresAt: iso(future(env.auth.sessionTtlDays))
  };
  sessions.set(sessionId, session);
  loginChallenges.delete(challengeId);
  user.lastLoginAt = iso();

  const token = jwt.sign(
    { id: user._id, role: user.role, sessionId, deviceId },
    env.jwtSecret,
    { expiresIn: env.auth.tokenTtl }
  );

  res.json({
    token,
    session: { id: sessionId, expiresAt: session.expiresAt },
    user: publicUser(user)
  });
}));

demoRoutes.post('/auth/password-reset/request', asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const user = users.find((item) => item.email === String(email || '').trim().toLowerCase());

  if (user) {
    const expectedRole = normalizeRole(role);
    if (accessRole(user.role) !== expectedRole) throw new ApiError(401, `This account is not registered as ${expectedRole}`);

    const challengeId = id();
    resetChallenges.set(challengeId, {
      challengeId,
      userId: user._id,
      code: demoCode,
      expiresAt: future(0.007)
    });
  }

  res.json({
    message: 'If that account exists, a password reset code has been sent.',
    devCode: demoCode
  });
}));

demoRoutes.post('/auth/password-reset/complete', asyncHandler(async (req, res) => {
  const { email, code, password, role } = req.body;
  const user = users.find((item) => item.email === String(email || '').trim().toLowerCase());
  if (!user || !code || !password) throw new ApiError(401, 'Reset code is invalid or has expired');
  if (password.length < 8) throw new ApiError(400, 'Use at least 8 characters for the new password');

  const expectedRole = normalizeRole(role);
  if (accessRole(user.role) !== expectedRole) throw new ApiError(401, `This account is not registered as ${expectedRole}`);

  const challenge = Array.from(resetChallenges.values())
    .reverse()
    .find((item) => item.userId === user._id && item.code === code && item.expiresAt > now());
  if (!challenge) throw new ApiError(401, 'Reset code is invalid or has expired');

  user.password = password;
  resetChallenges.delete(challenge.challengeId);
  for (const session of sessions.values()) {
    if (session.user === user._id) {
      session.revokedAt = iso();
      session.revokeReason = 'password_reset';
    }
  }

  res.json({ message: 'Password reset complete. Sign in with your new password.' });
}));

demoRoutes.post('/auth/logout', demoProtect, (req, res) => {
  const session = sessions.get(req.authSession.id);
  if (session) {
    session.revokedAt = iso();
    session.revokeReason = 'logout';
  }
  res.json({ message: 'Signed out of this device' });
});

demoRoutes.get('/auth/me', demoProtect, (req, res) => {
  res.json({
    user: publicUser(req.user),
    session: req.authSession
  });
});

demoRoutes.get('/courses', (req, res) => {
  const { search, category, discipline, difficulty, instructor, price, language, sort = 'popular', page, limit, featured } = req.query;
  let items = courses.filter((course) => course.status === 'published');

  if (search) {
    items = items.filter((course) =>
      [course.title, course.subtitle, course.description, course.category, course.discipline, course.instructorName]
        .some((value) => contains(value, search))
    );
  }
  if (category) items = items.filter((course) => course.category === category);
  if (discipline) items = items.filter((course) => course.discipline === discipline);
  if (difficulty) items = items.filter((course) => course.difficulty === difficulty);
  if (language) items = items.filter((course) => course.language === language);
  if (instructor) items = items.filter((course) => contains(course.instructorName, instructor));
  if (featured === 'true') items = items.filter((course) => course.isFeatured);
  if (price === 'free') items = items.filter((course) => Number(course.price) === 0);
  if (price === 'paid') items = items.filter((course) => Number(course.price) > 0);
  if (price === 'under100') items = items.filter((course) => Number(course.price) <= 100);

  const sorters = {
    popular: (a, b) => (b.studentsEnrolled || 0) - (a.studentsEnrolled || 0),
    rating: (a, b) => (b.rating || 0) - (a.rating || 0),
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    priceAsc: (a, b) => (a.price || 0) - (b.price || 0),
    priceDesc: (a, b) => (b.price || 0) - (a.price || 0),
    alphabetical: (a, b) => a.title.localeCompare(b.title)
  };
  items = [...items].sort(sorters[sort] || sorters.popular);

  const result = paginate(items, { page, limit, maxLimit: 24 });
  res.json({ courses: clone(result.items), pagination: result.pagination });
});

demoRoutes.get('/courses/:slug/learn', demoProtect, (req, res) => {
  const course = courses.find((item) => item.slug === req.params.slug && item.status === 'published');
  if (!course) throw new ApiError(404, 'Course not found');
  if (!hasCourseAccess(req.user, course._id)) throw new ApiError(403, 'Purchase this course to unlock protected lessons');
  res.json({ course: { ...clone(course), access: 'unlocked' } });
});

demoRoutes.get('/courses/:slug/lessons/:lessonId/playback', demoProtect, (req, res) => {
  const course = courses.find((item) => item.slug === req.params.slug && item.status === 'published');
  if (!course) throw new ApiError(404, 'Course not found');
  const match = findLesson(course, req.params.lessonId);
  if (!match) throw new ApiError(404, 'Lesson not found');
  if (!match.lesson.isPreview && !hasCourseAccess(req.user, course._id)) {
    throw new ApiError(403, 'Purchase this course to stream this lesson');
  }

  res.json({
    playback: {
      provider: match.lesson.stream?.provider || 'unconfigured',
      status: match.lesson.stream?.status || 'not_uploaded',
      configured: false,
      message: 'Demo playback is ready for access checks; connect a stream provider for real lesson video.'
    }
  });
});

demoRoutes.get('/courses/:slug/comments', demoProtect, (req, res) => {
  const course = courses.find((item) => item.slug === req.params.slug && item.status === 'published');
  if (!course) throw new ApiError(404, 'Course not found');
  if (!hasCourseAccess(req.user, course._id)) throw new ApiError(403, 'Purchase this course to view comments');

  res.json({
    comments: courseComments
      .filter((comment) => comment.course === course._id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50)
      .map(populateCourseComment)
  });
});

demoRoutes.post('/courses/:slug/comments', demoProtect, (req, res) => {
  const course = courses.find((item) => item.slug === req.params.slug && item.status === 'published');
  if (!course) throw new ApiError(404, 'Course not found');
  if (!hasCourseAccess(req.user, course._id)) throw new ApiError(403, 'Purchase this course before adding comments');

  const message = String(req.body.message || '').trim();
  if (!message) throw new ApiError(400, 'Comment message is required');

  const match = req.body.lessonId ? findLesson(course, req.body.lessonId) : null;
  const comment = withDates({
    _id: id(),
    user: req.user._id,
    course: course._id,
    lessonId: match?.lesson?._id,
    lessonTitle: match?.lesson?.title,
    message,
    status: 'open',
    source: req.body.source === 'tutor_request' ? 'tutor_request' : 'lesson_comment'
  });

  courseComments.unshift(comment);
  res.status(201).json({ comment: populateCourseComment(comment) });
});

demoRoutes.get('/courses/:slug', (req, res) => {
  const course = courses.find((item) => item.slug === req.params.slug && item.status === 'published');
  if (!course) throw new ApiError(404, 'Course not found');
  res.json({ course: clone(course) });
});

demoRoutes.get('/products', (req, res) => {
  const { search, category, type, featured, sort = 'newest', page, limit } = req.query;
  let items = products.filter((product) => product.status === 'published');

  if (search) {
    items = items.filter((product) =>
      [product.title, product.description, product.category, product.sku].some((value) => contains(value, search))
    );
  }
  if (category) items = items.filter((product) => product.category === category);
  if (type) items = items.filter((product) => product.productType === type);
  if (featured === 'true') items = items.filter((product) => product.isFeatured);

  const sorters = {
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    priceAsc: (a, b) => (a.price || 0) - (b.price || 0),
    priceDesc: (a, b) => (b.price || 0) - (a.price || 0),
    popular: (a, b) => (b.soldCount || 0) - (a.soldCount || 0),
    alphabetical: (a, b) => a.title.localeCompare(b.title)
  };
  items = [...items].sort(sorters[sort] || sorters.newest);

  const result = paginate(items, { page, limit, maxLimit: 24 });
  res.json({ products: clone(result.items), pagination: result.pagination });
});

demoRoutes.get('/products/:slug', (req, res) => {
  const product = products.find((item) => item.slug === req.params.slug && item.status === 'published');
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ product: clone(product) });
});

demoRoutes.post('/courses', demoProtect, demoAllowRoles('admin'), (req, res) => {
  const body = req.body || {};
  if (!body.title?.trim() || !body.description?.trim() || !body.category?.trim() || !body.discipline?.trim()) {
    throw new ApiError(400, 'Title, description, category, and discipline are required');
  }

  const course = withDates({
    _id: id(),
    ...body,
    title: body.title.trim(),
    slug: makeSlug(body.title),
    instructor: body.instructor || consultant._id,
    instructorName: body.instructorName || consultant.name,
    modules: normalizeModules(body.modules?.length ? body.modules : lessonSet(body.title)),
    studentsEnrolled: Number(body.studentsEnrolled || 0),
    rating: Number(body.rating || 0),
    lastUpdated: iso()
  });
  courses.unshift(course);
  res.status(201).json({ course: clone(course) });
});

demoRoutes.patch('/courses/:id', demoProtect, demoAllowRoles('admin'), (req, res) => {
  const course = findCourse(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found');

  Object.assign(course, req.body, {
    slug: req.body.slug || course.slug || makeSlug(req.body.title || course.title),
    modules: req.body.modules ? normalizeModules(req.body.modules) : course.modules,
    updatedAt: iso(),
    lastUpdated: iso()
  });

  res.json({ course: clone(course) });
});

demoRoutes.post('/courses/:id/modules/:moduleId/lessons/:lessonId/stream-upload', demoProtect, demoAllowRoles('admin'), (req, res) => {
  const course = findCourse(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found');
  const match = findLesson(course, req.params.lessonId);
  if (!match || match.module._id !== req.params.moduleId) throw new ApiError(404, 'Lesson not found');

  match.lesson.stream = {
    ...match.lesson.stream,
    provider: 'cloudflare',
    status: 'uploading',
    uploadId: `demo-upload-${id()}`
  };

  res.json({
    upload: {
      provider: 'demo',
      courseId: course._id,
      lessonId: match.lesson._id,
      directUploadUrl: null,
      message: 'Demo upload intent prepared. Configure Cloudflare credentials for real direct uploads.'
    }
  });
});

demoRoutes.delete('/courses/:id', demoProtect, demoAllowRoles('admin'), (req, res) => {
  const course = findCourse(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found');
  course.status = 'archived';
  course.updatedAt = iso();
  res.json({ message: 'Course archived', course: clone(course) });
});

demoRoutes.get('/content/homepage', (req, res) => {
  res.json({
    featuredCourses: clone(courses.filter((course) => course.status === 'published' && course.isFeatured).slice(0, 6)),
    consultants: users.filter((user) => user.role === 'consultant' && user.status === 'active').map(publicUser).slice(0, 4),
    articles: clone(articles.filter((article) => article.status === 'published').slice(0, 3))
  });
});

demoRoutes.get('/content/articles', (req, res) => {
  res.json({ articles: clone(articles.filter((article) => article.status === 'published')) });
});

demoRoutes.post('/content/newsletter', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'A valid email address is required');

  const existing = newsletterSubscriptions.find((item) => item.email === email);
  if (existing) {
    existing.status = 'active';
    existing.updatedAt = iso();
  } else {
    newsletterSubscriptions.push(withDates({ _id: id(), email, source: req.body.source || 'website', status: 'active' }));
  }

  res.status(201).json({ message: 'Newsletter subscription confirmed' });
});

demoRoutes.post('/content/contact', (req, res) => {
  const body = req.body || {};
  const selectedTopic = String(body.customTopic || body.topic || '').trim();
  if (!body.name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email || '') || !selectedTopic || !body.subject?.trim() || !body.message?.trim()) {
    throw new ApiError(400, 'Name, valid email, topic, subject, and message are required');
  }

  const inquiry = withDates({
    _id: id(),
    intent: body.intent || 'general',
    topic: selectedTopic,
    topicSource: body.customTopic ? 'custom' : 'selected',
    name: body.name.trim(),
    email: body.email.trim().toLowerCase(),
    organization: body.organization || '',
    role: body.role || '',
    subject: body.subject.trim(),
    message: body.message.trim(),
    priority: ['b2b', 'consulting', 'collaboration', 'partnership'].includes(body.intent) ? 'high' : 'normal',
    status: 'new',
    source: 'contact_page'
  });
  inquiries.unshift(inquiry);

  res.status(201).json({
    message: 'Inquiry received. PlaneForge will review it by category and respond by email.',
    inquiry: {
      id: inquiry._id,
      intent: inquiry.intent,
      topic: inquiry.topic,
      status: inquiry.status
    }
  });
});

demoRoutes.get('/consultations/consultants', (req, res) => {
  res.json({
    consultants: users.filter((user) => user.role === 'consultant' && user.status === 'active').map(publicUser)
  });
});

demoRoutes.post('/consultations/book', demoProtect, (req, res) => {
  const { consultantId, service, category, scheduledAt, durationMinutes = 60, notes } = req.body;
  const selectedConsultant = users.find((user) => user._id === consultantId && user.role === 'consultant' && user.status === 'active');
  if (!selectedConsultant || !service || !category || !scheduledAt) {
    throw new ApiError(400, 'Consultant, service, category and schedule are required');
  }

  const consultation = withDates({
    _id: id(),
    student: req.user._id,
    consultant: selectedConsultant._id,
    service,
    category,
    scheduledAt,
    durationMinutes,
    amount: selectedConsultant.consultationFee || 150,
    currency: 'USD',
    provider: 'mock',
    paymentRef: `demo_consultation_${Date.now()}`,
    status: 'confirmed',
    notes
  });
  consultations.unshift(consultation);
  res.status(201).json({
    consultation: populateConsultation(consultation),
    payment: { provider: 'mock', status: 'paid', paymentRef: consultation.paymentRef }
  });
});

demoRoutes.get('/consultations/mine', demoProtect, (req, res) => {
  const items = consultations.filter((consultation) =>
    req.user.role === 'consultant' ? consultation.consultant === req.user._id : consultation.student === req.user._id
  );
  res.json({ consultations: items.map(populateConsultation) });
});

demoRoutes.post('/payments/checkout', demoProtect, (req, res) => {
  const { courseId, couponCode, termsAccepted } = req.body;
  if (!termsAccepted) throw new ApiError(400, 'Terms must be accepted before payment');

  const course = findCourse(courseId);
  if (!course || course.status !== 'published') throw new ApiError(404, 'Course not found');
  if (hasCourseAccess(req.user, course._id)) throw new ApiError(409, 'Course is already unlocked');

  const amount = couponCode?.toUpperCase() === 'FORGE10' ? Number((course.price * 0.9).toFixed(2)) : course.price;
  const order = withDates({
    _id: id(),
    user: req.user._id,
    itemType: 'course',
    course: course._id,
    quantity: 1,
    amount,
    currency: course.currency,
    provider: 'mock',
    status: amount <= 0 ? 'paid' : 'payment_initialized',
    paymentRef: `demo_order_${Date.now()}`,
    couponCode,
    invoiceNumber: `PF-DEMO-${Date.now()}`,
    invoice: {
      customerName: req.user.name,
      customerEmail: req.user.email,
      itemName: course.title,
      issuedAt: iso(),
      html: `<h1>PlaneForge Invoice</h1><p>${course.title}</p>`
    }
  });
  orders.unshift(order);
  if (amount <= 0) completeOrder(order);

  res.status(201).json({
    order: populateOrder(order),
    payment: {
      provider: 'mock',
      status: order.status,
      paymentRef: order.paymentRef,
      checkoutUrl: null,
      verificationRequired: order.status !== 'paid'
    },
    verificationRequired: order.status !== 'paid',
    mockVerificationAvailable: order.status !== 'paid'
  });
});

demoRoutes.post('/payments/checkout-product', demoProtect, (req, res) => {
  const { productId, couponCode, termsAccepted, quantity = 1 } = req.body;
  if (!termsAccepted) throw new ApiError(400, 'Terms must be accepted before payment');

  const product = findProduct(productId);
  if (!product || product.status !== 'published') throw new ApiError(404, 'Product not found');

  const safeQuantity = Math.max(1, Number(quantity || 1));
  if (product.inventory?.track && Number(product.inventory.quantity || 0) < safeQuantity) {
    throw new ApiError(409, 'Product is out of stock');
  }

  const subtotal = Number((Number(product.price || 0) * safeQuantity).toFixed(2));
  const amount = couponCode?.toUpperCase() === 'FORGE10' ? Number((subtotal * 0.9).toFixed(2)) : subtotal;
  const order = withDates({
    _id: id(),
    user: req.user._id,
    itemType: 'product',
    product: product._id,
    quantity: safeQuantity,
    amount,
    currency: product.currency,
    provider: 'mock',
    status: amount <= 0 ? 'paid' : 'payment_initialized',
    paymentRef: `demo_product_${Date.now()}`,
    couponCode,
    invoiceNumber: `PF-DEMO-PRODUCT-${Date.now()}`,
    invoice: {
      customerName: req.user.name,
      customerEmail: req.user.email,
      itemName: product.title,
      issuedAt: iso(),
      html: `<h1>PlaneForge Invoice</h1><p>${product.title}</p>`
    }
  });
  orders.unshift(order);
  if (amount <= 0) completeOrder(order);

  res.status(201).json({
    order: populateOrder(order),
    payment: {
      provider: 'mock',
      status: order.status,
      paymentRef: order.paymentRef,
      checkoutUrl: null,
      verificationRequired: order.status !== 'paid'
    },
    verificationRequired: order.status !== 'paid',
    mockVerificationAvailable: order.status !== 'paid'
  });
});

demoRoutes.post('/payments/mock-verify', demoProtect, (req, res) => {
  const order = orders.find((item) => item._id === req.body.orderId && item.user === req.user._id && item.provider === 'mock');
  if (!order) throw new ApiError(404, 'Mock order not found');
  completeOrder(order);
  res.json({ order: populateOrder(order), access: 'granted' });
});

demoRoutes.get('/payments/mine', demoProtect, (req, res) => {
  res.json({ orders: orders.filter((order) => order.user === req.user._id).map(populateOrder) });
});

demoRoutes.get('/users/dashboard', demoProtect, (req, res) => {
  if (accessRole(req.user.role) === 'user') {
    return res.json({
      role: 'user',
      progress: progress.filter((item) => item.user === req.user._id).map((item) => ({ ...item, course: findCourse(item.course) })),
      orders: orders.filter((order) => order.user === req.user._id).map(populateOrder),
      consultations: consultations.filter((consultation) => consultation.student === req.user._id).map(populateConsultation),
      comments: courseComments.filter((comment) => comment.user === req.user._id).map(populateCourseComment),
      cartItems: cartItems.filter((item) => item.user === req.user._id).map(populateCartItem),
      certificates: certificates.filter((certificate) => certificate.user === req.user._id).map((certificate) => ({
        ...certificate,
        course: findCourse(certificate.course)
      }))
    });
  }

  if (req.user.role === 'consultant') {
    const items = consultations.filter((consultation) => consultation.consultant === req.user._id);
    return res.json({
      role: 'consultant',
      consultations: items.map(populateConsultation),
      earnings: items.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    });
  }

  if (req.user.role === 'partner') {
    const commissionRate = Number(req.user.commissionRate || 0);
    return res.json({
      role: 'partner',
      partnerCode: req.user.partnerCode,
      commissionRate,
      siteOrders: orders.length,
      paidOrders: orders.filter((order) => order.status === 'paid').length,
      estimatedCommission: orders.reduce((sum, item) => sum + Number(item.amount || 0) * (commissionRate / 100), 0),
      resources: ['Course bundles', 'Enterprise training proposal template', 'Consultation package overview']
    });
  }

  throw new ApiError(403, 'Use the admin dashboard endpoint for administrator data');
});

demoRoutes.get('/users/cart', demoProtect, (req, res) => {
  const { status = 'active' } = req.query;
  let items = cartItems.filter((item) => item.user === req.user._id);
  if (status) items = items.filter((item) => item.status === status);
  res.json({ cartItems: items.map(populateCartItem) });
});

demoRoutes.post('/users/cart', demoProtect, (req, res) => {
  const product = req.body.productId ? findProduct(req.body.productId) : null;
  const course = !product && req.body.courseId ? findCourse(req.body.courseId) : null;
  const itemType = product ? 'product' : 'course';
  const quantity = Math.max(1, Number(req.body.quantity || 1));

  if (req.body.productId && (!product || product.status !== 'published')) throw new ApiError(404, 'Product not found');
  if (!product && !course) throw new ApiError(404, 'Course not found');
  if (product?.inventory?.track && Number(product.inventory.quantity || 0) < quantity) {
    throw new ApiError(409, 'Product is out of stock');
  }

  let item = cartItems.find(
    (cartItem) =>
      cartItem.user === req.user._id &&
      cartItem.itemType === itemType &&
      (itemType === 'product' ? cartItem.product === product._id : cartItem.course === course._id) &&
      cartItem.status === 'active'
  );

  if (item) {
    Object.assign(item, {
      quantity,
      unitPrice: product ? product.price : course.price,
      currency: product ? product.currency : course.currency,
      productName: product ? product.title : undefined,
      updatedAt: iso()
    });
  } else {
    item = withDates({
      _id: id(),
      user: req.user._id,
      itemType,
      course: course?._id,
      product: product?._id,
      productId: product?._id,
      productName: product?.title,
      quantity,
      unitPrice: product ? product.price : course.price,
      currency: product ? product.currency : course.currency,
      status: 'active',
      source: req.body.source || (product ? 'product_catalog' : 'course_detail')
    });
    cartItems.unshift(item);
  }

  res.status(201).json({ cartItem: populateCartItem(item) });
});

demoRoutes.delete('/users/cart/:id', demoProtect, (req, res) => {
  const item = cartItems.find((cartItem) => cartItem._id === req.params.id && cartItem.user === req.user._id && cartItem.status === 'active');
  if (!item) throw new ApiError(404, 'Cart item not found');

  item.status = 'removed';
  item.removedAt = iso();
  item.updatedAt = iso();
  res.json({ cartItem: populateCartItem(item) });
});

demoRoutes.patch('/users/profile', demoProtect, (req, res) => {
  const body = req.body || {};
  const lockedFields = ['email', 'contact', 'contactNumber', 'phone', 'dateOfBirth'];
  const profileBody = body.profile && typeof body.profile === 'object' ? body.profile : {};

  if (lockedFields.some((field) => field in body || field in profileBody)) {
    throw new ApiError(400, 'Email, contact number, and date of birth cannot be changed after sign-up');
  }

  if ('name' in body) {
    const name = compactString(body.name, 120);
    if (!name) throw new ApiError(400, 'Name is required');
    req.user.name = name;
  }
  if ('avatar' in body) req.user.avatar = sanitizeAvatar(body.avatar);
  if ('title' in body) req.user.title = compactString(body.title, 140);
  if ('specialty' in body) req.user.specialty = compactString(body.specialty, 180);
  if ('bio' in body) req.user.bio = compactString(body.bio, 1000);
  if ('qualifications' in body) req.user.qualifications = sanitizeStringList(body.qualifications);
  if ('experienceYears' in body) req.user.experienceYears = Math.max(0, Number(body.experienceYears || 0));
  if ('languages' in body) req.user.languages = sanitizeStringList(body.languages);
  if ('profile' in body) {
    req.user.profile = {
      ...(req.user.profile || {}),
      ...sanitizeProfile(body.profile)
    };
  }

  if ('consultationFee' in body && ['consultant', 'admin'].includes(req.user.role)) {
    req.user.consultationFee = Math.max(0, Number(body.consultationFee || 0));
  }
  if ('availability' in body && ['consultant', 'admin'].includes(req.user.role)) {
    req.user.availability = Array.isArray(body.availability) ? body.availability : [];
  }

  req.user.updatedAt = iso();
  res.json({ user: publicUser(req.user) });
});

const saveProgress = (req, res) => {
  const course = findCourse(req.params.courseId);
  if (!course) throw new ApiError(404, 'Course not found');
  if (!hasCourseAccess(req.user, course._id)) throw new ApiError(403, 'Purchase this course before tracking progress');

  const match = findLesson(course, req.params.lessonId);
  if (!match) throw new ApiError(404, 'Lesson not found');

  let item = progress.find((record) => record.user === req.user._id && record.course === course._id);
  if (!item) {
    item = withDates({
      _id: id(),
      user: req.user._id,
      course: course._id,
      completedLessons: [],
      lessonProgress: [],
      currentLesson: null,
      totalTimeSeconds: 0,
      percentComplete: 0,
      certificateIssued: false
    });
    progress.push(item);
  }

  const watchedSeconds = Number(req.body.watchedSeconds || 0);
  const durationSeconds = Number(req.body.durationSeconds || match.lesson.durationSeconds || 0);
  const completed = Boolean(req.body.completed) || (durationSeconds ? watchedSeconds >= durationSeconds * 0.9 : false);
  const existing = item.completedLessons.find((lesson) => lesson.lessonId === match.lesson._id);

  item.currentLesson = { moduleId: match.module._id, lessonId: match.lesson._id };
  item.lastAccessedAt = iso();
  item.updatedAt = iso();
  item.totalTimeSeconds = Math.max(item.totalTimeSeconds || 0, watchedSeconds);

  if (completed && !existing) {
    item.completedLessons.push({
      moduleId: match.module._id,
      lessonId: match.lesson._id,
      watchedSeconds,
      durationSeconds,
      completedAt: iso()
    });
  }

  const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
  item.percentComplete = totalLessons ? Math.min(Math.round((item.completedLessons.length / totalLessons) * 100), 100) : 0;

  res.json({ progress: clone(item), certificate: null });
};

demoRoutes.patch('/users/progress/:courseId/lessons/:lessonId', demoProtect, saveProgress);

demoRoutes.post('/users/progress/:courseId/lessons', demoProtect, (req, res) => {
  req.params.lessonId = req.body.lessonId;
  saveProgress(req, res);
});

demoRoutes.use('/admin', demoProtect, demoAllowRoles('admin'));

demoRoutes.get('/admin/overview', (req, res) => {
  res.json({
    students: users.filter((user) => accessRole(user.role) === 'user').length,
    users: users.filter((user) => accessRole(user.role) === 'user').length,
    consultants: users.filter((user) => user.role === 'consultant').length,
    partners: users.filter((user) => user.role === 'partner').length,
    admins: users.filter((user) => user.role === 'admin').length,
    courses: courses.filter((course) => course.status === 'published').length,
    draftCourses: courses.filter((course) => course.status === 'draft').length,
    products: products.filter((product) => product.status === 'published').length,
    draftProducts: products.filter((product) => product.status === 'draft').length,
    paidOrders: orders.filter((order) => order.status === 'paid').length,
    pendingOrders: orders.filter((order) => ['pending', 'payment_initialized', 'verified'].includes(order.status)).length,
    consultations: consultations.length,
    cartItems: cartItems.length,
    activeCartItems: cartItems.filter((item) => item.status === 'active').length,
    subscribers: newsletterSubscriptions.filter((subscription) => subscription.status === 'active').length,
    inquiries: inquiries.filter((inquiry) => inquiry.status !== 'closed').length,
    activeEnrollments: enrollments.filter(isActiveEnrollment).length,
    revenue: orders.filter((order) => order.status === 'paid').reduce((sum, order) => sum + Number(order.amount || 0), 0)
  });
});

demoRoutes.get('/admin/activity', (req, res) => {
  const safeLimit = Math.min(Math.max(Number(req.query.limit) || 40, 1), 100);
  const activities = [
    ...users.map((user) => ({
      id: `user-${user._id}`,
      type: 'account',
      label: 'Account created',
      actorName: user.name,
      actorEmail: user.email,
      status: user.status,
      detail: `${user.role} account`,
      createdAt: user.createdAt
    })),
    ...orders.map((order) => {
      const user = findUser(order.user);
      const course = findCourse(order.course);
      const product = findProduct(order.product);

      return {
        id: `order-${order._id}`,
        type: 'purchase',
        label: 'Purchase activity',
        actorName: user?.name || order.invoice?.customerName || 'Unknown customer',
        actorEmail: user?.email || order.invoice?.customerEmail,
        status: order.status,
        amount: order.amount,
        currency: order.currency,
        detail: course?.title || product?.title || order.invoice?.itemName || order.invoiceNumber,
        createdAt: order.createdAt
      };
    }),
    ...progress.map((item) => {
      const user = findUser(item.user);
      const course = findCourse(item.course);

      return {
        id: `progress-${item._id}`,
        type: 'learning_progress',
        label: 'Learning progress',
        actorName: user?.name || 'Unknown learner',
        actorEmail: user?.email,
        status: `${item.percentComplete || 0}% complete`,
        detail: course?.title || 'Course progress',
        createdAt: item.updatedAt || item.createdAt
      };
    }),
    ...consultations.map((consultation) => {
      const student = findUser(consultation.student);
      const consultant = findUser(consultation.consultant);

      return {
        id: `consultation-${consultation._id}`,
        type: 'consulting',
        label: 'Consulting activity',
        actorName: student?.name || 'Unknown client',
        actorEmail: student?.email,
        status: consultation.status,
        amount: consultation.amount,
        currency: consultation.currency,
        detail: `${consultation.service} with ${consultant?.name || 'consultant'}`,
        createdAt: consultation.createdAt
      };
    }),
    ...inquiries.map((inquiry) => ({
      id: `inquiry-${inquiry._id}`,
      type: 'inquiry',
      label: 'Contact inquiry',
      actorName: inquiry.name,
      actorEmail: inquiry.email,
      status: inquiry.status,
      detail: `${inquiry.topic || inquiry.intent}: ${inquiry.subject || inquiry.message}`,
      createdAt: inquiry.createdAt
    })),
    ...courseComments.map((comment) => {
      const user = findUser(comment.user);
      const course = findCourse(comment.course);

      return {
        id: `comment-${comment._id}`,
        type: 'course_comment',
        label: comment.source === 'tutor_request' ? 'Tutor request' : 'Course comment',
        actorName: user?.name || 'Unknown learner',
        actorEmail: user?.email,
        status: comment.status,
        detail: `${course?.title || 'Course'}${comment.lessonTitle ? ` / ${comment.lessonTitle}` : ''}: ${comment.message}`,
        createdAt: comment.createdAt
      };
    }),
    ...cartItems.map((item) => {
      const user = findUser(item.user);
      const course = findCourse(item.course);
      const product = findProduct(item.product);

      return {
        id: `cart-${item._id}`,
        type: 'cart',
        label: 'Cart activity',
        actorName: user?.name || 'Unknown account',
        actorEmail: user?.email,
        status: item.status,
        amount: item.unitPrice,
        currency: item.currency,
        detail: course?.title || product?.title || item.productName || item.productId || 'Cart item',
        createdAt: item.updatedAt || item.createdAt
      };
    })
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, safeLimit);

  res.json({ activities });
});

demoRoutes.get('/admin/content', (req, res) => {
  res.json({ courses: clone(courses), articles: clone(articles), products: clone(products) });
});

demoRoutes.post('/admin/products', (req, res) => {
  const product = withDates({
    _id: id(),
    ...normalizeProductRecord(req.body || {})
  });
  products.unshift(product);
  res.status(201).json({ product: clone(product) });
});

demoRoutes.patch('/admin/products/:id', (req, res) => {
  const product = findProduct(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  Object.assign(product, normalizeProductRecord(req.body || {}, product), {
    updatedAt: iso()
  });
  res.json({ product: clone(product) });
});

demoRoutes.delete('/admin/products/:id', (req, res) => {
  const product = findProduct(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  product.status = 'archived';
  product.updatedAt = iso();
  res.json({ product: clone(product), message: 'Product archived' });
});

demoRoutes.get('/admin/users', (req, res) => {
  const { role, status, search, page, limit } = req.query;
  let items = users;
  if (role) items = items.filter((user) => accessRole(user.role) === normalizeRole(role));
  if (status) items = items.filter((user) => user.status === status);
  if (search) items = items.filter((user) => [user.name, user.email, user.title, user.specialty, user.profile?.organization].some((value) => contains(value, search)));

  const result = paginate(items.map(userForAdmin), { page, limit });
  res.json({ users: result.items, pagination: result.pagination });
});

demoRoutes.post('/admin/users', (req, res) => {
  const {
    name,
    email,
    contactNumber,
    dateOfBirth,
    password,
    role = 'user',
    status = 'active',
    title,
    specialty,
    bio,
    consultationFee,
    profile,
    partnerCode,
    commissionRate
  } = req.body;
  const normalizedRole = normalizeRole(role);
  const normalizedStatus = status || 'active';
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');
  const normalizedContactNumber = normalizeContactNumber(contactNumber);

  if (!String(name || '').trim() || !normalizedEmail || !normalizedContactNumber || !normalizedPassword) {
    throw new ApiError(400, 'Name, email, contact number and password are required');
  }

  if (normalizedPassword.length < 8) throw new ApiError(400, 'Use at least 8 characters for the password');
  if (!adminCreatedRoles.includes(normalizedRole)) {
    throw new ApiError(400, 'Admin-created accounts must be users, consultants, or partners');
  }
  if (!userStatuses.includes(normalizedStatus)) throw new ApiError(400, 'Invalid user status');
  if (users.some((user) => user.email === normalizedEmail)) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = withDates({
    _id: id(),
    name: String(name).trim(),
    email: normalizedEmail,
    contactNumber: normalizedContactNumber,
    dateOfBirth: parseDateOfBirth(dateOfBirth),
    password: normalizedPassword,
    role: normalizedRole,
    status: normalizedStatus,
    title: String(title || '').trim() || undefined,
    specialty: String(specialty || '').trim() || undefined,
    bio: String(bio || '').trim() || undefined,
    consultationFee: Number(consultationFee || 0),
    profile: profile && typeof profile === 'object' ? profile : {},
    partnerCode: String(partnerCode || '').trim() || undefined,
    commissionRate: Math.max(0, Number(commissionRate || 0)),
    ownedCourses: []
  });

  users.unshift(user);
  res.status(201).json({ user: userForAdmin(user) });
});

demoRoutes.patch('/admin/users/:id', (req, res) => {
  const user = findUser(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  const lockedFields = ['email', 'contact', 'contactNumber', 'phone', 'dateOfBirth'];
  const profileBody = req.body.profile && typeof req.body.profile === 'object' ? req.body.profile : {};
  if (lockedFields.some((field) => field in req.body || field in profileBody)) {
    throw new ApiError(400, 'Email, contact number, and date of birth cannot be changed after account creation');
  }

  if (req.body.role) req.body.role = normalizeRole(req.body.role);
  if (req.body.role && !roles.includes(req.body.role)) throw new ApiError(400, 'Invalid user role');
  if (req.body.status && !userStatuses.includes(req.body.status)) throw new ApiError(400, 'Invalid user status');
  if (user._id === req.user._id && ((req.body.role && req.body.role !== 'admin') || (req.body.status && req.body.status !== 'active'))) {
    throw new ApiError(400, 'You cannot remove your own admin access');
  }

  const allowed = ['name', 'role', 'status', 'title', 'specialty', 'bio', 'consultationFee', 'languages', 'profile', 'availability', 'qualifications', 'experienceYears', 'partnerCode', 'commissionRate'];
  for (const key of allowed) {
    if (key in req.body) user[key] = req.body[key];
  }
  user.updatedAt = iso();
  res.json({ user: userForAdmin(user) });
});

demoRoutes.post('/admin/users/:id/enrollments', (req, res) => {
  const enrollment = grantCourseAccess({
    userId: req.params.id,
    courseId: req.body.courseId,
    source: 'admin',
    expiresAt: req.body.expiresAt || null
  });
  res.status(201).json({
    enrollment: {
      ...enrollment,
      user: publicUser(findUser(enrollment.user)),
      course: findCourse(enrollment.course)
    }
  });
});

demoRoutes.get('/admin/payments', (req, res) => {
  const { status, provider, search, page, limit } = req.query;
  let items = orders.map(populateOrder);
  if (status) items = items.filter((order) => order.status === status);
  if (provider) items = items.filter((order) => order.provider === provider);
  if (search) {
    items = items.filter((order) =>
      [order.invoiceNumber, order.paymentRef, order.user?.name, order.user?.email, order.course?.title, order.product?.title, order.product?.sku].some(
        (value) => contains(value, search)
      )
    );
  }

  const result = paginate(items, { page, limit });
  res.json({ orders: result.items, pagination: result.pagination });
});

demoRoutes.patch('/admin/payments/:id', (req, res) => {
  const order = orders.find((item) => item._id === req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (!orderStatuses.includes(req.body.status)) throw new ApiError(400, 'Invalid payment status');

  if (['verified', 'paid'].includes(req.body.status)) completeOrder(order, req.body.status);
  else {
    order.status = req.body.status;
    order.updatedAt = iso();
  }
  res.json({ order: populateOrder(order) });
});

demoRoutes.get('/admin/consultations', (req, res) => {
  const { status, search, page, limit } = req.query;
  let items = consultations.map(populateConsultation);
  if (status) items = items.filter((consultation) => consultation.status === status);
  if (search) items = items.filter((consultation) => [consultation.service, consultation.category, consultation.paymentRef, consultation.student?.name, consultation.student?.email, consultation.consultant?.name, consultation.consultant?.email].some((value) => contains(value, search)));

  const result = paginate(items, { page, limit });
  res.json({ consultations: result.items, pagination: result.pagination });
});

demoRoutes.patch('/admin/consultations/:id', (req, res) => {
  const consultation = consultations.find((item) => item._id === req.params.id);
  if (!consultation) throw new ApiError(404, 'Consultation not found');
  if (req.body.status && !consultationStatuses.includes(req.body.status)) throw new ApiError(400, 'Invalid consultation status');

  Object.assign(consultation, req.body, { updatedAt: iso() });
  res.json({ consultation: populateConsultation(consultation) });
});

demoRoutes.get('/admin/inquiries', (req, res) => {
  const { intent, status = 'open', priority, search, page, limit = 80 } = req.query;
  let items = inquiries;
  if (intent) items = items.filter((inquiry) => inquiry.intent === intent);
  if (priority) items = items.filter((inquiry) => inquiry.priority === priority);
  if (status === 'open') items = items.filter((inquiry) => inquiry.status !== 'closed');
  else if (status) items = items.filter((inquiry) => inquiry.status === status);
  if (search) items = items.filter((inquiry) => [inquiry.name, inquiry.email, inquiry.organization, inquiry.subject, inquiry.message, inquiry.topic].some((value) => contains(value, search)));

  const result = paginate(items, { page, limit, maxLimit: 200 });
  res.json({
    inquiries: result.items,
    pagination: result.pagination,
    grouped: {
      byIntent: groupBy(items, (item) => item.intent),
      byStatus: groupBy(items, (item) => item.status),
      byTopic: groupBy(items, (item) => ({ intent: item.intent, topic: item.topic })).slice(0, 20)
    }
  });
});

demoRoutes.patch('/admin/inquiries/:id', (req, res) => {
  const inquiry = inquiries.find((item) => item._id === req.params.id);
  if (!inquiry) throw new ApiError(404, 'Inquiry not found');
  if (req.body.status && !inquiryStatuses.includes(req.body.status)) throw new ApiError(400, 'Invalid inquiry status');
  if (req.body.priority && !inquiryPriorities.includes(req.body.priority)) throw new ApiError(400, 'Invalid inquiry priority');

  Object.assign(inquiry, req.body, { updatedAt: iso() });
  res.json({ inquiry: clone(inquiry) });
});

demoRoutes.get('/admin/settings', (req, res) => {
  res.json({ settings: clone([...settings].sort((a, b) => a.key.localeCompare(b.key))) });
});

demoRoutes.put('/admin/settings', (req, res) => {
  const key = String(req.body.key || '').trim();
  if (!key) throw new ApiError(400, 'Setting key is required');

  const existing = settings.find((setting) => setting.key === key);
  const setting = {
    ...(existing || { _id: id(), createdAt: iso() }),
    key,
    value: req.body.value ?? {},
    description: req.body.description || '',
    updatedAt: iso()
  };
  if (existing) settings = settings.map((item) => (item._id === existing._id ? setting : item));
  else settings.push(setting);

  res.json({ setting: clone(setting) });
});

demoRoutes.post('/admin/articles', (req, res) => {
  const body = req.body || {};
  if (!body.title?.trim() || !body.body?.trim()) throw new ApiError(400, 'Title and body are required');

  const article = withDates({
    _id: id(),
    title: body.title.trim(),
    slug: makeSlug(body.title),
    excerpt: body.excerpt || '',
    body: body.body,
    image: body.image || '',
    category: body.category || '',
    readingTime: body.readingTime || '',
    author: req.user._id,
    publishedAt: iso(),
    status: body.status || 'published'
  });
  articles.unshift(article);
  res.status(201).json({ article: clone(article) });
});

demoRoutes.patch('/admin/articles/:id', (req, res) => {
  const article = articles.find((item) => item._id === req.params.id);
  if (!article) throw new ApiError(404, 'Article not found');
  if (req.body.status && !articleStatuses.includes(req.body.status)) throw new ApiError(400, 'Invalid article status');

  Object.assign(article, req.body, {
    slug: req.body.slug || article.slug || makeSlug(req.body.title || article.title),
    updatedAt: iso()
  });
  res.json({ article: clone(article) });
});

demoRoutes.delete('/admin/articles/:id', (req, res) => {
  const article = articles.find((item) => item._id === req.params.id);
  if (!article) throw new ApiError(404, 'Article not found');
  article.status = 'draft';
  article.updatedAt = iso();
  res.json({ article: clone(article), message: 'Article moved to drafts' });
});
