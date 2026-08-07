import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AdminAccess } from './pages/AdminAccess.jsx';
import { AdminDashboard } from './pages/AdminDashboard.jsx';
import { About } from './pages/About.jsx';
import { Blog } from './pages/Blog.jsx';
import { Checkout } from './pages/Checkout.jsx';
import { CheckoutComplete } from './pages/CheckoutComplete.jsx';
import { Consultations } from './pages/Consultations.jsx';
import { Contact } from './pages/Contact.jsx';
import { CourseDetails } from './pages/CourseDetails.jsx';
import { Courses } from './pages/Courses.jsx';
import { Home } from './pages/Home.jsx';
import { LearningPlayer } from './pages/LearningPlayer.jsx';
import { Login } from './pages/Login.jsx';
import { NotFound } from './pages/NotFound.jsx';
import { PartnerDashboard } from './pages/PartnerDashboard.jsx';
import { Profile } from './pages/Profile.jsx';
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
  return <Navigate to={`/dashboard/${user?.role || 'student'}`} replace />;
};

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      window.setTimeout(() => {
        document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
      }, 0);
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

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
        <Route path="/consultations" element={<Consultations />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin" element={<AdminAccess />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ResetPassword />} />
        <Route path="/search" element={<Search />} />
        <Route path="/checkout/complete" element={<CheckoutComplete />} />
        <Route
          path="/checkout/:slug"
          element={
            <ProtectedRoute roles={['student', 'admin']}>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learn/:slug"
          element={
            <ProtectedRoute roles={['student', 'admin']}>
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
          path="/dashboard/student"
          element={
            <ProtectedRoute roles={['student', 'admin']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin"
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
