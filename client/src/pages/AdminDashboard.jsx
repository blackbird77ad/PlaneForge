import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
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
  Settings,
  ShieldCheck,
  UploadCloud,
  UserCog,
  Users,
  X
} from 'lucide-react';
import { DashboardShell } from '../components/DashboardShell.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { PasswordField } from '../components/PasswordField.jsx';
import {
  archiveAdminArticle,
  archiveAdminCourse,
  archiveAdminProduct,
  createAdminArticle,
  createAdminCourse,
  createAdminExpense,
  createAdminProduct,
  createAdminUser,
  createStreamUploadIntent,
  getAdminActivity,
  getAdminConsultations,
  getAdminContent,
  getAdminEarnings,
  getAdminExpenses,
  getAdminInquiries,
  getAdminOverview,
  getAdminPayments,
  getAdminSettings,
  getAdminUsers,
  grantAdminEnrollment,
  refreshStreamUpload,
  updateAdminArticle,
  updateAdminConsultation,
  updateAdminCourse,
  updateAdminExpense,
  updateAdminInquiry,
  updateAdminPayment,
  updateAdminProduct,
  updateAdminUser,
  upsertAdminSetting
} from '../api/client.js';

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

const difficultyOptions = ['Beginner', 'Intermediate', 'Advanced', 'Professional', 'Capstone'];
const courseStatusOptions = ['draft', 'published', 'archived'];
const purchaseTypeOptions = ['one_time', 'subscription'];
const streamProviders = ['mux', 'bunny', 'vimeo', 'external', 'unconfigured'];
const streamStatusOptions = ['not_uploaded', 'uploading', 'processing', 'ready', 'failed'];
const inquiryStatusOptions = ['open', 'new', 'in_review', 'responded', 'closed'];
const inquiryUpdateStatuses = ['new', 'in_review', 'responded', 'closed'];
const priorityOptions = ['low', 'normal', 'high'];
const intentOptions = [
  'learner',
  'course_support',
  'b2b',
  'collaboration',
  'consulting',
  'partnership',
  'general'
];
const userRoles = ['user', 'consultant', 'partner', 'admin'];
const adminCreatedUserRoles = ['user', 'consultant', 'partner'];
const userStatuses = ['active', 'suspended', 'pending'];
const orderStatuses = ['pending', 'payment_initialized', 'verified', 'paid', 'failed', 'refunded'];
const providers = ['stripe'];
const consultationStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
const articleStatuses = ['draft', 'published'];
const productStatusOptions = ['draft', 'published', 'archived'];
const productTypeOptions = ['physical', 'digital'];

const serverIdPattern = /^[a-f0-9]{24}$/i;

const emptyLesson = (order = 1) => ({
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
  title: order === 1 ? 'Getting Started' : '',
  description: '',
  order,
  lessons: [emptyLesson()]
});

const initialCourseForm = () => ({
  id: '',
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
  status: 'published',
  thumbnail: '',
  bannerImage: '',
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
  price: '49',
  currency: 'USD',
  status: 'published',
  inventoryTrack: false,
  inventoryQuantity: '0',
  isFeatured: false
});

const initialSettingForm = () => ({
  key: 'platform',
  description: '',
  valueText: '{\n  "newsletterEnabled": true\n}'
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
  status: course?.status || 'published',
  thumbnail: course?.thumbnail || '',
  bannerImage: course?.bannerImage || '',
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
        _id: module._id,
        title: module.title || '',
        description: module.description || '',
        order: module.order || moduleIndex + 1,
        lessons: module.lessons?.length
          ? module.lessons.map((lesson, lessonIndex) => ({
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
              resources: lesson.resources || []
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
  order: Number(lesson.order) || index + 1,
  stream: {
    provider: lesson.stream?.provider || 'unconfigured',
    status: lesson.stream?.status || 'not_uploaded',
    assetId: lesson.stream?.assetId?.trim() || undefined,
    playbackId: lesson.stream?.playbackId?.trim() || undefined,
    uploadId: lesson.stream?.uploadId?.trim() || undefined,
    signedPlaybackRequired: lesson.stream?.signedPlaybackRequired !== false,
    allowDownloads: Boolean(lesson.stream?.allowDownloads)
  },
  resources: Array.isArray(lesson.resources) ? lesson.resources : []
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
  status: form.status,
  thumbnail: form.thumbnail.trim(),
  bannerImage: form.bannerImage.trim(),
  duration: form.duration.trim(),
  instructorName: form.instructorName.trim(),
  language: form.language.trim() || 'English',
  isFeatured: Boolean(form.isFeatured),
  certificateAvailable: Boolean(form.certificateAvailable),
  outcomes: textToList(form.outcomesText),
  skills: textToList(form.skillsText),
  requirements: textToList(form.requirementsText),
  targetAudience: textToList(form.targetAudienceText),
  modules: form.modules.map((module, moduleIndex) => ({
    ...(isServerRecord(module._id) ? { _id: module._id } : {}),
    title: module.title?.trim() || `Module ${moduleIndex + 1}`,
    description: module.description?.trim(),
    order: Number(module.order) || moduleIndex + 1,
    lessons: module.lessons.map(lessonPayload)
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
  images: textToList(form.imagesText),
  price: Number(form.price || 0),
  currency: form.currency.trim().toUpperCase() || 'USD',
  status: form.status,
  inventory: {
    track: Boolean(form.inventoryTrack),
    quantity: Number(form.inventoryQuantity || 0)
  },
  isFeatured: Boolean(form.isFeatured)
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
  const [overview, setOverview] = useState(null);
  const [activities, setActivities] = useState([]);
  const [content, setContent] = useState({ courses: [], articles: [], products: [] });
  const [inquiries, setInquiries] = useState({ inquiries: [], grouped: { byIntent: [], byStatus: [], byTopic: [] } });
  const [users, setUsers] = useState({ users: [], pagination: null });
  const [payments, setPayments] = useState({ orders: [], pagination: null });
  const [consultations, setConsultations] = useState({ consultations: [], pagination: null });
  const [expenses, setExpenses] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [settings, setSettings] = useState([]);
  const [courseForm, setCourseForm] = useState(() => initialCourseForm());
  const [productForm, setProductForm] = useState(() => initialProductForm());
  const [articleForm, setArticleForm] = useState(() => initialArticleForm());
  const [settingForm, setSettingForm] = useState(() => initialSettingForm());
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
    consultationStatus: '',
    consultationSearch: ''
  });
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});

  const courses = content.courses || [];
  const products = content.products || [];
  const articles = content.articles || [];
  const serverCourses = courses.filter((course) => isServerRecord(course._id));

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

  const refresh = async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);

    const results = await Promise.allSettled([
      getAdminOverview(),
      getAdminActivity({ limit: 80 }),
      getAdminContent(),
      getAdminInquiries({
        status: filters.inquiryStatus,
        intent: filters.inquiryIntent,
        priority: filters.inquiryPriority,
        search: filters.inquirySearch,
        limit: 80
      }),
      getAdminUsers({
        role: filters.userRole,
        status: filters.userStatus,
        search: filters.userSearch,
        limit: 80
      }),
      getAdminPayments({
        status: filters.paymentStatus,
        provider: filters.paymentProvider,
        search: filters.paymentSearch,
        limit: 80
      }),
      getAdminConsultations({
        status: filters.consultationStatus,
        search: filters.consultationSearch,
        limit: 80
      }),
      getAdminExpenses(),
      getAdminEarnings(),
      getAdminSettings()
    ]);

    const [
      overviewResult,
      activityResult,
      contentResult,
      inquiryResult,
      userResult,
      paymentResult,
      consultationResult,
      expenseResult,
      earningResult,
      settingResult
    ] =
      results;

    if (overviewResult.status === 'fulfilled') setOverview(overviewResult.value);
    if (activityResult.status === 'fulfilled') setActivities(activityResult.value.activities || []);
    if (contentResult.status === 'fulfilled') setContent(contentResult.value);
    if (inquiryResult.status === 'fulfilled') setInquiries(inquiryResult.value);
    if (userResult.status === 'fulfilled') setUsers(userResult.value);
    if (paymentResult.status === 'fulfilled') setPayments(paymentResult.value);
    if (consultationResult.status === 'fulfilled') setConsultations(consultationResult.value);
    if (expenseResult.status === 'fulfilled') setExpenses(expenseResult.value.expenses || []);
    if (earningResult.status === 'fulfilled') setEarnings(earningResult.value.earnings || []);
    if (settingResult.status === 'fulfilled') setSettings(settingResult.value.settings || []);

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
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const updateCourseField = (key, value) =>
    setCourseForm((current) => ({
      ...current,
      [key]: value
    }));

  const updateProductField = (key, value) =>
    setProductForm((current) => ({
      ...current,
      [key]: value
    }));

  const updateModuleField = (moduleIndex, key, value) =>
    setCourseForm((current) => ({
      ...current,
      modules: current.modules.map((module, index) =>
        index === moduleIndex ? { ...module, [key]: value } : module
      )
    }));

  const updateLessonField = (moduleIndex, lessonIndex, key, value) =>
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

  const updateLessonStreamField = (moduleIndex, lessonIndex, key, value) =>
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

  const addModule = () =>
    setCourseForm((current) => ({
      ...current,
      modules: [...current.modules, emptyModule(current.modules.length + 1)]
    }));

  const removeModule = (moduleIndex) =>
    setCourseForm((current) => ({
      ...current,
      modules: current.modules.length > 1 ? current.modules.filter((_, index) => index !== moduleIndex) : current.modules
    }));

  const addLesson = (moduleIndex) =>
    setCourseForm((current) => ({
      ...current,
      modules: current.modules.map((module, index) =>
        index === moduleIndex
          ? {
              ...module,
              lessons: [...module.lessons, emptyLesson(module.lessons.length + 1)]
            }
          : module
      )
    }));

  const removeLesson = (moduleIndex, lessonIndex) =>
    setCourseForm((current) => ({
      ...current,
      modules: current.modules.map((module, index) => {
        if (index !== moduleIndex || module.lessons.length <= 1) return module;

        return {
          ...module,
          lessons: module.lessons.filter((_, nestedIndex) => nestedIndex !== lessonIndex)
        };
      })
    }));

  const editCourse = (course) => {
    setCourseForm(courseToForm(course));
    document.getElementById('course-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetCourseForm = () => setCourseForm(initialCourseForm());

  const resetProductForm = () => setProductForm(initialProductForm());

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

  const submitCourse = async (event) => {
    event.preventDefault();
    const payload = coursePayload(courseForm);
    const isEditing = isServerRecord(courseForm.id);

    const data = await runAction(
      'course-save',
      () => (isEditing ? updateAdminCourse(courseForm.id, payload) : createAdminCourse(payload)),
      isEditing ? 'Course updated.' : 'Course created.'
    );

    if (data?.course) {
      setCourseForm(courseToForm(data.course));
      await refresh({ quiet: true });
    }
  };

  const archiveCourse = async (course) => {
    const data = await runAction(
      `course-archive-${course._id}`,
      () => archiveAdminCourse(course._id),
      'Course archived.'
    );

    if (data) await refresh({ quiet: true });
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
          text: 'Video uploaded to Mux. Refresh this lesson in a moment to pull the playback ID.'
        });
        await refresh({ quiet: true });
      } catch (error) {
        setNotice({ type: 'error', text: error.message || 'Mux upload failed.' });
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
        text: data.stream.message || `Mux status: ${statusLabel(data.stream.status)}`
      });
      await refresh({ quiet: true });
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

  const editSetting = (setting) => {
    setSettingForm({
      key: setting.key,
      description: setting.description || '',
      valueText: JSON.stringify(setting.value ?? {}, null, 2)
    });
  };

  const submitSetting = async (event) => {
    event.preventDefault();
    let value;

    try {
      value = JSON.parse(settingForm.valueText || '{}');
    } catch {
      setNotice({ type: 'error', text: 'Setting value must be valid JSON.' });
      return;
    }

    const data = await runAction(
      'setting-save',
      () =>
        upsertAdminSetting({
          key: settingForm.key,
          description: settingForm.description,
          value
        }),
      'Setting saved.'
    );

    if (data?.setting) {
      setSettings((current) => {
        const exists = current.some((setting) => setting._id === data.setting._id);
        return exists ? replaceById(current, data.setting) : [...current, data.setting].sort((a, b) => a.key.localeCompare(b.key));
      });
      editSetting(data.setting);
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
      detail: `${overview?.paidOrders ?? 0} paid orders`
    },
    {
      label: 'Users',
      value:
        overview?.users ??
        overview?.students ??
        users.users?.filter((user) => ['user', 'student', 'learner', 'buyer'].includes(user.role)).length ??
        0,
      detail: `${overview?.activeEnrollments ?? 0} active enrollments`
    },
    {
      label: 'Courses',
      value: overview?.courses ?? courses.filter((course) => course.status !== 'draft').length,
      detail: `${overview?.draftCourses ?? courses.filter((course) => course.status === 'draft').length} drafts`
    },
    {
      label: 'Products',
      value: overview?.products ?? products.filter((product) => product.status === 'published').length,
      detail: `${overview?.draftProducts ?? products.filter((product) => product.status === 'draft').length} drafts`
    },
    {
      label: 'Open Inquiries',
      value: overview?.inquiries ?? inquiries.inquiries?.length ?? 0,
      detail: `${overview?.pendingOrders ?? 0} orders need attention`
    },
    {
      label: 'Active Carts',
      value: overview?.activeCartItems ?? 0,
      detail: `${overview?.cartItems ?? 0} tracked cart events`
    },
    {
      label: 'Consultants',
      value: overview?.consultants ?? 0,
      detail: `${overview?.consultations ?? consultations.consultations?.length ?? 0} consultations`
    },
    {
      label: 'Subscribers',
      value: overview?.subscribers ?? 0,
      detail: 'Newsletter list'
    },
    {
      label: 'Admins',
      value: overview?.admins ?? users.users?.filter((user) => user.role === 'admin').length ?? 0,
      detail: 'Platform operators'
    },
    {
      label: 'Partners',
      value: overview?.partners ?? users.users?.filter((user) => user.role === 'partner').length ?? 0,
      detail: 'Referral accounts'
    }
  ];

  return (
    <DashboardShell title="Admin console" subtitle="Manage content, access, support, payments, and platform configuration.">
      <div className="admin-workspace">
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

        {notice.text && (
          <div className={`admin-notice ${notice.type}`} role="status">
            {notice.type === 'error' ? <X size={18} /> : <CheckCircle2 size={18} />}
            <span>{notice.text}</span>
          </div>
        )}

        <div className="metric-grid admin-metric-grid">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>

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
                <label>
                  Category
                  <input value={courseForm.category} onChange={(event) => updateCourseField('category', event.target.value)} required />
                </label>
                <label>
                  Discipline
                  <input
                    value={courseForm.discipline}
                    onChange={(event) => updateCourseField('discipline', event.target.value)}
                    required
                  />
                </label>
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
                <label className="admin-wide">
                  Cloudinary thumbnail URL
                  <input value={courseForm.thumbnail} onChange={(event) => updateCourseField('thumbnail', event.target.value)} />
                </label>
                <label className="admin-wide">
                  Cloudinary banner URL
                  <input value={courseForm.bannerImage} onChange={(event) => updateCourseField('bannerImage', event.target.value)} />
                </label>
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
                <label className="admin-wide">
                  Cloudinary thumbnail URL
                  <input value={productForm.thumbnail} onChange={(event) => updateProductField('thumbnail', event.target.value)} />
                </label>
                <label className="admin-wide">
                  Cloudinary image URLs
                  <textarea value={productForm.imagesText} onChange={(event) => updateProductField('imagesText', event.target.value)} />
                </label>
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
                <span>Create user, consultant, or partner access without exposing staff roles on public login.</span>
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
              <label>
                Contact number
                <input
                  value={userForm.contactNumber}
                  onChange={(event) => updateUserForm('contactNumber', event.target.value)}
                  type="tel"
                  required
                />
              </label>
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

        <section className="dashboard-section admin-section" id="payments">
          <header className="admin-section-header">
            <div>
              <h2>
                <CreditCard size={20} /> Payments
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
              <span>Learner</span>
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

        <section className="dashboard-section admin-section" id="settings">
          <header className="admin-section-header">
            <div>
              <h2>
                <Settings size={20} /> Settings
              </h2>
              <span>{settings.length} keys</span>
            </div>
          </header>

          <div className="admin-split">
            <div className="admin-compact-list">
              {settings.map((setting) => (
                <article key={setting._id || setting.key}>
                  <div>
                    <strong>{setting.key}</strong>
                    <span>{setting.description || 'No description'}</span>
                  </div>
                  <button className="button ghost small" type="button" onClick={() => editSetting(setting)}>
                    <Pencil size={16} />
                    Edit
                  </button>
                </article>
              ))}
              {settings.length === 0 && <p className="admin-empty">No saved settings yet.</p>}
            </div>

            <form className="profile-form admin-editor" onSubmit={submitSetting}>
              <div className="admin-editor-heading">
                <div>
                  <strong>Setting editor</strong>
                  <span>{settingForm.key}</span>
                </div>
                <button className="button primary small" type="submit" disabled={busyAction === 'setting-save'}>
                  {busyAction === 'setting-save' ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}
                  Save
                </button>
              </div>
              <label>
                Key
                <input value={settingForm.key} onChange={(event) => setSettingForm({ ...settingForm, key: event.target.value })} required />
              </label>
              <label>
                Description
                <input
                  value={settingForm.description}
                  onChange={(event) => setSettingForm({ ...settingForm, description: event.target.value })}
                />
              </label>
              <label>
                Value
                <textarea
                  className="admin-code-textarea"
                  value={settingForm.valueText}
                  onChange={(event) => setSettingForm({ ...settingForm, valueText: event.target.value })}
                  spellCheck="false"
                  required
                />
              </label>
            </form>
          </div>
        </section>

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
      </div>
    </DashboardShell>
  );
};
