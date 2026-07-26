export const MetricCard = ({ label, value, detail }) => (
  <article className="metric-card">
    <span>{label}</span>
    <strong>{value}</strong>
    {detail && <small>{detail}</small>}
  </article>
);
