import { safeLocalStorage } from '../utils/storage.js';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:5000/api' : 'https://planeforge.onrender.com/api');
const tokenKey = 'planeforge_token';
const deviceKey = 'planeforge_device_id';

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

const request = async (path, options = {}) => {
  const { timeoutMs, ...fetchOptions } = options;
  const controller = timeoutMs ? new AbortController() : null;
  const timeout = timeoutMs
    ? globalThis.setTimeout(() => controller.abort(), timeoutMs)
    : null;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...fetchOptions,
      signal: controller?.signal || fetchOptions.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': getDeviceId(),
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...fetchOptions.headers
      }
    });
  } catch (err) {
    const error = new Error('We could not reach PlaneForge right now. Check that the API server is running and try again.');
    error.status = 0;
    error.cause = err;
    throw error;
  } finally {
    if (timeout) globalThis.clearTimeout(timeout);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const getCourses = async (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  ).toString();

  return request(`/courses${query ? `?${query}` : ''}`);
};

export const getCourse = (slug) => request(`/courses/${slug}`);

export const enrollFreeCourse = (slug) =>
  request(`/courses/${slug}/enroll`, {
    method: 'POST',
    body: JSON.stringify({})
  });

export const getProducts = async (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  ).toString();

  return request(`/products${query ? `?${query}` : ''}`);
};

export const getProduct = (slug) => request(`/products/${slug}`);

export const getProductAccess = (slug) => request(`/products/${slug}/access`);

export const downloadDigitalAsset = async ({ slug, assetId }) => {
  const response = await fetch(`${API_URL}/products/${slug}/assets/${assetId}/download`, {
    headers: {
      'X-Device-Id': getDeviceId(),
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
    }
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Download failed');
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const fileName = disposition.match(/filename="([^"]+)"/)?.[1] || 'planeforge-download';
  return { blob, fileName };
};

export const getLearningCourse = (slug) => request(`/courses/${slug}/learn`);

export const getLessonPlayback = (slug, lessonId) =>
  request(`/courses/${slug}/lessons/${lessonId}/playback`);

export const getCourseComments = (slug) => request(`/courses/${slug}/comments`);

export const createCourseComment = (slug, payload) =>
  request(`/courses/${slug}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const submitCourseReview = (slug, payload) =>
  request(`/courses/${slug}/reviews`, {
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

export const getHomepage = () => request('/content/homepage');

export const getConsultants = () => request('/consultations/consultants');

export const getArticles = () => request('/content/articles');

export const getCareers = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  ).toString();

  return request(`/careers${query ? `?${query}` : ''}`);
};

export const getCareer = (slug) => request(`/careers/${slug}`);

export const submitCareerApplication = (slug, payload) =>
  request(`/careers/${slug}/apply`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const subscribeNewsletter = (email) =>
  request('/content/newsletter', {
    method: 'POST',
    body: JSON.stringify({ email })
  });

export const submitContactInquiry = (payload) =>
  request('/content/contact', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const checkoutCourse = async ({ courseId, provider, couponCode, termsAccepted, country }) =>
  request('/payments/checkout', {
    method: 'POST',
    body: JSON.stringify({ courseId, provider, couponCode, termsAccepted, country })
  });

export const checkoutProduct = async ({ productId, provider, termsAccepted, quantity, shippingAddress }) =>
  request('/payments/checkout-product', {
    method: 'POST',
    body: JSON.stringify({ productId, provider, termsAccepted, quantity, shippingAddress })
  });

export const bookConsultation = (payload) =>
  request('/consultations/book', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

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

export const resendLoginCodeRequest = (payload) =>
  request('/auth/verification/resend', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const requestPasswordReset = (payload) =>
  request('/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const verifyPasswordResetCodeRequest = (payload) =>
  request('/auth/password-reset/verify', {
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

export const updateProfileRequest = (payload) =>
  request('/users/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

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

export const getDashboard = () => request('/users/dashboard');

export const getAdminOverview = () => request('/admin/overview');

export const getAdminActivity = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  ).toString();

  return request(`/admin/activity${query ? `?${query}` : ''}`);
};

export const getAdminContent = () => request('/admin/content');

export const getAdminProducts = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  ).toString();

  return request(`/admin/products${query ? `?${query}` : ''}`);
};

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

export const getAdminReviews = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  ).toString();

  return request(`/admin/reviews${query ? `?${query}` : ''}`);
};

export const updateAdminReview = ({ courseId, reviewId, status }) =>
  request(`/admin/reviews/${courseId}/${reviewId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });

export const getAdminCareerPositions = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  ).toString();

  return request(`/admin/careers/positions${query ? `?${query}` : ''}`);
};

export const createAdminCareerPosition = (payload) =>
  request('/admin/careers/positions', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const updateAdminCareerPosition = (positionId, payload) =>
  request(`/admin/careers/positions/${positionId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

export const duplicateAdminCareerPosition = (positionId) =>
  request(`/admin/careers/positions/${positionId}/duplicate`, {
    method: 'POST',
    body: JSON.stringify({})
  });

export const getAdminCareerApplications = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  ).toString();

  return request(`/admin/careers/applications${query ? `?${query}` : ''}`);
};

export const updateAdminCareerApplication = (applicationId, payload) =>
  request(`/admin/careers/applications/${applicationId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

export const getAdminCareerDocument = (applicationId, documentId) =>
  request(`/admin/careers/applications/${applicationId}/documents/${documentId}`);

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
