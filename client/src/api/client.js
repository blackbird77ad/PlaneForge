import { articles, consultants, courses } from '../data/catalog.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('planeforge_token');

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...options.headers
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

const sortCourses = (items, sort) => {
  const list = [...items];
  if (sort === 'rating') return list.sort((a, b) => b.rating - a.rating);
  if (sort === 'newest') return list.reverse();
  if (sort === 'priceAsc') return list.sort((a, b) => a.price - b.price);
  if (sort === 'priceDesc') return list.sort((a, b) => b.price - a.price);
  if (sort === 'alphabetical') return list.sort((a, b) => a.title.localeCompare(b.title));
  return list.sort((a, b) => b.studentsEnrolled - a.studentsEnrolled);
};

export const getCourses = async (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  ).toString();

  try {
    return await request(`/courses${query ? `?${query}` : ''}`);
  } catch {
    const page = Number(params.page || 1);
    const limit = Number(params.limit || 12);
    const search = params.search?.toLowerCase();
    let filtered = [...courses];

    if (search) {
      filtered = filtered.filter((course) =>
        [course.title, course.description, course.category, course.discipline, course.instructorName]
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
  }
};

export const getCourse = async (slug) => {
  try {
    return await request(`/courses/${slug}`);
  } catch {
    return { course: courses.find((course) => course.slug === slug) };
  }
};

export const getHomepage = async () => {
  try {
    return await request('/content/homepage');
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
    return await request('/consultations/consultants');
  } catch {
    return { consultants };
  }
};

export const getArticles = async () => {
  try {
    return await request('/content/articles');
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

export const checkoutCourse = async ({ courseId, provider, couponCode, termsAccepted }) =>
  request('/payments/checkout', {
    method: 'POST',
    body: JSON.stringify({ courseId, provider, couponCode, termsAccepted })
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
