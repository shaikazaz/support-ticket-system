import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket } from '../api/tickets';

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ subject: '', description: '', priority: 'medium' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      const ticket = await createTicket(form);
      navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setErrors(typeof detail === 'object' ? detail : { non_field: 'Could not create the ticket.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>New ticket</h1>
          <p>Tell us what's going on and we'll get an agent on it.</p>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: 560 }}>
        {errors.non_field && <div className="form-error-banner">{errors.non_field}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="subject">Subject</label>
            <input
              id="subject" required maxLength={200}
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="A short summary of the issue"
            />
            {errors.subject && <div className="field-error">{errors.subject[0]}</div>}
          </div>

          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description" required rows={6}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Steps to reproduce, error messages, what you expected to happen…"
            />
            {errors.description && <div className="field-error">{errors.description[0]}</div>}
          </div>

          <div className="field">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: 'auto' }}>
            {submitting ? 'Submitting…' : 'Submit ticket'}
          </button>
        </form>
      </div>
    </>
  );
}
