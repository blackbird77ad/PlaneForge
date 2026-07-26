import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout.jsx';
import { Home } from './pages/Home.jsx';
import { UnderDevelopment } from './pages/UnderDevelopment.jsx';

const App = () => (
  <Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/courses" element={<UnderDevelopment />} />
      <Route path="/courses/:slug" element={<UnderDevelopment />} />
      <Route path="/consultations" element={<UnderDevelopment />} />
      <Route path="/blog" element={<UnderDevelopment />} />
      <Route path="/about" element={<UnderDevelopment />} />
      <Route path="/contact" element={<UnderDevelopment />} />
      <Route path="/login" element={<UnderDevelopment />} />
      <Route path="/register" element={<UnderDevelopment />} />
      <Route path="/search" element={<UnderDevelopment />} />
      <Route path="/checkout/:slug" element={<UnderDevelopment />} />
      <Route path="/profile" element={<UnderDevelopment />} />
      <Route path="/dashboard" element={<UnderDevelopment />} />
      <Route path="/dashboard/*" element={<UnderDevelopment />} />
      <Route path="/faq" element={<UnderDevelopment />} />
      <Route path="/help" element={<UnderDevelopment />} />
      <Route path="/terms" element={<UnderDevelopment />} />
      <Route path="/privacy" element={<UnderDevelopment />} />
      <Route path="/refunds" element={<UnderDevelopment />} />
      <Route path="/testimonials" element={<UnderDevelopment />} />
      <Route path="*" element={<UnderDevelopment />} />
    </Route>
  </Routes>
);

export default App;
