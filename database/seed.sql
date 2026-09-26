-- Sample seed data for the Support Ticket Management System.
-- Passwords below are illustrative placeholders only (this file mirrors the
-- plain-SQL schema in schema.sql). The Django app's real seed data — with
-- properly bcrypt/PBKDF2-hashed passwords — is created via:
--   python manage.py seed_data
-- (see backend/tickets/management/commands/seed_data.py)

USE support_ticket_db;

INSERT INTO users (name, email, password_hash, role) VALUES
('Alice Johnson', 'alice@example.com', '$2b$12$placeholderHashAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'customer'),
('Bob Martinez',  'bob@example.com',   '$2b$12$placeholderHashBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', 'customer'),
('Priya Nair',    'priya.agent@example.com', '$2b$12$placeholderHashCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', 'agent'),
('Daniel Kim',    'daniel.agent@example.com', '$2b$12$placeholderHashDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', 'agent');

INSERT INTO tickets (user_id, subject, description, priority, status, assigned_to) VALUES
(1, 'Cannot reset my password', 'The reset link in the email leads to a 404 page.', 'high', 'open', NULL),
(1, 'Invoice amount looks wrong', 'My March invoice charged me twice for the same plan.', 'medium', 'in_progress', 3),
(2, 'Feature request: dark mode', 'Would love a dark theme for the dashboard.', 'low', 'open', NULL),
(2, 'App crashes on file upload', 'Uploading a PDF over 5MB crashes the browser tab.', 'urgent', 'in_progress', 4);

INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES
(1, 1, 'Tried again on Chrome and Safari, same result.'),
(2, 3, 'Looking into the billing system now, will update shortly.'),
(2, 1, 'Thank you, appreciate the quick response.'),
(4, 4, 'Confirmed the crash. Escalating to engineering.');
