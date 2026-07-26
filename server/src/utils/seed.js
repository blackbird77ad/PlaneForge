import { connectDb } from '../config/db.js';
import { BlogPost } from '../models/BlogPost.js';
import { Certificate } from '../models/Certificate.js';
import { Consultation } from '../models/Consultation.js';
import { Course } from '../models/Course.js';
import { NewsletterSubscription } from '../models/NewsletterSubscription.js';
import { Order } from '../models/Order.js';
import { Progress } from '../models/Progress.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { User } from '../models/User.js';

await connectDb();

const passwordHash = await User.hashPassword('Password123!');
const planeforgeAvatar = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80';

await Promise.all([
  BlogPost.deleteMany({}),
  Certificate.deleteMany({}),
  Consultation.deleteMany({}),
  Course.deleteMany({}),
  NewsletterSubscription.deleteMany({}),
  Order.deleteMany({}),
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
    title: 'Automation Trainee',
    profile: {
      country: 'Ghana',
      organization: 'BridgeWorks Studio'
    }
  },
  {
    name: 'PlaneForge',
    email: 'consultant@planeforge.test',
    passwordHash,
    role: 'consultant',
    avatar: planeforgeAvatar,
    title: 'PLC Projects & Products Consulting',
    specialty: 'Company PLC projects, product builds, automation research, and technical support',
    bio:
      'PlaneForge works directly with companies that reach out for PLC project scoping, automation products, controls research, architecture reviews, builds, troubleshooting strategy, commissioning, and implementation guidance.',
    qualifications: ['PLC Programming Lead', 'Industrial Automation Advisor', 'Control Systems Project Build Team'],
    experienceYears: 14,
    consultationFee: 250,
    availability: [
      { day: 'Tuesday', slots: ['10:00', '14:00'] },
      { day: 'Thursday', slots: ['09:00', '15:00'] }
    ]
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

const courses = await Course.create([
  {
    title: 'Programmable Logic Controller (PLC) Fundamentals',
    slug: 'programmable-logic-controller-plc-fundamentals',
    subtitle: 'Wire, program, test, and troubleshoot PLC systems used in industrial projects.',
    description:
      'A practical PLC course centered on ladder logic, I/O wiring, sensors, actuators, HMI basics, commissioning, and fault finding for industrial automation work.',
    thumbnail: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=1400&q=80',
    category: 'PLC Programming',
    discipline: 'PLC & Industrial Automation',
    difficulty: 'Beginner',
    instructor: planeforgeConsultant._id,
    instructorName: planeforgeConsultant.name,
    language: 'English',
    price: 149,
    duration: '9h 10m',
    rating: 4.9,
    studentsEnrolled: 1260,
    isFeatured: true,
    outcomes: [
      'Read PLC hardware layouts and I/O maps',
      'Build ladder logic for real machine sequences',
      'Connect sensors, actuators, relays, and safety inputs',
      'Commission and troubleshoot PLC-controlled systems'
    ],
    skills: ['PLC hardware', 'Ladder logic', 'I/O wiring', 'Commissioning'],
    requirements: ['Basic electrical concepts', 'Comfort reading simple wiring diagrams'],
    targetAudience: ['Technicians', 'Electrical engineers', 'Maintenance teams', 'Automation beginners'],
    faqs: [
      {
        question: 'Is this course mainly about PLCs?',
        answer: 'Yes. The curriculum is built around Programmable Logic Controller hardware, programming, wiring, commissioning, and troubleshooting.'
      }
    ],
    modules: [
      {
        title: 'PLC Hardware and I/O Foundations',
        lessons: [
          {
            title: 'What a PLC does in a control system',
            duration: '12 min',
            isPreview: true,
            videoUrl: 'https://cdn.planeforge.local/previews/plc-foundations.mp4'
          },
          { title: 'Power, inputs, outputs, and field devices', duration: '20 min' },
          { title: 'Building an I/O list from a machine brief', duration: '18 min' }
        ]
      },
      {
        title: 'Ladder Logic That Works',
        lessons: [
          { title: 'Contacts, coils, timers, and counters', duration: '25 min' },
          { title: 'Interlocks and sequence control', duration: '28 min' },
          { title: 'Testing logic before commissioning', duration: '19 min' }
        ]
      },
      {
        title: 'Commissioning and Fault Finding',
        lessons: [
          { title: 'Online monitoring and forcing rules', duration: '21 min' },
          { title: 'Diagnosing sensor, wiring, and logic faults', duration: '26 min' }
        ]
      }
    ],
    reviews: [
      {
        studentName: 'Kwame Mensah',
        occupation: 'Maintenance Technician',
        rating: 5,
        comment: 'The PLC examples finally connected ladder logic to the machines we service every day.'
      }
    ]
  },
  {
    title: 'PLC Troubleshooting and Commissioning',
    slug: 'plc-troubleshooting-and-commissioning',
    subtitle: 'Diagnose control faults, validate wiring, and bring PLC systems online with confidence.',
    description:
      'Learn a structured approach to commissioning PLC panels, checking field devices, tracing signals, reviewing programs, and resolving downtime without guesswork.',
    thumbnail: 'https://images.unsplash.com/photo-1581091870622-1e7e2e0f9b9f?auto=format&fit=crop&w=900&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1400&q=80',
    category: 'Troubleshooting',
    discipline: 'PLC & Industrial Automation',
    difficulty: 'Intermediate',
    instructor: planeforgeConsultant._id,
    instructorName: planeforgeConsultant.name,
    language: 'English',
    price: 139,
    duration: '6h 40m',
    rating: 4.8,
    studentsEnrolled: 940,
    isFeatured: true,
    outcomes: [
      'Trace PLC faults from device to logic',
      'Use online monitoring safely',
      'Create commissioning checklists',
      'Document root cause and repair actions'
    ],
    skills: ['Fault diagnosis', 'Online monitoring', 'Commissioning checks'],
    requirements: ['PLC fundamentals', 'Basic multimeter use'],
    targetAudience: ['Plant technicians', 'Controls engineers', 'Maintenance supervisors'],
    modules: [
      {
        title: 'Fault Diagnosis Workflow',
        lessons: [
          {
            title: 'Separating power, device, wiring, and logic faults',
            duration: '14 min',
            isPreview: true,
            videoUrl: 'https://cdn.planeforge.local/previews/plc-troubleshooting.mp4'
          },
          { title: 'Using PLC status lights and diagnostics', duration: '18 min' },
          { title: 'Building a fault log that speeds repair', duration: '16 min' }
        ]
      },
      {
        title: 'Commissioning Discipline',
        lessons: [
          { title: 'Pre-power checks and loop testing', duration: '22 min' },
          { title: 'Site acceptance testing for PLC systems', duration: '24 min' }
        ]
      }
    ],
    reviews: [
      {
        studentName: 'Diego Santos',
        occupation: 'Plant Engineer',
        rating: 5,
        comment: 'The troubleshooting method gave our team a cleaner path from alarm to root cause.'
      }
    ]
  },
  {
    title: 'HMI and SCADA Integration for PLC Projects',
    slug: 'hmi-scada-integration-for-plc-projects',
    subtitle: 'Design operator screens and supervisory workflows that make PLC systems easier to run.',
    description:
      'A project-focused course for PLC tags, HMI screen structure, alarms, trends, operator prompts, and SCADA handover documentation.',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?auto=format&fit=crop&w=1400&q=80',
    category: 'HMI & SCADA',
    discipline: 'PLC & Industrial Automation',
    difficulty: 'Intermediate',
    instructor: planeforgeConsultant._id,
    instructorName: planeforgeConsultant.name,
    language: 'English',
    price: 129,
    duration: '5h 55m',
    rating: 4.7,
    studentsEnrolled: 760,
    isFeatured: true,
    outcomes: [
      'Map PLC tags for HMI use',
      'Design clear operator screens',
      'Document alarms and trends',
      'Prepare handover notes for plant teams'
    ],
    skills: ['PLC tags', 'HMI screen planning', 'Alarms and trends'],
    requirements: ['Basic PLC tag knowledge'],
    targetAudience: ['Automation engineers', 'HMI developers', 'Plant operators'],
    modules: [
      {
        title: 'Operator Interface Planning',
        lessons: [
          {
            title: 'Screen hierarchy and operator decisions',
            duration: '13 min',
            isPreview: true,
            videoUrl: 'https://cdn.planeforge.local/previews/hmi-plc.mp4'
          },
          { title: 'PLC tags, alarms, and trends', duration: '27 min' },
          { title: 'Handover notes for operations teams', duration: '19 min' }
        ]
      }
    ],
    reviews: []
  },
  {
    title: 'Industrial Sensors, Drives, and I/O Wiring',
    slug: 'industrial-sensors-drives-and-io-wiring',
    subtitle: 'Connect the field devices that make PLC programs useful in the real world.',
    description:
      'Learn how sensors, VFDs, solenoids, relays, motor starters, analog signals, and safety inputs connect to PLC projects.',
    thumbnail: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1400&q=80',
    category: 'Field Devices',
    discipline: 'Industrial Controls',
    difficulty: 'Intermediate',
    instructor: planeforgeConsultant._id,
    instructorName: planeforgeConsultant.name,
    language: 'English',
    price: 119,
    duration: '6h 15m',
    rating: 4.6,
    studentsEnrolled: 680,
    isFeatured: true,
    outcomes: ['Select digital and analog I/O', 'Wire sensors and actuators correctly', 'Coordinate PLC logic with drives'],
    skills: ['Field wiring', 'VFD coordination', 'Analog scaling'],
    requirements: ['Basic electrical safety'],
    targetAudience: ['Electricians', 'Technicians', 'Controls trainees'],
    modules: [
      {
        title: 'Field Device Integration',
        lessons: [
          { title: 'Digital inputs and outputs', duration: '15 min', isPreview: true },
          { title: 'Analog signals and scaling', duration: '24 min' }
        ]
      }
    ],
    reviews: []
  },
  {
    title: 'PLC Project Estimation and Proposal Planning',
    slug: 'plc-project-estimation-and-proposal-planning',
    subtitle: 'Scope PLC work, research requirements, and prepare proposals companies can approve.',
    description:
      'A consulting-minded course for estimating PLC panels, software hours, field commissioning, documentation, research tasks, and project risk.',
    thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80',
    category: 'Project Consulting',
    discipline: 'PLC & Industrial Automation',
    difficulty: 'Professional',
    instructor: planeforgeConsultant._id,
    instructorName: planeforgeConsultant.name,
    language: 'English',
    price: 159,
    duration: '5h 25m',
    rating: 4.7,
    studentsEnrolled: 510,
    isFeatured: false,
    outcomes: ['Scope PLC project requirements', 'Estimate hardware and software effort', 'Prepare company-facing proposals'],
    skills: ['Project scoping', 'Proposal planning', 'Research estimates'],
    requirements: ['PLC project exposure'],
    targetAudience: ['Automation contractors', 'Project engineers', 'Technical founders'],
    modules: [
      {
        title: 'PLC Project Scoping',
        lessons: [
          { title: 'From company request to technical brief', duration: '12 min', isPreview: true },
          { title: 'Estimating panels, programming, testing, and research', duration: '24 min' }
        ]
      }
    ],
    reviews: []
  },
  {
    title: 'Control Panel QA and PLC Documentation',
    slug: 'control-panel-qa-and-plc-documentation',
    subtitle: 'Build review systems for panels, programs, and handover files before site work starts.',
    description:
      'Create PLC documentation, I/O test sheets, panel QA records, change logs, and commissioning packs that stand up to client review.',
    thumbnail: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=900&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1581091870622-1e7e2e0f9b9f?auto=format&fit=crop&w=1400&q=80',
    category: 'QA & Documentation',
    discipline: 'Industrial Controls',
    difficulty: 'Advanced',
    instructor: planeforgeConsultant._id,
    instructorName: planeforgeConsultant.name,
    language: 'English',
    price: 109,
    duration: '4h 50m',
    rating: 4.6,
    studentsEnrolled: 430,
    isFeatured: false,
    outcomes: ['Prepare PLC handover documents', 'Review panel build quality', 'Reduce commissioning rework'],
    skills: ['Panel QA', 'I/O test sheets', 'Handover records'],
    requirements: ['Project delivery experience'],
    targetAudience: ['Controls leads', 'Panel builders', 'Commissioning engineers'],
    modules: [
      {
        title: 'Controls QA System',
        lessons: [
          { title: 'I/O test sheets that catch errors', duration: '14 min', isPreview: true },
          { title: 'Program revision and handover control', duration: '23 min' }
        ]
      }
    ],
    reviews: []
  }
]);

await User.findByIdAndUpdate(student._id, { $addToSet: { ownedCourses: courses[0]._id } });
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
  percentComplete: 13,
  lastAccessedAt: new Date()
});

await BlogPost.create([
  {
    title: 'How to Review a PLC Course Before Buying',
    excerpt: 'A quick framework for judging PLC curriculum depth, hardware relevance, and hands-on outcomes.',
    body: 'Use PLC outcomes, hardware coverage, ladder logic practice, commissioning examples, and instructor credibility to judge a technical course.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    category: 'PLC Learning',
    readingTime: '5 min',
    author: admin._id
  },
  {
    title: 'When Companies Should Book PLC Consulting',
    excerpt: 'Recognize the moments when PlaneForge PLC consulting and build support can save research time, rework, cost, and project risk.',
    body: 'Consulting is useful before PLC architecture decisions, automation product builds, controls research, proposal submission, procurement, commissioning, and production downtime reviews.',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80',
    category: 'Consulting',
    readingTime: '4 min',
    author: planeforgeConsultant._id
  },
  {
    title: 'PLC Certificates That Mean Something',
    excerpt: 'A professional PLC certificate should point to demonstrated control skills, not just screen time.',
    body: 'PlaneForge certificates are connected to structured PLC progress, practical control outcomes, and project-ready documentation.',
    image: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=900&q=80',
    category: 'Careers',
    readingTime: '6 min',
    author: admin._id
  }
]);

await SystemSetting.create({
  key: 'platform',
  description: 'Default commercial settings',
  value: {
    consultationCurrency: 'USD',
    certificateIssuer: 'PlaneForge Academy',
    newsletterEnabled: true
  }
});

await Consultation.create({
  student: student._id,
  consultant: planeforgeConsultant._id,
  service: 'PlaneForge PLC project consulting',
  category: 'PLC & Industrial Automation',
  scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
  durationMinutes: 60,
  amount: planeforgeConsultant.consultationFee,
  provider: 'mock',
  paymentRef: `seed_${Date.now()}`,
  status: 'confirmed',
  notes: 'Review company PLC project scope, research needs, and commissioning risks.'
});

console.log('PlaneForge PLC seed data created.');
console.log('Demo accounts use Password123!');
console.log('student@planeforge.test | consultant@planeforge.test | partner@planeforge.test | admin@planeforge.test');

process.exit(0);
