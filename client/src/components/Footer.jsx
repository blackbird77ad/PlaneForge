import { Link } from 'react-router-dom';
import { Award, BookOpen, Clock, Linkedin, Mail, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { NewsletterForm } from './NewsletterForm.jsx';
import logo from '../assets/planeforge-logo.png';

const linkedInUrl = 'https://www.linkedin.com/company/planeforge?trk=blended-typeahead';
const brandHelperUrl = 'https://thebrandhelper.com';
const phone = '+2015406178';
const email = 'planeforge1@gmail.com';

export const Footer = () => (
  <footer className="site-footer">
    <div className="footer-trust">
      <article>
        <BookOpen size={38} />
        <strong>PLC-Focused</strong>
        <span>Programmable Logic Controller training for practical automation work.</span>
      </article>
      <article>
        <ShieldCheck size={38} />
        <strong>CEO Advisory</strong>
        <span>Companies can reach the CEO for project, research, and PLC consulting.</span>
      </article>
      <article>
        <Clock size={38} />
        <strong>Learn Your Way</strong>
        <span>Flexible and self-paced learning that fits your schedule.</span>
      </article>
      <article>
        <Award size={38} />
        <strong>Practical Certificates</strong>
        <span>Earn certificates tied to PLC skills and controls project outcomes.</span>
      </article>
    </div>

    <div className="footer-grid section-inner">
      <section>
        <img className="footer-logo" src={logo} alt="PlaneForge Academy" />
        <p>
          Helping learners build PLC skills and helping companies reach the PlaneForge CEO for
          automation projects, research, feasibility, and technical consulting.
        </p>
        <div className="footer-contact">
          <a href={`https://wa.me/${phone.replace('+', '')}`}>
            <MessageCircle size={18} /> {phone}
          </a>
          <a href={`tel:${phone}`}>
            <Phone size={18} /> {phone}
          </a>
          <a href={`mailto:${email}`}>
            <Mail size={18} /> {email}
          </a>
          <a href={linkedInUrl} target="_blank" rel="noreferrer">
            <Linkedin size={18} /> LinkedIn
          </a>
        </div>
      </section>

      <section>
        <h3>Quick links</h3>
        <Link to="/">Home</Link>
        <Link to="/courses">PLC Courses</Link>
        <Link to="/consultations">CEO Consulting</Link>
        <Link to="/about">About</Link>
        <Link to="/blog">Blog</Link>
        <Link to="/contact">Contact Us</Link>
      </section>

      <section>
        <h3>PLC Courses</h3>
        <Link to="/courses">All PLC Courses</Link>
        <Link to="/courses">PLC Fundamentals</Link>
        <Link to="/courses">Ladder Logic</Link>
        <Link to="/courses">Troubleshooting</Link>
        <Link to="/courses">HMI & SCADA</Link>
        <Link to="/courses">Control Panel QA</Link>
      </section>

      <section>
        <h3>Support</h3>
        <Link to="/faq">FAQ</Link>
        <Link to="/help">Help Center</Link>
        <Link to="/terms">Terms & Conditions</Link>
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/refunds">Refund Policy</Link>
        <Link to="/contact">Contact Support</Link>
      </section>

      <section>
        <h3>Stay Updated</h3>
        <p>Subscribe to get PLC course updates, automation insights, and consulting notes.</p>
        <NewsletterForm compact />
      </section>
    </div>

    <div className="footer-bottom section-inner">
      <span>&copy; 2026 PlaneForge Academy. All rights reserved.</span>
      <a className="footer-credit" href={brandHelperUrl} target="_blank" rel="noreferrer">
        Built by The BrandHelper
      </a>
    </div>
  </footer>
);
