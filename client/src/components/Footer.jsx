import { Link } from 'react-router-dom';
import { Award, BookOpen, Clock, Mail, ShieldCheck } from 'lucide-react';
import { NewsletterForm } from './NewsletterForm.jsx';
import logo from '../assets/planeforge-logo-site.png';

const email = 'planeforge1@gmail.com';

export const Footer = () => (
  <footer className="site-footer">
    <div className="footer-trust">
      <article>
        <BookOpen size={38} />
        <strong>Project-Based Training</strong>
        <span>Hands-on PCB courses built around real board projects.</span>
      </article>
      <article>
        <ShieldCheck size={38} />
        <strong>Real Board Practice</strong>
        <span>Practice schematics, layouts, Gerbers, DFM checks, and bring-up.</span>
      </article>
      <article>
        <Clock size={38} />
        <strong>Learn Your Way</strong>
        <span>Flexible and self-paced learning that fits your schedule.</span>
      </article>
      <article>
        <Award size={38} />
        <strong>Practical Certificates</strong>
        <span>Earn certificates tied to completed PCB builds.</span>
      </article>
    </div>

    <div className="footer-grid section-inner">
      <section>
        <img className="footer-logo" src={logo} alt="PlaneForge Academy" loading="lazy" decoding="async" />
        <p>
          Teaching PCB design through hands-on, project-based courses from first breadboard
          builds to flight controllers and FPGA boards.
        </p>
        <div className="footer-contact">
          <a href={`mailto:${email}`}>
            <Mail size={18} /> {email}
          </a>
        </div>
      </section>

      <section>
        <h3>Products</h3>
        <Link to="/courses">PCB Courses</Link>
        <Link to="/consultations">Consulting</Link>
        <Link to="/search">Search</Link>
        <Link to="/signup">Learner Account</Link>
      </section>

      <section>
        <h3>Resources</h3>
        <Link to="/blog">Blog</Link>
        <Link to="/faq">FAQ</Link>
        <Link to="/help">Help Center</Link>
        <Link to="/testimonials">Testimonials</Link>
        <Link to="/courses?category=Capstone%20and%20Professional%20Practice">Capstone Projects</Link>
      </section>

      <section>
        <h3>Legal</h3>
        <Link to="/terms">Terms & Conditions</Link>
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/refunds">Refund Policy</Link>
      </section>

      <section>
        <h3>Contact</h3>
        <a href={`mailto:${email}`}>
          <Mail size={18} /> Email
        </a>
      </section>

      <section>
        <h3>Stay Updated</h3>
        <p>Subscribe to get PCB course updates and design insights.</p>
        <NewsletterForm compact />
      </section>
    </div>

    <div className="footer-bottom section-inner">
      <span>&copy; 2026 PlaneForge Academy. All rights reserved.</span>
    </div>
  </footer>
);
