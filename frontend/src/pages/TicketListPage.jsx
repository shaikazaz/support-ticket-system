import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listTickets } from '../api/tickets';
import TicketRow from '../components/TicketRow';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function TicketListPage() {
  const { user } = useAuth();
  const isAgent = user?.role === 'agent';

  const [tickets, setTickets] = useState(null);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [ordering, setOrdering] = useState('-created_at');

  useEffect(() => {
    setTickets(null);
    const params = { page, ordering };
    if (search) params.search = search;
    if (status) params.status = status;
    if (priority) params.priority = priority;

    const timeout = setTimeout(() => {
      listTickets(params)
        .then((data) => {
          setTickets(data.results ?? data);
          setCount(data.count ?? (data.results ?? data).length);
        })
        .catch(() => setTickets([]));
    }, 300);

    return () => clearTimeout(timeout);
  }, [page, search, status, priority, ordering]);

  const totalPages = Math.max(1, Math.ceil(count / 10));

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{isAgent ? 'All tickets' : 'My tickets'}</h1>
          <p>{count} ticket{count === 1 ? '' : 's'} found</p>
        </div>
      </div>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search subject, description…"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
        />
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={priority} onChange={(e) => { setPage(1); setPriority(e.target.value); }}>
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select value={ordering} onChange={(e) => setOrdering(e.target.value)}>
          <option value="-created_at">Newest first</option>
          <option value="created_at">Oldest first</option>
          <option value="priority">Priority</option>
          <option value="status">Status</option>
        </select>
      </div>

      {tickets === null ? (
        <LoadingSpinner />
      ) : tickets.length === 0 ? (
        <EmptyState title="No tickets match your filters" description="Try adjusting the search or filters above." />
      ) : (
        <>
          <div className="ticket-list">
            {tickets.map((t) => <TicketRow key={t.id} ticket={t} />)}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span style={{ alignSelf: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                Page {page} of {totalPages}
              </span>
              <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
