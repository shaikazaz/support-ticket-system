export function StatusBadge({ status }) {
  const labels = { open: 'Open', in_progress: 'In progress', resolved: 'Resolved', closed: 'Closed' };
  return <span className={`badge badge-status-${status}`}>{labels[status] || status}</span>;
}

export function PriorityBadge({ priority }) {
  const labels = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
  return <span className={`badge badge-priority-${priority}`}>{labels[priority] || priority}</span>;
}
