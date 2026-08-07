import cpldBoardImage from '../assets/cpld_board_preview.jpg';
import stm32BoardImage from '../assets/stm32_board_preview.jpg';

export const boardImages = {
  cpld: cpldBoardImage,
  stm32: stm32BoardImage
};

export const heroImage = stm32BoardImage;

const images = {
  pcbBench: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=84',
  electronicsBench: stm32BoardImage,
  schematic: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=84',
  engineeringDesk: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1000&q=84',
  lab: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1000&q=84',
  product: cpldBoardImage,
  training: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1000&q=84',
  manufacturing: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1000&q=84'
};

const planeforgeInstructor = {
  name: 'PlaneForge Academy',
  title: 'PCB Design & Hardware Engineering Team',
  avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
  specialty: 'PCB design, hardware engineering, board bring-up, and product builds',
  bio:
    'PlaneForge Academy teaches PCB design through hands-on, project-based courses built around real boards, real workflows, and fabrication-ready outputs.',
  qualifications: [
    'PCB Design',
    'Embedded Hardware',
    'Board Bring-Up',
    'Fabrication-Ready Gerbers'
  ],
  experienceYears: 14
};

const learners = [
  {
    studentName: 'Maya Okafor',
    occupation: 'Electrical Engineering Student',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    comment: 'PlaneForge made PCB design feel like a build process I could actually repeat.'
  },
  {
    studentName: 'Jonas Reed',
    occupation: 'Embedded Developer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    comment: 'The project files, checks, and bring-up flow were exactly what I needed for client hardware.'
  },
  {
    studentName: 'Aisha Raman',
    occupation: 'Robotics Founder',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    comment: 'The capstone path gave our team a practical way to review boards before fabrication.'
  }
];

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const requirementFor = (difficulty) => {
  if (difficulty === 'Beginner') return ['Basic electronics curiosity', 'A laptop that can run PCB design software'];
  if (difficulty === 'Intermediate') return ['Comfort with schematic symbols', 'Basic PCB routing experience'];
  if (difficulty === 'Advanced') return ['Completed at least one PCB layout', 'Ability to read component datasheets'];
  if (difficulty === 'Professional') return ['Prior board project experience', 'Interest in manufacturing or team review workflows'];
  return ['A custom board idea', 'Readiness to document and test a complete PCB project'];
};

const audienceFor = (track) => [
  'Students building a practical PCB portfolio',
  'Makers moving from breadboards to fabricated boards',
  'Engineers who need cleaner board design workflows',
  `${track} learners who want project-based practice`
];

const moduleSet = (course, index) => [
  {
    title: 'Project Brief and Board Architecture',
    description: `Define the constraints, blocks, components, and design choices for ${course.title}.`,
    order: 1,
    lessons: [
      {
        title: `What ${course.title} teaches`,
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
      },
      {
        title: 'Datasheet notes and design constraints',
        duration: '22 min',
        durationSeconds: 1320,
        order: 3
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
        title: 'Placement, routing, and design rules',
        duration: '31 min',
        durationSeconds: 1860,
        order: 2
      },
      {
        title: 'Gerbers, assembly notes, and bring-up checklist',
        duration: index % 3 === 0 ? '34 min' : '28 min',
        durationSeconds: index % 3 === 0 ? 2040 : 1680,
        order: 3,
        resources: [{ label: 'Bring-up checklist', type: 'checklist', downloadable: true }]
      }
    ]
  }
];

const courseBlueprints = [
  {
    track: 'Starter PCB Builds',
    discipline: 'PCB Design',
    image: images.pcbBench,
    courses: [
      ['Build Your First PCB: A Blinking LED Board', 'Start PCB design by building a simple, real blinking LED board.', 'Beginner', 21.99, '3h 20m'],
      ['KiCad Foundations for PCB Beginners', 'Learn the core KiCad workflow before your first fabrication order.', 'Beginner', 24.99, '4h 05m'],
      ['Schematic Capture Essentials', 'Turn a circuit idea into a readable, reviewable schematic.', 'Beginner', 19.99, '2h 55m'],
      ['Footprints, Symbols, and Library Hygiene', 'Create reusable PCB libraries without losing track of parts.', 'Beginner', 24.99, '3h 30m'],
      ['PCB Design Rules, ERC, and DRC Basics', 'Catch avoidable board mistakes before sending files to fabrication.', 'Beginner', 19.99, '2h 45m'],
      ['First Board Bring-Up and Debugging', 'Power up a new board methodically and document the results.', 'Beginner', 29.99, '3h 40m']
    ]
  },
  {
    track: 'Embedded Dev Boards',
    discipline: 'Embedded Hardware',
    image: images.electronicsBench,
    courses: [
      ['Build an ESP32 Dev Board From Scratch', 'Design a practical ESP32 development board from schematic to fabrication files.', 'Intermediate', 34.99, '5h 30m'],
      ['Build an STM32 Sensor Dev Board', 'Create a compact STM32 board with USB, power, headers, and test points.', 'Intermediate', 39.99, '5h 45m'],
      ['RP2040 Custom Dev Board Project', 'Lay out a microcontroller board with flash, USB-C, clocks, and boot controls.', 'Intermediate', 34.99, '4h 55m'],
      ['Arduino-Compatible Shield Design', 'Design a shield that respects mechanical, pinout, and signal constraints.', 'Beginner', 24.99, '3h 35m'],
      ['USB-C Power and Programming Board', 'Build a USB-C powered programming board with practical protection choices.', 'Intermediate', 34.99, '4h 40m'],
      ['Battery-Powered BLE Sensor Node', 'Design a low-power wireless node with charging, regulation, and test strategy.', 'Intermediate', 44.99, '5h 20m'],
      ['CAN Bus Controller Board', 'Create a robust CAN interface board with transceiver placement and protection.', 'Advanced', 49.99, '5h 50m'],
      ['Debug Probe and Programming Header Board', 'Build a compact tool board for SWD, UART, reset, and power injection.', 'Intermediate', 29.99, '3h 45m']
    ]
  },
  {
    track: 'Sensors and Mixed Signal',
    discipline: 'Mixed-Signal PCB',
    image: images.schematic,
    courses: [
      ['Build a Combo Accelerometer + Barometer Breakout Board', 'Design a compact sensor breakout board with practical hardware constraints.', 'Intermediate', 34.99, '4h 35m'],
      ['Precision ADC Data Logger Board', 'Route a low-noise data logger with analog inputs and clean references.', 'Advanced', 49.99, '5h 55m'],
      ['Thermocouple Amplifier PCB', 'Build a sensor board that handles small signals, filtering, and connector choices.', 'Intermediate', 39.99, '4h 50m'],
      ['Load Cell Measurement Board', 'Design a strain measurement board with analog front-end awareness.', 'Advanced', 49.99, '5h 25m'],
      ['Low-Noise Audio Preamp PCB', 'Practice grounding, decoupling, and signal flow in a small audio board.', 'Intermediate', 34.99, '4h 10m'],
      ['IMU + GNSS Logger Board', 'Combine sensors, storage, power, and connectors into a field-ready board.', 'Advanced', 54.99, '6h 05m'],
      ['Environmental Sensor Array PCB', 'Build a modular board for temperature, humidity, pressure, and air-quality sensing.', 'Intermediate', 34.99, '4h 25m'],
      ['Analog Filtering and Protection PCB', 'Create a signal conditioning board with filtering, clamping, and test points.', 'Intermediate', 29.99, '3h 55m']
    ]
  },
  {
    track: 'Power Electronics',
    discipline: 'Power Electronics',
    image: images.lab,
    courses: [
      ['Buck Converter PCB Layout', 'Design a switching regulator layout with loop control and thermal awareness.', 'Intermediate', 39.99, '4h 45m'],
      ['Li-Ion Charger and Protection Board', 'Build a battery charging PCB with power-path and safety considerations.', 'Intermediate', 44.99, '5h 10m'],
      ['Solar MPPT Controller Board', 'Plan a low-voltage solar charging board with measurement and control blocks.', 'Advanced', 59.99, '6h 20m'],
      ['Motor Driver Carrier PCB', 'Route current paths, protection, connectors, and control signals for motors.', 'Advanced', 54.99, '5h 55m'],
      ['Power Distribution Board for Robotics', 'Design a board that distributes power cleanly across a robotics system.', 'Intermediate', 39.99, '4h 40m'],
      ['Isolated DC-DC Module PCB', 'Create a low-voltage isolated module with spacing, filtering, and validation checks.', 'Advanced', 54.99, '5h 30m'],
      ['Thermal Design for Compact PCBs', 'Use copper, placement, vias, and measurement plans to manage board heat.', 'Professional', 64.99, '4h 35m']
    ]
  },
  {
    track: 'High-Speed and RF',
    discipline: 'High-Speed PCB',
    image: images.engineeringDesk,
    courses: [
      ['USB 2.0 PCB Routing Project', 'Route differential pairs, connectors, ESD, and layout details for USB hardware.', 'Advanced', 49.99, '5h 25m'],
      ['Impedance Control for Practical Boards', 'Understand stackups, trace geometry, and manufacturer communication.', 'Advanced', 54.99, '4h 55m'],
      ['Ethernet PHY Board Design', 'Build an Ethernet interface board with magnetics, routing, and power planning.', 'Advanced', 59.99, '6h 05m'],
      ['RF Antenna Breakout Board', 'Design a small RF board with keepouts, matching footprints, and test strategy.', 'Advanced', 59.99, '5h 45m'],
      ['EMC-Aware PCB Design Review', 'Review boards for return paths, loops, shielding, and cable noise risks.', 'Professional', 69.99, '4h 50m'],
      ['Differential Pair Routing Lab', 'Practice pair routing, length matching, vias, and reference plane decisions.', 'Intermediate', 39.99, '3h 55m'],
      ['DDR Routing Concepts for PCB Designers', 'Learn the board-level constraints behind memory interface layouts.', 'Professional', 79.99, '5h 35m']
    ]
  },
  {
    track: 'FPGA and Digital Boards',
    discipline: 'FPGA Hardware',
    image: images.product,
    courses: [
      ['Build Your Own FPGA Development Board From Scratch', 'Create an advanced FPGA development board with disciplined PCB workflows.', 'Advanced', 54.99, '6h 30m'],
      ['JTAG Programmer and Logic Tool Board', 'Design a digital tool board for programming, probing, and lab workflows.', 'Intermediate', 34.99, '4h 15m'],
      ['FPGA Power Sequencing Board', 'Plan rails, supervision, and startup behavior for digital hardware.', 'Advanced', 59.99, '5h 20m'],
      ['High-Pin-Count Connector Breakout', 'Build a breakout board for dense connectors and signal organization.', 'Intermediate', 34.99, '3h 45m'],
      ['Logic Analyzer Front-End PCB', 'Create a practical probing board with protection and clean signal paths.', 'Advanced', 49.99, '5h 05m'],
      ['Digital Board Test Fixture Design', 'Build fixtures that make repeatable board validation easier.', 'Professional', 64.99, '4h 50m']
    ]
  },
  {
    track: 'Drones, Robotics, and IoT',
    discipline: 'Robotics Hardware',
    image: images.manufacturing,
    courses: [
      ['Build Your Own Flight Controller Board From Scratch', 'Design a flight controller board using real embedded hardware decisions.', 'Advanced', 44.99, '6h 05m'],
      ['ESC Carrier and Power Monitoring Board', 'Build a robotics power board with current sensing and connector planning.', 'Advanced', 49.99, '5h 35m'],
      ['Robot Sensor Hub PCB', 'Route a compact board for sensors, buses, power, and rugged connectors.', 'Intermediate', 39.99, '4h 50m'],
      ['Telemetry Radio Interface Board', 'Design a communications interface board with power and signal protection.', 'Intermediate', 39.99, '4h 30m'],
      ['Wearable Sensor PCB Project', 'Design a compact wearable PCB with battery, charging, and enclosure constraints.', 'Intermediate', 39.99, '4h 55m'],
      ['Industrial IoT Gateway PCB', 'Plan a connected hardware board for sensing, power, compute, and field wiring.', 'Professional', 74.99, '6h 15m']
    ]
  },
  {
    track: 'Capstone and Professional Practice',
    discipline: 'Professional PCB Practice',
    image: images.training,
    courses: [
      ['Capstone: Design, Fabricate, and Bring Up Your Own Custom PCB', 'Complete a custom PCB from idea to fabrication and bring-up.', 'Capstone', 59.99, '7h 10m'],
      ['Manufacturing Package and Gerber Release', 'Prepare fabrication, assembly, BOM, CPL, and review files for production.', 'Professional', 49.99, '4h 40m'],
      ['PCB Design Review Like an Engineering Team', 'Run structured schematic and layout reviews before boards are ordered.', 'Professional', 64.99, '5h 05m'],
      ['Cost Optimization for PCB Products', 'Reduce board cost while protecting reliability, assembly, and debug access.', 'Professional', 64.99, '4h 35m'],
      ['Compliance Pre-Check for Hardware Teams', 'Review hardware decisions for EMC, safety, labeling, and documentation readiness.', 'Professional', 69.99, '4h 45m'],
      ['PCB Portfolio Sprint', 'Package course projects into a portfolio that shows real board-building skill.', 'Capstone', 39.99, '3h 50m']
    ]
  }
];

export const courses = courseBlueprints.flatMap((group) =>
  group.courses.map(([title, subtitle, difficulty, price, duration], nestedIndex) => {
    const globalIndex = courseBlueprints
      .slice(0, courseBlueprints.indexOf(group))
      .reduce((sum, item) => sum + item.courses.length, 0) + nestedIndex;
    const slug = slugify(title);
    const review = learners[globalIndex % learners.length];

    return {
      id: `course-${slug}`,
      _id: `course-${slug}`,
      slug,
      title,
      subtitle,
      description:
        `${subtitle} This project-based course moves through requirements, schematic capture, layout decisions, fabrication outputs, and board bring-up so learners leave with a repeatable PCB workflow.`,
      thumbnail: group.image,
      bannerImage: globalIndex % 2 === 0 ? heroImage : group.image,
      category: group.track,
      discipline: group.discipline,
      difficulty,
      instructorName: planeforgeInstructor.name,
      instructor: planeforgeInstructor,
      language: 'English',
      price,
      currency: 'USD',
      purchaseType: 'one_time',
      duration,
      rating: Number((4.6 + ((globalIndex % 5) * 0.08)).toFixed(1)),
      studentsEnrolled: 1020 + ((globalIndex * 73) % 1180),
      isFeatured: globalIndex < 10 || difficulty === 'Capstone',
      certificateAvailable: true,
      outcomes: [
        'Translate a hardware idea into board-level requirements',
        'Create a reviewable schematic and component plan',
        'Route a fabrication-ready PCB with practical design rules',
        'Generate manufacturing files and a board bring-up checklist'
      ],
      skills: [
        group.discipline,
        'Schematic review',
        'PCB layout',
        'DFM checks',
        'Board bring-up'
      ],
      requirements: requirementFor(difficulty),
      targetAudience: audienceFor(group.track),
      faqs: [
        {
          question: 'Do I need to fabricate the board to take this course?',
          answer:
            'No. You can complete the design workflow without fabrication, but ordering the board is recommended for full bring-up practice.'
        },
        {
          question: 'Does this include downloadable project files?',
          answer:
            'Yes. The course structure includes project briefs, review checklists, and manufacturing output references.'
        }
      ],
      modules: moduleSet({ title }, globalIndex),
      reviews: [
        {
          ...review,
          rating: 5
        }
      ],
      resources: [
        { label: 'Project brief', type: 'pdf' },
        { label: 'DFM checklist', type: 'checklist' }
      ]
    };
  })
);

export const consultants = [
  {
    id: 'consultant-planeforge',
    _id: 'consultant-planeforge',
    name: 'PlaneForge',
    title: 'PCB Projects, Products & Build Support',
    specialty:
      'PCB project planning, hardware research, product builds, troubleshooting, and implementation',
    avatar: planeforgeInstructor.avatar,
    bio:
      'Companies consult with PlaneForge for PCB projects, products, builds, hardware research, schematic and layout architecture, troubleshooting, and implementation decisions.',
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
    id: 'article-review-pcb-course',
    _id: 'article-review-pcb-course',
    slug: 'how-to-review-a-pcb-course-before-buying',
    title: 'How to Review a PCB Course Before Buying',
    excerpt:
      'A quick framework for judging PCB curriculum depth, project quality, file outputs, and hands-on outcomes.',
    body:
      'A strong PCB course should show real schematics, design constraints, layout decisions, fabrication outputs, and bring-up discipline.',
    image: images.schematic,
    category: 'PCB Learning',
    readingTime: '5 min'
  },
  {
    id: 'article-consulting-moments',
    _id: 'article-consulting-moments',
    slug: 'when-companies-should-book-pcb-consulting',
    title: 'When Companies Should Book PCB Consulting',
    excerpt:
      'Recognize the moments when PlaneForge build support can reduce research time, rework, cost, and project risk.',
    body:
      'Consulting is useful before board architecture decisions, component selection, manufacturing release, and bring-up troubleshooting.',
    image: images.product,
    category: 'Consulting',
    readingTime: '4 min'
  },
  {
    id: 'article-certificates',
    _id: 'article-certificates',
    slug: 'pcb-certificates-that-mean-something',
    title: 'PCB Certificates That Mean Something',
    excerpt:
      'A professional PCB certificate should point to demonstrated board-building skill, not just screen time.',
    body:
      'PlaneForge certificates are tied to structured progress, practical board outcomes, and project-ready documentation.',
    image: images.training,
    category: 'Careers',
    readingTime: '6 min'
  },
  {
    id: 'article-first-board',
    _id: 'article-first-board',
    slug: 'the-first-board-checklist',
    title: 'The First Board Checklist',
    excerpt:
      'Use this short checklist to catch common schematic, footprint, and fabrication mistakes before your first order.',
    body:
      'First board reviews should cover nets, footprints, polarity, mounting, connectors, design rules, silkscreen, and test access.',
    image: images.pcbBench,
    category: 'Build Notes',
    readingTime: '7 min'
  },
  {
    id: 'article-team-training',
    _id: 'article-team-training',
    slug: 'scaling-pcb-training-for-teams',
    title: 'Scaling PCB Training for Teams',
    excerpt:
      'How teams can use structured project paths, review gates, and shared checklists to onboard many learners at once.',
    body:
      'Team PCB training scales best when learners follow consistent project briefs, review criteria, and progress milestones.',
    image: images.engineeringDesk,
    category: 'Teams',
    readingTime: '8 min'
  },
  {
    id: 'article-bring-up',
    _id: 'article-bring-up',
    slug: 'board-bring-up-without-guesswork',
    title: 'Board Bring-Up Without Guesswork',
    excerpt:
      'A practical sequence for powering, measuring, documenting, and debugging a new PCB.',
    body:
      'Good bring-up starts with inspection, current-limited power, rail checks, clock checks, communication checks, and disciplined notes.',
    image: images.lab,
    category: 'Debugging',
    readingTime: '6 min'
  }
];

export const testimonials = [
  {
    name: 'Maya Okafor',
    role: 'Electrical engineering student',
    avatar: learners[0].avatar,
    quote:
      'I joined for one beginner board and stayed because every project gave me another real workflow to reuse.',
    result: 'Built 4 course boards'
  },
  {
    name: 'Jonas Reed',
    role: 'Embedded developer',
    avatar: learners[1].avatar,
    quote:
      'The course structure helped me explain layout decisions to clients and stop treating PCB review as guesswork.',
    result: 'Reduced review rework'
  },
  {
    name: 'Aisha Raman',
    role: 'Robotics founder',
    avatar: learners[2].avatar,
    quote:
      'PlaneForge gave our hardware team a shared language for board architecture, DFM, and bring-up planning.',
    result: 'Team-ready PCB process'
  }
];

export const benefits = [
  'Project-based PCB curriculum',
  'Real board-building practice',
  'Flexible self-paced learning',
  'Project certificates',
  'Fabrication-ready outputs',
  'Downloadable resources',
  'Scalable learner onboarding',
  'Company consulting support'
];

export const publicStats = [
  { value: '100', label: 'Launch learners supported' },
  { value: `${courses.length}`, label: 'PCB courses in the catalog' },
  { value: '8', label: 'Structured learning tracks' },
  { value: '100%', label: 'Project-based course paths' }
];
