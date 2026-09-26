import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listTickets, getTicketStats } from '../api/tickets';
import TicketRow from '../components/TicketRow';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function AgentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [urgentTickets, setUrgentTickets] = useState(null);

  useEffect(() => {
    getTicketStats().then(setStats).catch(() => setStats({}));
    listTickets({ status: 'open', ordering: '-created_at', page_size: 6 })
      .then((data) => setUrgentTickets(data.results ?? data))
      .catch(() => setUrgentTickets([]));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.first_name || user?.username}</h1>
          <p>Overview of everything happening across the helpdesk right now.</p>
        </div>
        <Link to="/tickets" className="btn btn-secondary" style={{ width: 'auto' }}>
          View all tickets
        </Link>
      </div>

      {stats === null ? (
        <LoadingSpinner label="Loading stats…" />
      ) : (
        <div className="stat-grid">
          <div className="stat-tile"><div className="stat-number">{stats.total}</div><div className="stat-label">Total tickets</div></div>
          <div className="stat-tile accent"><div className="stat-number">{stats.open}</div><div className="stat-label">Open</div></div>
          <div className="stat-tile warn"><div className="stat-number">{stats.in_progress}</div><div className="stat-label">In progress</div></div>
          <div className="stat-tile"><div className="stat-number">{stats.resolved}</div><div className="stat-label">Resolved</div></div>
          <div className="stat-tile urgent"><div className="stat-number">{stats.urgent_open}</div><div className="stat-label">Urgent &amp; open</div></div>
          <div className="stat-tile"><div className="stat-number">{stats.unassigned}</div><div className="stat-label">Unassigned</div></div>
        </div>
      )}

      <h2 style={{ fontSize: '1.05rem', marginBottom: 12 }}>Open tickets needing attention</h2>
      {urgentTickets === null ? (
        <LoadingSpinner />
      ) : urgentTickets.length === 0 ? (
        <EmptyState title="All caught up" description="There are no open tickets right now." />
      ) : (
        <div className="ticket-list">
          {urgentTickets.map((t) => <TicketRow key={t.id} ticket={t} />)}
        </div>
      )}
    </>
  );
}
