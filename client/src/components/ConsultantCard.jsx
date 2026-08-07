import { Award, CalendarDays } from 'lucide-react';

export const ConsultantCard = ({ consultant, onSelect }) => (
  <article className="consultant-card">
    <img src={consultant.avatar} alt="" loading="lazy" decoding="async" />
    <div>
      <p className="eyebrow">{consultant.specialty}</p>
      <h3>{consultant.name}</h3>
      <p>{consultant.title}</p>
      <div className="course-facts">
        <span>
          <Award size={16} /> {consultant.experienceYears} years
        </span>
        <span>${consultant.consultationFee}/consultation</span>
      </div>
      <button className="button primary small" type="button" onClick={() => onSelect?.(consultant)}>
        <CalendarDays size={16} />
        View Advisor
      </button>
    </div>
  </article>
);
