import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getTicket,
  updateTicket,
  deleteTicket,
  addComment,
  listAgents,
} from '../api/tickets';
import { StatusBadge, PriorityBadge } from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAgent = user?.role === 'agent';

  const [ticket, setTicket] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [agents, setAgents] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [savingField, setSavingField] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    getTicket(id)
      .then(setTicket)
      .catch((err) => {
        if (err.response?.status === 404) {
          setNotFound(true);
        }
      });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Load agents for agent users
  useEffect(() => {
    if (!isAgent) return;

    listAgents()
      .then((data) => {
        // DRF may return either:
        // 1. An array: [...]
        // 2. A paginated object: { count, next, previous, results: [...] }
        if (Array.isArray(data)) {
          setAgents(data);
        } else if (Array.isArray(data?.results)) {
          setAgents(data.results);
        } else {
          setAgents([]);
        }
      })
      .catch(() => {
        setAgents([]);
      });
  }, [isAgent]);

  const patchTicket = async (payload, fieldKey) => {
    setSavingField(fieldKey);
    setError('');

    try {
      const updated = await updateTicket(id, payload);
      setTicket(updated);
    } catch (err) {
      setError(
        err.response?.data?.detail?.non_field_errors?.[0] ||
          'Could not update the ticket.'
      );
    } finally {
      setSavingField('');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) return;

    setPosting(true);
    setError('');

    try {
      await addComment(id, commentText.trim());
      setCommentText('');
      load();
    } catch {
      setError('Could not post your comment.');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this ticket? This cannot be undone.')) {
      return;
    }

    try {
      await deleteTicket(id);
      navigate('/tickets');
    } catch {
      setError('Could not delete the ticket.');
    }
  };

  if (notFound) {
    return (
      <div className="empty-state">
        <h3>Ticket not found</h3>
        <p>
          It may have been deleted, or you may not have access to it.
        </p>

        <Link
          to="/tickets"
          className="btn btn-secondary"
          style={{ width: 'auto', marginTop: 12 }}
        >
          Back to tickets
        </Link>
      </div>
    );
  }

  if (!ticket) {
    return <LoadingSpinner />;
  }

  const canEditText = !isAgent && ticket.status === 'open';

  return (
    <>
      <div className="page-header">
        <div>
          <h1>
            #{ticket.id} — {ticket.subject}
          </h1>

          <p>
            Opened by{' '}
            {ticket.customer.first_name || ticket.customer.username} ·{' '}
            {new Date(ticket.created_at).toLocaleString()}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      {error && <div className="form-error-banner">{error}</div>}

      <div className="detail-grid">
        <div>
          <div className="panel">
            <h3>Description</h3>

            <p
              style={{
                whiteSpace: 'pre-wrap',
                color: 'var(--ink-soft)',
              }}
            >
              {ticket.description}
            </p>
          </div>

          <div className="panel">
            <h3>Comments ({ticket.comments.length})</h3>

            {ticket.comments.length === 0 && (
              <p style={{ color: 'var(--muted)' }}>
                No comments yet.
              </p>
            )}

            {ticket.comments.map((c) => (
              <div className="comment" key={c.id}>
                <div className="comment-head">
                  <span className="comment-author">
                    {c.user.first_name || c.user.username}{' '}
                    {c.user.role === 'agent' && '(agent)'}
                  </span>

                  <span>
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>

                <div>{c.comment}</div>
              </div>
            ))}

            <form
              className="comment-form"
              onSubmit={handleAddComment}
              style={{ marginTop: 14 }}
            >
              <textarea
                placeholder="Write a response…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />

              <button
                className="btn btn-primary"
                style={{ width: 'auto' }}
                disabled={posting}
              >
                {posting ? 'Posting…' : 'Add comment'}
              </button>
            </form>
          </div>
        </div>

        <div>
          <div className="panel">
            <h3>Details</h3>

            <div className="meta-list">
              <div className="meta-row">
                <span className="meta-row-label">Customer</span>
                <span>{ticket.customer.email}</span>
              </div>

              <div className="meta-row">
                <span className="meta-row-label">Assigned to</span>

                <span>
                  {ticket.assigned_to
                    ? ticket.assigned_to.first_name ||
                      ticket.assigned_to.username
                    : 'Unassigned'}
                </span>
              </div>

              <div className="meta-row">
                <span className="meta-row-label">Last updated</span>

                <span>
                  {new Date(ticket.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {isAgent && (
            <div className="panel">
              <h3>Manage ticket</h3>

              <div className="field">
                <label htmlFor="status">Status</label>

                <select
                  id="status"
                  value={ticket.status}
                  disabled={savingField === 'status'}
                  onChange={(e) =>
                    patchTicket(
                      { status: e.target.value },
                      'status'
                    )
                  }
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="priority">Priority</label>

                <select
                  id="priority"
                  value={ticket.priority}
                  disabled={savingField === 'priority'}
                  onChange={(e) =>
                    patchTicket(
                      { priority: e.target.value },
                      'priority'
                    )
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="assigned_to">Assign to</label>

                <select
                  id="assigned_to"
                  value={ticket.assigned_to?.id || ''}
                  disabled={savingField === 'assigned_to'}
                  onChange={(e) =>
                    patchTicket(
                      {
                        assigned_to: e.target.value || null,
                      },
                      'assigned_to'
                    )
                  }
                >
                  <option value="">Unassigned</option>

                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.first_name || a.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {canEditText && (
            <div className="panel">
              <h3>Edit ticket</h3>

              <p
                style={{
                  color: 'var(--muted)',
                  fontSize: '0.85rem',
                  marginBottom: 12,
                }}
              >
                You can edit the subject and description while the
                ticket is still open.
              </p>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const subject = window.prompt(
                    'Edit subject',
                    ticket.subject
                  );

                  if (subject) {
                    patchTicket({ subject }, 'subject');
                  }
                }}
              >
                Edit subject
              </button>
            </div>
          )}

          {(isAgent || ticket.customer.id === user.id) && (
            <div className="panel">
              <button
                className="btn btn-secondary btn-sm"
                style={{ color: 'var(--urgent)' }}
                onClick={handleDelete}
              >
                Delete ticket
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}