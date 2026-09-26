# Support Ticket Management System

A full-stack support ticket portal where customers raise tickets and support agents triage, assign and resolve them.

**Stack**
- Frontend: React 18 (Vite, React Router) — no UI framework, hand-built design system
- Backend: Django 5 + Django REST Framework
- Auth: JWT (djangorestframework-simplejwt), role-based authorization
- Database: MySQL 8
- Testing: DRF `APITestCase` (backend), Vitest + Testing Library (frontend)
- API testing: Postman collection

## 1. Project structure

```
support-ticket-system/
├── backend/                  Django + DRF API
│   ├── config/                settings, urls, wsgi/asgi
│   ├── accounts/               custom User model, auth endpoints, tests
│   ├── tickets/                tickets, comments, permissions, filters, tests
│   ├── requirements.txt
│   ├── .env.example
│   ├── Dockerfile / Procfile
├── frontend/                  React (Vite) SPA
│   ├── src/
│   │   ├── api/                axios client + endpoint wrappers
│   │   ├── context/             AuthContext (JWT session state)
│   │   ├── components/          Sidebar, TicketRow, Badge, etc.
│   │   ├── pages/                Login, Register, Dashboards, Ticket list/detail/create
│   ├── .env.example
├── database/
│   ├── schema.sql              plain-SQL reference schema (matches spec section 7)
│   └── seed.sql                sample data for schema.sql
├── postman/
│   └── Support_Ticket_System.postman_collection.json
├── docker-compose.yml          optional local one-command setup
└── README.md
```

## 2. Features implemented

**Auth & security**
- Customer self-registration; agents are provisioned via Django admin/seed data
- JWT login (access + refresh tokens), refresh endpoint, blacklist-on-logout
- Passwords hashed with Django's PBKDF2 hasher (never stored in plain text)
- Role-based authorization enforced at the view layer (`IsAgent`, `IsOwnerOrAgent`)
- Customers cannot view, edit or comment on another customer's tickets (403)
- Agent-only endpoints (`/api/users`, `/api/tickets/stats/`) reject customers with 403
- CORS restricted to the configured frontend origin(s)
- All queries go through the Django ORM (parameterized — no raw SQL injection risk)
- Secrets/config via environment variables, never committed (`.env` is git-ignored)

**Customer**
- Dashboard with a snapshot of recent tickets and counts
- Create ticket (subject, description, priority) with client + server-side validation
- View own tickets, ticket detail, and comment thread
- Add comments to their own tickets
- Search / filter / sort their tickets
- Edit subject/description while a ticket is still `open`

**Support agent**
- Dashboard with aggregate stats (total / open / in progress / resolved / unassigned / urgent-open)
- View, search, filter and sort **all** tickets
- Update status, priority, and assign a ticket to an agent
- Respond via comments
- Cannot create tickets on a customer's behalf (kept intentionally out of scope, per the brief's role table)

**Small extras added for polish**
- `/api/tickets/stats/` aggregate endpoint powering the agent dashboard tiles
- Priority is shown as a colored left-border accent on each ticket row (quick visual triage) as well as a badge
- Debounced live search-as-you-type on the ticket list
- Consistent JSON error shape via a custom DRF exception handler
- `python manage.py seed_data` — one command to populate demo customers, agents, tickets and comments with real hashed passwords
- Optional `docker-compose.yml` + Dockerfiles for a one-command local environment

## 3. Backend setup (Django + DRF + MySQL)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env with your MySQL credentials

# create the database (or let schema.sql do it — see database/schema.sql)
mysql -u root -p -e "CREATE DATABASE support_ticket_db CHARACTER SET utf8mb4;"

python manage.py migrate
python manage.py createsuperuser     # optional, for /admin/
python manage.py seed_data           # optional demo data (see credentials below)
python manage.py runserver
```

API is now at `http://localhost:8000/api/`. Django admin at `http://localhost:8000/admin/`.

**Run backend tests**
```bash
python manage.py test
```
Covers: valid/invalid login, registration validation, ticket creation, unauthorized access, cross-customer access denial, agent status/assignment updates, invalid ticket ID, comment permissions, and the stats endpoint (15 tests total).

**Demo accounts** (created by `seed_data`)
| Role | Email | Password |
|---|---|---|
| Customer | alice@example.com | Customer123 |
| Customer | bob@example.com | Customer123 |
| Agent | priya.agent@example.com | Agent123 |
| Agent | daniel.agent@example.com | Agent123 |

## 4. Frontend setup (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env
# set VITE_API_BASE_URL to your backend URL

npm run dev
```

App runs at `http://localhost:5173`.

**Run frontend tests**
```bash
npm run test
```

**Build for production**
```bash
npm run build     # outputs to frontend/dist
```

## 5. One-command local setup (optional, Docker)

```bash
docker compose up --build
```
This starts MySQL, runs migrations + seed data, and starts both the backend (`:8000`) and frontend (`:5173`).

## 6. REST API reference

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | `/api/auth/register` | Register a customer | Public |
| POST | `/api/auth/login` | Login, returns JWT pair | Public |
| POST | `/api/auth/login/refresh` | Refresh access token | Public (valid refresh token) |
| POST | `/api/auth/logout` | Blacklist refresh token | Authenticated |
| GET | `/api/auth/me` | Current user profile | Authenticated |
| GET | `/api/tickets/` | List tickets (own, or all for agents); supports `?search=`, `?status=`, `?priority=`, `?ordering=`, `?page=` | Authenticated |
| POST | `/api/tickets/` | Create a ticket | Customer |
| GET | `/api/tickets/{id}/` | Ticket detail + comments | Owner or agent |
| PATCH/PUT | `/api/tickets/{id}/` | Update ticket (agents: status/priority/assignment; customers: subject/description while open) | Owner or agent |
| DELETE | `/api/tickets/{id}/` | Delete ticket | Owner or agent |
| GET | `/api/tickets/stats/` | Aggregate counts for dashboard | Agent |
| GET | `/api/tickets/{id}/comments` | List comments on a ticket | Owner or agent |
| POST | `/api/tickets/{id}/comments` | Add a comment | Owner or agent |
| GET | `/api/users` | List support agents (for assignment) | Agent |

All endpoints return JSON, validate input, and use standard HTTP status codes (200/201/400/401/403/404). Errors are returned as `{"error": true, "status_code": ..., "detail": ...}`.

### Example JOIN query (assessment section 8)

```sql
SELECT t.id, t.subject, t.priority, t.status, t.created_at,
       u.name AS customer_name, u.email AS customer_email
FROM tickets t
JOIN users u ON u.id = t.user_id
WHERE t.status = 'open'
ORDER BY t.created_at DESC;
```
See `database/schema.sql` for the full reference schema and `database/seed.sql` for sample data in that shape. The running Django app manages the equivalent tables (`accounts_user`, `tickets_ticket`, `tickets_ticketcomment`) via its own migrations.

## 7. API testing with Postman

Import `postman/Support_Ticket_System.postman_collection.json`. It covers:
successful registration & login, invalid login, ticket creation (success + invalid input), get tickets, get ticket by ID (success + 404), update ticket (success + 403 for wrong role), unauthorized request (401, no token), forbidden request (403, wrong role), comments (list + create), agent stats, and agent-only user listing.

Run `python manage.py seed_data` first so the collection's demo credentials work, then run the **Auth** folder before the **Tickets** folder (it stores the access/refresh tokens as collection variables).

## 8. Deployment

The app is designed to deploy as two independent services plus a managed MySQL instance:

1. **Database** — any managed MySQL (PlanetScale, AWS RDS, Railway MySQL, etc.). Run `database/schema.sql` or `python manage.py migrate` against it.
2. **Backend** — any platform that runs a WSGI app (Render, Railway, Fly.io, AWS Elastic Beanstalk, PythonAnywhere). Set `DEBUG=False`, `ALLOWED_HOSTS`, the `DB_*` variables, and `CORS_ALLOWED_ORIGINS` to your frontend's URL. `Procfile` and `runtime.txt` are provided for Heroku-style platforms; `Dockerfile` is provided for container platforms. Start command: `gunicorn config.wsgi:application`.
3. **Frontend** — any static host (Vercel, Netlify, Render static site). Set `VITE_API_BASE_URL` to the deployed backend's `/api` URL at build time, then `npm run build` and deploy the `dist/` folder.

After deploying, update the README (or a `DEPLOYMENT.md`) with:
- Live frontend URL
- Live backend/API URL
- Confirmation the database is cloud-hosted and reachable

## 9. Git workflow note

This deliverable was generated as a complete snapshot. When you push it to your own GitHub repository, commit it incrementally (e.g. "Project setup", "Auth API", "Ticket API + MySQL", "Frontend dashboards", "Tests", "Deployment config") rather than as a single commit, per the assessment's requirement for meaningful commit history.
