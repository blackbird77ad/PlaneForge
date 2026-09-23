import { articles, consultants, courses, products } from '../data/catalog.js';
import { safeLocalStorage, safeSessionStorage } from '../utils/storage.js';

const API_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:5001/api' : '/api');
const tokenKey = 'planeforge_token';
const deviceKey = 'planeforge_device_id';
const storageUser = 'planeforge_user';
const demoChallengeKey = 'planeforge_demo_challenge';
const demoPassword = 'Password123!';

const demoUsers = [
  {
    id: 'demo-student',
    name: 'Maya Okafor',
    email: 'student@planeforge.test',
    contactNumber: '+233 555 010 100',
    dateOfBirth: '2001-05-14',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    title: 'PCB Design Learner',
    ownedCourses: ['pcb-design-fundamentals'],
    profile: {
      country: 'Ghana',
      organization: 'BridgeWorks Studio'
    }
  },
  {
    id: 'demo-consultant',
    name: 'Honu Evans',
    email: 'consultant@planeforge.test',
    contactNumber: '+233 555 010 200',
    dateOfBirth: '1987-11-08',
    role: 'consultant',
    avatar: consultants[0]?.avatar,
    title: consultants[0]?.title || 'PCB Engineering Consultant',
    specialty: consultants[0]?.specialty || 'PCB Design & Hardware Engineering',
    ownedCourses: [],
    profile: {}
  },
  {
    id: 'demo-partner',
    name: 'Nora Patel',
    email: 'partner@planeforge.test',
    contactNumber: '+233 555 010 300',
    dateOfBirth: '1990-02-22',
    role: 'partner',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    title: 'Training Partnerships Lead',
    partnerCode: 'PF-PARTNER-NORA',
    commissionRate: 8,
    ownedCourses: [],
    profile: {}
  },
  {
    id: 'demo-admin',
    name: 'PlaneForge Admin',
    email: 'admin@planeforge.test',
    contactNumber: '+233 555 010 400',
    dateOfBirth: '1985-09-12',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    title: 'Platform Administrator',
    ownedCourses: [],
    profile: {}
  }
];

export const getDeviceId = () => {
  let deviceId = safeLocalStorage.getItem(deviceKey);

  if (!deviceId) {
    deviceId =
      globalThis.crypto?.randomUUID?.() ||
      `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    safeLocalStorage.setItem(deviceKey, deviceId);
  }

  return deviceId;
};

const getToken = () => safeLocalStorage.getItem(tokenKey);

const normalizeRole = (role) =>
  !role || ['learner', 'student', 'buyer'].includes(role) ? 'user' : role;

const isDemoLoginPayload = ({ email, password } = {}) =>
  password === demoPassword &&
  demoUsers.some((user) => user.email === email?.trim().toLowerCase());

const hasDemoChallenge = ({ challengeId } = {}) => {
  try {
    const challenge = JSON.parse(safeSessionStorage.getItem(demoChallengeKey) || 'null');
    return Boolean(challenge?.challengeId && challenge.challengeId === challengeId);
  } catch {
    return false;
  }
};

const generateDemoCode = () => String(Math.floor(100000 + Math.random() * 900000));

const compactString = (value, maxLength = 240) => {
  if (value == null) return '';
  return String(value).trim().slice(0, maxLength);
};

const localProfileStringFields = {
  organization: 240,
  country: 120,
  city: 120,
  website: 240,
  headline: 180,
  experienceLevel: 80,
  learningGoal: 400
};
const lockedAccountFields = ['email', 'contact', 'contactNumber', 'phone', 'dateOfBirth'];

const sanitizeLocalProfile = (profile = {}) => {
  if (!profile || typeof profile !== 'object') return {};

  return Object.fromEntries(
    Object.entries(localProfileStringFields)
      .filter(([field]) => field in profile)
      .map(([field, maxLength]) => [field, compactString(profile[field], maxLength)])
  );
};

const hasLockedAccountField = (payload = {}) => {
  const profile = payload.profile && typeof payload.profile === 'object' ? payload.profile : {};
  return lockedAccountFields.some((field) => field in payload || field in profile);
};

const lockedAccountError = () => {
  const error = new Error('Email, contact number, and date of birth cannot be changed after sign-up');
  error.status = 400;
  return error;
};

const demoLogin = ({ email, password, role }) => {
  const requestedRole = normalizeRole(role);
  const user = demoUsers.find((item) => item.email === email?.trim().toLowerCase());

  if (!user || password !== demoPassword) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  if (user.role !== requestedRole) {
    const error = new Error(`This account is not registered as ${requestedRole}`);
    error.status = 401;
    throw error;
  }

  const challenge = {
    challengeId: `demo-${Date.now()}`,
    code: generateDemoCode(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    user
  };
  safeSessionStorage.setItem(demoChallengeKey, JSON.stringify(challenge));

  return {
    message: 'Demo login code ready.',
    requiresVerification: true,
    challengeId: challenge.challengeId,
    expiresAt: challenge.expiresAt,
    tokenTtlDays: 3
  };
};

const demoVerifyLogin = ({ challengeId, code }) => {
  let challenge = null;

  try {
    challenge = JSON.parse(safeSessionStorage.getItem(demoChallengeKey) || 'null');
  } catch {
    challenge = null;
  }

  if (!challenge || challenge.challengeId !== challengeId || challenge.code !== code) {
    const error = new Error('Login code is incorrect');
    error.status = 401;
    throw error;
  }

  safeSessionStorage.removeItem(demoChallengeKey);

  return {
    token: `demo-token-${challenge.user.role}-${Date.now()}`,
    session: {
      id: `demo-session-${challenge.user.role}`,
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    user: challenge.user
  };
};

const demoCurrentUser = () => {
  if (!getToken()?.startsWith('demo-token-')) return null;
  try {
    const user = JSON.parse(safeLocalStorage.getItem(storageUser));
    if (!user) return null;
    return {
      user,
      session: {
        id: `demo-session-${user.role}`,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    };
  } catch {
    return null;
  }
};

const request = async (path, options = {}) => {
  const { timeoutMs, ...fetchOptions } = options;
  const controller = timeoutMs ? new AbortController() : null;
  const timeout = timeoutMs
    ? globalThis.setTimeout(() => controller.abort(), timeoutMs)
    : null;

  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    signal: controller?.signal || fetchOptions.signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': getDeviceId(),
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...fetchOptions.headers
    }
  }).finally(() => {
    if (timeout) globalThis.clearTimeout(timeout);
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

const sortCourses = (items, sort) => {
  const list = [...items];
  if (sort === 'rating') return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  if (sort === 'newest') return list.reverse();
  if (sort === 'priceAsc') return list.sort((a, b) => a.price - b.price);
  if (sort === 'priceDesc') return list.sort((a, b) => b.price - a.price);
  if (sort === 'alphabetical') return list.sort((a, b) => a.title.localeCompare(b.title));
  return list.sort((a, b) => (b.studentsEnrolled || 0) - (a.studentsEnrolled || 0));
};

const sortProducts = (items, sort) => {
  const list = [...items];
  if (sort === 'popular') return list.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
  if (sort === 'priceAsc') return list.sort((a, b) => (a.price || 0) - (b.price || 0));
  if (sort === 'priceDesc') return list.sort((a, b) => (b.price || 0) - (a.price || 0));
  if (sort === 'alphabetical') return list.sort((a, b) => a.title.localeCompare(b.title));
  return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
};

export const getLocalCourseResults = (params = {}) => {
  const page = Number(params.page || 1);
  const limit = Number(params.limit || 12);
  const search = params.search?.toLowerCase();
  let filtered = [...courses];

  if (search) {
    filtered = filtered.filter((course) =>
      [
        course.title,
        course.subtitle,
        course.description,
        course.category,
        course.discipline,
        course.instructorName,
        ...(course.skills || []),
        ...(course.outcomes || [])
      ]
        .join(' ')
        .toLowerCase()
        .includes(search)
    );
  }

  ['category', 'discipline', 'difficulty', 'language'].forEach((key) => {
    if (params[key]) filtered = filtered.filter((course) => course[key] === params[key]);
  });

  if (params.instructor) {
    filtered = filtered.filter((course) =>
      course.instructorName.toLowerCase().includes(params.instructor.toLowerCase())
    );
  }

  if (params.price === 'free') filtered = filtered.filter((course) => course.price === 0);
  if (params.price === 'paid') filtered = filtered.filter((course) => course.price > 0);
  if (params.price === 'under100') filtered = filtered.filter((course) => course.price <= 100);
  if (params.featured === 'true') filtered = filtered.filter((course) => course.isFeatured);

  const sorted = sortCourses(filtered, params.sort);
  const start = (page - 1) * limit;

  return {
    courses: sorted.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total: sorted.length,
      pages: Math.max(Math.ceil(sorted.length / limit), 1)
    }
  };
};

export const getCourses = async (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  ).toString();

  try {
    return await request(`/courses${query ? `?${query}` : ''}`, { timeoutMs: 800 });
  } catch {
    return getLocalCourseResults(params);
  }
};

export const getCourse = async (slug) => {
  try {
    return await request(`/courses/${slug}`, { timeoutMs: 800 });
  } catch {
    return { course: courses.find((course) => course.slug === slug) };
  }
};

export const getLocalProductResults = (params = {}) => {
  const page = Number(params.page || 1);
  const limit = Number(params.limit || 12);
  const search = params.search?.toLowerCase();
  const selectedType = params.type || params.productType || '';
  let filtered = products.filter((product) => product.status === 'published');

  if (search) {
    filtered = filtered.filter((product) =>
      [
        product.title,
        product.description,
        product.category,
        product.sku,
        product.productType
      ]
        .join(' ')
        .toLowerCase()
        .includes(search)
    );
  }

  if (params.category) filtered = filtered.filter((product) => product.category === params.category);
  if (selectedType) filtered = filtered.filter((product) => product.productType === selectedType);
  if (params.price === 'under50') filtered = filtered.filter((product) => Number(product.price || 0) < 50);
  if (params.price === 'under100') filtered = filtered.filter((product) => Number(product.price || 0) <= 100);
  if (params.price === 'over100') filtered = filtered.filter((product) => Number(product.price || 0) > 100);
  if (params.featured === 'true') filtered = filtered.filter((product) => product.isFeatured);

  const sorted = sortProducts(filtered, params.sort);
  const start = (page - 1) * limit;

  return {
    products: sorted.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total: sorted.length,
      pages: Math.max(Math.ceil(sorted.length / limit), 1)
    }
  };
};

export const getProducts = async (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  ).toString();

  try {
    return await request(`/products${query ? `?${query}` : ''}`, { timeoutMs: 800 });
  } catch {
    return getLocalProductResults(params);
  }
};

export const getProduct = async (slug) => {
  try {
    return await request(`/products/${slug}`, { timeoutMs: 800 });
  } catch {
    return { product: products.find((product) => product.slug === slug) };
  }
};

export const getLearningCourse = async (slug) => {
  try {
    return await request(`/courses/${slug}/learn`, { timeoutMs: 1000 });
  } catch {
    return { course: courses.find((course) => course.slug === slug) };
  }
};

export const getLessonPlayback = (slug, lessonId) =>
  request(`/courses/${slug}/lessons/${lessonId}/playback`);

export const getCourseComments = (slug) => request(`/courses/${slug}/comments`);

export const createCourseComment = (slug, payload) =>
  request(`/courses/${slug}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const saveLessonProgress = ({ courseId, lessonId, positionSeconds, watchedSeconds, durationSeconds, completed }) =>
  request(`/users/progress/${courseId}/lessons/${lessonId}`, {
    method: 'PATCH',
    body: JSON.stringify({ positionSeconds, watchedSeconds, durationSeconds, completed })
  });

export const getCartItems = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  ).toString();

  return request(`/users/cart${query ? `?${query}` : ''}`);
};

export const addCartItem = (payload) =>
  request('/users/cart', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const removeCartItem = (cartItemId) =>
  request(`/users/cart/${cartItemId}`, {
    method: 'DELETE'
  });

export const getHomepage = async () => {
  try {
    return await request('/content/homepage', { timeoutMs: 800 });
  } catch {
    return {
      featuredCourses: courses.filter((course) => course.isFeatured),
      consultants,
      articles
    };
  }
};

export const getConsultants = async () => {
  try {
    const data = await request('/consultations/consultants', { timeoutMs: 800 });
    return data.consultants?.length ? data : { consultants };
  } catch {
    return { consultants };
  }
};

export const getArticles = async () => {
  try {
    const data = await request('/content/articles', { timeoutMs: 800 });
    return data.articles?.length ? data : { articles };
  } catch {
    return { articles };
  }
};

export const subscribeNewsletter = async (email) => {
  try {
    return await request('/content/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  } catch {
    return { message: 'Newsletter subscription confirmed' };
  }
};

export const submitContactInquiry = async (payload) => {
  try {
    return await request('/content/contact', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (err) {
    if (err.status) throw err;
    return {
      message:
        'Inquiry saved for local review. PlaneForge will respond by email when the API is available.'
    };
  }
};

export const checkoutCourse = async ({ courseId, provider, couponCode, termsAccepted, country }) =>
  request('/payments/checkout', {
    method: 'POST',
    body: JSON.stringify({ courseId, provider, couponCode, termsAccepted, country })
  });

export const checkoutProduct = async ({ productId, provider, couponCode, termsAccepted, quantity }) =>
  request('/payments/checkout-product', {
    method: 'POST',
    body: JSON.stringify({ productId, provider, couponCode, termsAccepted, quantity })
  });

export const verifyMockPayment = (orderId) =>
  request('/payments/mock-verify', {
    method: 'POST',
    body: JSON.stringify({ orderId })
  });

export const bookConsultation = async (payload) => {
  try {
    return await request('/consultations/book', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch {
    return {
      consultation: {
        id: `demo-consultation-${Date.now()}`,
        ...payload,
        amount: consultants.find((item) => item._id === payload.consultantId)?.consultationFee || 150,
        status: 'confirmed'
      },
      payment: {
        provider: 'mock',
        status: 'paid',
        paymentRef: `mock_${Date.now()}`
      }
    };
  }
};

export const loginRequest = async (payload) => {
  try {
    return await request('/auth/login', {
      method: 'POST',
      timeoutMs: 1500,
      body: JSON.stringify(payload)
    });
  } catch (err) {
    throw err;
  }
};

export const registerRequest = (payload) =>
  request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const verifyLoginRequest = async (payload) => {
  try {
    return await request('/auth/verify-login', {
      method: 'POST',
      timeoutMs: 1500,
      body: JSON.stringify(payload)
    });
  } catch (err) {
    throw err;
  }
};

export const requestPasswordReset = (payload) =>
  request('/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const completePasswordReset = (payload) =>
  request('/auth/password-reset/complete', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const logoutRequest = () =>
  getToken()?.startsWith('demo-token-')
    ? Promise.resolve({ message: 'Signed out of demo session' })
    : request('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({})
  });

export const getMe = async () => demoCurrentUser() || request('/auth/me');

export const updateProfileRequest = async (payload) => {
  try {
    return await request('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  } catch (err) {
    if (!getToken()?.startsWith('demo-token-')) throw err;
    if (hasLockedAccountField(payload)) throw lockedAccountError();

    let current = {};
    try {
      current = JSON.parse(safeLocalStorage.getItem(storageUser) || 'null') || {};
    } catch {
      current = {};
    }

    const nextUser = {
      ...current,
      ...('name' in payload ? { name: compactString(payload.name, 120) } : {}),
      ...('title' in payload ? { title: compactString(payload.title, 140) } : {}),
      ...('avatar' in payload ? { avatar: compactString(payload.avatar, 1_600_000) } : {}),
      profile: {
        ...(current.profile || {}),
        ...sanitizeLocalProfile(payload.profile)
      },
      updatedAt: new Date().toISOString()
    };

    safeLocalStorage.setItem(storageUser, JSON.stringify(nextUser));
    return { user: nextUser };
  }
};

export const requestProfileChange = (payload) =>
  request('/users/profile/change-request', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const confirmProfileChange = (payload) =>
  request('/users/profile/change-confirm', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const uploadImageAsset = (payload) =>
  request('/media/images', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const getDashboard = async () => {
  try {
    return await request('/users/dashboard');
  } catch {
    return null;
  }
};

export const getAdminOverview = () => request('/admin/overview');

export const getAdminActivity = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  ).toString();

  return request(`/admin/activity${query ? `?${query}` : ''}`);
};

export const getAdminContent = () => request('/admin/content');

export const getAdminUsers = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  ).toString();

  return request(`/admin/users${query ? `?${query}` : ''}`);
};

export const createAdminUser = (payload) =>
  request('/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const updateAdminUser = (userId, payload) =>
  request(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

export const grantAdminEnrollment = (userId, payload) =>
  request(`/admin/users/${userId}/enrollments`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const getAdminPayments = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  ).toString();

  return request(`/admin/payments${query ? `?${query}` : ''}`);
};

export const updateAdminPayment = (paymentId, payload) =>
  request(`/admin/payments/${paymentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

export const getAdminConsultations = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  ).toString();

  return request(`/admin/consultations${query ? `?${query}` : ''}`);
};

export const updateAdminConsultation = (consultationId, payload) =>
  request(`/admin/consultations/${consultationId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

export const getAdminExpenses = () => request('/admin/expenses');

export const createAdminExpense = (payload) =>
  request('/admin/expenses', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const updateAdminExpense = (expenseId, payload) =>
  request(`/admin/expenses/${expenseId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

export const getAdminEarnings = () => request('/admin/earnings');

export const getMyEarnings = () => request('/users/earnings');

export const withdrawEarning = (earningId) =>
  request(`/users/earnings/${earningId}/withdraw`, {
    method: 'POST',
    body: JSON.stringify({})
  });

export const getAdminInquiries = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  ).toString();

  return request(`/admin/inquiries${query ? `?${query}` : ''}`);
};

export const updateAdminInquiry = (inquiryId, payload) =>
  request(`/admin/inquiries/${inquiryId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

export const getAdminSettings = () => request('/admin/settings');

export const upsertAdminSetting = (payload) =>
  request('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

export const createAdminCourse = (payload) =>
  request('/courses', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const updateAdminCourse = (courseId, payload) =>
  request(`/courses/${courseId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

export const archiveAdminCourse = (courseId) =>
  request(`/courses/${courseId}`, {
    method: 'DELETE'
  });

export const createStreamUploadIntent = ({ courseId, moduleId, lessonId }) =>
  request(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/stream-upload`, {
    method: 'POST',
    body: JSON.stringify({})
  });

export const refreshStreamUpload = ({ courseId, moduleId, lessonId }) =>
  request(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/stream-refresh`, {
    method: 'POST',
    body: JSON.stringify({})
  });

export const createAdminProduct = (payload) =>
  request('/admin/products', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const updateAdminProduct = (productId, payload) =>
  request(`/admin/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

export const archiveAdminProduct = (productId) =>
  request(`/admin/products/${productId}`, {
    method: 'DELETE'
  });

export const createAdminArticle = (payload) =>
  request('/admin/articles', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const updateAdminArticle = (articleId, payload) =>
  request(`/admin/articles/${articleId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

export const archiveAdminArticle = (articleId) =>
  request(`/admin/articles/${articleId}`, {
    method: 'DELETE'
  });
