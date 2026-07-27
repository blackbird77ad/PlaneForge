import { Linkedin, Mail, MapPin } from 'lucide-react';

const linkedInUrl = 'https://www.linkedin.com/company/planeforge?trk=blended-typeahead';

export const Contact = () => (
  <main className="section page">
    <div className="page-heading">
      <p className="eyebrow">Contact</p>
      <h1>Talk with PlaneForge</h1>
      <p>Send PCB course, hardware project, research, partnership, and consulting questions to the operations team.</p>
    </div>
    <section className="contact-grid">
      <article>
        <Mail size={22} />
        <h2>Email</h2>
        <p>planeforge1@gmail.com</p>
      </article>
      <article>
        <Linkedin size={22} />
        <h2>LinkedIn</h2>
        <p>
          <a href={linkedInUrl} target="_blank" rel="noreferrer">
            PlaneForge
          </a>
        </p>
      </article>
      <article>
        <MapPin size={22} />
        <h2>Location</h2>
        <p>Online PCB education, consulting, product build, and hardware support.</p>
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
