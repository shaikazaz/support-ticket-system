import { Link } from 'react-router-dom';
import { StatusBadge, PriorityBadge } from './Badge';

export default function TicketRow({ ticket }) {
  const created = new Date(ticket.created_at).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <Link to={`/tickets/${ticket.id}`} className={`ticket-row priority-${ticket.priority}`}>
      <div className="ticket-row-main">
        <div className="ticket-subject">#{ticket.id} — {ticket.subject}</div>
        <div className="ticket-meta">
          <span>{ticket.customer?.first_name || ticket.customer?.username}</span>
          <span>{created}</span>
          <span>{ticket.comment_count ?? 0} comment{(ticket.comment_count ?? 0) === 1 ? '' : 's'}</span>
          {ticket.assigned_to && <span>Assigned to {ticket.assigned_to.first_name || ticket.assigned_to.username}</span>}
        </div>
      </div>
      <div className="ticket-row-badges">
        <PriorityBadge priority={ticket.priority} />
        <StatusBadge status={ticket.status} />
      </div>
    </Link>
  );
}
