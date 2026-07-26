export const heroImage =
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1800&q=85';

const planeforgeInstructor = {
  name: 'PlaneForge',
  title: 'PLC Projects & Products Team',
  avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
  specialty: 'PLC systems, industrial automation, company projects, and product builds',
  bio: 'PlaneForge works directly with companies on PLC projects, automation products, controls research, technical scoping, builds, troubleshooting, and implementation decisions.',
  qualifications: ['PLC Programming Lead', 'Industrial Automation Advisor', 'Control Systems Project Build Team'],
  experienceYears: 14
};

export const courses = [
  {
    id: 'course-plc-fundamentals',
    _id: 'course-plc-fundamentals',
    slug: 'programmable-logic-controller-plc-fundamentals',
    title: 'Programmable Logic Controller (PLC) Fundamentals',
    subtitle: 'Wire, program, test, and troubleshoot PLC systems used in industrial projects.',
    description:
      'A practical PLC course centered on ladder logic, I/O wiring, sensors, actuators, HMI basics, commissioning, and fault finding for industrial automation work.',
    thumbnail: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=1600&q=80',
    category: 'PLC Programming',
    discipline: 'PLC & Industrial Automation',
    difficulty: 'Beginner',
    instructorName: planeforgeInstructor.name,
    instructor: planeforgeInstructor,
    language: 'English',
    price: 149,
    currency: 'USD',
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
    requirements: ['Basic electrical concepts', 'Comfort reading simple wiring diagrams'],
    targetAudience: ['Technicians', 'Electrical engineers', 'Maintenance teams', 'Automation beginners'],
    modules: [
      {
        _id: 'plc-m1',
        title: 'PLC Hardware and I/O Foundations',
        lessons: [
          { _id: 'plc-l1', title: 'What a PLC does in a control system', duration: '12 min', isPreview: true },
          { _id: 'plc-l2', title: 'Power, inputs, outputs, and field devices', duration: '20 min' },
          { _id: 'plc-l3', title: 'Building an I/O list from a machine brief', duration: '18 min' }
        ]
      },
      {
        _id: 'plc-m2',
        title: 'Ladder Logic That Works',
        lessons: [
          { _id: 'plc-l4', title: 'Contacts, coils, timers, and counters', duration: '25 min' },
          { _id: 'plc-l5', title: 'Interlocks and sequence control', duration: '28 min' },
          { _id: 'plc-l6', title: 'Testing logic before commissioning', duration: '19 min' }
        ]
      },
      {
        _id: 'plc-m3',
        title: 'Commissioning and Fault Finding',
        lessons: [
          { _id: 'plc-l7', title: 'Online monitoring and forcing rules', duration: '21 min' },
          { _id: 'plc-l8', title: 'Diagnosing sensor, wiring, and logic faults', duration: '26 min' }
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
    id: 'course-plc-troubleshooting',
    _id: 'course-plc-troubleshooting',
    slug: 'plc-troubleshooting-and-commissioning',
    title: 'PLC Troubleshooting and Commissioning',
    subtitle: 'Diagnose control faults, validate wiring, and bring PLC systems online with confidence.',
    description:
      'Learn a structured approach to commissioning PLC panels, checking field devices, tracing signals, reviewing programs, and resolving downtime without guesswork.',
    thumbnail: 'https://images.unsplash.com/photo-1581091870622-1e7e2e0f9b9f?auto=format&fit=crop&w=900&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1600&q=80',
    category: 'Troubleshooting',
    discipline: 'PLC & Industrial Automation',
    difficulty: 'Intermediate',
    instructorName: planeforgeInstructor.name,
    instructor: planeforgeInstructor,
    language: 'English',
    price: 139,
    currency: 'USD',
    duration: '6h 40m',
    rating: 4.8,
    studentsEnrolled: 940,
    isFeatured: true,
    outcomes: ['Trace PLC faults from device to logic', 'Use online monitoring safely', 'Create commissioning checklists'],
    requirements: ['PLC fundamentals', 'Basic multimeter use'],
    targetAudience: ['Plant technicians', 'Controls engineers', 'Maintenance supervisors'],
    modules: [
      {
        _id: 'trouble-m1',
        title: 'Fault Diagnosis Workflow',
        lessons: [
          { _id: 'trouble-l1', title: 'Separating power, device, wiring, and logic faults', duration: '14 min', isPreview: true },
          { _id: 'trouble-l2', title: 'Using PLC status lights and diagnostics', duration: '18 min' },
          { _id: 'trouble-l3', title: 'Building a fault log that speeds repair', duration: '16 min' }
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
    id: 'course-hmi-scada',
    _id: 'course-hmi-scada',
    slug: 'hmi-scada-integration-for-plc-projects',
    title: 'HMI and SCADA Integration for PLC Projects',
    subtitle: 'Design operator screens and supervisory workflows that make PLC systems easier to run.',
    description:
      'A project-focused course for PLC tags, HMI screen structure, alarms, trends, operator prompts, and SCADA handover documentation.',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?auto=format&fit=crop&w=1600&q=80',
    category: 'HMI & SCADA',
    discipline: 'PLC & Industrial Automation',
    difficulty: 'Intermediate',
    instructorName: planeforgeInstructor.name,
    instructor: planeforgeInstructor,
    language: 'English',
    price: 129,
    currency: 'USD',
    duration: '5h 55m',
    rating: 4.7,
    studentsEnrolled: 760,
    isFeatured: true,
    outcomes: ['Map PLC tags for HMI use', 'Design clear operator screens', 'Document alarms and trends'],
    requirements: ['Basic PLC tag knowledge'],
    targetAudience: ['Automation engineers', 'HMI developers', 'Plant operators'],
    modules: [
      {
        _id: 'hmi-m1',
        title: 'Operator Interface Planning',
        lessons: [
          { _id: 'hmi-l1', title: 'Screen hierarchy and operator decisions', duration: '13 min', isPreview: true },
          { _id: 'hmi-l2', title: 'PLC tags, alarms, and trends', duration: '27 min' }
        ]
      }
    ],
    reviews: []
  },
  {
    id: 'course-industrial-io',
    _id: 'course-industrial-io',
    slug: 'industrial-sensors-drives-and-io-wiring',
    title: 'Industrial Sensors, Drives, and I/O Wiring',
    subtitle: 'Connect the field devices that make PLC programs useful in the real world.',
    description:
      'Learn how sensors, VFDs, solenoids, relays, motor starters, analog signals, and safety inputs connect to PLC projects.',
    thumbnail: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1600&q=80',
    category: 'Field Devices',
    discipline: 'Industrial Controls',
    difficulty: 'Intermediate',
    instructorName: planeforgeInstructor.name,
    instructor: planeforgeInstructor,
    language: 'English',
    price: 119,
    currency: 'USD',
    duration: '6h 15m',
    rating: 4.6,
    studentsEnrolled: 680,
    isFeatured: true,
    outcomes: ['Select digital and analog I/O', 'Wire sensors and actuators correctly', 'Coordinate PLC logic with drives'],
    requirements: ['Basic electrical safety'],
    targetAudience: ['Electricians', 'Technicians', 'Controls trainees'],
    modules: [
      {
        _id: 'io-m1',
        title: 'Field Device Integration',
        lessons: [
          { _id: 'io-l1', title: 'Digital inputs and outputs', duration: '15 min', isPreview: true },
          { _id: 'io-l2', title: 'Analog signals and scaling', duration: '24 min' }
        ]
      }
    ],
    reviews: []
  },
  {
    id: 'course-plc-estimation',
    _id: 'course-plc-estimation',
    slug: 'plc-project-estimation-and-proposal-planning',
    title: 'PLC Project Estimation and Proposal Planning',
    subtitle: 'Scope PLC work, research requirements, and prepare proposals companies can approve.',
    description:
      'A consulting-minded course for estimating PLC panels, software hours, field commissioning, documentation, research tasks, and project risk.',
    thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=80',
    category: 'Project Consulting',
    discipline: 'PLC & Industrial Automation',
    difficulty: 'Professional',
    instructorName: planeforgeInstructor.name,
    instructor: planeforgeInstructor,
    language: 'English',
    price: 159,
    currency: 'USD',
    duration: '5h 25m',
    rating: 4.7,
    studentsEnrolled: 510,
    isFeatured: false,
    outcomes: ['Scope PLC project requirements', 'Estimate hardware and software effort', 'Prepare company-facing proposals'],
    requirements: ['PLC project exposure'],
    targetAudience: ['Automation contractors', 'Project engineers', 'Technical founders'],
    modules: [
      {
        _id: 'estimate-m1',
        title: 'PLC Project Scoping',
        lessons: [
          { _id: 'estimate-l1', title: 'From company request to technical brief', duration: '12 min', isPreview: true },
          { _id: 'estimate-l2', title: 'Estimating panels, programming, testing, and research', duration: '24 min' }
        ]
      }
    ],
    reviews: []
  },
  {
    id: 'course-control-panel-qa',
    _id: 'course-control-panel-qa',
    slug: 'control-panel-qa-and-plc-documentation',
    title: 'Control Panel QA and PLC Documentation',
    subtitle: 'Build review systems for panels, programs, and handover files before site work starts.',
    description:
      'Create PLC documentation, I/O test sheets, panel QA records, change logs, and commissioning packs that stand up to client review.',
    thumbnail: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=900&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1581091870622-1e7e2e0f9b9f?auto=format&fit=crop&w=1600&q=80',
    category: 'QA & Documentation',
    discipline: 'Industrial Controls',
    difficulty: 'Advanced',
    instructorName: planeforgeInstructor.name,
    instructor: planeforgeInstructor,
    language: 'English',
    price: 109,
    currency: 'USD',
    duration: '4h 50m',
    rating: 4.6,
    studentsEnrolled: 430,
    isFeatured: false,
    outcomes: ['Prepare PLC handover documents', 'Review panel build quality', 'Reduce commissioning rework'],
    requirements: ['Project delivery experience'],
    targetAudience: ['Controls leads', 'Panel builders', 'Commissioning engineers'],
    modules: [
      {
        _id: 'qa-m1',
        title: 'Controls QA System',
        lessons: [
          { _id: 'qa-l1', title: 'I/O test sheets that catch errors', duration: '14 min', isPreview: true },
          { _id: 'qa-l2', title: 'Program revision and handover control', duration: '23 min' }
        ]
      }
    ],
    reviews: []
  }
];

export const consultants = [
  {
    id: 'consultant-planeforge',
    _id: 'consultant-planeforge',
    name: 'PlaneForge',
    title: 'PLC Projects & Products Consulting',
    specialty: 'Company PLC projects, product builds, automation research, and technical support',
    avatar: planeforgeInstructor.avatar,
    bio: 'Companies can consult with PlaneForge for PLC project scoping, automation products, controls research, architecture reviews, builds, troubleshooting, commissioning, and implementation guidance.',
    qualifications: planeforgeInstructor.qualifications,
    experienceYears: planeforgeInstructor.experienceYears,
    consultationFee: 250,
    languages: ['English'],
    availability: [
      { day: 'Tuesday', slots: ['10:00', '14:00'] },
      { day: 'Thursday', slots: ['09:00', '15:00'] }
    ]
  }
];

export const articles = [
  {
    id: 'article-course-review',
    title: 'How to Review a PLC Course Before Buying',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    category: 'PLC Learning',
    readingTime: '5 min',
    excerpt: 'A quick framework for judging PLC curriculum depth, hardware relevance, and hands-on outcomes.'
  },
  {
    id: 'article-consultation',
    title: 'When Companies Should Book PLC Consulting',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80',
    category: 'Consulting',
    readingTime: '4 min',
    excerpt: 'Recognize the moments when PlaneForge PLC consulting and build support can save research time, rework, cost, and project risk.'
  },
  {
    id: 'article-certificates',
    title: 'PLC Certificates That Mean Something',
    image: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=900&q=80',
    category: 'Careers',
    readingTime: '6 min',
    excerpt: 'A professional PLC certificate should point to demonstrated control skills, not just screen time.'
  }
];

export const testimonials = [
  {
    name: 'Kwame Mensah',
    occupation: 'Maintenance Technician',
    photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80',
    review: 'PlaneForge made PLC programming feel practical, from I/O checks to real troubleshooting.'
  },
  {
    name: 'Priya Nair',
    occupation: 'Operations Director',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    review: 'The PlaneForge consultation helped us turn a vague automation idea into a scoped PLC project and product path.'
  },
  {
    name: 'Luis Ortega',
    occupation: 'Automation Project Manager',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    review: 'The PLC estimation course gave our proposal team a clearer way to plan hardware, software, and commissioning.'
  }
];

export const benefits = [
  'PLC-focused curriculum',
  'PLC consulting and builds',
  'Practical ladder logic',
  'Industrial troubleshooting',
  'Professional certificates',
  'Secure payments',
  'Downloadable resources'
];

export const demoUsers = {
  student: {
    id: 'demo-student',
    name: 'Maya Okafor',
    email: 'student@planeforge.test',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    ownedCourses: ['programmable-logic-controller-plc-fundamentals'],
    orders: [
      {
        id: 'order-1001',
        invoiceNumber: 'PF-20260725-DEMO01',
        amount: 149,
        status: 'paid',
        courseTitle: 'Programmable Logic Controller (PLC) Fundamentals'
      }
    ]
  },
  consultant: {
    id: 'demo-consultant',
    name: 'PlaneForge',
    email: 'consultant@planeforge.test',
    role: 'consultant',
    avatar: planeforgeInstructor.avatar
  },
  partner: {
    id: 'demo-partner',
    name: 'Nora Patel',
    email: 'partner@planeforge.test',
    role: 'partner',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
  },
  admin: {
    id: 'demo-admin',
    name: 'PlaneForge Admin',
    email: 'admin@planeforge.test',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80'
  }
};
