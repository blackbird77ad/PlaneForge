export const heroImage =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1800&q=85';

const planeforgeInstructor = {
  name: 'PlaneForge Academy',
  title: 'PCB Design & Hardware Engineering Team',
  avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
  specialty: 'PCB design, hardware engineering, board bring-up, and product builds',
  bio: 'PlaneForge Academy teaches PCB design through hands-on, project-based courses built around real boards, real workflows, and fabrication-ready outputs.',
  qualifications: ['PCB Design', 'Hardware Engineering', 'Board Bring-Up', 'Fabrication-Ready Gerbers'],
  experienceYears: 14
};

const pcbImage = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80';

export const courses = [
  {
    id: 'course-blinking-led-pcb',
    _id: 'course-blinking-led-pcb',
    slug: 'build-your-first-pcb-blinking-led-board',
    title: 'Build Your First PCB: A Blinking LED Board',
    subtitle: 'Start PCB design by building a simple, real blinking LED board.',
    description:
      'A beginner PCB design course that introduces schematic capture, footprints, layout, routing, Gerbers, and first-board bring-up.',
    thumbnail: pcbImage,
    bannerImage: heroImage,
    category: 'PCB',
    discipline: 'PCB Design',
    difficulty: 'Beginner',
    instructorName: planeforgeInstructor.name,
    instructor: planeforgeInstructor,
    language: 'English',
    price: 21.99,
    currency: 'USD',
    duration: 'Project-based',
    isFeatured: true
  },
  {
    id: 'course-esp32-dev-board',
    _id: 'course-esp32-dev-board',
    slug: 'build-an-esp32-dev-board-from-scratch',
    title: 'Build an ESP32 Dev Board From Scratch',
    subtitle: 'Design a practical ESP32 development board from schematic to fabrication files.',
    description:
      'A project-based ESP32 board course covering power, USB, programming headers, layout choices, and hardware bring-up.',
    thumbnail: pcbImage,
    bannerImage: heroImage,
    category: 'PCB',
    discipline: 'PCB Design',
    difficulty: 'Intermediate',
    instructorName: planeforgeInstructor.name,
    instructor: planeforgeInstructor,
    language: 'English',
    price: 34.99,
    currency: 'USD',
    duration: 'Project-based',
    isFeatured: true
  },
  {
    id: 'course-sensor-breakout',
    _id: 'course-sensor-breakout',
    slug: 'build-a-combo-accelerometer-barometer-breakout-board',
    title: 'Build a Combo Accelerometer + Barometer Breakout Board',
    subtitle: 'Design a compact sensor breakout board with practical hardware constraints.',
    description:
      'A PCB course focused on sensor selection, schematic capture, layout, headers, routing, and fabrication-ready outputs.',
    thumbnail: pcbImage,
    bannerImage: heroImage,
    category: 'PCB',
    discipline: 'PCB Design',
    difficulty: 'Intermediate',
    instructorName: planeforgeInstructor.name,
    instructor: planeforgeInstructor,
    language: 'English',
    price: 34.99,
    currency: 'USD',
    duration: 'Project-based',
    isFeatured: true
  },
  {
    id: 'course-fpga-dev-board',
    _id: 'course-fpga-dev-board',
    slug: 'build-your-own-fpga-development-board-from-scratch',
    title: 'Build Your Own FPGA Development Board From Scratch',
    subtitle: 'Create an advanced FPGA development board with disciplined PCB workflows.',
    description:
      'An advanced course for FPGA board architecture, power planning, signal integrity awareness, layout, and bring-up.',
    thumbnail: pcbImage,
    bannerImage: heroImage,
    category: 'PCB',
    discipline: 'PCB Design',
    difficulty: 'Advanced',
    instructorName: planeforgeInstructor.name,
    instructor: planeforgeInstructor,
    language: 'English',
    price: 54.99,
    currency: 'USD',
    duration: 'Project-based',
    isFeatured: true
  },
  {
    id: 'course-flight-controller',
    _id: 'course-flight-controller',
    slug: 'build-your-own-flight-controller-board-from-scratch',
    title: 'Build Your Own Flight Controller Board From Scratch',
    subtitle: 'Design a flight controller board using real embedded hardware design decisions.',
    description:
      'An advanced PCB course for microcontrollers, sensors, power, routing, connectors, and practical board bring-up.',
    thumbnail: pcbImage,
    bannerImage: heroImage,
    category: 'PCB',
    discipline: 'PCB Design',
    difficulty: 'Advanced',
    instructorName: planeforgeInstructor.name,
    instructor: planeforgeInstructor,
    language: 'English',
    price: 44.99,
    currency: 'USD',
    duration: 'Project-based',
    isFeatured: true
  },
  {
    id: 'course-custom-pcb-capstone',
    _id: 'course-custom-pcb-capstone',
    slug: 'capstone-design-fabricate-and-bring-up-your-own-custom-pcb',
    title: 'Capstone: Design, Fabricate, and Bring Up Your Own Custom PCB',
    subtitle: 'Complete a custom PCB from idea to fabrication and bring-up.',
    description:
      'A capstone course for planning, designing, fabricating, testing, and documenting your own custom PCB project.',
    thumbnail: pcbImage,
    bannerImage: heroImage,
    category: 'PCB',
    discipline: 'PCB Design',
    difficulty: 'Capstone',
    instructorName: planeforgeInstructor.name,
    instructor: planeforgeInstructor,
    language: 'English',
    price: 59.99,
    currency: 'USD',
    duration: 'Project-based',
    isFeatured: true
  }
];

export const consultants = [
  {
    id: 'consultant-planeforge',
    _id: 'consultant-planeforge',
    name: 'PlaneForge',
    title: 'PCB Projects, Products & Build Support',
    specialty: 'PCB project planning, hardware research, product builds, troubleshooting, and implementation',
    avatar: planeforgeInstructor.avatar,
    bio: 'Companies consult with PlaneForge for PCB projects, products, builds, hardware research, schematic and layout architecture, troubleshooting, and implementation decisions.',
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

export const articles = [];

export const testimonials = [];

export const benefits = [
  'Project-based PCB curriculum',
  'Real board-building practice',
  'Flexible self-paced learning',
  'Project certificates',
  'Fabrication-ready outputs',
  'Downloadable resources'
];

export const demoUsers = {
  student: {
    id: 'demo-student',
    name: 'Maya Okafor',
    email: 'student@planeforge.test',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    ownedCourses: ['build-your-first-pcb-blinking-led-board'],
    orders: [
      {
        id: 'order-1001',
        invoiceNumber: 'PF-20260725-DEMO01',
        amount: 21.99,
        status: 'paid',
        courseTitle: 'Build Your First PCB: A Blinking LED Board'
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
