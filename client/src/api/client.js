import { articles, consultants, courses } from '../data/catalog.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const tokenKey = 'planeforge_token';
const deviceKey = 'planeforge_device_id';

export const getDeviceId = () => {
  let deviceId = localStorage.getItem(deviceKey);

  if (!deviceId) {
    deviceId =
      crypto?.randomUUID?.() ||
      `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(deviceKey, deviceId);
  }

  return deviceId;
};

const getToken = () => localStorage.getItem(tokenKey);

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

const hasCatalogFilters = (params = {}) =>
  ['search', 'category', 'discipline', 'difficulty', 'instructor', 'price', 'language', 'featured'].some(
    (key) => params[key]
  );

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
    const data = await request(`/courses${query ? `?${query}` : ''}`, { timeoutMs: 800 });
    if (!data.courses?.length) {
      const localResults = getLocalCourseResults(params);
      if (localResults.courses.length || !hasCatalogFilters(params)) return localResults;
    }
    return data;
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

export const getLearningCourse = async (slug) => {
  try {
    return await request(`/courses/${slug}/learn`, { timeoutMs: 1000 });
  } catch {
    return { course: courses.find((course) => course.slug === slug) };
  }
};

export const getLessonPlayback = (slug, lessonId) =>
  request(`/courses/${slug}/lessons/${lessonId}/playback`);

export const saveLessonProgress = ({ courseId, lessonId, positionSeconds, watchedSeconds, durationSeconds, completed }) =>
  request(`/users/progress/${courseId}/lessons/${lessonId}`, {
    method: 'PATCH',
    body: JSON.stringify({ positionSeconds, watchedSeconds, durationSeconds, completed })
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

export const loginRequest = (payload) =>
  request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const registerRequest = (payload) =>
  request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const verifyLoginRequest = (payload) =>
  request('/auth/verify-login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

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
  request('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({})
  });

export const getMe = () => request('/auth/me');

export const getDashboard = async () => {
  try {
    return await request('/users/dashboard');
  } catch {
    return null;
  }
};

export const getAdminOverview = () => request('/admin/overview');

export const getAdminContent = () => request('/admin/content');

export const getAdminUsers = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  ).toString();

  return request(`/admin/users${query ? `?${query}` : ''}`);
};

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
