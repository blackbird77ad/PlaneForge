import { useEffect, useLayoutEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AdminAccess } from './pages/AdminAccess.jsx';
import { AdminDashboard } from './pages/AdminDashboard.jsx';
import { About } from './pages/About.jsx';
import { Blog } from './pages/Blog.jsx';
import { Checkout } from './pages/Checkout.jsx';
import { CheckoutComplete } from './pages/CheckoutComplete.jsx';
import { ConsultantAccess } from './pages/ConsultantAccess.jsx';
import { Consultations } from './pages/Consultations.jsx';
import { Contact } from './pages/Contact.jsx';
import { CourseDetails } from './pages/CourseDetails.jsx';
import { Courses } from './pages/Courses.jsx';
import { CareerDetails, Careers } from './pages/Careers.jsx';
import { Home } from './pages/Home.jsx';
import { LearningPlayer } from './pages/LearningPlayer.jsx';
import { Login } from './pages/Login.jsx';
import { NotFound } from './pages/NotFound.jsx';
import { PartnerDashboard } from './pages/PartnerDashboard.jsx';
import { PartnerAccess } from './pages/PartnerAccess.jsx';
import { Profile } from './pages/Profile.jsx';
import { ProductCheckout } from './pages/ProductCheckout.jsx';
import { ProductDetails } from './pages/ProductDetails.jsx';
import { Products } from './pages/Products.jsx';
import { Register } from './pages/Register.jsx';
import { ResetPassword } from './pages/ResetPassword.jsx';
import { Search } from './pages/Search.jsx';
import { StudentDashboard } from './pages/StudentDashboard.jsx';
import {
  Faq,
  Help,
  Privacy,
  Refunds,
  Terms,
  Testimonials
} from './pages/SupportPages.jsx';
import { ConsultantDashboard } from './pages/ConsultantDashboard.jsx';
import { useAuth } from './context/AuthContext.jsx';

const DashboardRedirect = () => {
  const { user } = useAuth();
  const role = ['student', 'learner', 'buyer'].includes(user?.role) ? 'user' : user?.role || 'user';
  return <Navigate to={`/dashboard/${role}`} replace />;
};

const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    if (hash) {
      window.setTimeout(() => {
        document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
      }, 0);
      return;
    }

    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
  }, [pathname, search, hash]);

  return null;
};

const App = () => (
  <>
    <ScrollToTop />
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:slug" element={<CourseDetails />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetails />} />
        <Route path="/consultations" element={<Consultations />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/careers/:slug" element={<CareerDetails />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin" element={<AdminAccess />} />
        <Route path="/consultant" element={<ConsultantAccess />} />
        <Route path="/partner" element={<PartnerAccess />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ResetPassword />} />
        <Route path="/search" element={<Search />} />
        <Route path="/checkout/complete" element={<CheckoutComplete />} />
        <Route
          path="/checkout/product/:slug"
          element={
            <ProtectedRoute roles={['user', 'admin']}>
              <ProductCheckout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout/:slug"
          element={
            <ProtectedRoute roles={['user', 'admin']}>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learn/:slug"
          element={
            <ProtectedRoute roles={['user', 'admin']}>
              <LearningPlayer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/user"
          element={
            <ProtectedRoute roles={['user', 'admin']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/dashboard/student" element={<Navigate to="/dashboard/user" replace />} />
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/:section"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/consultant"
          element={
            <ProtectedRoute roles={['consultant', 'admin']}>
              <ConsultantDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/partner"
          element={
            <ProtectedRoute roles={['partner', 'admin']}>
              <PartnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/faq" element={<Faq />} />
        <Route path="/help" element={<Help />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/refunds" element={<Refunds />} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/dashboard/*" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  </>
);

export default App;
