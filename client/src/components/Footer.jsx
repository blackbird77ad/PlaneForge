import { Link } from 'react-router-dom';
import { Award, BookOpen, Clock, Linkedin, Mail, Phone, ShieldCheck } from 'lucide-react';
import { NewsletterForm } from './NewsletterForm.jsx';
import logo from '../assets/planeforge-logo.png';

const linkedInUrl = 'https://www.linkedin.com/company/planeforge?trk=blended-typeahead';
const phone = '+2015406176';
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
        <img className="footer-logo" src={logo} alt="PlaneForge Academy" />
        <p>
          Teaching PCB design through hands-on, project-based courses from first breadboard
          builds to flight controllers and FPGA boards.
        </p>
        <div className="footer-contact">
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
        <Link to="/courses">PCB Courses</Link>
        <Link to="/about">About</Link>
        <Link to="/blog">Blog</Link>
        <Link to="/contact">Contact Us</Link>
      </section>

      <section>
        <h3>Course Categories</h3>
        <Link to="/courses">All PCB Courses</Link>
        <Link to="/courses">Beginner Builds</Link>
        <Link to="/courses">Dev Boards & Programmers</Link>
        <Link to="/courses">Sensor Breakout Boards</Link>
        <Link to="/courses">High-Speed & Mixed-Signal</Link>
        <Link to="/courses">FPGA Design</Link>
        <Link to="/courses">Drone & Flight Controller</Link>
        <Link to="/courses">Capstone Projects</Link>
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
        <p>Subscribe to get PCB course updates and design insights.</p>
        <NewsletterForm compact />
      </section>
    </div>

    <div className="footer-bottom section-inner">
      <span>&copy; 2026 PlaneForge Academy. All rights reserved.</span>
    </div>
  </footer>
);
