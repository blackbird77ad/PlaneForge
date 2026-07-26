import { Mail, MapPin, Phone } from 'lucide-react';

export const Contact = () => (
  <main className="section page">
    <div className="page-heading">
      <p className="eyebrow">Contact</p>
      <h1>Talk with PlaneForge</h1>
      <p>Send PLC course, company project, research, partnership, and consulting questions to the operations team.</p>
    </div>
    <section className="contact-grid">
      <article>
        <Mail size={22} />
        <h2>Email</h2>
        <p>planeforge1@gmail.com</p>
      </article>
      <article>
        <Phone size={22} />
        <h2>Phone</h2>
        <p>+2015406176</p>
      </article>
      <article>
        <MapPin size={22} />
        <h2>Location</h2>
        <p>Online PLC education, consulting, product build, and automation support.</p>
      </article>
    </section>
    <form className="contact-form">
      <label>
        Name
        <input placeholder="Your name" />
      </label>
      <label>
        Email
        <input type="email" placeholder="you@example.com" />
      </label>
      <label>
        Message
        <textarea placeholder="How can PlaneForge help?" />
      </label>
      <button className="button primary" type="button">
        Send Message
      </button>
    </form>
  </main>
);
