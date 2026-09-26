import { Link } from 'react-router-dom';

export const MetricCard = ({ label, value, detail, actionLabel, to }) => (
  <article className="metric-card">
    <span>{label}</span>
    <strong>{value}</strong>
    {detail && <small>{detail}</small>}
    {to && (
      <Link className="metric-card-link" to={to}>
        {actionLabel || 'View'}
      </Link>
    )}
  </article>
);
