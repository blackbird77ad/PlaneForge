import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout.jsx';
import { Home } from './pages/Home.jsx';
import { Courses } from './pages/Courses.jsx';
import { CourseDetails } from './pages/CourseDetails.jsx';
import { Consultations } from './pages/Consultations.jsx';
import { NotFound } from './pages/NotFound.jsx';
import { UnderDevelopment } from './pages/UnderDevelopment.jsx';

const App = () => (
  <Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/courses/:slug" element={<CourseDetails />} />
      <Route path="/consultations" element={<Consultations />} />
      <Route path="/blog" element={<UnderDevelopment />} />
      <Route path="/about" element={<UnderDevelopment />} />
      <Route path="/contact" element={<UnderDevelopment />} />
      <Route path="/login" element={<UnderDevelopment />} />
      <Route path="/register" element={<UnderDevelopment />} />
      <Route path="/search" element={<UnderDevelopment />} />
      <Route path="/checkout/:slug" element={<UnderDevelopment />} />
      <Route path="/profile" element={<UnderDevelopment />} />
      <Route path="/dashboard" element={<Navigate to="/dashboard/student" replace />} />
      <Route path="/dashboard/*" element={<UnderDevelopment />} />
      <Route path="/faq" element={<UnderDevelopment />} />
      <Route path="/help" element={<UnderDevelopment />} />
      <Route path="/terms" element={<UnderDevelopment />} />
      <Route path="/privacy" element={<UnderDevelopment />} />
      <Route path="/refunds" element={<UnderDevelopment />} />
      <Route path="/testimonials" element={<UnderDevelopment />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
);

export default App;
