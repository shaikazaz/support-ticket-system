import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="empty-state">
      <h3>Page not found</h3>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-secondary" style={{ width: 'auto', marginTop: 12 }}>Back to dashboard</Link>
    </div>
  );
}
