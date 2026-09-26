import { useEffect, useMemo, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import {
  Archive,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Eye,
  FileText,
  GripVertical,
  ImagePlus,
  Inbox,
  Layers3,
  LoaderCircle,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Star,
  UploadCloud,
  UserCog,
  Users,
  X
} from 'lucide-react';
import { DashboardShell } from '../components/DashboardShell.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { PasswordField } from '../components/PasswordField.jsx';
import { PhoneNumberField } from '../components/PhoneNumberField.jsx';
import {
  archiveAdminArticle,
  archiveAdminCourse,
  archiveAdminProduct,
  createAdminArticle,
  createAdminCareerPosition,
  createAdminCourse,
  duplicateAdminCareerPosition,
  createAdminExpense,
  createAdminProduct,
  createAdminUser,
  createStreamUploadIntent,
  getAdminActivity,
  getAdminCareerApplications,
  getAdminCareerPositions,
  getAdminConsultations,
  getAdminContent,
  getAdminEarnings,
  getAdminExpenses,
  getAdminInquiries,
  getAdminOverview,
  getAdminPayments,
  getAdminReviews,
  getAdminUsers,
  grantAdminEnrollment,
  refreshStreamUpload,
  updateAdminArticle,
  updateAdminCareerApplication,
  updateAdminCareerPosition,
  updateAdminConsultation,
  updateAdminCourse,
  updateAdminExpense,
  updateAdminInquiry,
  updateAdminPayment,
  updateAdminProduct,
  updateAdminReview,
  updateAdminUser,
  uploadImageAsset
} from '../api/client.js';
import { getContactNumberError } from '../utils/contactNumber.js';

const encodeUploadMetadata = (items = {}) =>
  Object.entries(items)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key} ${btoa(unescape(encodeURIComponent(String(value))))}`)
    .join(',');

const uploadToMuxDirectUrl = ({ directUploadUrl, file, onProgress }) =>
  new Promise((resolve, reject) => {
    const create = new XMLHttpRequest();
    create.open('POST', directUploadUrl);
    create.setRequestHeader('Tus-Resumable', '1.0.0');
    create.setRequestHeader('Upload-Length', String(file.size));
    create.setRequestHeader(
      'Upload-Metadata',
      encodeUploadMetadata({ filename: file.name, filetype: file.type })
    );
    create.onload = () => {
      if (create.status < 200 || create.status >= 300) {
        reject(new Error('Mux upload could not be initialized.'));
        return;
      }

      const location = create.getResponseHeader('Location');
      if (!location) {
        reject(new Error('Mux did not return an upload location.'));
        return;
      }

      const patch = new XMLHttpRequest();
      patch.open('PATCH', location);
      patch.setRequestHeader('Tus-Resumable', '1.0.0');
      patch.setRequestHeader('Upload-Offset', '0');
      patch.setRequestHeader('Content-Type', 'application/offset+octet-stream');
      patch.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
      };
      patch.onload = () => {
        if (patch.status >= 200 && patch.status < 300) {
          onProgress?.(100);
          resolve();
        } else {
          reject(new Error('Mux upload failed while sending the video.'));
        }
      };
      patch.onerror = () => reject(new Error('Network error while uploading to Mux.'));
      patch.send(file);
    };
    create.onerror = () => reject(new Error('Network error while creating the Mux upload.'));
    create.send();
  });

const difficultyOptions = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
const courseStatusOptions = ['draft', 'published', 'archived'];
const purchaseTypeOptions = ['one_time', 'subscription'];
const streamProviders = ['mux', 'bunny', 'vimeo', 'external', 'unconfigured'];
const streamStatusOptions = ['not_uploaded', 'uploading', 'processing', 'ready', 'failed'];
const categoryFallbackOptions = [
  'PCB Design',
  'Embedded Systems',
  'Electronics',
  'Manufacturing',
  'Hardware Startup',
  'Capstone'
];
const disciplineFallbackOptions = [
  'PCB Layout',
  'Schematic Design',
  'Firmware',
  'Signal Integrity',
  'Manufacturing Preparation',
  'Hardware Validation'
];
const currencyOptions = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
const languageOptions = ['English', 'Spanish', 'French', 'German', 'Portuguese'];
const accessDurationOptions = [
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
  { label: '6 months', days: 180 },
  { label: '1 year', days: 365 },
  { label: 'Custom duration', days: '' }
];
const inquiryStatusOptions = ['open', 'new', 'in_review', 'responded', 'closed'];
const inquiryUpdateStatuses = ['new', 'in_review', 'responded', 'closed'];
const priorityOptions = ['low', 'normal', 'high'];
const intentOptions = [
  'quote',
  'issue',
  'message',
  'course',
  'product',
  'consulting',
  'collaboration',
  'general'
];
const userRoles = ['user', 'consultant', 'partner', 'admin'];
const adminCreatedUserRoles = ['user', 'consultant', 'partner', 'admin'];
const userStatuses = ['active', 'suspended', 'pending'];
const orderStatuses = ['pending', 'payment_initialized', 'verified', 'paid', 'failed', 'refunded'];
const providers = ['stripe'];
const consultationStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
const articleStatuses = ['draft', 'published'];
const productStatusOptions = ['draft', 'published', 'archived'];
const productTypeOptions = ['physical', 'digital'];
const careerPositionStatuses = ['draft', 'published', 'closed', 'archived'];
const careerApplicationStatuses = ['new', 'under_review', 'shortlisted', 'assessment', 'interview', 'selected', 'rejected', 'withdrawn'];

const serverIdPattern = /^[a-f0-9]{24}$/i;
const makeClientId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const adminSections = new Set([
  'overview',
  'inquiries',
  'courses',
  'reviews',
  'streaming',
  'products',
  'careers',
  'articles',
  'users',
  'finance',
  'orders',
  'payments',
  'consultations',
  'reports'
]);

const adminSectionLinks = [
  { section: 'overview', to: '/dashboard/admin', label: 'Dashboard', icon: BarChart3 },
  { section: 'courses', to: '/dashboard/admin/courses', label: 'Courses', icon: BookOpen },
  { section: 'products', to: '/dashboard/admin/products', label: 'Products', icon: Package },
  { section: 'orders', to: '/dashboard/admin/orders', label: 'Orders', icon: FileText },
  { section: 'users', to: '/dashboard/admin/users', label: 'Users', icon: Users },
  { section: 'payments', to: '/dashboard/admin/payments', label: 'Payments', icon: CreditCard },
  { section: 'articles', to: '/dashboard/admin/articles', label: 'Blog', icon: FileText },
  { section: 'careers', to: '/dashboard/admin/careers', label: 'Careers', icon: BriefcaseBusiness },
  { section: 'consultations', to: '/dashboard/admin/consultations', label: 'Consultations', icon: CalendarDays },
  { section: 'inquiries', to: '/dashboard/admin/inquiries', label: 'Inquiries', icon: Inbox },
  { section: 'reports', to: '/dashboard/admin/reports', label: 'Reports', icon: BarChart3 }
];

const emptyResource = () => ({
  label: '',
  url: '',
  type: 'file',
  downloadable: true
});

const emptyLesson = (order = 1) => ({
  clientId: makeClientId('lesson'),
  title: order === 1 ? 'Introduction' : '',
  description: '',
  duration: '8 min',
  durationSeconds: 0,
  isPreview: order === 1,
  order,
  stream: {
    provider: 'unconfigured',
    status: 'not_uploaded',
    assetId: '',
    playbackId: '',
    uploadId: '',
    signedPlaybackRequired: true,
    allowDownloads: false
  },
  resources: []
});

const emptyModule = (order = 1) => ({
  clientId: makeClientId('module'),
  title: order === 1 ? 'Getting Started' : '',
  description: '',
  order,
  lessons: [emptyLesson()]
});

const initialCourseForm = () => ({
  id: '',
  slug: '',
  title: '',
  subtitle: '',
  description: '',
  category: '',
  discipline: '',
  difficulty: 'Beginner',
  price: '49',
  currency: 'USD',
  purchaseType: 'one_time',
  subscriptionDurationDays: '',
  accessDurationType: 'lifetime',
  accessDurationDays: '365',
  discountEnabled: false,
  discountType: 'percentage',
  discountValue: '',
  discountStartsAt: '',
  discountEndsAt: '',
  status: 'draft',
  thumbnail: '',
  bannerImage: '',
  imagesText: '',
  videoUrl: '',
  duration: '4h 30m',
  instructorName: 'PlaneForge Academy',
  language: 'English',
  isFeatured: false,
  certificateAvailable: true,
  outcomesText: '',
  skillsText: '',
  requirementsText: '',
  targetAudienceText: '',
  modules: [emptyModule()]
});

const initialArticleForm = () => ({
  id: '',
  title: '',
  excerpt: '',
  category: '',
  readingTime: '',
  image: '',
  status: 'published',
  body: ''
});

const initialProductForm = () => ({
  id: '',
  title: '',
  description: '',
  category: '',
  sku: '',
  productType: 'physical',
  thumbnail: '',
  imagesText: '',
  videoUrl: '',
  price: '49',
  currency: 'USD',
  status: 'published',
  inventoryTrack: false,
  inventoryQuantity: '0',
  isFeatured: false
});

const initialCareerForm = () => ({
  id: '',
  title: '',
  hiringCompany: 'PlaneForge',
  department: '',
  employmentType: 'full_time',
  workArrangement: 'remote',
  location: '',
  country: '',
  shortDescription: '',
  description: '',
  salaryRange: '',
  responsibilitiesText: '',
  requirementsText: '',
  benefitsText: '',
  status: 'draft',
  applicationDeadline: '',
  applicationMethod: 'internal',
  externalApplyUrl: ''
});

const initialUserForm = () => ({
  name: '',
  email: '',
  contactNumber: '',
  dateOfBirth: '',
  password: '',
  role: 'user',
  status: 'active',
  title: '',
  organization: '',
  specialty: '',
  consultationFee: '',
  partnerCode: '',
  commissionRate: ''
});

const initialExpenseForm = () => ({
  id: '',
  title: '',
  category: 'operations',
  amount: '',
  currency: 'USD',
  periodStart: '',
  periodEnd: '',
  settledAmount: '0',
  settlementStatus: 'unsettled',
  notes: ''
});

const isServerRecord = (value) => serverIdPattern.test(String(value || ''));

const listToText = (items) => (Array.isArray(items) ? items.filter(Boolean).join('\n') : '');

const textToList = (value) =>
  String(value || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const editableTextList = (value) => {
  const raw = String(value ?? '');
  if (!raw.trim()) return [''];
  return raw.split(/\r?\n/);
};

const uniqueOptions = (...groups) =>
  Array.from(
    new Set(
      groups
        .flat()
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    )
  );

const moveItem = (items, fromIndex, toIndex) => {
  if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return items;
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
};

const renumberLessons = (lessons = []) =>
  lessons.map((lesson, index) => ({
    ...lesson,
    order: index + 1
  }));

const renumberModules = (modules = []) =>
  modules.map((module, index) => ({
    ...module,
    order: index + 1,
    lessons: renumberLessons(module.lessons?.length ? module.lessons : [emptyLesson()])
  }));

const getModuleKey = (module, index) => module?._id || module?.clientId || `module-${index}`;
const getLessonKey = (lesson, moduleIndex, lessonIndex) =>
  lesson?._id || lesson?.clientId || `lesson-${moduleIndex}-${lessonIndex}`;

const hasText = (value) => Boolean(String(value || '').trim());

const lessonHasVideo = (lesson = {}) => {
  const stream = lesson.stream || {};
  return Boolean(
    lesson.videoUrl ||
      stream.playbackId ||
      stream.assetId ||
      stream.uploadId ||
      ['uploading', 'processing', 'ready'].includes(stream.status)
  );
};

const courseDraftIssues = (form) => {
  const issues = [];

  if (!hasText(form.title)) {
    issues.push({ label: 'Add a course title', sectionId: 'course-information' });
  }
  if (!hasText(form.description)) {
    issues.push({ label: 'Add a full course description', sectionId: 'course-information' });
  }
  if (!hasText(form.category)) {
    issues.push({ label: 'Choose a category', sectionId: 'course-information' });
  }
  if (!hasText(form.discipline)) {
    issues.push({ label: 'Choose a discipline', sectionId: 'course-information' });
  }

  return issues;
};

const coursePublishIssues = (form) => {
  const modules = form.modules || [];
  const lessons = modules.flatMap((module) => module.lessons || []);
  const issues = [...courseDraftIssues(form)];

  if (!hasText(form.thumbnail)) {
    issues.push({ label: 'Add a course thumbnail', sectionId: 'course-media' });
  }
  if (!modules.some((module) => hasText(module.title))) {
    issues.push({ label: 'Add at least one module', sectionId: 'course-curriculum' });
  }
  if (!lessons.some((lesson) => hasText(lesson.title))) {
    issues.push({ label: 'Add at least one lesson', sectionId: 'course-curriculum' });
  }
  if (!hasText(form.videoUrl) && !lessons.some(lessonHasVideo)) {
    issues.push({ label: 'Add course video', sectionId: 'course-media' });
  }
  if (form.discountEnabled) {
    const value = Number(form.discountValue || 0);
    if (value < 0 || (form.discountType === 'percentage' && value > 100)) {
      issues.push({ label: 'Fix the discount amount', sectionId: 'course-pricing' });
    }
    if (form.discountStartsAt && form.discountEndsAt && new Date(form.discountEndsAt) < new Date(form.discountStartsAt)) {
      issues.push({ label: 'Fix the discount schedule', sectionId: 'course-pricing' });
    }
  }

  return issues;
};

const activeDiscountForForm = (form, now = new Date()) => {
  if (!form.discountEnabled) return null;
  const value = Number(form.discountValue || 0);
  if (value <= 0) return null;
  if (form.discountType === 'percentage' && value > 100) return null;
  if (form.discountStartsAt && new Date(form.discountStartsAt) > now) return null;
  if (form.discountEndsAt && new Date(form.discountEndsAt) < now) return null;
  return { type: form.discountType || 'percentage', value };
};

const coursePricePreview = (form) => {
  const originalPrice = Math.max(0, Number(form.price || 0));
  const discount = activeDiscountForForm(form);
  const discountAmount = discount
    ? discount.type === 'fixed'
      ? Math.min(originalPrice, Number(discount.value || 0))
      : originalPrice * (Number(discount.value || 0) / 100)
    : 0;
  const finalPrice = Math.max(0, Number((originalPrice - discountAmount).toFixed(2)));

  return {
    originalPrice,
    finalPrice,
    discountAmount,
    isFree: finalPrice <= 0
  };
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('File could not be read.'));
    reader.readAsDataURL(file);
  });

const formatDate = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

const formatMoney = (amount = 0, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(Number(amount || 0));
  } catch {
    return `${currency || 'USD'} ${Number(amount || 0).toFixed(2)}`;
  }
};

const statusLabel = (value) => String(value || 'unknown').replaceAll('_', ' ');

const roleLabel = (value) => (['student', 'learner', 'buyer', 'user'].includes(value) ? 'user' : statusLabel(value));

const statusTone = (value) => {
  if (['active', 'published', 'paid', 'confirmed', 'completed', 'responded', 'ready', 'reviewed', 'resolved'].includes(value)) {
    return 'positive';
  }

  if (['pending', 'payment_initialized', 'verified', 'in_review', 'processing', 'uploading', 'draft', 'new', 'open'].includes(value)) {
    return 'attention';
  }

  if (['failed', 'refunded', 'cancelled', 'closed', 'suspended', 'archived'].includes(value)) {
    return 'muted';
  }

  return 'neutral';
};

const courseToForm = (course) => ({
  id: course?._id || '',
  slug: course?.slug || '',
  title: course?.title || '',
  subtitle: course?.subtitle || '',
  description: course?.description || '',
  category: course?.category || '',
  discipline: course?.discipline || '',
  difficulty: course?.difficulty || 'Beginner',
  price: String(course?.price ?? 0),
  currency: course?.currency || 'USD',
  purchaseType: course?.purchaseType || 'one_time',
  subscriptionDurationDays: course?.subscriptionDurationDays ? String(course.subscriptionDurationDays) : '',
  accessDurationType: course?.accessDurationType || (course?.subscriptionDurationDays ? 'limited' : 'lifetime'),
  accessDurationDays: String(course?.accessDurationDays || course?.subscriptionDurationDays || 365),
  discountEnabled: Boolean(course?.discount?.enabled),
  discountType: course?.discount?.type || 'percentage',
  discountValue: course?.discount?.value ? String(course.discount.value) : '',
  discountStartsAt: course?.discount?.startsAt ? course.discount.startsAt.slice(0, 16) : '',
  discountEndsAt: course?.discount?.endsAt ? course.discount.endsAt.slice(0, 16) : '',
  status: course?.status || 'published',
  thumbnail: course?.thumbnail || '',
  bannerImage: course?.bannerImage || '',
  imagesText: listToText(course?.images),
  videoUrl: course?.videoUrl || '',
  duration: course?.duration || '4h 30m',
  instructorName: course?.instructorName || course?.instructor?.name || 'PlaneForge Academy',
  language: course?.language || 'English',
  isFeatured: Boolean(course?.isFeatured),
  certificateAvailable: course?.certificateAvailable !== false,
  outcomesText: listToText(course?.outcomes),
  skillsText: listToText(course?.skills),
  requirementsText: listToText(course?.requirements),
  targetAudienceText: listToText(course?.targetAudience),
  modules: course?.modules?.length
    ? course.modules.map((module, moduleIndex) => ({
        clientId: makeClientId('module'),
        _id: module._id,
        title: module.title || '',
        description: module.description || '',
        order: module.order || moduleIndex + 1,
        lessons: module.lessons?.length
          ? module.lessons.map((lesson, lessonIndex) => ({
              clientId: makeClientId('lesson'),
              _id: lesson._id,
              title: lesson.title || '',
              description: lesson.description || '',
              duration: lesson.duration || '8 min',
              durationSeconds: lesson.durationSeconds || 0,
              isPreview: Boolean(lesson.isPreview),
              order: lesson.order || lessonIndex + 1,
              stream: {
                ...emptyLesson().stream,
                ...(lesson.stream || {})
              },
              resources: lesson.resources?.length
                ? lesson.resources.map((resource) => ({
                    label: resource.label || '',
                    url: resource.url || '',
                    type: resource.type || 'file',
                    downloadable: Boolean(resource.downloadable)
                  }))
                : []
            }))
          : [emptyLesson()]
      }))
    : [emptyModule()]
});

const lessonPayload = (lesson, index) => ({
  ...(isServerRecord(lesson._id) ? { _id: lesson._id } : {}),
  title: lesson.title?.trim() || `Lesson ${index + 1}`,
  description: lesson.description?.trim(),
  duration: lesson.duration?.trim() || '8 min',
  durationSeconds: Number(lesson.durationSeconds) || 0,
  isPreview: Boolean(lesson.isPreview),
  order: index + 1,
  stream: {
    provider: lesson.stream?.provider || 'unconfigured',
    status: lesson.stream?.status || 'not_uploaded',
    assetId: lesson.stream?.assetId?.trim() || undefined,
    playbackId: lesson.stream?.playbackId?.trim() || undefined,
    uploadId: lesson.stream?.uploadId?.trim() || undefined,
    signedPlaybackRequired: lesson.stream?.signedPlaybackRequired !== false,
    allowDownloads: Boolean(lesson.stream?.allowDownloads)
  },
  resources: Array.isArray(lesson.resources)
    ? lesson.resources
        .map((resource) => ({
          label: resource.label?.trim() || '',
          url: resource.url?.trim() || '',
          type: resource.type?.trim() || 'file',
          downloadable: Boolean(resource.downloadable)
        }))
        .filter((resource) => resource.label || resource.url)
    : []
});

const coursePayload = (form) => ({
  title: form.title.trim(),
  subtitle: form.subtitle.trim(),
  description: form.description.trim(),
  category: form.category.trim(),
  discipline: form.discipline.trim(),
  difficulty: form.difficulty,
  price: Number(form.price || 0),
  currency: form.currency.trim().toUpperCase() || 'USD',
  purchaseType: form.purchaseType,
  subscriptionDurationDays:
    form.purchaseType === 'subscription' && form.subscriptionDurationDays
      ? Number(form.subscriptionDurationDays)
      : null,
  accessDurationType: form.accessDurationType || 'lifetime',
  accessDurationDays:
    form.accessDurationType === 'limited' && form.accessDurationDays
      ? Number(form.accessDurationDays)
      : null,
  discount: {
    enabled: Boolean(form.discountEnabled),
    type: form.discountType || 'percentage',
    value: Number(form.discountValue || 0),
    startsAt: form.discountStartsAt || null,
    endsAt: form.discountEndsAt || null
  },
  status: form.status,
  thumbnail: form.thumbnail.trim(),
  bannerImage: form.bannerImage.trim(),
  images: textToList(form.imagesText).slice(0, 5),
  videoUrl: form.videoUrl.trim(),
  duration: form.duration.trim(),
  instructorName: form.instructorName.trim(),
  language: form.language.trim() || 'English',
  isFeatured: Boolean(form.isFeatured),
  certificateAvailable: Boolean(form.certificateAvailable),
  outcomes: textToList(form.outcomesText),
  skills: textToList(form.skillsText),
  requirements: textToList(form.requirementsText),
  targetAudience: textToList(form.targetAudienceText),
  modules: renumberModules(form.modules).map((module, moduleIndex) => ({
    ...(isServerRecord(module._id) ? { _id: module._id } : {}),
    title: module.title?.trim() || `Module ${moduleIndex + 1}`,
    description: module.description?.trim(),
    order: moduleIndex + 1,
    lessons: (module.lessons?.length ? module.lessons : [emptyLesson()]).map(lessonPayload)
  }))
});

const productToForm = (product) => ({
  id: product?._id || '',
  title: product?.title || '',
  description: product?.description || '',
  category: product?.category || '',
  sku: product?.sku || '',
  productType: product?.productType || 'physical',
  thumbnail: product?.thumbnail || '',
  imagesText: listToText(product?.images),
  videoUrl: product?.videoUrl || '',
  price: String(product?.price ?? 49),
  currency: product?.currency || 'USD',
  status: product?.status || 'published',
  inventoryTrack: Boolean(product?.inventory?.track),
  inventoryQuantity: String(product?.inventory?.quantity ?? 0),
  isFeatured: Boolean(product?.isFeatured)
});

const productPayload = (form) => ({
  title: form.title.trim(),
  description: form.description.trim(),
  category: form.category.trim(),
  sku: form.sku.trim(),
  productType: form.productType,
  thumbnail: form.thumbnail.trim(),
  images: textToList(form.imagesText).slice(0, 5),
  videoUrl: form.videoUrl.trim(),
  price: Number(form.price || 0),
  currency: form.currency.trim().toUpperCase() || 'USD',
  status: form.status,
  inventory: {
    track: Boolean(form.inventoryTrack),
    quantity: Number(form.inventoryQuantity || 0)
  },
  isFeatured: Boolean(form.isFeatured)
});

const careerToForm = (position = {}) => ({
  id: position._id || '',
  title: position.title || '',
  hiringCompany: position.hiringCompany || 'PlaneForge',
  department: position.department || '',
  employmentType: position.employmentType || 'full_time',
  workArrangement: position.workArrangement || 'remote',
  location: position.location || '',
  country: position.country || '',
  shortDescription: position.shortDescription || '',
  description: position.description || '',
  salaryRange: position.salaryRange || '',
  responsibilitiesText: listToText((position.responsibilities || []).map((item) => item.text || item)),
  requirementsText: listToText((position.requirements || []).map((item) => item.text || item)),
  benefitsText: listToText((position.benefits || []).map((item) => item.text || item)),
  status: position.status || 'draft',
  applicationDeadline: position.applicationDeadline ? String(position.applicationDeadline).slice(0, 10) : '',
  applicationMethod: position.applicationMethod || 'internal',
  externalApplyUrl: position.externalApplyUrl || ''
});

const careerPayload = (form) => ({
  title: form.title.trim(),
  hiringCompany: form.hiringCompany.trim() || 'PlaneForge',
  department: form.department.trim(),
  employmentType: form.employmentType,
  workArrangement: form.workArrangement,
  location: form.location.trim(),
  country: form.country.trim(),
  shortDescription: form.shortDescription.trim(),
  description: form.description.trim(),
  salaryRange: form.salaryRange.trim(),
  responsibilities: textToList(form.responsibilitiesText).map((text) => ({ text })),
  requirements: textToList(form.requirementsText).map((text) => ({ text })),
  benefits: textToList(form.benefitsText).map((text) => ({ text })),
  status: form.status,
  applicationDeadline: form.applicationDeadline || null,
  applicationMethod: form.applicationMethod,
  externalApplyUrl: form.externalApplyUrl.trim()
});

const articleToForm = (article) => ({
  id: article?._id || '',
  title: article?.title || '',
  excerpt: article?.excerpt || '',
  category: article?.category || '',
  readingTime: article?.readingTime || '',
  image: article?.image || '',
  status: article?.status || 'published',
  body: article?.body || ''
});

const articlePayload = (form) => ({
  title: form.title.trim(),
  excerpt: form.excerpt.trim(),
  category: form.category.trim(),
  readingTime: form.readingTime.trim(),
  image: form.image.trim(),
  status: form.status,
  body: form.body.trim()
});

const userPayload = (form) => ({
  name: form.name.trim(),
  email: form.email.trim(),
  contactNumber: form.contactNumber.trim(),
  dateOfBirth: form.dateOfBirth,
  password: form.password,
  role: form.role,
  status: form.status,
  title: form.title.trim(),
  specialty: form.role === 'consultant' ? form.specialty.trim() : '',
  consultationFee: form.role === 'consultant' ? Number(form.consultationFee || 0) : 0,
  partnerCode: form.role === 'partner' ? form.partnerCode.trim() : '',
  commissionRate: form.role === 'partner' ? Number(form.commissionRate || 0) : 0,
  profile: form.organization.trim() ? { organization: form.organization.trim() } : undefined
});

const replaceById = (items, nextItem) =>
  items.map((item) => (item._id === nextItem._id ? nextItem : item));

export const AdminDashboard = () => {
  const { section } = useParams();
  const activeSection = adminSections.has(section) ? section : 'overview';
  const [overview, setOverview] = useState(null);
  const [activities, setActivities] = useState([]);
  const [content, setContent] = useState({ courses: [], articles: [], products: [] });
  const [reviews, setReviews] = useState({ reviews: [] });
  const [inquiries, setInquiries] = useState({ inquiries: [], grouped: { byIntent: [], byStatus: [], byTopic: [] } });
  const [users, setUsers] = useState({ users: [], pagination: null });
  const [payments, setPayments] = useState({ orders: [], pagination: null });
  const [careerPositions, setCareerPositions] = useState({ positions: [], pagination: null });
  const [careerApplications, setCareerApplications] = useState({ applications: [], pagination: null });
  const [consultations, setConsultations] = useState({ consultations: [], pagination: null });
  const [expenses, setExpenses] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [courseForm, setCourseForm] = useState(() => initialCourseForm());
  const [productForm, setProductForm] = useState(() => initialProductForm());
  const [careerForm, setCareerForm] = useState(() => initialCareerForm());
  const [articleForm, setArticleForm] = useState(() => initialArticleForm());
  const [userForm, setUserForm] = useState(() => initialUserForm());
  const [expenseForm, setExpenseForm] = useState(() => initialExpenseForm());
  const [grants, setGrants] = useState({});
  const [filters, setFilters] = useState({
    inquiryStatus: 'open',
    inquiryIntent: '',
    inquiryPriority: '',
    inquirySearch: '',
    userRole: '',
    userStatus: '',
    userSearch: '',
    paymentStatus: '',
    paymentProvider: '',
    paymentSearch: '',
    careerStatus: '',
    careerSearch: '',
    careerApplicationStatus: '',
    consultationStatus: '',
    consultationSearch: '',
    courseSearch: '',
    courseStatus: '',
    courseCategory: '',
    courseDifficulty: '',
    courseInstructor: '',
    reviewStatus: 'pending'
  });
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});
  const [courseSaveState, setCourseSaveState] = useState('idle');
  const [validationSummary, setValidationSummary] = useState({ title: '', items: [] });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [taxonomyDrafts, setTaxonomyDrafts] = useState({ category: '', discipline: '' });
  const [taxonomyAddMode, setTaxonomyAddMode] = useState({ category: false, discipline: false });
  const [expandedModules, setExpandedModules] = useState({ 'module-0': true });
  const [courseEditorOpen, setCourseEditorOpen] = useState(false);

  const courses = content.courses || [];
  const products = content.products || [];
  const articles = content.articles || [];
  const serverCourses = courses.filter((course) => isServerRecord(course._id));
  const activeSectionMeta = adminSectionLinks.find((item) => item.section === activeSection) || adminSectionLinks[0];
  const shellTitle = activeSection === 'courses' ? 'Courses' : `Admin console: ${activeSectionMeta.label}`;
  const shellSubtitle =
    activeSection === 'courses'
      ? 'Course catalogue and management for PlaneForge Academy.'
      : 'Manage content, access, support, payments, and platform configuration.';
  const categoryOptions = uniqueOptions(categoryFallbackOptions, courses.map((course) => course.category), courseForm.category);
  const disciplineOptions = uniqueOptions(
    disciplineFallbackOptions,
    courses.map((course) => course.discipline),
    courseForm.discipline
  );
  const activeImages = textToList(courseForm.imagesText).slice(0, 5);
  const courseSkills = textToList(courseForm.skillsText);
  const pricePreview = coursePricePreview(courseForm);
  const filteredCourses = courses.filter((course) => {
    const search = filters.courseSearch.trim().toLowerCase();
    const matchesSearch =
      !search ||
      [course.title, course.subtitle, course.instructorName, course.category, course.discipline]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    const matchesStatus = !filters.courseStatus || (course.status || 'published') === filters.courseStatus;
    const matchesCategory = !filters.courseCategory || course.category === filters.courseCategory;
    const matchesDifficulty = !filters.courseDifficulty || course.difficulty === filters.courseDifficulty;
    const matchesInstructor =
      !filters.courseInstructor ||
      String(course.instructorName || course.instructor?.name || '')
        .toLowerCase()
        .includes(filters.courseInstructor.trim().toLowerCase());

    return matchesSearch && matchesStatus && matchesCategory && matchesDifficulty && matchesInstructor;
  });
  const primaryVideoTarget = courseForm.modules?.[0]?.lessons?.[0]
    ? {
        moduleIndex: 0,
        lessonIndex: 0,
        module: courseForm.modules[0],
        lesson: courseForm.modules[0].lessons[0]
      }
    : null;
  const primaryVideoStatus = courseForm.videoUrl
    ? 'ready'
    : primaryVideoTarget?.lesson?.stream?.status || 'not_uploaded';
  const primaryUploadProgress =
    primaryVideoTarget?.lesson?._id && uploadProgress[primaryVideoTarget.lesson._id] != null
      ? uploadProgress[primaryVideoTarget.lesson._id]
      : null;
  const canUploadPrimaryVideo =
    isServerRecord(courseForm.id) &&
    isServerRecord(primaryVideoTarget?.module?._id) &&
    isServerRecord(primaryVideoTarget?.lesson?._id);
  const courseSaveLabel =
    busyAction === 'course-save' || courseSaveState === 'saving'
      ? 'Saving...'
      : courseSaveState === 'dirty'
        ? 'Unsaved changes'
        : courseSaveState === 'saved'
          ? 'Saved'
          : 'Ready to draft';

  const lessonRows = useMemo(
    () =>
      courses.flatMap((course) =>
        (course.modules || []).flatMap((module) =>
          (module.lessons || []).map((lesson) => ({
            course,
            module,
            lesson
          }))
        )
      ),
    [courses]
  );

  const refresh = async ({ quiet = false, section: nextSection = activeSection } = {}) => {
    if (!quiet) setLoading(true);

    const tasks = {
      overview: [
        ['overview', getAdminOverview],
        ['activity', () => getAdminActivity({ limit: 80 })]
      ],
      inquiries: [
        ['inquiries', () => getAdminInquiries({
          status: filters.inquiryStatus,
          intent: filters.inquiryIntent,
          priority: filters.inquiryPriority,
          search: filters.inquirySearch,
          limit: 80
        })]
      ],
      courses: [['content', getAdminContent]],
      reviews: [
        ['reviews', () => getAdminReviews({ status: filters.reviewStatus })]
      ],
      streaming: [['content', getAdminContent]],
      products: [['content', getAdminContent]],
      articles: [['content', getAdminContent]],
      users: [
        ['users', () => getAdminUsers({
          role: filters.userRole,
          status: filters.userStatus,
          search: filters.userSearch,
          limit: 80
        })],
        ['content', getAdminContent]
      ],
      finance: [
        ['expenses', getAdminExpenses],
        ['earnings', getAdminEarnings]
      ],
      payments: [
        ['payments', () => getAdminPayments({
          status: filters.paymentStatus,
          provider: filters.paymentProvider,
          search: filters.paymentSearch,
          limit: 80
        })]
      ],
      orders: [
        ['payments', () => getAdminPayments({
          status: filters.paymentStatus,
          provider: filters.paymentProvider,
          search: filters.paymentSearch,
          limit: 80
        })]
      ],
      careers: [
        ['careerPositions', () => getAdminCareerPositions({
          status: filters.careerStatus,
          search: filters.careerSearch,
          limit: 80
        })],
        ['careerApplications', () => getAdminCareerApplications({
          status: filters.careerApplicationStatus,
          search: filters.careerSearch,
          limit: 80
        })]
      ],
      consultations: [
        ['consultations', () => getAdminConsultations({
          status: filters.consultationStatus,
          search: filters.consultationSearch,
          limit: 80
        })]
      ],
      reports: [
        ['overview', getAdminOverview],
        ['activity', () => getAdminActivity({ limit: 80 })]
      ]
    };

    const selectedTasks = tasks[nextSection] || tasks.overview;
    const results = await Promise.allSettled(selectedTasks.map(([, task]) => task()));
    const nextData = {};

    results.forEach((result, index) => {
      if (result.status !== 'fulfilled') return;
      const key = selectedTasks[index][0];
      nextData[key] = result.value;

      if (key === 'overview') setOverview(result.value);
      if (key === 'activity') setActivities(result.value.activities || []);
      if (key === 'content') setContent(result.value);
      if (key === 'inquiries') setInquiries(result.value);
      if (key === 'users') setUsers(result.value);
      if (key === 'payments') setPayments(result.value);
      if (key === 'careerPositions') setCareerPositions(result.value);
      if (key === 'careerApplications') setCareerApplications(result.value);
      if (key === 'consultations') setConsultations(result.value);
      if (key === 'reviews') setReviews(result.value);
      if (key === 'expenses') setExpenses(result.value.expenses || []);
      if (key === 'earnings') setEarnings(result.value.earnings || []);
    });

    const failed = results.filter((result) => result.status === 'rejected');
    if (failed.length) {
      setNotice({
        type: 'error',
        text: 'Some admin data could not load. Check API connectivity and admin session status.'
      });
    } else if (!quiet) {
      setNotice({ type: 'success', text: 'Admin data refreshed.' });
    }

    setLoading(false);
    return nextData;
  };

  useEffect(() => {
    refresh({ section: activeSection });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  const setFilter = (key, value) =>
    setFilters((current) => ({
      ...current,
      [key]: value
    }));

  const updateUserForm = (key, value) =>
    setUserForm((current) => ({
      ...current,
      [key]: value
    }));

  const updateExpenseForm = (key, value) =>
    setExpenseForm((current) => ({
      ...current,
      [key]: value
    }));

  const runAction = async (key, action, successText) => {
    setBusyAction(key);
    setNotice({ type: '', text: '' });

    try {
      const data = await action();
      if (successText) setNotice({ type: 'success', text: successText });
      return data;
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
      return null;
    } finally {
      setBusyAction('');
    }
  };

  const markCourseDirty = () => {
    setCourseSaveState('dirty');
    setValidationSummary({ title: '', items: [] });
  };

  const updateCourseField = (key, value) => {
    markCourseDirty();
    setCourseForm((current) => ({
      ...current,
      [key]: value
    }));
  };

  const updateProductField = (key, value) =>
    setProductForm((current) => ({
      ...current,
      [key]: value
    }));

  const selectCourseTaxonomy = (field, value) => {
    if (value === '__add_new__') {
      setTaxonomyAddMode((current) => ({ ...current, [field]: true }));
      setTaxonomyDrafts((current) => ({ ...current, [field]: '' }));
      return;
    }

    updateCourseField(field, value);
  };

  const addCourseTaxonomyOption = (field) => {
    const nextValue = taxonomyDrafts[field].trim();
    if (!nextValue) return;
    updateCourseField(field, nextValue);
    setTaxonomyDrafts((current) => ({ ...current, [field]: '' }));
    setTaxonomyAddMode((current) => ({ ...current, [field]: false }));
  };

  const uploadAdminImage = async ({ file, folder, publicId }) => {
    const dataUrl = await fileToDataUrl(file);
    const result = await uploadImageAsset({
      data: dataUrl,
      folder,
      publicId
    });

    return result.asset?.secureUrl || result.asset?.url;
  };

  const uploadSingleMedia = async ({ file, folder, publicId, actionKey, setField }) => {
    if (!file) return;
    setBusyAction(`media-${actionKey || publicId}`);
    setNotice({ type: '', text: '' });

    try {
      const url = await uploadAdminImage({ file, folder, publicId });
      setField(url);
      setNotice({ type: 'success', text: 'Media uploaded. Save the record to keep this change.' });
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Media upload failed.' });
    } finally {
      setBusyAction('');
    }
  };

  const uploadGalleryMedia = async ({ files, folder, publicIdPrefix, currentText, setField }) => {
    const currentItems = textToList(currentText).slice(0, 5);
    const remaining = Math.max(5 - currentItems.length, 0);
    const selectedFiles = Array.from(files || []).slice(0, remaining);

    if (!selectedFiles.length) {
      setNotice({ type: 'error', text: 'You can upload up to 5 images.' });
      return;
    }

    setBusyAction(`media-${publicIdPrefix}`);
    setNotice({ type: '', text: '' });

    try {
      const uploaded = [];
      for (const [index, file] of selectedFiles.entries()) {
        uploaded.push(
          await uploadAdminImage({
            file,
            folder,
            publicId: `${publicIdPrefix}-${Date.now()}-${index + 1}`
          })
        );
      }
      setField([...currentItems, ...uploaded].slice(0, 5).join('\n'));
      setNotice({ type: 'success', text: 'Images uploaded. Save the record to keep these changes.' });
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Image upload failed.' });
    } finally {
      setBusyAction('');
    }
  };

  const updateCourseListItem = (field, itemIndex, value) => {
    const items = editableTextList(courseForm[field]);
    items[itemIndex] = value;
    updateCourseField(field, items.join('\n'));
  };

  const addCourseListItem = (field) => {
    updateCourseField(field, [...editableTextList(courseForm[field]), ''].join('\n'));
  };

  const removeCourseListItem = (field, itemIndex) => {
    const items = editableTextList(courseForm[field]).filter((_, index) => index !== itemIndex);
    updateCourseField(field, items.join('\n'));
  };

  const addSkill = () => {
    const value = skillInput.trim();
    if (!value) return;
    const next = uniqueOptions(courseSkills, value);
    updateCourseField('skillsText', next.join('\n'));
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    updateCourseField('skillsText', courseSkills.filter((item) => item !== skill).join('\n'));
  };

  const moveGalleryImage = (fromIndex, toIndex) => {
    updateCourseField('imagesText', moveItem(activeImages, fromIndex, toIndex).join('\n'));
  };

  const updateModuleField = (moduleIndex, key, value) => {
    markCourseDirty();
    setCourseForm((current) => ({
      ...current,
      modules: current.modules.map((module, index) =>
        index === moduleIndex ? { ...module, [key]: value } : module
      )
    }));
  };

  const updateLessonField = (moduleIndex, lessonIndex, key, value) => {
    markCourseDirty();
    setCourseForm((current) => ({
      ...current,
      modules: current.modules.map((module, index) => {
        if (index !== moduleIndex) return module;

        return {
          ...module,
          lessons: module.lessons.map((lesson, nestedIndex) =>
            nestedIndex === lessonIndex ? { ...lesson, [key]: value } : lesson
          )
        };
      })
    }));
  };

  const updateLessonStreamField = (moduleIndex, lessonIndex, key, value) => {
    markCourseDirty();
    setCourseForm((current) => ({
      ...current,
      modules: current.modules.map((module, index) => {
        if (index !== moduleIndex) return module;

        return {
          ...module,
          lessons: module.lessons.map((lesson, nestedIndex) =>
            nestedIndex === lessonIndex
              ? {
                  ...lesson,
                  stream: {
                    ...lesson.stream,
                    [key]: value
                  }
                }
              : lesson
          )
        };
      })
    }));
  };

  const clearLessonStream = (moduleIndex, lessonIndex) => {
    markCourseDirty();
    setCourseForm((current) => ({
      ...current,
      modules: current.modules.map((module, index) => {
        if (index !== moduleIndex) return module;

        return {
          ...module,
          lessons: module.lessons.map((lesson, nestedIndex) =>
            nestedIndex === lessonIndex ? { ...lesson, stream: emptyLesson().stream } : lesson
          )
        };
      })
    }));
  };

  const addLessonResource = (moduleIndex, lessonIndex) => {
    markCourseDirty();
    setCourseForm((current) => ({
      ...current,
      modules: current.modules.map((module, index) => {
        if (index !== moduleIndex) return module;

        return {
          ...module,
          lessons: module.lessons.map((lesson, nestedIndex) =>
            nestedIndex === lessonIndex
              ? { ...lesson, resources: [...(lesson.resources || []), emptyResource()] }
              : lesson
          )
        };
      })
    }));
  };

  const updateLessonResourceField = (moduleIndex, lessonIndex, resourceIndex, key, value) => {
    markCourseDirty();
    setCourseForm((current) => ({
      ...current,
      modules: current.modules.map((module, index) => {
        if (index !== moduleIndex) return module;

        return {
          ...module,
          lessons: module.lessons.map((lesson, nestedIndex) => {
            if (nestedIndex !== lessonIndex) return lesson;

            return {
              ...lesson,
              resources: (lesson.resources || []).map((resource, itemIndex) =>
                itemIndex === resourceIndex ? { ...resource, [key]: value } : resource
              )
            };
          })
        };
      })
    }));
  };

  const removeLessonResource = (moduleIndex, lessonIndex, resourceIndex) => {
    markCourseDirty();
    setCourseForm((current) => ({
      ...current,
      modules: current.modules.map((module, index) => {
        if (index !== moduleIndex) return module;

        return {
          ...module,
          lessons: module.lessons.map((lesson, nestedIndex) =>
            nestedIndex === lessonIndex
              ? {
                  ...lesson,
                  resources: (lesson.resources || []).filter((_, itemIndex) => itemIndex !== resourceIndex)
                }
              : lesson
          )
        };
      })
    }));
  };

  const addModule = () => {
    const nextModule = emptyModule(courseForm.modules.length + 1);
    markCourseDirty();
    setExpandedModules((current) => ({ ...current, [nextModule.clientId]: true }));
    setCourseForm((current) => ({
      ...current,
      modules: renumberModules([...current.modules, nextModule])
    }));
  };

  const removeModule = (moduleIndex) => {
    markCourseDirty();
    setCourseForm((current) => ({
      ...current,
      modules:
        current.modules.length > 1
          ? renumberModules(current.modules.filter((_, index) => index !== moduleIndex))
          : current.modules
    }));
  };

  const moveModule = (moduleIndex, direction) => {
    markCourseDirty();
    setCourseForm((current) => ({
      ...current,
      modules: renumberModules(moveItem(current.modules, moduleIndex, moduleIndex + direction))
    }));
  };

  const toggleModule = (module, moduleIndex) => {
    const key = getModuleKey(module, moduleIndex);
    setExpandedModules((current) => ({ ...current, [key]: !current[key] }));
  };

  const addLesson = (moduleIndex) => {
    markCourseDirty();
    setCourseForm((current) => ({
      ...current,
      modules: current.modules.map((module, index) =>
        index === moduleIndex
          ? {
              ...module,
              lessons: renumberLessons([...module.lessons, emptyLesson(module.lessons.length + 1)])
            }
          : module
      )
    }));
  };

  const removeLesson = (moduleIndex, lessonIndex) => {
    markCourseDirty();
    setCourseForm((current) => ({
      ...current,
      modules: current.modules.map((module, index) => {
        if (index !== moduleIndex || module.lessons.length <= 1) return module;

        return {
          ...module,
          lessons: renumberLessons(module.lessons.filter((_, nestedIndex) => nestedIndex !== lessonIndex))
        };
      })
    }));
  };

  const moveLesson = (moduleIndex, lessonIndex, direction) => {
    markCourseDirty();
    setCourseForm((current) => ({
      ...current,
      modules: current.modules.map((module, index) =>
        index === moduleIndex
          ? {
              ...module,
              lessons: renumberLessons(moveItem(module.lessons, lessonIndex, lessonIndex + direction))
            }
          : module
      )
    }));
  };

  const editCourse = (course) => {
    const nextForm = courseToForm(course);
    setCourseForm(nextForm);
    setCourseEditorOpen(true);
    setCourseSaveState('saved');
    setValidationSummary({ title: '', items: [] });
    setPreviewOpen(false);
    setExpandedModules(
      nextForm.modules?.[0] ? { [getModuleKey(nextForm.modules[0], 0)]: true } : { 'module-0': true }
    );
    document.getElementById('course-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetCourseForm = () => {
    const nextForm = initialCourseForm();
    setCourseForm(nextForm);
    setCourseEditorOpen(true);
    setCourseSaveState('idle');
    setValidationSummary({ title: '', items: [] });
    setPreviewOpen(false);
    setSkillInput('');
    setExpandedModules({ [getModuleKey(nextForm.modules[0], 0)]: true });
    document.getElementById('course-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetProductForm = () => setProductForm(initialProductForm());

  const resetCareerForm = () => setCareerForm(initialCareerForm());

  const expensePayload = (form) => ({
    title: form.title.trim(),
    category: form.category.trim() || 'operations',
    amount: Number(form.amount || 0),
    currency: form.currency.trim().toUpperCase() || 'USD',
    periodStart: form.periodStart || undefined,
    periodEnd: form.periodEnd || undefined,
    settledAmount: Number(form.settledAmount || 0),
    settlementStatus: form.settlementStatus,
    notes: form.notes.trim()
  });

  const submitExpense = async (event) => {
    event.preventDefault();
    const isEditing = isServerRecord(expenseForm.id);
    const data = await runAction(
      'expense-save',
      () =>
        isEditing
          ? updateAdminExpense(expenseForm.id, expensePayload(expenseForm))
          : createAdminExpense(expensePayload(expenseForm)),
      isEditing ? 'Expense updated.' : 'Expense recorded.'
    );

    if (data?.expense) {
      setExpenseForm(initialExpenseForm());
      await refresh({ quiet: true });
    }
  };

  const editExpense = (expense) => {
    setExpenseForm({
      id: expense._id || '',
      title: expense.title || '',
      category: expense.category || 'operations',
      amount: String(expense.amount ?? ''),
      currency: expense.currency || 'USD',
      periodStart: expense.periodStart ? expense.periodStart.slice(0, 10) : '',
      periodEnd: expense.periodEnd ? expense.periodEnd.slice(0, 10) : '',
      settledAmount: String(expense.settledAmount ?? 0),
      settlementStatus: expense.settlementStatus || 'unsettled',
      notes: expense.notes || ''
    });
    document.getElementById('finance')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const showCourseValidation = (title, items) => {
    setValidationSummary({ title, items });
    setNotice({ type: 'error', text: title });
    requestAnimationFrame(() => {
      document.getElementById('course-validation')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const saveCourse = async ({ status, successText }) => {
    const nextForm = { ...courseForm, status };
    const payload = coursePayload(nextForm);
    const isEditing = isServerRecord(courseForm.id);

    setCourseSaveState('saving');
    const data = await runAction(
      'course-save',
      () => (isEditing ? updateAdminCourse(courseForm.id, payload) : createAdminCourse(payload)),
      successText
    );

    if (data?.course) {
      const savedForm = courseToForm(data.course);
      setCourseForm(savedForm);
      setCourseSaveState('saved');
      setValidationSummary({ title: '', items: [] });
      await refresh({ quiet: true });
      return data.course;
    }

    setCourseSaveState('dirty');
    return null;
  };

  const saveDraftCourse = async () => {
    const issues = courseDraftIssues(courseForm);
    if (issues.length) {
      showCourseValidation("Course needs a little more before saving.", issues);
      return null;
    }

    const isEditing = isServerRecord(courseForm.id);
    return saveCourse({
      status: 'draft',
      successText: isEditing ? 'Draft saved.' : 'Draft created.'
    });
  };

  const publishCourse = async () => {
    const issues = coursePublishIssues({ ...courseForm, status: 'published' });
    if (issues.length) {
      showCourseValidation("Course isn't ready to publish.", issues);
      return null;
    }

    return saveCourse({
      status: 'published',
      successText: isServerRecord(courseForm.id) ? 'Course published.' : 'Course created and published.'
    });
  };

  const submitCourse = async (event) => {
    event.preventDefault();
    await saveDraftCourse();
  };

  const scrollToCourseSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const archiveCourse = async (course) => {
    const data = await runAction(
      `course-archive-${course._id}`,
      () => archiveAdminCourse(course._id),
      'Course archived.'
    );

    if (data) await refresh({ quiet: true });
  };

  const updateCourseStatus = async (course, status) => {
    const payload = {
      ...coursePayload(courseToForm(course)),
      status
    };
    const data = await runAction(
      `course-status-${course._id}`,
      () => updateAdminCourse(course._id, payload),
      status === 'published' ? 'Course published.' : status === 'draft' ? 'Course unpublished.' : 'Course updated.'
    );

    if (data?.course) {
      await refresh({ quiet: true, section: 'courses' });
    }
  };

  const duplicateCourse = async (course) => {
    const copyModules = (course.modules || []).map((module, moduleIndex) => ({
      title: module.title || `Module ${moduleIndex + 1}`,
      description: module.description || '',
      order: moduleIndex + 1,
      lessons: (module.lessons || []).map((lesson, lessonIndex) => ({
        title: lesson.title || `Lesson ${lessonIndex + 1}`,
        description: lesson.description || '',
        duration: lesson.duration || '8 min',
        durationSeconds: lesson.durationSeconds || 0,
        isPreview: Boolean(lesson.isPreview),
        order: lessonIndex + 1,
        stream: emptyLesson().stream,
        resources: lesson.resources || []
      }))
    }));

    const data = await runAction(
      `course-duplicate-${course._id}`,
      () =>
        createAdminCourse({
          ...coursePayload(courseToForm(course)),
          title: `${course.title} Copy`,
          status: 'draft',
          modules: copyModules
        }),
      'Course duplicated as a draft.'
    );

    if (data?.course) {
      setCourseForm(courseToForm(data.course));
      setCourseEditorOpen(true);
      await refresh({ quiet: true, section: 'courses' });
    }
  };

  const previewCourse = (course) => {
    editCourse(course);
    setPreviewOpen(true);
  };

  const moderateReview = async (review, status) => {
    const data = await runAction(
      `review-${review._id}`,
      () => updateAdminReview({ courseId: review.course._id, reviewId: review._id, status }),
      status === 'approved' ? 'Review approved.' : 'Review declined.'
    );

    if (data) {
      await refresh({ quiet: true, section: 'reviews' });
      await refresh({ quiet: true, section: 'courses' });
    }
  };

  const editProduct = (product) => {
    setProductForm(productToForm(product));
    document.getElementById('product-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const submitProduct = async (event) => {
    event.preventDefault();
    const payload = productPayload(productForm);
    const isEditing = isServerRecord(productForm.id);

    const data = await runAction(
      'product-save',
      () => (isEditing ? updateAdminProduct(productForm.id, payload) : createAdminProduct(payload)),
      isEditing ? 'Product updated.' : 'Product created.'
    );

    if (data?.product) {
      setProductForm(productToForm(data.product));
      await refresh({ quiet: true });
    }
  };

  const archiveProduct = async (product) => {
    const data = await runAction(
      `product-archive-${product._id}`,
      () => archiveAdminProduct(product._id),
      'Product archived.'
    );

    if (data) await refresh({ quiet: true });
  };

  const editCareerPosition = (position) => {
    setCareerForm(careerToForm(position));
    document.getElementById('career-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const submitCareerPosition = async (event) => {
    event.preventDefault();
    const payload = careerPayload(careerForm);
    const isEditing = isServerRecord(careerForm.id);
    const data = await runAction(
      'career-save',
      () => (isEditing ? updateAdminCareerPosition(careerForm.id, payload) : createAdminCareerPosition(payload)),
      isEditing ? 'Career position updated.' : 'Career position created.'
    );

    if (data?.position) {
      setCareerForm(careerToForm(data.position));
      await refresh({ quiet: true, section: 'careers' });
    }
  };

  const updateCareerPositionStatus = async (position, status) => {
    const data = await runAction(
      `career-status-${position._id}`,
      () => updateAdminCareerPosition(position._id, { ...careerPayload(careerToForm(position)), status }),
      'Career position updated.'
    );
    if (data) await refresh({ quiet: true, section: 'careers' });
  };

  const duplicateCareerPosition = async (position) => {
    const data = await runAction(
      `career-duplicate-${position._id}`,
      () => duplicateAdminCareerPosition(position._id),
      'Career position duplicated.'
    );
    if (data?.position) {
      setCareerForm(careerToForm(data.position));
      await refresh({ quiet: true, section: 'careers' });
    }
  };

  const updateCareerApplication = async (application, status) => {
    const data = await runAction(
      `career-application-${application._id}`,
      () => updateAdminCareerApplication(application._id, { status }),
      'Application updated.'
    );
    if (data?.application) await refresh({ quiet: true, section: 'careers' });
  };

  const requestUploadIntent = async ({ course, module, lesson }) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setBusyAction(`stream-${lesson._id}`);
      setNotice({ type: '', text: '' });
      setUploadProgress((current) => ({ ...current, [lesson._id]: 0 }));

      try {
        const data = await createStreamUploadIntent({
          courseId: course._id,
          moduleId: module._id,
          lessonId: lesson._id
        });

        if (!data?.upload?.directUploadUrl) {
          throw new Error(data?.upload?.message || 'Mux upload URL was not created.');
        }

        await uploadToMuxDirectUrl({
          directUploadUrl: data.upload.directUploadUrl,
          file,
          onProgress: (progress) =>
            setUploadProgress((current) => ({ ...current, [lesson._id]: progress }))
        });

        setNotice({
          type: 'success',
          text: 'Video uploaded. Refresh this lesson in a moment to check processing.'
        });
        const refreshed = await refresh({ quiet: true });
        const updatedCourse = refreshed?.content?.courses?.find((item) => item._id === course._id);
        if (updatedCourse && courseForm.id === course._id) {
          setCourseForm(courseToForm(updatedCourse));
          setCourseSaveState('saved');
        }
      } catch (error) {
        setNotice({ type: 'error', text: error.message || 'Video upload failed.' });
      } finally {
        setBusyAction('');
      }
    };
    input.click();
  };

  const refreshLessonStream = async ({ course, module, lesson }) => {
    const data = await runAction(
      `stream-refresh-${lesson._id}`,
      () =>
        refreshStreamUpload({
          courseId: course._id,
          moduleId: module._id,
          lessonId: lesson._id
        }),
      ''
    );

    if (data?.stream) {
      setNotice({
        type: 'success',
        text: data.stream.message || `Video status: ${statusLabel(data.stream.status)}`
      });
      const refreshed = await refresh({ quiet: true });
      const updatedCourse = refreshed?.content?.courses?.find((item) => item._id === course._id);
      if (updatedCourse && courseForm.id === course._id) {
        setCourseForm(courseToForm(updatedCourse));
        setCourseSaveState('saved');
      }
    }
  };

  const submitArticle = async (event) => {
    event.preventDefault();
    const payload = articlePayload(articleForm);
    const isEditing = isServerRecord(articleForm.id);

    const data = await runAction(
      'article-save',
      () => (isEditing ? updateAdminArticle(articleForm.id, payload) : createAdminArticle(payload)),
      isEditing ? 'Article updated.' : 'Article published.'
    );

    if (data?.article) {
      setArticleForm(articleToForm(data.article));
      await refresh({ quiet: true });
    }
  };

  const archiveArticle = async (article) => {
    const data = await runAction(
      `article-archive-${article._id}`,
      () => archiveAdminArticle(article._id),
      'Article moved to drafts.'
    );

    if (data?.article) {
      setContent((current) => ({
        ...current,
        articles: replaceById(current.articles || [], data.article)
      }));
    }
  };

  const updateInquiry = async (inquiry, payload) => {
    const data = await runAction(
      `inquiry-${inquiry._id}`,
      () => updateAdminInquiry(inquiry._id, payload),
      'Inquiry updated.'
    );

    if (data?.inquiry) {
      setInquiries((current) => ({
        ...current,
        inquiries: replaceById(current.inquiries || [], data.inquiry)
      }));
      await refresh({ quiet: true });
    }
  };

  const updateUser = async (user, payload) => {
    const data = await runAction(
      `user-${user._id}`,
      () => updateAdminUser(user._id, payload),
      'User updated.'
    );

    if (data?.user) {
      setUsers((current) => ({
        ...current,
        users: replaceById(current.users || [], data.user)
      }));
    }
  };

  const submitUser = async (event) => {
    event.preventDefault();

    if (userForm.password.length < 8) {
      setNotice({ type: 'error', text: 'Use at least 8 characters for the account password.' });
      return;
    }

    const contactNumberError = getContactNumberError(userForm.contactNumber);
    if (contactNumberError) {
      setNotice({ type: 'error', text: contactNumberError });
      return;
    }

    const data = await runAction(
      'user-create',
      () => createAdminUser(userPayload(userForm)),
      'Account created.'
    );

    if (data?.user) {
      setUserForm(initialUserForm());
      await refresh({ quiet: true });
    }
  };

  const setGrant = (userId, key, value) =>
    setGrants((current) => ({
      ...current,
      [userId]: {
        ...(current[userId] || {}),
        [key]: value
      }
    }));

  const grantCourse = async (user) => {
    const grant = grants[user._id] || {};
    if (!grant.courseId) {
      setNotice({ type: 'error', text: 'Choose a course before granting access.' });
      return;
    }

    const data = await runAction(
      `grant-${user._id}`,
      () =>
        grantAdminEnrollment(user._id, {
          courseId: grant.courseId,
          expiresAt: grant.expiresAt || undefined
        }),
      'Course access granted.'
    );

    if (data?.enrollment) {
      setGrants((current) => ({
        ...current,
        [user._id]: { courseId: '', expiresAt: '' }
      }));
      await refresh({ quiet: true });
    }
  };

  const updatePayment = async (order, status) => {
    const data = await runAction(
      `payment-${order._id}`,
      () => updateAdminPayment(order._id, { status }),
      'Payment updated.'
    );

    if (data?.order) {
      setPayments((current) => ({
        ...current,
        orders: replaceById(current.orders || [], data.order)
      }));
      await refresh({ quiet: true });
    }
  };

  const updateConsultation = async (consultation, status) => {
    const data = await runAction(
      `consultation-${consultation._id}`,
      () => updateAdminConsultation(consultation._id, { status }),
      'Consultation updated.'
    );

    if (data?.consultation) {
      setConsultations((current) => ({
        ...current,
        consultations: replaceById(current.consultations || [], data.consultation)
      }));
    }
  };

  const applyFilters = (event) => {
    event.preventDefault();
    refresh();
  };

  const metrics = [
    {
      label: 'Revenue',
      value: formatMoney(overview?.revenue || 0),
      detail: `${overview?.paidOrders ?? 0} paid orders`,
      to: '/dashboard/admin/payments',
      actionLabel: 'View payments'
    },
    {
      label: 'Users',
      value:
        overview?.users ??
        overview?.students ??
        users.users?.filter((user) => ['user', 'student', 'learner', 'buyer'].includes(user.role)).length ??
        0,
      detail: `${overview?.activeEnrollments ?? 0} active enrollments`,
      to: '/dashboard/admin/users',
      actionLabel: 'Manage users'
    },
    {
      label: 'Courses',
      value: overview?.courses ?? courses.filter((course) => course.status !== 'draft').length,
      detail: `${overview?.draftCourses ?? courses.filter((course) => course.status === 'draft').length} drafts`,
      to: '/dashboard/admin/courses',
      actionLabel: 'Manage courses'
    },
    {
      label: 'Reviews',
      value: overview?.pendingReviews ?? reviews.reviews?.filter((review) => review.status === 'pending').length ?? 0,
      detail: 'Need moderation',
      to: '/dashboard/admin/reviews',
      actionLabel: 'Moderate reviews'
    },
    {
      label: 'Products',
      value: overview?.products ?? products.filter((product) => product.status === 'published').length,
      detail: `${overview?.draftProducts ?? products.filter((product) => product.status === 'draft').length} drafts`,
      to: '/dashboard/admin/products',
      actionLabel: 'Manage products'
    },
    {
      label: 'Open Inquiries',
      value: overview?.inquiries ?? inquiries.inquiries?.length ?? 0,
      detail: `${overview?.pendingOrders ?? 0} orders need attention`,
      to: '/dashboard/admin/inquiries',
      actionLabel: 'Review inquiries'
    },
    {
      label: 'Active Carts',
      value: overview?.activeCartItems ?? 0,
      detail: `${overview?.cartItems ?? 0} tracked cart events`,
      to: '/dashboard/admin/reports',
      actionLabel: 'View reports'
    },
    {
      label: 'Consultants',
      value: overview?.consultants ?? 0,
      detail: `${overview?.consultations ?? consultations.consultations?.length ?? 0} consultations`,
      to: '/dashboard/admin/consultations',
      actionLabel: 'View bookings'
    },
    {
      label: 'Subscribers',
      value: overview?.subscribers ?? 0,
      detail: 'Newsletter list',
      to: '/dashboard/admin/articles',
      actionLabel: 'Manage blog'
    },
    {
      label: 'Admins',
      value: overview?.admins ?? users.users?.filter((user) => user.role === 'admin').length ?? 0,
      detail: 'Platform operators',
      to: '/dashboard/admin/users',
      actionLabel: 'Manage access'
    },
    {
      label: 'Partners',
      value: overview?.partners ?? users.users?.filter((user) => user.role === 'partner').length ?? 0,
      detail: 'Referral accounts',
      to: '/dashboard/admin/users',
      actionLabel: 'Manage partners'
    }
  ];

  const renderImagePreview = (url, remove) => (
    <figure className="admin-media-preview" key={url}>
      <img src={url} alt="" loading="lazy" decoding="async" />
      <button className="button ghost small" type="button" onClick={remove}>
        Remove
      </button>
    </figure>
  );

  const renderRepeatableCourseSection = ({ id, title, description, field, addLabel, placeholder }) => {
    const items = editableTextList(courseForm[field]);

    return (
      <section className="course-builder-section" id={id}>
        <div className="course-section-heading">
          <div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
          <button className="button ghost small" type="button" onClick={() => addCourseListItem(field)}>
            <Plus size={16} />
            {addLabel}
          </button>
        </div>
        <div className="repeatable-list">
          {items.map((item, index) => (
            <div className="repeatable-row" key={`${field}-${index}`}>
              <span>{index + 1}</span>
              <input
                value={item}
                onChange={(event) => updateCourseListItem(field, index, event.target.value)}
                placeholder={placeholder}
              />
              <button
                className="icon-button"
                type="button"
                title="Remove item"
                onClick={() => removeCourseListItem(field, index)}
                disabled={items.length === 1 && !item.trim()}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderCoursePreview = () => {
    const previewModules = renumberModules(courseForm.modules || []);
    const previewOutcomes = textToList(courseForm.outcomesText);

    return (
      <article className="course-preview-card">
        <div className="course-preview-media">
          {courseForm.thumbnail ? (
            <img src={courseForm.thumbnail} alt="" loading="lazy" decoding="async" />
          ) : (
            <span>No thumbnail yet</span>
          )}
        </div>
        <div className="course-preview-body">
          <em>{courseForm.category || 'Course category'}</em>
          <h3>{courseForm.title || 'Untitled course'}</h3>
          <p>{courseForm.subtitle || courseForm.description || 'Course summary will appear here.'}</p>
          <div className="course-preview-facts">
            <span>{courseForm.difficulty}</span>
            <span>{courseForm.duration || 'Self-paced'}</span>
            <span>{formatMoney(courseForm.price || 0, courseForm.currency)}</span>
          </div>
          {!!previewOutcomes.length && (
            <ul>
              {previewOutcomes.slice(0, 4).map((outcome) => (
                <li key={outcome}>{outcome}</li>
              ))}
            </ul>
          )}
          <div className="course-preview-curriculum">
            {previewModules.slice(0, 3).map((module, moduleIndex) => (
              <div key={getModuleKey(module, moduleIndex)}>
                <strong>Module {moduleIndex + 1}: {module.title || `Module ${moduleIndex + 1}`}</strong>
                <small>{module.lessons?.length || 0} lessons</small>
              </div>
            ))}
          </div>
        </div>
      </article>
    );
  };

  const renderCourseInformationSection = () => (
    <section className="course-builder-section" id="course-information">
      <div className="course-section-heading">
        <div>
          <h3>Course Information</h3>
          <p>Give the course a clear learner-facing identity, price, access model, and owner.</p>
        </div>
      </div>
      <div className="course-builder-grid">
        <label>
          Course title
          <input value={courseForm.title} onChange={(event) => updateCourseField('title', event.target.value)} />
        </label>
        <label>
          Short description / subtitle
          <input value={courseForm.subtitle} onChange={(event) => updateCourseField('subtitle', event.target.value)} />
        </label>
        <label className="admin-wide">
          Full description
          <textarea
            className="course-large-textarea"
            value={courseForm.description}
            onChange={(event) => updateCourseField('description', event.target.value)}
          />
        </label>
        <div className="taxonomy-select-field">
          <label>
            Category
            <select value={courseForm.category} onChange={(event) => selectCourseTaxonomy('category', event.target.value)}>
              <option value="">Choose category</option>
              {categoryOptions.map((category) => (
                <option value={category} key={category}>
                  {category}
                </option>
              ))}
              <option value="__add_new__">+ Add new category</option>
            </select>
          </label>
          {taxonomyAddMode.category && (
            <div className="taxonomy-add-row">
              <input
                value={taxonomyDrafts.category}
                onChange={(event) => setTaxonomyDrafts((current) => ({ ...current, category: event.target.value }))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addCourseTaxonomyOption('category');
                  }
                }}
                placeholder="New category"
              />
              <button className="button ghost small" type="button" onClick={() => addCourseTaxonomyOption('category')}>
                <Plus size={16} />
                Add
              </button>
            </div>
          )}
        </div>
        <div className="taxonomy-select-field">
          <label>
            Discipline
            <select value={courseForm.discipline} onChange={(event) => selectCourseTaxonomy('discipline', event.target.value)}>
              <option value="">Choose discipline</option>
              {disciplineOptions.map((discipline) => (
                <option value={discipline} key={discipline}>
                  {discipline}
                </option>
              ))}
              <option value="__add_new__">+ Add new discipline</option>
            </select>
          </label>
          {taxonomyAddMode.discipline && (
            <div className="taxonomy-add-row">
              <input
                value={taxonomyDrafts.discipline}
                onChange={(event) => setTaxonomyDrafts((current) => ({ ...current, discipline: event.target.value }))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addCourseTaxonomyOption('discipline');
                  }
                }}
                placeholder="New discipline"
              />
              <button className="button ghost small" type="button" onClick={() => addCourseTaxonomyOption('discipline')}>
                <Plus size={16} />
                Add
              </button>
            </div>
          )}
        </div>
        <label>
          Difficulty
          <select value={courseForm.difficulty} onChange={(event) => updateCourseField('difficulty', event.target.value)}>
            {difficultyOptions.map((difficulty) => (
              <option value={difficulty} key={difficulty}>
                {difficulty}
              </option>
            ))}
          </select>
        </label>
        <label>
          Duration
          <input value={courseForm.duration} onChange={(event) => updateCourseField('duration', event.target.value)} />
        </label>
        <label>
          Instructor
          <input value={courseForm.instructorName} onChange={(event) => updateCourseField('instructorName', event.target.value)} />
        </label>
        <label>
          Language
          <select value={courseForm.language} onChange={(event) => updateCourseField('language', event.target.value)}>
            {uniqueOptions(languageOptions, courseForm.language).map((language) => (
              <option value={language} key={language}>
                {language}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );

  const renderCourseMediaSection = () => (
    <section className="course-builder-section" id="course-media">
      <div className="course-section-heading">
        <div>
          <h3>Course Media</h3>
          <p>Manage thumbnail, course images, and video without exposing storage provider details.</p>
        </div>
      </div>

      <div className="media-manager-grid">
        <article className="media-manager-card">
          <div className="media-manager-heading">
            <div>
              <strong>Course Thumbnail</strong>
              <span>Exactly one thumbnail</span>
            </div>
            <em className={`admin-pill ${courseForm.thumbnail ? 'positive' : 'attention'}`}>
              {busyAction === 'media-course-thumbnail' ? 'uploading' : courseForm.thumbnail ? 'ready' : 'empty'}
            </em>
          </div>
          <div className="media-preview-large">
            {courseForm.thumbnail ? (
              <img src={courseForm.thumbnail} alt="" loading="lazy" decoding="async" />
            ) : (
              <span>
                <ImagePlus size={24} />
                No thumbnail yet
              </span>
            )}
          </div>
          {busyAction === 'media-course-thumbnail' && (
            <div className="upload-progress-bar" aria-label="Uploading thumbnail">
              <span style={{ width: '62%' }} />
            </div>
          )}
          <div className="media-actions">
            <label className="button ghost small media-file-button">
              <UploadCloud size={16} />
              {courseForm.thumbnail ? 'Replace' : 'Upload'}
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  uploadSingleMedia({
                    file: event.target.files?.[0],
                    folder: 'planeforge/courses',
                    publicId: `${courseForm.title || 'course'}-thumbnail`,
                    actionKey: 'course-thumbnail',
                    setField: (url) => updateCourseField('thumbnail', url)
                  })
                }
              />
            </label>
            <button className="button ghost small" type="button" onClick={() => updateCourseField('thumbnail', '')} disabled={!courseForm.thumbnail}>
              <X size={16} />
              Remove
            </button>
          </div>
        </article>

        <article className="media-manager-card media-manager-card-wide">
          <div className="media-manager-heading">
            <div>
              <strong>Course Images</strong>
              <span>{activeImages.length}/5 images</span>
            </div>
            <label className={`button ghost small media-file-button ${activeImages.length >= 5 ? 'is-disabled' : ''}`}>
              <UploadCloud size={16} />
              Upload Images
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={activeImages.length >= 5}
                onChange={(event) =>
                  uploadGalleryMedia({
                    files: event.target.files,
                    folder: 'planeforge/courses',
                    publicIdPrefix: `${courseForm.title || 'course'}-gallery`,
                    currentText: courseForm.imagesText,
                    setField: (value) => updateCourseField('imagesText', value)
                  })
                }
              />
            </label>
          </div>
          {busyAction === `media-${courseForm.title || 'course'}-gallery` && (
            <div className="upload-progress-bar" aria-label="Uploading course images">
              <span style={{ width: '62%' }} />
            </div>
          )}
          <div className="gallery-card-grid">
            {activeImages.map((url, index) => (
              <figure className="gallery-image-card" key={url}>
                <img src={url} alt="" loading="lazy" decoding="async" />
                <figcaption>
                  <span>Image {index + 1}</span>
                  <div className="admin-icon-actions">
                    <button className="icon-button" type="button" title="Move image up" onClick={() => moveGalleryImage(index, index - 1)} disabled={index === 0}>
                      <ArrowUp size={15} />
                    </button>
                    <button className="icon-button" type="button" title="Move image down" onClick={() => moveGalleryImage(index, index + 1)} disabled={index === activeImages.length - 1}>
                      <ArrowDown size={15} />
                    </button>
                    <label className="icon-button media-file-icon" title="Replace image">
                      <UploadCloud size={15} />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          uploadSingleMedia({
                            file: event.target.files?.[0],
                            folder: 'planeforge/courses',
                            publicId: `${courseForm.title || 'course'}-gallery-${index + 1}`,
                            actionKey: `course-gallery-${index}`,
                            setField: (nextUrl) => {
                              const nextImages = [...activeImages];
                              nextImages[index] = nextUrl;
                              updateCourseField('imagesText', nextImages.join('\n'));
                            }
                          })
                        }
                      />
                    </label>
                    <button
                      className="icon-button"
                      type="button"
                      title="Remove image"
                      onClick={() => updateCourseField('imagesText', activeImages.filter((item) => item !== url).join('\n'))}
                    >
                      <X size={15} />
                    </button>
                  </div>
                </figcaption>
              </figure>
            ))}
            {!activeImages.length && <p className="admin-empty">Upload up to 5 course images.</p>}
          </div>
        </article>

        <article className="media-manager-card media-manager-card-wide">
          <div className="media-manager-heading">
            <div>
              <strong>Course Video</strong>
              <span>{canUploadPrimaryVideo ? 'Upload or replace the primary lesson video' : 'Save a draft before uploading video'}</span>
            </div>
            <em className={`admin-pill ${statusTone(primaryVideoStatus)}`}>{statusLabel(primaryVideoStatus)}</em>
          </div>
          {primaryUploadProgress != null && primaryUploadProgress < 100 && (
            <div className="video-upload-status">
              <span>{primaryUploadProgress}% uploaded</span>
              <div className="upload-progress-bar">
                <span style={{ width: `${primaryUploadProgress}%` }} />
              </div>
            </div>
          )}
          <div className="video-upload-surface">
            <UploadCloud size={24} />
            <div>
              <strong>{primaryVideoStatus === 'failed' ? 'Upload failed' : statusLabel(primaryVideoStatus)}</strong>
              <span>
                {primaryVideoStatus === 'ready'
                  ? 'Video is ready for learners.'
                  : primaryVideoStatus === 'processing'
                    ? 'Video is processing.'
                    : primaryVideoStatus === 'uploading'
                      ? 'Upload started. Refresh to check processing.'
                      : 'Choose a video file when the draft has been saved.'}
              </span>
            </div>
          </div>
          <div className="media-actions">
            <button
              className="button ghost small"
              type="button"
              onClick={() =>
                requestUploadIntent({
                  course: { _id: courseForm.id },
                  module: primaryVideoTarget.module,
                  lesson: primaryVideoTarget.lesson
                })
              }
              disabled={!canUploadPrimaryVideo || busyAction === `stream-${primaryVideoTarget?.lesson?._id}`}
            >
              {busyAction === `stream-${primaryVideoTarget?.lesson?._id}` ? <LoaderCircle className="spin" size={16} /> : <UploadCloud size={16} />}
              {lessonHasVideo(primaryVideoTarget?.lesson) ? 'Replace' : primaryVideoStatus === 'failed' ? 'Retry' : 'Upload'}
            </button>
            <button
              className="button ghost small"
              type="button"
              onClick={() =>
                refreshLessonStream({
                  course: { _id: courseForm.id },
                  module: primaryVideoTarget.module,
                  lesson: primaryVideoTarget.lesson
                })
              }
              disabled={
                !canUploadPrimaryVideo ||
                !primaryVideoTarget?.lesson?.stream?.uploadId ||
                busyAction === `stream-refresh-${primaryVideoTarget?.lesson?._id}`
              }
            >
              {busyAction === `stream-refresh-${primaryVideoTarget?.lesson?._id}` ? <LoaderCircle className="spin" size={16} /> : <RefreshCw size={16} />}
              Refresh
            </button>
            <button
              className="button ghost small"
              type="button"
              onClick={() => {
                updateCourseField('videoUrl', '');
                if (primaryVideoTarget) clearLessonStream(primaryVideoTarget.moduleIndex, primaryVideoTarget.lessonIndex);
              }}
              disabled={!courseForm.videoUrl && !lessonHasVideo(primaryVideoTarget?.lesson)}
            >
              <X size={16} />
              Remove
            </button>
          </div>
          <details className="advanced-inline-settings">
            <summary>Use external video</summary>
            <p>External URLs can stop working if the source becomes private, expires, is deleted, or changes.</p>
            <label>
              External video URL
              <input value={courseForm.videoUrl} onChange={(event) => updateCourseField('videoUrl', event.target.value)} />
            </label>
          </details>
        </article>
      </div>
    </section>
  );

  const renderSkillsSection = () => (
    <section className="course-builder-section" id="course-skills">
      <div className="course-section-heading">
        <div>
          <h3>Skills</h3>
          <p>Add skills as tags learners can scan quickly.</p>
        </div>
      </div>
      <div className="skill-input-row">
        <input
          value={skillInput}
          onChange={(event) => setSkillInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addSkill();
            }
          }}
          placeholder="PCB routing"
        />
        <button className="button ghost small" type="button" onClick={addSkill}>
          <Plus size={16} />
          Add Skill
        </button>
      </div>
      <div className="chip-list">
        {courseSkills.map((skill) => (
          <span className="skill-chip" key={skill}>
            {skill}
            <button type="button" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>
              <X size={14} />
            </button>
          </span>
        ))}
        {!courseSkills.length && <p className="admin-empty">No skills added yet.</p>}
      </div>
    </section>
  );

  const renderCoursePricingSection = () => (
    <section className="course-builder-section" id="course-pricing">
      <div className="course-section-heading">
        <div>
          <h3>Pricing & Access</h3>
          <p>Make it clear what learners pay and how long they can access the course.</p>
        </div>
        <em className={`admin-pill ${pricePreview.isFree ? 'positive' : 'attention'}`}>
          {pricePreview.isFree ? 'free course' : formatMoney(pricePreview.finalPrice, courseForm.currency)}
        </em>
      </div>

      <div className="course-builder-grid">
        <label>
          Course price
          <input
            value={courseForm.price}
            onChange={(event) => updateCourseField('price', event.target.value)}
            type="number"
            min="0"
            step="0.01"
          />
        </label>
        <label>
          Currency
          <select value={courseForm.currency} onChange={(event) => updateCourseField('currency', event.target.value)}>
            {uniqueOptions(currencyOptions, courseForm.currency).map((currency) => (
              <option value={currency} key={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="pricing-choice-group admin-wide">
          <legend>Access after enrollment</legend>
          <label className="admin-check compact">
            <input
              type="radio"
              name="access-duration"
              checked={courseForm.accessDurationType === 'lifetime'}
              onChange={() => updateCourseField('accessDurationType', 'lifetime')}
            />
            <span>Lifetime access</span>
          </label>
          <label className="admin-check compact">
            <input
              type="radio"
              name="access-duration"
              checked={courseForm.accessDurationType === 'limited'}
              onChange={() => updateCourseField('accessDurationType', 'limited')}
            />
            <span>Limited access</span>
          </label>
        </fieldset>
        {courseForm.accessDurationType === 'limited' && (
          <label>
            Access duration
            <select
              value={accessDurationOptions.some((option) => String(option.days) === String(courseForm.accessDurationDays)) ? courseForm.accessDurationDays : ''}
              onChange={(event) => updateCourseField('accessDurationDays', event.target.value || courseForm.accessDurationDays)}
            >
              {accessDurationOptions.map((option) => (
                <option value={option.days} key={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {courseForm.accessDurationType === 'limited' && (
          <label>
            Custom days
            <input
              value={courseForm.accessDurationDays}
              onChange={(event) => updateCourseField('accessDurationDays', event.target.value)}
              type="number"
              min="1"
            />
          </label>
        )}
      </div>

      <div className="discount-editor">
        <label className="admin-check">
          <input
            type="checkbox"
            checked={courseForm.discountEnabled}
            onChange={(event) => updateCourseField('discountEnabled', event.target.checked)}
          />
          <span>Enable discount</span>
        </label>
        {courseForm.discountEnabled && (
          <div className="course-builder-grid">
            <label>
              Discount type
              <select value={courseForm.discountType} onChange={(event) => updateCourseField('discountType', event.target.value)}>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </label>
            <label>
              Discount
              <input
                value={courseForm.discountValue}
                onChange={(event) => updateCourseField('discountValue', event.target.value)}
                type="number"
                min="0"
                max={courseForm.discountType === 'percentage' ? '100' : undefined}
                step="0.01"
              />
            </label>
            <label>
              Discount starts
              <input
                value={courseForm.discountStartsAt}
                onChange={(event) => updateCourseField('discountStartsAt', event.target.value)}
                type="datetime-local"
              />
            </label>
            <label>
              Discount ends
              <input
                value={courseForm.discountEndsAt}
                onChange={(event) => updateCourseField('discountEndsAt', event.target.value)}
                type="datetime-local"
              />
            </label>
          </div>
        )}
        <div className="discount-preview">
          <strong>{pricePreview.isFree ? 'FREE' : formatMoney(pricePreview.finalPrice, courseForm.currency)}</strong>
          {pricePreview.discountAmount > 0 && (
            <span>
              {formatMoney(pricePreview.originalPrice, courseForm.currency)} to {formatMoney(pricePreview.finalPrice, courseForm.currency)}
            </span>
          )}
          {courseForm.discountEnabled && Number(courseForm.discountValue || 0) > 0 && (
            <em>
              {courseForm.discountType === 'percentage'
                ? `${courseForm.discountValue}% off`
                : `${formatMoney(courseForm.discountValue, courseForm.currency)} off`}
            </em>
          )}
        </div>
      </div>
    </section>
  );

  const renderAdvancedCourseSettings = () => (
    <details className="course-builder-section advanced-settings" id="course-advanced">
      <summary>
        <span>
          <h3>Advanced Settings</h3>
          <p>Less common publishing, certificate, and external media settings.</p>
        </span>
        <ChevronDown size={18} />
      </summary>
      <div className="course-builder-grid">
        <label>
          Status
          <select value={courseForm.status} onChange={(event) => updateCourseField('status', event.target.value)}>
            {courseStatusOptions.map((status) => (
              <option value={status} key={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-check compact">
          <input
            type="checkbox"
            checked={courseForm.isFeatured}
            onChange={(event) => updateCourseField('isFeatured', event.target.checked)}
          />
          <span>Featured course</span>
        </label>
        <label className="admin-check compact">
          <input
            type="checkbox"
            checked={courseForm.certificateAvailable}
            onChange={(event) => updateCourseField('certificateAvailable', event.target.checked)}
          />
          <span>Certificate available</span>
        </label>
        <label>
          Thumbnail image URL
          <input value={courseForm.thumbnail} onChange={(event) => updateCourseField('thumbnail', event.target.value)} />
        </label>
        <label>
          Banner image URL
          <input value={courseForm.bannerImage} onChange={(event) => updateCourseField('bannerImage', event.target.value)} />
        </label>
        <label>
          External video URL
          <input value={courseForm.videoUrl} onChange={(event) => updateCourseField('videoUrl', event.target.value)} />
        </label>
      </div>
    </details>
  );

  const renderCourseCurriculumSection = () => (
    <section className="course-builder-section course-curriculum-section" id="course-curriculum">
      <div className="course-section-heading">
        <div>
          <h3>Curriculum</h3>
          <p>Build the course from modules and lessons. Numbering follows the visible order.</p>
        </div>
        <button className="button ghost small" type="button" onClick={addModule}>
          <Plus size={16} />
          Add Module
        </button>
      </div>

      <div className="curriculum-list">
        {courseForm.modules.map((module, moduleIndex) => {
          const moduleKey = getModuleKey(module, moduleIndex);
          const isExpanded = expandedModules[moduleKey] ?? moduleIndex === 0;

          return (
            <article className="curriculum-module-card" key={moduleKey}>
              <header className="module-card-header">
                <GripVertical size={18} />
                <button className="module-expand-button" type="button" onClick={() => toggleModule(module, moduleIndex)}>
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                <div className="module-title-control">
                  <span>Module {moduleIndex + 1}</span>
                  <input
                    value={module.title}
                    onChange={(event) => updateModuleField(moduleIndex, 'title', event.target.value)}
                    placeholder="Module title"
                  />
                  <small>{module.lessons?.length || 0} lessons</small>
                </div>
                <div className="admin-icon-actions">
                  <button className="icon-button" type="button" title="Move module up" onClick={() => moveModule(moduleIndex, -1)} disabled={moduleIndex === 0}>
                    <ArrowUp size={16} />
                  </button>
                  <button className="icon-button" type="button" title="Move module down" onClick={() => moveModule(moduleIndex, 1)} disabled={moduleIndex === courseForm.modules.length - 1}>
                    <ArrowDown size={16} />
                  </button>
                  <button className="icon-button" type="button" title="Delete module" onClick={() => removeModule(moduleIndex)} disabled={courseForm.modules.length <= 1}>
                    <X size={16} />
                  </button>
                </div>
              </header>

              {isExpanded && (
                <div className="module-card-body">
                  <label>
                    Module description
                    <textarea
                      value={module.description}
                      onChange={(event) => updateModuleField(moduleIndex, 'description', event.target.value)}
                      placeholder="What this module covers"
                    />
                  </label>

                  <div className="lesson-builder-list">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const lessonKey = getLessonKey(lesson, moduleIndex, lessonIndex);
                      const lessonUploadProgress = lesson._id && uploadProgress[lesson._id] != null ? uploadProgress[lesson._id] : null;
                      const canUploadLessonVideo = isServerRecord(courseForm.id) && isServerRecord(module._id) && isServerRecord(lesson._id);

                      return (
                        <article className="lesson-builder-card" key={lessonKey}>
                          <header className="lesson-card-header">
                            <span>Lesson {lessonIndex + 1}</span>
                            <input
                              value={lesson.title}
                              onChange={(event) => updateLessonField(moduleIndex, lessonIndex, 'title', event.target.value)}
                              placeholder="Lesson title"
                            />
                            <div className="admin-icon-actions">
                              <button className="icon-button" type="button" title="Move lesson up" onClick={() => moveLesson(moduleIndex, lessonIndex, -1)} disabled={lessonIndex === 0}>
                                <ArrowUp size={15} />
                              </button>
                              <button className="icon-button" type="button" title="Move lesson down" onClick={() => moveLesson(moduleIndex, lessonIndex, 1)} disabled={lessonIndex === module.lessons.length - 1}>
                                <ArrowDown size={15} />
                              </button>
                              <button className="icon-button" type="button" title="Delete lesson" onClick={() => removeLesson(moduleIndex, lessonIndex)} disabled={module.lessons.length <= 1}>
                                <X size={15} />
                              </button>
                            </div>
                          </header>

                          <div className="lesson-card-body">
                            <label>
                              Description
                              <textarea
                                value={lesson.description}
                                onChange={(event) => updateLessonField(moduleIndex, lessonIndex, 'description', event.target.value)}
                                placeholder="What learners do in this lesson"
                              />
                            </label>
                            <div className="lesson-meta-grid">
                              <label>
                                Duration
                                <input
                                  value={lesson.duration}
                                  onChange={(event) => updateLessonField(moduleIndex, lessonIndex, 'duration', event.target.value)}
                                  placeholder="8 min"
                                />
                              </label>
                              <label>
                                Duration seconds
                                <input
                                  value={lesson.durationSeconds}
                                  onChange={(event) => updateLessonField(moduleIndex, lessonIndex, 'durationSeconds', event.target.value)}
                                  type="number"
                                  min="0"
                                />
                              </label>
                              <label className="admin-check compact lesson-preview-toggle">
                                <input
                                  type="checkbox"
                                  checked={lesson.isPreview}
                                  onChange={(event) => updateLessonField(moduleIndex, lessonIndex, 'isPreview', event.target.checked)}
                                />
                                <span>Free preview</span>
                              </label>
                            </div>

                            <div className="lesson-video-manager">
                              <div>
                                <strong>Lesson Video</strong>
                                <em className={`admin-pill ${statusTone(lesson.stream?.status || 'not_uploaded')}`}>
                                  {statusLabel(lesson.stream?.status || 'not_uploaded')}
                                </em>
                              </div>
                              {lessonUploadProgress != null && lessonUploadProgress < 100 && (
                                <div className="upload-progress-bar">
                                  <span style={{ width: `${lessonUploadProgress}%` }} />
                                </div>
                              )}
                              <div className="media-actions">
                                <button
                                  className="button ghost small"
                                  type="button"
                                  onClick={() => requestUploadIntent({ course: { _id: courseForm.id }, module, lesson })}
                                  disabled={!canUploadLessonVideo || busyAction === `stream-${lesson._id}`}
                                >
                                  {busyAction === `stream-${lesson._id}` ? <LoaderCircle className="spin" size={16} /> : <UploadCloud size={16} />}
                                  {lessonHasVideo(lesson) ? 'Replace' : lesson.stream?.status === 'failed' ? 'Retry' : 'Upload'}
                                </button>
                                <button
                                  className="button ghost small"
                                  type="button"
                                  onClick={() => refreshLessonStream({ course: { _id: courseForm.id }, module, lesson })}
                                  disabled={!canUploadLessonVideo || !lesson.stream?.uploadId || busyAction === `stream-refresh-${lesson._id}`}
                                >
                                  {busyAction === `stream-refresh-${lesson._id}` ? <LoaderCircle className="spin" size={16} /> : <RefreshCw size={16} />}
                                  Refresh
                                </button>
                                <button
                                  className="button ghost small"
                                  type="button"
                                  onClick={() => clearLessonStream(moduleIndex, lessonIndex)}
                                  disabled={!lessonHasVideo(lesson)}
                                >
                                  <X size={16} />
                                  Remove
                                </button>
                              </div>
                              {!canUploadLessonVideo && <small>Save the draft before uploading video for this lesson.</small>}
                            </div>

                            <details className="advanced-inline-settings">
                              <summary>Advanced video settings</summary>
                              <div className="lesson-meta-grid">
                                <label>
                                  Provider
                                  <select
                                    value={lesson.stream?.provider || 'unconfigured'}
                                    onChange={(event) => updateLessonStreamField(moduleIndex, lessonIndex, 'provider', event.target.value)}
                                  >
                                    {streamProviders.map((provider) => (
                                      <option value={provider} key={provider}>
                                        {statusLabel(provider)}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label>
                                  Processing status
                                  <select
                                    value={lesson.stream?.status || 'not_uploaded'}
                                    onChange={(event) => updateLessonStreamField(moduleIndex, lessonIndex, 'status', event.target.value)}
                                  >
                                    {streamStatusOptions.map((status) => (
                                      <option value={status} key={status}>
                                        {statusLabel(status)}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label>
                                  Playback reference
                                  <input
                                    value={lesson.stream?.playbackId || ''}
                                    onChange={(event) => updateLessonStreamField(moduleIndex, lessonIndex, 'playbackId', event.target.value)}
                                  />
                                </label>
                                <label className="admin-check compact">
                                  <input
                                    type="checkbox"
                                    checked={lesson.stream?.signedPlaybackRequired !== false}
                                    onChange={(event) => updateLessonStreamField(moduleIndex, lessonIndex, 'signedPlaybackRequired', event.target.checked)}
                                  />
                                  <span>Protected playback</span>
                                </label>
                                <label className="admin-check compact">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(lesson.stream?.allowDownloads)}
                                    onChange={(event) => updateLessonStreamField(moduleIndex, lessonIndex, 'allowDownloads', event.target.checked)}
                                  />
                                  <span>Downloads</span>
                                </label>
                              </div>
                            </details>

                            <div className="lesson-resources">
                              <div className="course-section-heading compact">
                                <div>
                                  <h4>Lesson Resources</h4>
                                  <p>Add files or links learners need for this lesson.</p>
                                </div>
                                <button className="button ghost small" type="button" onClick={() => addLessonResource(moduleIndex, lessonIndex)}>
                                  <Plus size={16} />
                                  Add Resource
                                </button>
                              </div>
                              {(lesson.resources || []).map((resource, resourceIndex) => (
                                <div className="resource-row" key={`resource-${lessonKey}-${resourceIndex}`}>
                                  <input
                                    value={resource.label}
                                    onChange={(event) => updateLessonResourceField(moduleIndex, lessonIndex, resourceIndex, 'label', event.target.value)}
                                    placeholder="Resource label"
                                  />
                                  <input
                                    value={resource.url}
                                    onChange={(event) => updateLessonResourceField(moduleIndex, lessonIndex, resourceIndex, 'url', event.target.value)}
                                    placeholder="Resource URL"
                                  />
                                  <select
                                    value={resource.type || 'file'}
                                    onChange={(event) => updateLessonResourceField(moduleIndex, lessonIndex, resourceIndex, 'type', event.target.value)}
                                  >
                                    {['file', 'link', 'worksheet', 'project', 'checklist'].map((type) => (
                                      <option value={type} key={type}>
                                        {statusLabel(type)}
                                      </option>
                                    ))}
                                  </select>
                                  <label className="admin-check compact">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(resource.downloadable)}
                                      onChange={(event) =>
                                        updateLessonResourceField(moduleIndex, lessonIndex, resourceIndex, 'downloadable', event.target.checked)
                                      }
                                    />
                                    <span>Download</span>
                                  </label>
                                  <button className="icon-button" type="button" title="Remove resource" onClick={() => removeLessonResource(moduleIndex, lessonIndex, resourceIndex)}>
                                    <X size={15} />
                                  </button>
                                </div>
                              ))}
                              {!(lesson.resources || []).length && <p className="admin-empty">No resources added for this lesson.</p>}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <button className="button ghost small" type="button" onClick={() => addLesson(moduleIndex)}>
                    <Plus size={16} />
                    Add Lesson
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );

  const renderCourseManagementPanel = () => (
    <aside className="admin-course-panel course-management-panel">
      {previewOpen && (
        <div className="course-management-card">
          <div className="admin-panel-heading">
            <strong>Learner Preview</strong>
            <button className="icon-button" type="button" title="Close preview" onClick={() => setPreviewOpen(false)}>
              <X size={16} />
            </button>
          </div>
          {renderCoursePreview()}
        </div>
      )}

      <div className="course-management-card">
        <div className="admin-panel-heading">
          <div>
            <strong>Course catalogue</strong>
            <span>{serverCourses.length ? `${serverCourses.length} saved records` : 'No saved course records yet'}</span>
          </div>
          <button className="icon-button" type="button" title="Refresh catalogue" onClick={() => refresh({ section: 'courses' })} disabled={loading}>
            {loading ? <LoaderCircle className="spin" size={16} /> : <RefreshCw size={16} />}
          </button>
        </div>
        <div className="course-catalog-list">
          {courses.map((course) => (
            <article className="course-catalog-item" key={course._id || course.slug}>
              <div>
                <strong>{course.title}</strong>
                <span>
                  {course.discipline || 'No discipline'} / {formatMoney(course.price, course.currency)}
                </span>
              </div>
              <em className={`admin-pill ${statusTone(course.status || 'published')}`}>{statusLabel(course.status || 'published')}</em>
              <div className="admin-icon-actions">
                <button className="icon-button" type="button" title="Edit course" onClick={() => editCourse(course)}>
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-button"
                  type="button"
                  title="Archive course"
                  onClick={() => archiveCourse(course)}
                  disabled={!isServerRecord(course._id) || busyAction === `course-archive-${course._id}`}
                >
                  <Archive size={16} />
                </button>
              </div>
            </article>
          ))}
          {!courses.length && <p className="admin-empty">No courses have been created yet.</p>}
        </div>
      </div>
    </aside>
  );

  const renderReviewModeration = () => {
    const reviewItems = reviews.reviews || [];

    return (
      <section className="dashboard-section admin-section review-moderation-section" id="reviews">
        <header className="admin-section-header">
          <div>
            <h2>
              <MessageSquare size={20} /> Course reviews
            </h2>
            <span>{reviewItems.length} reviews in this queue</span>
          </div>
          <form className="admin-filter-row" onSubmit={applyFilters}>
            <select value={filters.reviewStatus} onChange={(event) => setFilter('reviewStatus', event.target.value)}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
              <option value="">All reviews</option>
            </select>
            <button className="button ghost small" type="submit">
              Filter
            </button>
          </form>
        </header>

        <div className="review-moderation-list">
          {reviewItems.map((review) => {
            const reviewerName = review.reviewer?.name || 'PlaneForge learner';
            const reviewerEmail = review.reviewer?.email || 'No email';
            const actionBusy = busyAction === `review-${review._id}`;

            return (
              <article className="review-moderation-card" key={review._id}>
                <div className="review-moderation-main">
                  <div className="admin-record-title">
                    <strong>{review.course?.title || 'Untitled course'}</strong>
                    <em className={`admin-pill ${statusTone(review.status)}`}>{statusLabel(review.status)}</em>
                  </div>
                  <div className="review-rating-row">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={`${review._id}-star-${index}`}
                        size={16}
                        fill={index < Number(review.rating || 0) ? 'currentColor' : 'none'}
                      />
                    ))}
                    <span>{review.rating}/5</span>
                  </div>
                  <p>{review.comment}</p>
                  <small>
                    {review.anonymous ? 'Anonymous public review' : review.displayNamePublic ? 'Reviewer name public' : 'Reviewer name hidden'} /{' '}
                    Submitted {formatDate(review.createdAt)}
                  </small>
                </div>
                <div className="review-moderation-meta">
                  <div>
                    <strong>{reviewerName}</strong>
                    <span>{reviewerEmail}</span>
                  </div>
                  <div className="admin-record-actions">
                    <button
                      className="button primary small"
                      type="button"
                      onClick={() => moderateReview(review, 'approved')}
                      disabled={actionBusy || review.status === 'approved'}
                    >
                      {actionBusy ? <LoaderCircle className="spin" size={16} /> : <CheckCircle2 size={16} />}
                      Approve
                    </button>
                    <button
                      className="button danger small"
                      type="button"
                      onClick={() => moderateReview(review, 'declined')}
                      disabled={actionBusy || review.status === 'declined'}
                    >
                      <X size={16} />
                      Decline
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
          {!reviewItems.length && <p className="admin-empty">No course reviews match this filter.</p>}
        </div>
      </section>
    );
  };

  const renderCourseCatalogue = () => (
    <div className="course-catalogue-workspace">
      <header className="course-workspace-header">
        <div>
          <p className="eyebrow">Courses</p>
          <h2>Manage, create and publish learning courses.</h2>
          <p>Review catalogue status, drafts, enrollments, revenue, curriculum size, and pending reviews.</p>
        </div>
        <button className="button primary" type="button" onClick={resetCourseForm}>
          <Plus size={18} />
          Create Course
        </button>
      </header>

      <form className="course-catalogue-filters" onSubmit={(event) => event.preventDefault()}>
        <label className="admin-search-field">
          <Search size={16} />
          <input
            value={filters.courseSearch}
            onChange={(event) => setFilter('courseSearch', event.target.value)}
            placeholder="Search courses"
          />
        </label>
        <select value={filters.courseStatus} onChange={(event) => setFilter('courseStatus', event.target.value)}>
          <option value="">All statuses</option>
          {courseStatusOptions.map((status) => (
            <option value={status} key={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
        <select value={filters.courseCategory} onChange={(event) => setFilter('courseCategory', event.target.value)}>
          <option value="">All categories</option>
          {categoryOptions.map((category) => (
            <option value={category} key={category}>
              {category}
            </option>
          ))}
        </select>
        <select value={filters.courseDifficulty} onChange={(event) => setFilter('courseDifficulty', event.target.value)}>
          <option value="">All difficulties</option>
          {difficultyOptions.map((difficulty) => (
            <option value={difficulty} key={difficulty}>
              {difficulty}
            </option>
          ))}
        </select>
        <input
          value={filters.courseInstructor}
          onChange={(event) => setFilter('courseInstructor', event.target.value)}
          placeholder="Instructor"
        />
      </form>

      <div className="course-catalogue-grid">
        {filteredCourses.map((course) => {
          const lessonCount =
            course.lessonCount ??
            (course.modules || []).reduce((sum, module) => sum + (module.lessons?.length || 0), 0);
          const moduleCount = course.moduleCount ?? course.modules?.length ?? 0;
          const pricing = course.pricing || { finalPrice: course.price, originalPrice: course.price, isFree: Number(course.price || 0) <= 0 };

          return (
            <article className="course-catalogue-card" key={course._id || course.slug}>
              <div className="course-catalogue-thumb">
                {course.thumbnail ? <img src={course.thumbnail} alt="" loading="lazy" decoding="async" /> : <BookOpen size={26} />}
              </div>
              <div className="course-catalogue-main">
                <div>
                  <strong>{course.title}</strong>
                  <span>{course.instructorName || course.instructor?.name || 'PlaneForge Academy'}</span>
                </div>
                <div className="course-card-meta-row">
                  <em className={`admin-pill ${statusTone(course.status || 'published')}`}>{statusLabel(course.status || 'published')}</em>
                  <span>{course.category || 'No category'}</span>
                  <span>{course.difficulty || 'Course'}</span>
                  <span>{pricing.isFree ? 'FREE' : formatMoney(pricing.finalPrice, course.currency)}</span>
                </div>
                <div className="course-card-stats">
                  <span>{moduleCount} modules</span>
                  <span>{lessonCount} lessons</span>
                  <span>{course.enrollmentCount ?? course.studentsEnrolled ?? 0} enrollments</span>
                  <span>{formatMoney(course.revenue || 0, course.currency)} revenue</span>
                  <span>Updated {formatDate(course.updatedAt || course.lastUpdated)}</span>
                  {!!course.pendingReviewCount && <span>{course.pendingReviewCount} pending reviews</span>}
                </div>
              </div>
              <div className="course-catalogue-actions">
                <button className="button ghost small" type="button" onClick={() => editCourse(course)}>
                  <Pencil size={16} />
                  Edit
                </button>
                <button className="button ghost small" type="button" onClick={() => previewCourse(course)}>
                  <Eye size={16} />
                  Preview
                </button>
                {course.status === 'published' ? (
                  <button className="button ghost small" type="button" onClick={() => updateCourseStatus(course, 'draft')}>
                    Unpublish
                  </button>
                ) : (
                  <button className="button primary small" type="button" onClick={() => updateCourseStatus(course, 'published')}>
                    Publish
                  </button>
                )}
                <button className="button ghost small" type="button" onClick={() => duplicateCourse(course)}>
                  Duplicate
                </button>
                <button
                  className="button danger small"
                  type="button"
                  onClick={() => archiveCourse(course)}
                  disabled={!isServerRecord(course._id) || course.status === 'archived'}
                >
                  <Archive size={16} />
                  Archive
                </button>
              </div>
            </article>
          );
        })}
        {!filteredCourses.length && <p className="admin-empty">No courses match the current filters.</p>}
      </div>
    </div>
  );

  const renderCourseWorkspace = () => (
    <section className="dashboard-section admin-section course-workspace" id="content">
      {!courseEditorOpen ? (
        renderCourseCatalogue()
      ) : (
      <>
      <header className="course-workspace-header">
        <div>
          <p className="eyebrow">Course catalogue / management</p>
          <h2>{isServerRecord(courseForm.id) ? 'Edit Course' : 'Create Course'}</h2>
          <p>Create and publish a new course for PlaneForge Academy.</p>
          <div className="course-header-meta">
            <em className={`admin-pill ${statusTone(courseForm.status)}`}>{statusLabel(courseForm.status)}</em>
            <span>{courses.length} courses in the catalogue</span>
          </div>
        </div>
        <div className="course-action-panel">
          <span className={`course-save-status ${courseSaveState}`}>{courseSaveLabel}</span>
          <div className="course-action-row">
            <button className="button ghost small" type="button" onClick={saveDraftCourse} disabled={busyAction === 'course-save'}>
              {busyAction === 'course-save' ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}
              Save Draft
            </button>
            <button className="button ghost small" type="button" onClick={() => setPreviewOpen((value) => !value)}>
              <Eye size={17} />
              Preview
            </button>
            <button className="button primary small" type="button" onClick={publishCourse} disabled={busyAction === 'course-save'}>
              {busyAction === 'course-save' ? <LoaderCircle className="spin" size={17} /> : <CheckCircle2 size={17} />}
              Publish Course
            </button>
            <button className="icon-button" type="button" title="Create new course" onClick={resetCourseForm}>
              <Plus size={17} />
            </button>
          </div>
        </div>
      </header>

      {!!validationSummary.items.length && (
        <aside className="course-validation-summary" id="course-validation" role="alert">
          <AlertCircle size={20} />
          <div>
            <strong>{validationSummary.title}</strong>
            <div className="course-validation-items">
              {validationSummary.items.map((item) => (
                <button key={`${item.sectionId}-${item.label}`} type="button" onClick={() => scrollToCourseSection(item.sectionId)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </aside>
      )}

      <div className="admin-course-layout course-builder-layout">
        <form className="profile-form admin-editor course-builder-form" id="course-form" onSubmit={submitCourse}>
          {renderCourseInformationSection()}
          {renderCourseMediaSection()}
          {renderCourseCurriculumSection()}
          {renderCoursePricingSection()}
          {renderRepeatableCourseSection({
            id: 'course-outcomes',
            title: 'What Students Will Learn',
            description: 'Add clear learner outcomes as individual items.',
            field: 'outcomesText',
            addLabel: 'Add Outcome',
            placeholder: 'Design a fabrication-ready PCB from a schematic'
          })}
          {renderSkillsSection()}
          {renderRepeatableCourseSection({
            id: 'course-requirements',
            title: 'Requirements',
            description: 'List prerequisites one at a time.',
            field: 'requirementsText',
            addLabel: 'Add Requirement',
            placeholder: 'Basic electronics knowledge'
          })}
          {renderRepeatableCourseSection({
            id: 'course-audience',
            title: 'Target Audience',
            description: 'Describe who this course is intended for.',
            field: 'targetAudienceText',
            addLabel: 'Add Audience',
            placeholder: 'Engineers preparing their first manufacturable PCB'
          })}
          {renderAdvancedCourseSettings()}
        </form>

        {renderCourseManagementPanel()}
      </div>
      </>
      )}
    </section>
  );

  return (
    <DashboardShell title={shellTitle} subtitle={shellSubtitle}>
      <div className="admin-workspace">
        {activeSection !== 'courses' && (
        <div className="admin-toolbar">
          <div>
            <strong>Control center</strong>
            <span>{loading ? 'Syncing admin data' : `Last sync ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</span>
          </div>
          <button className="button ghost small" type="button" onClick={() => refresh()} disabled={loading || Boolean(busyAction)}>
            {loading ? <LoaderCircle className="spin" size={17} /> : <RefreshCw size={17} />}
            Refresh
          </button>
        </div>
        )}

        {activeSection === 'overview' && (
          <div className="admin-action-strip">
            <NavLink className="button primary small" to="/dashboard/admin/courses">
              <Plus size={16} />
              Create Course
            </NavLink>
            <NavLink className="button primary small" to="/dashboard/admin/products">
              <Plus size={16} />
              Add Product
            </NavLink>
            <NavLink className="button secondary small" to="/dashboard/admin/users">
              <UserCog size={16} />
              Add Account
            </NavLink>
          </div>
        )}

        {notice.text && (
          <div className={`admin-notice ${notice.type}`} role="status">
            {notice.type === 'error' ? <X size={18} /> : <CheckCircle2 size={18} />}
            <span>{notice.text}</span>
          </div>
        )}

        {activeSection !== 'courses' && (
        <nav className="admin-section-nav" aria-label="Admin console sections">
          {adminSectionLinks.map(({ to, label, icon: Icon, section: itemSection }) => (
            <NavLink key={itemSection} to={to} end={itemSection === 'overview'}>
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        )}

        {activeSection === 'overview' && (
        <div className="metric-grid admin-metric-grid">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>
        )}

        {activeSection === 'overview' && (
        <section className="dashboard-section admin-section" id="activity">
          <header className="admin-section-header">
            <div>
              <h2>
                <BarChart3 size={20} /> Site activity
              </h2>
              <span>{activities.length} latest events</span>
            </div>
          </header>
          <div className="admin-activity-list">
            {activities.map((activity) => (
              <article key={activity.id}>
                <div>
                  <strong>{activity.label}</strong>
                  <small>{activity.detail}</small>
                </div>
                <div>
                  <span>{activity.actorName || 'Unknown'}</span>
                  <small>{activity.actorEmail || 'No email'}</small>
                </div>
                <em className={`admin-pill ${statusTone(activity.status)}`}>{statusLabel(activity.status)}</em>
                <span>{activity.amount ? formatMoney(activity.amount, activity.currency) : statusLabel(activity.type)}</span>
                <small>{formatDate(activity.createdAt)}</small>
              </article>
            ))}
            {activities.length === 0 && <p className="admin-empty">No tracked activity yet.</p>}
          </div>
        </section>
        )}

        {activeSection === 'inquiries' && (
        <section className="dashboard-section admin-section" id="inquiries">
          <header className="admin-section-header">
            <div>
              <h2>
                <Inbox size={20} /> Inquiries
              </h2>
              <span>{inquiries.pagination?.total ?? inquiries.inquiries?.length ?? 0} records</span>
            </div>
            <form className="admin-filter-row" onSubmit={applyFilters}>
              <label className="admin-search-field">
                <Search size={16} />
                <input
                  value={filters.inquirySearch}
                  onChange={(event) => setFilter('inquirySearch', event.target.value)}
                  placeholder="Search inquiries"
                />
              </label>
              <select value={filters.inquiryStatus} onChange={(event) => setFilter('inquiryStatus', event.target.value)}>
                {inquiryStatusOptions.map((status) => (
                  <option value={status} key={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
              <select value={filters.inquiryIntent} onChange={(event) => setFilter('inquiryIntent', event.target.value)}>
                <option value="">All intents</option>
                {intentOptions.map((intent) => (
                  <option value={intent} key={intent}>
                    {statusLabel(intent)}
                  </option>
                ))}
              </select>
              <select value={filters.inquiryPriority} onChange={(event) => setFilter('inquiryPriority', event.target.value)}>
                <option value="">All priorities</option>
                {priorityOptions.map((priority) => (
                  <option value={priority} key={priority}>
                    {statusLabel(priority)}
                  </option>
                ))}
              </select>
              <button className="button ghost small" type="submit">
                Filter
              </button>
            </form>
          </header>

          <div className="admin-summary-strip">
            {(inquiries.grouped?.byStatus || []).map((group) => (
              <article key={group._id || 'unknown'}>
                <span>{statusLabel(group._id || 'unknown')}</span>
                <strong>{group.count}</strong>
              </article>
            ))}
            {(inquiries.grouped?.byStatus || []).length === 0 && <p className="admin-empty">No inquiry activity yet.</p>}
          </div>

          <div className="admin-record-list">
            {(inquiries.inquiries || []).map((item) => (
              <article className="admin-inquiry-item" key={item._id}>
                <div className="admin-record-main">
                  <div className="admin-record-title">
                    <strong>{item.subject}</strong>
                    <em className={`admin-pill ${statusTone(item.priority)}`}>{statusLabel(item.priority)}</em>
                  </div>
                  <span>
                    {item.name} / {item.email}
                    {item.organization ? ` / ${item.organization}` : ''}
                  </span>
                  <p>{item.message}</p>
                  <small>
                    {statusLabel(item.intent)} / {item.topic} / {formatDate(item.createdAt)}
                  </small>
                </div>
                <div className="admin-record-actions">
                  <select value={item.status} onChange={(event) => updateInquiry(item, { status: event.target.value })}>
                    {inquiryUpdateStatuses.map((status) => (
                      <option value={status} key={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>
                  <select value={item.priority} onChange={(event) => updateInquiry(item, { priority: event.target.value })}>
                    {priorityOptions.map((priority) => (
                      <option value={priority} key={priority}>
                        {statusLabel(priority)}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            ))}
            {(inquiries.inquiries || []).length === 0 && <p className="admin-empty">No inquiries match the current filters.</p>}
          </div>
        </section>
        )}

        {activeSection === 'courses' && renderCourseWorkspace()}
        {activeSection === 'reviews' && renderReviewModeration()}

        {false && activeSection === 'courses' && (
        <section className="dashboard-section admin-section" id="content">
          <header className="admin-section-header">
            <div>
              <h2>
                <BookOpen size={20} /> Course builder
              </h2>
              <span>{courses.length} courses</span>
            </div>
            <button className="button ghost small" type="button" onClick={resetCourseForm}>
              <Plus size={17} />
              New course
            </button>
          </header>

          <div className="admin-course-layout">
            <form className="profile-form admin-editor" id="course-form" onSubmit={submitCourse}>
              <div className="admin-editor-heading">
                <div>
                  <strong>{isServerRecord(courseForm.id) ? 'Edit course' : 'Create course'}</strong>
                  <span>{courseForm.status}</span>
                </div>
                <button className="button primary small" type="submit" disabled={busyAction === 'course-save'}>
                  {busyAction === 'course-save' ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}
                  Save
                </button>
              </div>

              <div className="admin-form-grid">
                <label>
                  Title
                  <input value={courseForm.title} onChange={(event) => updateCourseField('title', event.target.value)} required />
                </label>
                <label>
                  Subtitle
                  <input value={courseForm.subtitle} onChange={(event) => updateCourseField('subtitle', event.target.value)} />
                </label>
                <label className="admin-wide">
                  Description
                  <textarea
                    value={courseForm.description}
                    onChange={(event) => updateCourseField('description', event.target.value)}
                    required
                  />
                </label>
                <div className="taxonomy-select-field">
                  <label>
                    Category
                    <select value={courseForm.category} onChange={(event) => selectCourseTaxonomy('category', event.target.value)} required>
                      <option value="">Choose category</option>
                      {categoryOptions.map((category) => (
                        <option value={category} key={category}>
                          {category}
                        </option>
                      ))}
                      <option value="__add_new__">+ Add new category</option>
                    </select>
                  </label>
                  {taxonomyAddMode.category && (
                    <div className="taxonomy-add-row">
                      <input
                        value={taxonomyDrafts.category}
                        onChange={(event) => setTaxonomyDrafts((current) => ({ ...current, category: event.target.value }))}
                        placeholder="New category"
                      />
                      <button className="button ghost small" type="button" onClick={() => addCourseTaxonomyOption('category')}>
                        <Plus size={16} />
                        Add
                      </button>
                    </div>
                  )}
                </div>
                <div className="taxonomy-select-field">
                  <label>
                    Discipline
                    <select value={courseForm.discipline} onChange={(event) => selectCourseTaxonomy('discipline', event.target.value)} required>
                      <option value="">Choose discipline</option>
                      {disciplineOptions.map((discipline) => (
                        <option value={discipline} key={discipline}>
                          {discipline}
                        </option>
                      ))}
                      <option value="__add_new__">+ Add new discipline</option>
                    </select>
                  </label>
                  {taxonomyAddMode.discipline && (
                    <div className="taxonomy-add-row">
                      <input
                        value={taxonomyDrafts.discipline}
                        onChange={(event) => setTaxonomyDrafts((current) => ({ ...current, discipline: event.target.value }))}
                        placeholder="New discipline"
                      />
                      <button className="button ghost small" type="button" onClick={() => addCourseTaxonomyOption('discipline')}>
                        <Plus size={16} />
                        Add
                      </button>
                    </div>
                  )}
                </div>
                <label>
                  Difficulty
                  <select value={courseForm.difficulty} onChange={(event) => updateCourseField('difficulty', event.target.value)}>
                    {difficultyOptions.map((difficulty) => (
                      <option value={difficulty} key={difficulty}>
                        {difficulty}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Duration
                  <input value={courseForm.duration} onChange={(event) => updateCourseField('duration', event.target.value)} />
                </label>
                <label>
                  Price
                  <input
                    value={courseForm.price}
                    onChange={(event) => updateCourseField('price', event.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                  />
                </label>
                <label>
                  Currency
                  <input
                    value={courseForm.currency}
                    onChange={(event) => updateCourseField('currency', event.target.value.toUpperCase())}
                    maxLength={3}
                  />
                </label>
                <label>
                  Purchase type
                  <select value={courseForm.purchaseType} onChange={(event) => updateCourseField('purchaseType', event.target.value)}>
                    {purchaseTypeOptions.map((type) => (
                      <option value={type} key={type}>
                        {statusLabel(type)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Subscription days
                  <input
                    value={courseForm.subscriptionDurationDays}
                    onChange={(event) => updateCourseField('subscriptionDurationDays', event.target.value)}
                    type="number"
                    min="1"
                  />
                </label>
                <label>
                  Status
                  <select value={courseForm.status} onChange={(event) => updateCourseField('status', event.target.value)}>
                    {courseStatusOptions.map((status) => (
                      <option value={status} key={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Instructor
                  <input value={courseForm.instructorName} onChange={(event) => updateCourseField('instructorName', event.target.value)} />
                </label>
                <label>
                  Language
                  <input value={courseForm.language} onChange={(event) => updateCourseField('language', event.target.value)} />
                </label>
                <div className="admin-wide admin-media-panel">
                  <div className="admin-editor-heading">
                    <div>
                      <strong>Course media</strong>
                      <span>Upload a thumbnail, up to 5 images, and optional intro video metadata.</span>
                    </div>
                  </div>
                  <div className="admin-media-grid">
                    <label className="admin-upload-tile">
                      <UploadCloud size={18} />
                      <strong>Thumbnail</strong>
                      <span>Upload 1 course thumbnail</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          uploadSingleMedia({
                            file: event.target.files?.[0],
                            folder: 'planeforge/courses',
                            publicId: `${courseForm.title || 'course'}-thumbnail`,
                            actionKey: 'course-thumbnail',
                            setField: (url) => updateCourseField('thumbnail', url)
                          })
                        }
                      />
                    </label>
                    {courseForm.thumbnail && renderImagePreview(courseForm.thumbnail, () => updateCourseField('thumbnail', ''))}
                    <label className="admin-upload-tile">
                      <UploadCloud size={18} />
                      <strong>Course images</strong>
                      <span>{textToList(courseForm.imagesText).length} / 5 uploaded</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) =>
                          uploadGalleryMedia({
                            files: event.target.files,
                            folder: 'planeforge/courses',
                            publicIdPrefix: `${courseForm.title || 'course'}-gallery`,
                            currentText: courseForm.imagesText,
                            setField: (value) => updateCourseField('imagesText', value)
                          })
                        }
                      />
                    </label>
                    {textToList(courseForm.imagesText).map((url) =>
                      renderImagePreview(
                        url,
                        () => updateCourseField('imagesText', textToList(courseForm.imagesText).filter((item) => item !== url).join('\n'))
                      )
                    )}
                  </div>
                  <details className="admin-warning-details">
                    <summary>External media URL fallback</summary>
                    <p>
                      Use external URLs only when necessary. PlaneForge does not control that host, so expired,
                      private, or removed media can stop working.
                    </p>
                    <label>
                      Thumbnail URL
                      <input value={courseForm.thumbnail} onChange={(event) => updateCourseField('thumbnail', event.target.value)} />
                    </label>
                    <label>
                      Banner URL
                      <input value={courseForm.bannerImage} onChange={(event) => updateCourseField('bannerImage', event.target.value)} />
                    </label>
                    <label>
                      Course video URL
                      <input value={courseForm.videoUrl} onChange={(event) => updateCourseField('videoUrl', event.target.value)} />
                    </label>
                  </details>
                </div>
                <label className="admin-wide">
                  Outcomes
                  <textarea value={courseForm.outcomesText} onChange={(event) => updateCourseField('outcomesText', event.target.value)} />
                </label>
                <label className="admin-wide">
                  Skills
                  <textarea value={courseForm.skillsText} onChange={(event) => updateCourseField('skillsText', event.target.value)} />
                </label>
                <label className="admin-wide">
                  Requirements
                  <textarea
                    value={courseForm.requirementsText}
                    onChange={(event) => updateCourseField('requirementsText', event.target.value)}
                  />
                </label>
                <label className="admin-wide">
                  Audience
                  <textarea
                    value={courseForm.targetAudienceText}
                    onChange={(event) => updateCourseField('targetAudienceText', event.target.value)}
                  />
                </label>
              </div>

              <div className="admin-toggle-row">
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={courseForm.isFeatured}
                    onChange={(event) => updateCourseField('isFeatured', event.target.checked)}
                  />
                  <span>Featured</span>
                </label>
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={courseForm.certificateAvailable}
                    onChange={(event) => updateCourseField('certificateAvailable', event.target.checked)}
                  />
                  <span>Certificate</span>
                </label>
              </div>

              <div className="admin-module-toolbar">
                <strong>Modules and lessons</strong>
                <button className="button ghost small" type="button" onClick={addModule}>
                  <Plus size={16} />
                  Module
                </button>
              </div>

              <div className="admin-module-list">
                {courseForm.modules.map((module, moduleIndex) => (
                  <fieldset className="admin-module-editor" key={module._id || `module-${moduleIndex}`}>
                    <legend>
                      <span>Module {moduleIndex + 1}</span>
                      <button className="icon-button" type="button" title="Remove module" onClick={() => removeModule(moduleIndex)}>
                        <X size={16} />
                      </button>
                    </legend>
                    <div className="admin-form-grid">
                      <label>
                        Module title
                        <input
                          value={module.title}
                          onChange={(event) => updateModuleField(moduleIndex, 'title', event.target.value)}
                          required
                        />
                      </label>
                      <label>
                        Module order
                        <input
                          value={module.order}
                          onChange={(event) => updateModuleField(moduleIndex, 'order', event.target.value)}
                          type="number"
                          min="1"
                        />
                      </label>
                      <label className="admin-wide">
                        Module description
                        <textarea
                          value={module.description}
                          onChange={(event) => updateModuleField(moduleIndex, 'description', event.target.value)}
                        />
                      </label>
                    </div>
                    <div className="admin-lesson-list">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div className="admin-lesson-editor" key={lesson._id || `lesson-${moduleIndex}-${lessonIndex}`}>
                          <input
                            value={lesson.title}
                            onChange={(event) => updateLessonField(moduleIndex, lessonIndex, 'title', event.target.value)}
                            aria-label="Lesson title"
                            placeholder="Lesson title"
                            required
                          />
                          <input
                            value={lesson.duration}
                            onChange={(event) => updateLessonField(moduleIndex, lessonIndex, 'duration', event.target.value)}
                            aria-label="Lesson duration"
                            placeholder="Duration"
                          />
                          <input
                            value={lesson.durationSeconds}
                            onChange={(event) => updateLessonField(moduleIndex, lessonIndex, 'durationSeconds', event.target.value)}
                            aria-label="Lesson seconds"
                            type="number"
                            min="0"
                          />
                          <select
                            value={lesson.stream?.provider || 'unconfigured'}
                            onChange={(event) => updateLessonStreamField(moduleIndex, lessonIndex, 'provider', event.target.value)}
                            aria-label="Stream provider"
                          >
                            {streamProviders.map((provider) => (
                              <option value={provider} key={provider}>
                                {statusLabel(provider)}
                              </option>
                            ))}
                          </select>
                          <select
                            value={lesson.stream?.status || 'not_uploaded'}
                            onChange={(event) => updateLessonStreamField(moduleIndex, lessonIndex, 'status', event.target.value)}
                            aria-label="Stream status"
                          >
                            {streamStatusOptions.map((status) => (
                              <option value={status} key={status}>
                                {statusLabel(status)}
                              </option>
                            ))}
                          </select>
                          <input
                            value={lesson.stream?.playbackId || ''}
                            onChange={(event) => updateLessonStreamField(moduleIndex, lessonIndex, 'playbackId', event.target.value)}
                            aria-label="Playback ID"
                            placeholder="Playback ID"
                          />
                          <label className="admin-check compact">
                            <input
                              type="checkbox"
                              checked={lesson.isPreview}
                              onChange={(event) => updateLessonField(moduleIndex, lessonIndex, 'isPreview', event.target.checked)}
                            />
                            <span>Preview</span>
                          </label>
                          <button className="icon-button" type="button" title="Remove lesson" onClick={() => removeLesson(moduleIndex, lessonIndex)}>
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button className="button ghost small" type="button" onClick={() => addLesson(moduleIndex)}>
                      <Plus size={16} />
                      Lesson
                    </button>
                  </fieldset>
                ))}
              </div>
            </form>

            <aside className="admin-course-panel">
              <div className="admin-panel-heading">
                <strong>Course catalogue</strong>
                <span>{serverCourses.length ? `${serverCourses.length} live records` : 'No course records yet'}</span>
              </div>
              <div className="admin-compact-list">
                {courses.map((course) => (
                  <article key={course._id || course.slug}>
                    <div>
                      <strong>{course.title}</strong>
                      <span>
                        {course.discipline} / {formatMoney(course.price, course.currency)}
                      </span>
                    </div>
                    <em className={`admin-pill ${statusTone(course.status || 'published')}`}>{statusLabel(course.status || 'published')}</em>
                    <div className="admin-icon-actions">
                      <button className="icon-button" type="button" title="Edit course" onClick={() => editCourse(course)}>
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        title="Archive course"
                        onClick={() => archiveCourse(course)}
                        disabled={!isServerRecord(course._id) || busyAction === `course-archive-${course._id}`}
                      >
                        <Archive size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </section>
        )}

        {activeSection === 'streaming' && (
        <section className="dashboard-section admin-section" id="streaming">
          <header className="admin-section-header">
            <div>
              <h2>
                <UploadCloud size={20} /> Streaming
              </h2>
              <span>{lessonRows.length} lessons</span>
            </div>
          </header>
          <div className="admin-table stream-table">
            <div className="admin-table-row admin-table-head">
              <span>Lesson</span>
              <span>Course</span>
              <span>Provider</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {lessonRows.map(({ course, module, lesson }) => (
              <div className="admin-table-row" key={`${course._id}-${module._id}-${lesson._id || lesson.title}`}>
                <span>
                  <strong>{lesson.title}</strong>
                  <small>{module.title}</small>
                </span>
                <span>{course.title}</span>
                <span>{statusLabel(lesson.stream?.provider || 'unconfigured')}</span>
                <span>
                  <em className={`admin-pill ${statusTone(lesson.stream?.status || 'not_uploaded')}`}>
                    {statusLabel(lesson.stream?.status || 'not_uploaded')}
                  </em>
                  {uploadProgress[lesson._id] != null && uploadProgress[lesson._id] < 100 && (
                    <small>{uploadProgress[lesson._id]}% uploaded</small>
                  )}
                </span>
                <span className="admin-icon-actions">
                  <button
                    className="button ghost small"
                    type="button"
                    onClick={() => requestUploadIntent({ course, module, lesson })}
                    disabled={
                      !isServerRecord(course._id) ||
                      !isServerRecord(module._id) ||
                      !isServerRecord(lesson._id) ||
                      busyAction === `stream-${lesson._id}`
                    }
                  >
                    {busyAction === `stream-${lesson._id}` ? <LoaderCircle className="spin" size={16} /> : <UploadCloud size={16} />}
                    Upload
                  </button>
                  <button
                    className="button ghost small"
                    type="button"
                    onClick={() => refreshLessonStream({ course, module, lesson })}
                    disabled={
                      !isServerRecord(course._id) ||
                      !isServerRecord(module._id) ||
                      !isServerRecord(lesson._id) ||
                      !lesson.stream?.uploadId ||
                      busyAction === `stream-refresh-${lesson._id}`
                    }
                  >
                    {busyAction === `stream-refresh-${lesson._id}` ? (
                      <LoaderCircle className="spin" size={16} />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                    Refresh
                  </button>
                </span>
              </div>
            ))}
            {lessonRows.length === 0 && <p className="admin-empty">No course lessons yet.</p>}
          </div>
        </section>
        )}

        {activeSection === 'products' && (
        <section className="dashboard-section admin-section" id="products">
          <header className="admin-section-header">
            <div>
              <h2>
                <Package size={20} /> Products
              </h2>
              <span>{products.length} products</span>
            </div>
            <button className="button ghost small" type="button" onClick={resetProductForm}>
              <Plus size={17} />
              New product
            </button>
          </header>

          <div className="admin-split">
            <form className="profile-form admin-editor" id="product-form" onSubmit={submitProduct}>
              <div className="admin-editor-heading">
                <div>
                  <strong>{isServerRecord(productForm.id) ? 'Edit product' : 'Create product'}</strong>
                  <span>{productForm.status}</span>
                </div>
                <button className="button primary small" type="submit" disabled={busyAction === 'product-save'}>
                  {busyAction === 'product-save' ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}
                  Save
                </button>
              </div>

              <div className="admin-form-grid">
                <label>
                  Title
                  <input value={productForm.title} onChange={(event) => updateProductField('title', event.target.value)} required />
                </label>
                <label>
                  SKU
                  <input value={productForm.sku} onChange={(event) => updateProductField('sku', event.target.value)} />
                </label>
                <label className="admin-wide">
                  Description
                  <textarea
                    value={productForm.description}
                    onChange={(event) => updateProductField('description', event.target.value)}
                    required
                  />
                </label>
                <label>
                  Category
                  <input value={productForm.category} onChange={(event) => updateProductField('category', event.target.value)} required />
                </label>
                <label>
                  Type
                  <select value={productForm.productType} onChange={(event) => updateProductField('productType', event.target.value)}>
                    {productTypeOptions.map((type) => (
                      <option value={type} key={type}>
                        {statusLabel(type)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Price
                  <input
                    value={productForm.price}
                    onChange={(event) => updateProductField('price', event.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                  />
                </label>
                <label>
                  Currency
                  <input
                    value={productForm.currency}
                    onChange={(event) => updateProductField('currency', event.target.value.toUpperCase())}
                    maxLength={3}
                  />
                </label>
                <label>
                  Status
                  <select value={productForm.status} onChange={(event) => updateProductField('status', event.target.value)}>
                    {productStatusOptions.map((status) => (
                      <option value={status} key={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Inventory quantity
                  <input
                    value={productForm.inventoryQuantity}
                    onChange={(event) => updateProductField('inventoryQuantity', event.target.value)}
                    type="number"
                    min="0"
                  />
                </label>
                <div className="admin-wide admin-media-panel">
                  <div className="admin-editor-heading">
                    <div>
                      <strong>Product media</strong>
                      <span>Upload one thumbnail, up to 5 product images, and optional video metadata.</span>
                    </div>
                  </div>
                  <div className="admin-media-grid">
                    <label className="admin-upload-tile">
                      <UploadCloud size={18} />
                      <strong>Thumbnail</strong>
                      <span>Upload 1 product thumbnail</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          uploadSingleMedia({
                            file: event.target.files?.[0],
                            folder: 'planeforge/products',
                            publicId: `${productForm.title || 'product'}-thumbnail`,
                            actionKey: 'product-thumbnail',
                            setField: (url) => updateProductField('thumbnail', url)
                          })
                        }
                      />
                    </label>
                    {productForm.thumbnail && renderImagePreview(productForm.thumbnail, () => updateProductField('thumbnail', ''))}
                    <label className="admin-upload-tile">
                      <UploadCloud size={18} />
                      <strong>Product images</strong>
                      <span>{textToList(productForm.imagesText).length} / 5 uploaded</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) =>
                          uploadGalleryMedia({
                            files: event.target.files,
                            folder: 'planeforge/products',
                            publicIdPrefix: `${productForm.title || 'product'}-gallery`,
                            currentText: productForm.imagesText,
                            setField: (value) => updateProductField('imagesText', value)
                          })
                        }
                      />
                    </label>
                    {textToList(productForm.imagesText).map((url) =>
                      renderImagePreview(
                        url,
                        () => updateProductField('imagesText', textToList(productForm.imagesText).filter((item) => item !== url).join('\n'))
                      )
                    )}
                  </div>
                  <details className="admin-warning-details">
                    <summary>External media URL fallback</summary>
                    <p>
                      Use external URLs only when necessary. If the external host changes, expires, or blocks
                      access, the media may stop working on PlaneForge.
                    </p>
                    <label>
                      Thumbnail URL
                      <input value={productForm.thumbnail} onChange={(event) => updateProductField('thumbnail', event.target.value)} />
                    </label>
                    <label>
                      Product image URLs
                      <textarea value={productForm.imagesText} onChange={(event) => updateProductField('imagesText', event.target.value)} />
                    </label>
                    <label>
                      Product video URL
                      <input value={productForm.videoUrl} onChange={(event) => updateProductField('videoUrl', event.target.value)} />
                    </label>
                  </details>
                </div>
              </div>

              <div className="admin-toggle-row">
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={productForm.inventoryTrack}
                    onChange={(event) => updateProductField('inventoryTrack', event.target.checked)}
                  />
                  <span>Track inventory</span>
                </label>
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={productForm.isFeatured}
                    onChange={(event) => updateProductField('isFeatured', event.target.checked)}
                  />
                  <span>Featured</span>
                </label>
              </div>
            </form>

            <aside className="admin-course-panel">
              <div className="admin-panel-heading">
                <strong>Product catalogue</strong>
                <span>{products.length} records</span>
              </div>
              <div className="admin-compact-list">
                {products.map((product) => (
                  <article key={product._id || product.slug}>
                    <div>
                      <strong>{product.title}</strong>
                      <span>
                        {product.category} / {formatMoney(product.price, product.currency)}
                      </span>
                    </div>
                    <em className={`admin-pill ${statusTone(product.status || 'draft')}`}>{statusLabel(product.status || 'draft')}</em>
                    <div className="admin-icon-actions">
                      <button className="icon-button" type="button" title="Edit product" onClick={() => editProduct(product)}>
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        title="Archive product"
                        onClick={() => archiveProduct(product)}
                        disabled={!isServerRecord(product._id) || busyAction === `product-archive-${product._id}`}
                      >
                        <Archive size={16} />
                      </button>
                    </div>
                  </article>
                ))}
                {products.length === 0 && <p className="admin-empty">No products yet.</p>}
              </div>
            </aside>
          </div>
        </section>
        )}

        {activeSection === 'careers' && (
        <section className="dashboard-section admin-section" id="careers">
          <header className="admin-section-header">
            <div>
              <h2>
                <BriefcaseBusiness size={20} /> Careers
              </h2>
              <span>{careerPositions.pagination?.total ?? careerPositions.positions?.length ?? 0} positions</span>
            </div>
            <form className="admin-filter-row" onSubmit={applyFilters}>
              <label className="admin-search-field">
                <Search size={16} />
                <input
                  value={filters.careerSearch}
                  onChange={(event) => setFilter('careerSearch', event.target.value)}
                  placeholder="Search careers"
                />
              </label>
              <select value={filters.careerStatus} onChange={(event) => setFilter('careerStatus', event.target.value)}>
                <option value="">All positions</option>
                {careerPositionStatuses.map((status) => (
                  <option value={status} key={status}>{statusLabel(status)}</option>
                ))}
              </select>
              <select value={filters.careerApplicationStatus} onChange={(event) => setFilter('careerApplicationStatus', event.target.value)}>
                <option value="">All applications</option>
                {careerApplicationStatuses.map((status) => (
                  <option value={status} key={status}>{statusLabel(status)}</option>
                ))}
              </select>
              <button className="button ghost small" type="submit">Filter</button>
            </form>
          </header>

          <div className="admin-split">
            <form className="profile-form admin-editor" id="career-form" onSubmit={submitCareerPosition}>
              <div className="admin-editor-heading">
                <div>
                  <strong>{careerForm.id ? 'Edit career position' : 'Create career position'}</strong>
                  <span>{careerForm.title || 'Draft role'}</span>
                </div>
                <button className="button ghost small" type="button" onClick={resetCareerForm}>
                  <Plus size={16} />
                  New
                </button>
              </div>
              <label>
                Title
                <input value={careerForm.title} onChange={(event) => setCareerForm({ ...careerForm, title: event.target.value })} required />
              </label>
              <div className="form-grid two">
                <label>
                  Company
                  <input value={careerForm.hiringCompany} onChange={(event) => setCareerForm({ ...careerForm, hiringCompany: event.target.value })} />
                </label>
                <label>
                  Department
                  <input value={careerForm.department} onChange={(event) => setCareerForm({ ...careerForm, department: event.target.value })} />
                </label>
                <label>
                  Employment
                  <select value={careerForm.employmentType} onChange={(event) => setCareerForm({ ...careerForm, employmentType: event.target.value })}>
                    {['full_time', 'part_time', 'contract', 'internship', 'temporary'].map((type) => (
                      <option value={type} key={type}>{statusLabel(type)}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Arrangement
                  <select value={careerForm.workArrangement} onChange={(event) => setCareerForm({ ...careerForm, workArrangement: event.target.value })}>
                    {['remote', 'hybrid', 'onsite'].map((type) => (
                      <option value={type} key={type}>{statusLabel(type)}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Location
                  <input value={careerForm.location} onChange={(event) => setCareerForm({ ...careerForm, location: event.target.value })} />
                </label>
                <label>
                  Country
                  <input value={careerForm.country} onChange={(event) => setCareerForm({ ...careerForm, country: event.target.value })} />
                </label>
              </div>
              <label>
                Short description
                <input value={careerForm.shortDescription} onChange={(event) => setCareerForm({ ...careerForm, shortDescription: event.target.value })} required />
              </label>
              <label>
                Role description
                <textarea value={careerForm.description} onChange={(event) => setCareerForm({ ...careerForm, description: event.target.value })} required />
              </label>
              <div className="form-grid two">
                <label>
                  Salary range
                  <input value={careerForm.salaryRange} onChange={(event) => setCareerForm({ ...careerForm, salaryRange: event.target.value })} />
                </label>
                <label>
                  Application deadline
                  <input type="date" value={careerForm.applicationDeadline} onChange={(event) => setCareerForm({ ...careerForm, applicationDeadline: event.target.value })} />
                </label>
                <label>
                  Application method
                  <select value={careerForm.applicationMethod} onChange={(event) => setCareerForm({ ...careerForm, applicationMethod: event.target.value })}>
                    <option value="internal">Internal form</option>
                    <option value="external">External URL</option>
                  </select>
                </label>
                <label>
                  Status
                  <select value={careerForm.status} onChange={(event) => setCareerForm({ ...careerForm, status: event.target.value })}>
                    {careerPositionStatuses.map((status) => (
                      <option value={status} key={status}>{statusLabel(status)}</option>
                    ))}
                  </select>
                </label>
              </div>
              {careerForm.applicationMethod === 'external' && (
                <label>
                  External apply URL
                  <input value={careerForm.externalApplyUrl} onChange={(event) => setCareerForm({ ...careerForm, externalApplyUrl: event.target.value })} />
                </label>
              )}
              <label>
                Responsibilities
                <textarea value={careerForm.responsibilitiesText} onChange={(event) => setCareerForm({ ...careerForm, responsibilitiesText: event.target.value })} placeholder="One responsibility per line" />
              </label>
              <label>
                Requirements
                <textarea value={careerForm.requirementsText} onChange={(event) => setCareerForm({ ...careerForm, requirementsText: event.target.value })} placeholder="One requirement per line" />
              </label>
              <label>
                Benefits
                <textarea value={careerForm.benefitsText} onChange={(event) => setCareerForm({ ...careerForm, benefitsText: event.target.value })} placeholder="One benefit per line" />
              </label>
              <button className="button primary" type="submit" disabled={busyAction === 'career-save'}>
                {busyAction === 'career-save' ? <LoaderCircle className="spin" size={18} /> : <Save size={18} />}
                Save Position
              </button>
            </form>

            <div className="admin-compact-list">
              {(careerPositions.positions || []).map((position) => (
                <article key={position._id}>
                  <div>
                    <strong>{position.title}</strong>
                    <span>{position.department || position.hiringCompany} / {statusLabel(position.employmentType)} / {formatDate(position.applicationDeadline)}</span>
                    <em className={`admin-pill ${statusTone(position.status)}`}>{statusLabel(position.status)}</em>
                  </div>
                  <div className="admin-record-actions">
                    <button className="icon-button" type="button" title="Edit position" onClick={() => editCareerPosition(position)}>
                      <Pencil size={16} />
                    </button>
                    <button className="icon-button" type="button" title="Duplicate position" onClick={() => duplicateCareerPosition(position)}>
                      <Plus size={16} />
                    </button>
                    <select value={position.status} onChange={(event) => updateCareerPositionStatus(position, event.target.value)}>
                      {careerPositionStatuses.map((status) => (
                        <option value={status} key={status}>{statusLabel(status)}</option>
                      ))}
                    </select>
                  </div>
                </article>
              ))}
              {(careerPositions.positions || []).length === 0 && <p className="admin-empty">No career positions match the current filters.</p>}
            </div>
          </div>

          <div className="admin-table payments-table">
            <div className="admin-table-row admin-table-head">
              <span>Applicant</span>
              <span>Role</span>
              <span>Location</span>
              <span>Submitted</span>
              <span>Status</span>
            </div>
            {(careerApplications.applications || []).map((application) => (
              <div className="admin-table-row" key={application._id}>
                <span>
                  <strong>{application.applicant?.firstName} {application.applicant?.lastName}</strong>
                  <small>{application.applicant?.email}</small>
                </span>
                <span>{application.position?.title || 'Position unavailable'}</span>
                <span>{[application.applicant?.city, application.applicant?.country].filter(Boolean).join(', ') || 'Not provided'}</span>
                <span>{formatDate(application.submittedAt)}</span>
                <span>
                  <select value={application.status} onChange={(event) => updateCareerApplication(application, event.target.value)}>
                    {careerApplicationStatuses.map((status) => (
                      <option value={status} key={status}>{statusLabel(status)}</option>
                    ))}
                  </select>
                </span>
              </div>
            ))}
            {(careerApplications.applications || []).length === 0 && <p className="admin-empty">No applications match the current filters.</p>}
          </div>
        </section>
        )}

        {activeSection === 'articles' && (
        <section className="dashboard-section admin-section" id="articles">
          <header className="admin-section-header">
            <div>
              <h2>
                <FileText size={20} /> Articles
              </h2>
              <span>{articles.length} posts</span>
            </div>
            <button className="button ghost small" type="button" onClick={() => setArticleForm(initialArticleForm())}>
              <Plus size={17} />
              New article
            </button>
          </header>

          <div className="admin-split">
            <form className="profile-form admin-editor" onSubmit={submitArticle}>
              <div className="admin-editor-heading">
                <div>
                  <strong>{isServerRecord(articleForm.id) ? 'Edit article' : 'Create article'}</strong>
                  <span>{articleForm.status}</span>
                </div>
                <button className="button primary small" type="submit" disabled={busyAction === 'article-save'}>
                  {busyAction === 'article-save' ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}
                  Save
                </button>
              </div>
              <div className="admin-form-grid">
                <label>
                  Title
                  <input value={articleForm.title} onChange={(event) => setArticleForm({ ...articleForm, title: event.target.value })} required />
                </label>
                <label>
                  Category
                  <input value={articleForm.category} onChange={(event) => setArticleForm({ ...articleForm, category: event.target.value })} />
                </label>
                <label>
                  Reading time
                  <input
                    value={articleForm.readingTime}
                    onChange={(event) => setArticleForm({ ...articleForm, readingTime: event.target.value })}
                  />
                </label>
                <label>
                  Status
                  <select value={articleForm.status} onChange={(event) => setArticleForm({ ...articleForm, status: event.target.value })}>
                    {articleStatuses.map((status) => (
                      <option value={status} key={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-wide">
                  Image URL
                  <input value={articleForm.image} onChange={(event) => setArticleForm({ ...articleForm, image: event.target.value })} />
                </label>
                <label className="admin-wide">
                  Excerpt
                  <textarea value={articleForm.excerpt} onChange={(event) => setArticleForm({ ...articleForm, excerpt: event.target.value })} />
                </label>
                <label className="admin-wide">
                  Body
                  <textarea value={articleForm.body} onChange={(event) => setArticleForm({ ...articleForm, body: event.target.value })} required />
                </label>
              </div>
            </form>

            <div className="admin-compact-list">
              {articles.map((article) => (
                <article key={article._id || article.slug}>
                  <div>
                    <strong>{article.title}</strong>
                    <span>
                      {article.category || 'Uncategorized'} / {article.readingTime || 'No time'}
                    </span>
                  </div>
                  <em className={`admin-pill ${statusTone(article.status || 'published')}`}>{statusLabel(article.status || 'published')}</em>
                  <div className="admin-icon-actions">
                    <button className="icon-button" type="button" title="Edit article" onClick={() => setArticleForm(articleToForm(article))}>
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      title="Move to drafts"
                      onClick={() => archiveArticle(article)}
                      disabled={!isServerRecord(article._id) || busyAction === `article-archive-${article._id}`}
                    >
                      <Archive size={16} />
                    </button>
                  </div>
                </article>
              ))}
              {articles.length === 0 && <p className="admin-empty">No articles yet.</p>}
            </div>
          </div>
        </section>
        )}

        {activeSection === 'users' && (
        <section className="dashboard-section admin-section" id="users">
          <header className="admin-section-header">
            <div>
              <h2>
                <Users size={20} /> Users and access
              </h2>
              <span>{users.pagination?.total ?? users.users?.length ?? 0} accounts</span>
            </div>
            <form className="admin-filter-row" onSubmit={applyFilters}>
              <label className="admin-search-field">
                <Search size={16} />
                <input
                  value={filters.userSearch}
                  onChange={(event) => setFilter('userSearch', event.target.value)}
                  placeholder="Search users"
                />
              </label>
              <select value={filters.userRole} onChange={(event) => setFilter('userRole', event.target.value)}>
                <option value="">All roles</option>
                {userRoles.map((role) => (
                  <option value={role} key={role}>
                    {roleLabel(role)}
                  </option>
                ))}
              </select>
              <select value={filters.userStatus} onChange={(event) => setFilter('userStatus', event.target.value)}>
                <option value="">All statuses</option>
                {userStatuses.map((status) => (
                  <option value={status} key={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
              <button className="button ghost small" type="submit">
                Filter
              </button>
            </form>
          </header>

          <form className="admin-editor admin-user-create" onSubmit={submitUser}>
            <div className="admin-editor-heading">
              <div>
                <h3>
                  <UserCog size={18} /> Add account
                </h3>
                <span>Create user, consultant, partner, or admin access without exposing staff roles on public login.</span>
              </div>
            </div>
            <div className="admin-form-grid">
              <label>
                Full name
                <input value={userForm.name} onChange={(event) => updateUserForm('name', event.target.value)} required />
              </label>
              <label>
                Email
                <input
                  value={userForm.email}
                  onChange={(event) => updateUserForm('email', event.target.value)}
                  type="email"
                  required
                />
              </label>
              <PhoneNumberField
                value={userForm.contactNumber}
                onChange={(contactNumber) => updateUserForm('contactNumber', contactNumber)}
                required
              />
              <label>
                Date of birth
                <input
                  value={userForm.dateOfBirth}
                  onChange={(event) => updateUserForm('dateOfBirth', event.target.value)}
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  required
                />
              </label>
              <PasswordField
                value={userForm.password}
                onChange={(event) => updateUserForm('password', event.target.value)}
                autoComplete="new-password"
              />
              <label>
                Role
                <select value={userForm.role} onChange={(event) => updateUserForm('role', event.target.value)}>
                  {adminCreatedUserRoles.map((role) => (
                    <option value={role} key={role}>
                      {roleLabel(role)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select value={userForm.status} onChange={(event) => updateUserForm('status', event.target.value)}>
                  {userStatuses.map((status) => (
                    <option value={status} key={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Title
                <input value={userForm.title} onChange={(event) => updateUserForm('title', event.target.value)} />
              </label>
              <label className="admin-wide">
                Organization
                <input
                  value={userForm.organization}
                  onChange={(event) => updateUserForm('organization', event.target.value)}
                />
              </label>
              {userForm.role === 'consultant' && (
                <>
                  <label>
                    Specialty
                    <input
                      value={userForm.specialty}
                      onChange={(event) => updateUserForm('specialty', event.target.value)}
                    />
                  </label>
                  <label>
                    Consultation fee
                    <input
                      value={userForm.consultationFee}
                      onChange={(event) => updateUserForm('consultationFee', event.target.value)}
                      type="number"
                      min="0"
                      step="1"
                    />
                  </label>
                </>
              )}
              {userForm.role === 'partner' && (
                <>
                  <label>
                    Partner code
                    <input
                      value={userForm.partnerCode}
                      onChange={(event) => updateUserForm('partnerCode', event.target.value)}
                    />
                  </label>
                  <label>
                    Commission %
                    <input
                      value={userForm.commissionRate}
                      onChange={(event) => updateUserForm('commissionRate', event.target.value)}
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </label>
                </>
              )}
            </div>
            <button className="button primary small" type="submit" disabled={busyAction === 'user-create'}>
              <Plus size={16} />
              {busyAction === 'user-create' ? 'Creating' : 'Add Account'}
            </button>
          </form>

          <div className="admin-table users-table">
            <div className="admin-table-row admin-table-head">
              <span>Account</span>
              <span>Role</span>
              <span>Status</span>
              <span>Courses</span>
              <span>Grant access</span>
            </div>
            {(users.users || []).map((user) => {
              const grant = grants[user._id] || {};

              return (
                <div className="admin-table-row" key={user._id}>
                  <span>
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                    {user.contactNumber && <small>{user.contactNumber}</small>}
                    {user.role === 'partner' && (
                      <small>
                        {user.partnerCode || 'No partner code'} / {Number(user.commissionRate || 0)}% commission
                      </small>
                    )}
                    {user.role === 'consultant' && user.specialty && <small>{user.specialty}</small>}
                    {user.role === 'consultant' && (
                      <small>
                        Fee: {formatMoney(user.consultationFee || 0)} / Requested {formatMoney(user.requestedConsultationFee || 0)}
                      </small>
                    )}
                  </span>
                  <span>
                    <select
                      value={['student', 'learner', 'buyer'].includes(user.role) ? 'user' : user.role}
                      onChange={(event) => updateUser(user, { role: event.target.value })}
                    >
                      {userRoles.map((role) => (
                        <option value={role} key={role}>
                          {roleLabel(role)}
                        </option>
                      ))}
                    </select>
                  </span>
                  <span>
                    <select value={user.status} onChange={(event) => updateUser(user, { status: event.target.value })}>
                      {userStatuses.map((status) => (
                        <option value={status} key={status}>
                          {statusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </span>
                  <span>{user.ownedCourses?.length || 0}</span>
                  <span className="admin-grant-control">
                    {user.role === 'consultant' && user.consultationFeeStatus === 'pending' && (
                      <button
                        className="button ghost small"
                        type="button"
                        onClick={() =>
                          updateUser(user, {
                            requestedConsultationFee: user.requestedConsultationFee,
                            consultationFeeStatus: 'approved'
                          })
                        }
                      >
                        Approve Fee
                      </button>
                    )}
                    <select value={grant.courseId || ''} onChange={(event) => setGrant(user._id, 'courseId', event.target.value)}>
                      <option value="">Course</option>
                      {serverCourses.map((course) => (
                        <option value={course._id} key={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                    <input
                      value={grant.expiresAt || ''}
                      onChange={(event) => setGrant(user._id, 'expiresAt', event.target.value)}
                      type="date"
                      aria-label="Grant expiration"
                    />
                    <button
                      className="button ghost small"
                      type="button"
                      onClick={() => grantCourse(user)}
                      disabled={!serverCourses.length || busyAction === `grant-${user._id}`}
                    >
                      <ShieldCheck size={16} />
                      Grant
                    </button>
                  </span>
                </div>
              );
            })}
            {(users.users || []).length === 0 && <p className="admin-empty">No users match the current filters.</p>}
          </div>
        </section>
        )}

        {activeSection === 'finance' && (
        <section className="dashboard-section admin-section" id="finance">
          <header className="admin-section-header">
            <div>
              <h2>
                <CreditCard size={20} /> Revenue settlement
              </h2>
              <span>{earnings.length} earnings / {expenses.length} expenses</span>
            </div>
          </header>

          <form className="admin-editor admin-user-create" onSubmit={submitExpense}>
            <div className="admin-editor-heading">
              <div>
                <h3>Expense deduction</h3>
                <span>Only unsettled or partly settled amounts reduce future net sales.</span>
              </div>
            </div>
            <div className="admin-form-grid">
              <label>
                Title
                <input value={expenseForm.title} onChange={(event) => updateExpenseForm('title', event.target.value)} required />
              </label>
              <label>
                Category
                <input value={expenseForm.category} onChange={(event) => updateExpenseForm('category', event.target.value)} />
              </label>
              <label>
                Amount
                <input value={expenseForm.amount} onChange={(event) => updateExpenseForm('amount', event.target.value)} type="number" min="0" step="0.01" required />
              </label>
              <label>
                Already settled
                <input value={expenseForm.settledAmount} onChange={(event) => updateExpenseForm('settledAmount', event.target.value)} type="number" min="0" step="0.01" />
              </label>
              <label>
                Status
                <select value={expenseForm.settlementStatus} onChange={(event) => updateExpenseForm('settlementStatus', event.target.value)}>
                  {['unsettled', 'part_settled', 'settled'].map((status) => (
                    <option value={status} key={status}>{statusLabel(status)}</option>
                  ))}
                </select>
              </label>
              <label>
                Currency
                <input value={expenseForm.currency} onChange={(event) => updateExpenseForm('currency', event.target.value.toUpperCase())} maxLength={3} />
              </label>
              <label>
                Period start
                <input value={expenseForm.periodStart} onChange={(event) => updateExpenseForm('periodStart', event.target.value)} type="date" />
              </label>
              <label>
                Period end
                <input value={expenseForm.periodEnd} onChange={(event) => updateExpenseForm('periodEnd', event.target.value)} type="date" />
              </label>
              <label className="admin-wide">
                Notes
                <textarea value={expenseForm.notes} onChange={(event) => updateExpenseForm('notes', event.target.value)} />
              </label>
            </div>
            <button className="button primary small" type="submit" disabled={busyAction === 'expense-save'}>
              <Save size={16} />
              {isServerRecord(expenseForm.id) ? 'Update Expense' : 'Record Expense'}
            </button>
          </form>

          <div className="admin-table payments-table">
            <div className="admin-table-row admin-table-head">
              <span>Expense</span>
              <span>Amount</span>
              <span>Settled</span>
              <span>Period</span>
              <span>Status</span>
            </div>
            {expenses.map((expense) => (
              <div className="admin-table-row" key={expense._id}>
                <span>
                  <strong>{expense.title}</strong>
                  <small>{expense.category}</small>
                </span>
                <span>{formatMoney(expense.amount, expense.currency)}</span>
                <span>{formatMoney(expense.settledAmount, expense.currency)}</span>
                <span>{expense.periodStart ? formatDate(expense.periodStart) : 'Any period'}</span>
                <span>
                  <button className="button ghost small" type="button" onClick={() => editExpense(expense)}>
                    {statusLabel(expense.settlementStatus)}
                  </button>
                </span>
              </div>
            ))}
            {!expenses.length && <p className="admin-empty">No settlement expenses recorded.</p>}
          </div>

          <div className="admin-table payments-table">
            <div className="admin-table-row admin-table-head">
              <span>Earner</span>
              <span>Source</span>
              <span>Net basis</span>
              <span>Share</span>
              <span>Status</span>
            </div>
            {earnings.map((earning) => (
              <div className="admin-table-row" key={earning._id}>
                <span>
                  <strong>{earning.earner?.name || 'Unknown'}</strong>
                  <small>{earning.earner?.email}</small>
                </span>
                <span>{earning.sourceType}</span>
                <span>{formatMoney(earning.netAmount, earning.currency)}</span>
                <span>{formatMoney(earning.amount, earning.currency)}</span>
                <span>{statusLabel(earning.status)}</span>
              </div>
            ))}
            {!earnings.length && <p className="admin-empty">No earnings have been generated yet.</p>}
          </div>
        </section>
        )}

        {['payments', 'orders'].includes(activeSection) && (
        <section className="dashboard-section admin-section" id={activeSection}>
          <header className="admin-section-header">
            <div>
              <h2>
                {activeSection === 'orders' ? <FileText size={20} /> : <CreditCard size={20} />} {activeSection === 'orders' ? 'Orders' : 'Payments'}
              </h2>
              <span>{payments.pagination?.total ?? payments.orders?.length ?? 0} orders</span>
            </div>
            <form className="admin-filter-row" onSubmit={applyFilters}>
              <label className="admin-search-field">
                <Search size={16} />
                <input
                  value={filters.paymentSearch}
                  onChange={(event) => setFilter('paymentSearch', event.target.value)}
                  placeholder="Search orders"
                />
              </label>
              <select value={filters.paymentStatus} onChange={(event) => setFilter('paymentStatus', event.target.value)}>
                <option value="">All statuses</option>
                {orderStatuses.map((status) => (
                  <option value={status} key={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
              <select value={filters.paymentProvider} onChange={(event) => setFilter('paymentProvider', event.target.value)}>
                <option value="">All providers</option>
                {providers.map((provider) => (
                  <option value={provider} key={provider}>
                    {provider}
                  </option>
                ))}
              </select>
              <button className="button ghost small" type="submit">
                Filter
              </button>
            </form>
          </header>

          <div className="admin-table payments-table">
            <div className="admin-table-row admin-table-head">
              <span>Invoice</span>
              <span>Customer</span>
              <span>Item</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            {(payments.orders || []).map((order) => (
              <div className="admin-table-row" key={order._id}>
                <span>
                  <strong>{order.invoiceNumber}</strong>
                  <small>{order.provider} / {formatDate(order.createdAt)}</small>
                </span>
                <span>
                  <strong>{order.user?.name || 'Unknown'}</strong>
                  <small>{order.user?.email || order.invoice?.customerEmail || 'No email'}</small>
                </span>
                <span>{order.course?.title || order.product?.title || order.invoice?.itemName || 'Unknown item'}</span>
                <span>{formatMoney(order.amount, order.currency)}</span>
                <span>
                  <select value={order.status} onChange={(event) => updatePayment(order, event.target.value)}>
                    {orderStatuses.map((status) => (
                      <option value={status} key={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>
                </span>
              </div>
            ))}
            {(payments.orders || []).length === 0 && <p className="admin-empty">No orders match the current filters.</p>}
          </div>
        </section>
        )}

        {activeSection === 'consultations' && (
        <section className="dashboard-section admin-section" id="consultations">
          <header className="admin-section-header">
            <div>
              <h2>
                <CalendarDays size={20} /> Consultations
              </h2>
              <span>{consultations.pagination?.total ?? consultations.consultations?.length ?? 0} bookings</span>
            </div>
            <form className="admin-filter-row" onSubmit={applyFilters}>
              <label className="admin-search-field">
                <Search size={16} />
                <input
                  value={filters.consultationSearch}
                  onChange={(event) => setFilter('consultationSearch', event.target.value)}
                  placeholder="Search consultations"
                />
              </label>
              <select value={filters.consultationStatus} onChange={(event) => setFilter('consultationStatus', event.target.value)}>
                <option value="">All statuses</option>
                {consultationStatuses.map((status) => (
                  <option value={status} key={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
              <button className="button ghost small" type="submit">
                Filter
              </button>
            </form>
          </header>

          <div className="admin-table consultations-table">
            <div className="admin-table-row admin-table-head">
              <span>Service</span>
              <span>User</span>
              <span>Consultant</span>
              <span>Schedule</span>
              <span>Status</span>
            </div>
            {(consultations.consultations || []).map((consultation) => (
              <div className="admin-table-row" key={consultation._id}>
                <span>
                  <strong>{consultation.service}</strong>
                  <small>{consultation.category}</small>
                </span>
                <span>{consultation.student?.name || 'Unknown'}</span>
                <span>{consultation.consultant?.name || 'Unknown'}</span>
                <span>{formatDate(consultation.scheduledAt)}</span>
                <span>
                  <select value={consultation.status} onChange={(event) => updateConsultation(consultation, event.target.value)}>
                    {consultationStatuses.map((status) => (
                      <option value={status} key={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>
                </span>
              </div>
            ))}
            {(consultations.consultations || []).length === 0 && <p className="admin-empty">No consultations match the current filters.</p>}
          </div>
        </section>
        )}

        {['overview', 'reports'].includes(activeSection) && (
        <section className="dashboard-section admin-section two-column">
          <article className="admin-mini-panel">
            <h2>
              <BarChart3 size={20} /> Reporting
            </h2>
            <p>Revenue, enrollments, order state, and support volume are aggregated from live admin records.</p>
          </article>
          <article className="admin-mini-panel">
            <h2>
              <Layers3 size={20} /> Content System
            </h2>
            <p>Course modules, lesson streams, public articles, and publish states are controlled from this console.</p>
          </article>
          <article className="admin-mini-panel">
            <h2>
              <UserCog size={20} /> Access Control
            </h2>
            <p>Admins can update account status, adjust roles, and grant course access from stored records.</p>
          </article>
          <article className="admin-mini-panel">
            <h2>
              <MessageSquare size={20} /> Support Flow
            </h2>
            <p>Contact messages can be filtered, prioritized, routed, and closed after response.</p>
          </article>
        </section>
        )}
      </div>
    </DashboardShell>
  );
};
