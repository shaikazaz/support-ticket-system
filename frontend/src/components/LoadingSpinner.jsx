export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="loading-wrap">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
