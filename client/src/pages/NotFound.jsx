import { Link } from 'react-router-dom';

export const NotFound = () => (
  <main className="section page">
    <div className="page-heading">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p>The PlaneForge page you requested is not available.</p>
      <Link className="button primary" to="/">
        Go Home
      </Link>
    </div>
  </main>
);
