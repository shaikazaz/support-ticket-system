import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listTickets } from '../api/tickets';
import TicketRow from '../components/TicketRow';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState(null);

  useEffect(() => {
    listTickets({ ordering: '-created_at', page_size: 5 })
      .then((data) => setTickets(data.results ?? data))
      .catch(() => setTickets([]));
  }, []);

  const openCount = tickets?.filter((t) => t.status === 'open').length ?? 0;
  const inProgressCount = tickets?.filter((t) => t.status === 'in_progress').length ?? 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Hi {user?.first_name || user?.username}</h1>
          <p>Here's a quick look at your support tickets.</p>
        </div>
        <Link to="/tickets/new" className="btn btn-primary" style={{ width: 'auto' }}>
          New ticket
        </Link>
      </div>

      <div className="stat-grid">
        <div className="stat-tile">
          <div className="stat-number">{tickets?.length ?? '—'}</div>
          <div className="stat-label">Recent tickets</div>
        </div>
        <div className="stat-tile accent">
          <div className="stat-number">{openCount}</div>
          <div className="stat-label">Open</div>
        </div>
        <div className="stat-tile warn">
          <div className="stat-number">{inProgressCount}</div>
          <div className="stat-label">In progress</div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.05rem', marginBottom: 12 }}>Recent activity</h2>
      {tickets === null ? (
        <LoadingSpinner />
      ) : tickets.length === 0 ? (
        <EmptyState
          title="No tickets yet"
          description="Raise a ticket and our support team will get back to you shortly."
          action={<Link to="/tickets/new" className="btn btn-primary" style={{ width: 'auto' }}>Create your first ticket</Link>}
        />
      ) : (
        <div className="ticket-list">
          {tickets.map((t) => <TicketRow key={t.id} ticket={t} />)}
        </div>
      )}
    </>
  );
}
