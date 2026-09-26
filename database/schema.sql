-- Support Ticket Management System — MySQL Schema
-- Reference schema matching the assessment spec (section 7).
-- NOTE: the running Django application manages its own equivalent tables
-- (accounts_user, tickets_ticket, tickets_ticketcomment) via migrations
-- (see backend/accounts/migrations and backend/tickets/migrations).
-- This file is provided as the required standalone schema.sql deliverable
-- and documents the same structure in plain SQL.

CREATE DATABASE IF NOT EXISTS support_ticket_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE support_ticket_db;

-- ---------------------------------------------------------------
-- users
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(150) NOT NULL,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    role           ENUM('customer', 'agent') NOT NULL DEFAULT 'customer',
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- tickets
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tickets (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT UNSIGNED NOT NULL,
    subject       VARCHAR(200) NOT NULL,
    description   TEXT NOT NULL,
    priority      ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
    status        ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    assigned_to   BIGINT UNSIGNED NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tickets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_tickets_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_tickets_subject (subject),
    INDEX idx_tickets_status (status),
    INDEX idx_tickets_priority (priority),
    INDEX idx_tickets_status_priority (status, priority),
    INDEX idx_tickets_created_at (created_at)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- ticket_comments
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_comments (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ticket_id   BIGINT UNSIGNED NOT NULL,
    user_id     BIGINT UNSIGNED NOT NULL,
    comment     TEXT NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comments_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_comments_ticket (ticket_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Example query required by section 8:
-- All open tickets with the customer's name and email, using a JOIN + filter.
-- ---------------------------------------------------------------
-- SELECT
--     t.id, t.subject, t.priority, t.status, t.created_at,
--     u.name  AS customer_name,
--     u.email AS customer_email
-- FROM tickets t
-- JOIN users u ON u.id = t.user_id
-- WHERE t.status = 'open'
-- ORDER BY t.created_at DESC;
