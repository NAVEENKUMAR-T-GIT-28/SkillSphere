# SkillSphere — Architecture Documentation

**Version:** 2.0
**Status:** Production-Grade System Design
**Last Updated:** June 2026

---

## 1. Overview

SkillSphere is a centralized student skill, certification, project, and placement intelligence platform built as a classic three-tier web application:

- **Frontend** — React 18 (Vite, JavaScript, Tailwind CSS, React Router 7)
- **API Layer** — Node.js + Express.js (REST, JSON)
- **Database** — MongoDB (via Mongoose ODM)

The system follows a stateless API design: the backend holds no session state, all authentication is via signed JWT tokens, and all persistent state lives in MongoDB.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)              │
│  Student Portal | Faculty Queue | HOD Dashboard | Admin     │
│  AuthContext (token + user in localStorage)                 │
└─────────────────────────┬───────────────────────────────────┘
                           │ HTTP/REST (Axios, Bearer JWT)
┌─────────────────────────▼───────────────────────────────────┐
│                    Express.js API Layer                     │
│  CORS → JSON body parser → Request logger (dev)             │
│  Routes: auth, students, skills, certifications, projects,  │
│  resumes, codingProfiles, verification, search, placement,  │
│  hod, notifications, myAccess, admin                        │
│  Middleware: authenticate → requireRole /                   │
│              requireOwnerOrRole / requireDynamicRole        │
│  404 handler → Global error handler                         │
└─────────────────────────┬───────────────────────────────────┘
                           │ Mongoose ODM
┌─────────────────────────▼───────────────────────────────────┐
│                     MongoDB                                 │
│  users, students, faculty, role_assignments, skills,        │
│  skill_taxonomy, certifications, projects, resumes,         │
│  coding_profiles, placement_drives, applications,           │
│  notifications, verification_logs, readiness_score_history  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Backend Architecture

### 3.1 Application Entry Point (`server.js`)

The server bootstrap performs, in order:

1. Loads environment variables via `dotenv`.
2. Configures CORS using an allow-list derived from `ALLOWED_ORIGINS` (comma-separated). Requests with no `Origin` header (e.g. server-to-server, curl) are allowed; unlisted origins are rejected with a CORS error.
3. Registers JSON and URL-encoded body parsers (10 MB limit).
4. In development, logs every incoming request (`timestamp | METHOD path`).
5. Exposes a public health check at `GET /api/health` returning status, uptime, timestamp, and environment.
6. Mounts all route modules under `/api/*` (see [API.md](./API.md) for the full route map).
7. Registers a catch-all 404 handler returning the standard error envelope.
8. Registers the global error handler (`middleware/errorHandler.js`) — must be last.
9. Connects to MongoDB via Mongoose (`MONGODB_URI`); on failure, the process exits (`process.exit(1)`).
10. Starts the HTTP server on `PORT` (default `5000`) only after a successful DB connection.

### 3.2 Middleware Stack

All protected routes compose middleware in this order:

```
authenticate → requireRole(...) and/or requireOwnerOrRole(...) and/or requireDynamicRole(...) → route handler
```

| Middleware | File | Responsibility |
|---|---|---|
| `authenticate` | `middleware/auth.js` | Verifies the `Authorization: Bearer <token>` JWT using RS256 + the configured public key. Attaches `{ userId, baseRole, iat, exp }` to `req.user`. Returns `401 NO_TOKEN`, `401 TOKEN_EXPIRED`, or `401 INVALID_TOKEN`. |
| `requireRole` | `middleware/roleGuard.js` | Restricts a route to one or more **base roles** (`student`, `faculty`, `hod`, `admin`) taken from the JWT payload. Returns `403 INSUFFICIENT_ROLE`. |
| `requireOwnerOrRole` | `middleware/ownerGuard.js` | Ensures a student can only operate on their own `Student` document (matched by `:studentId` route param vs. the caller's own profile). Roles passed as arguments (e.g. `'faculty', 'hod'`) bypass the ownership check entirely. Attaches the resolved `Student` document to `req.student`. |
| `requireDynamicRole` / `requireDynamicRoleWithScope` | `middleware/dynamicRoleGuard.js` | Checks the `role_assignments` collection for non-permanent roles (`mentor`, `cc`, `rep`) that are **not** encoded in the JWT and must be re-checked on every request. Attaches the matching assignment to `req.roleAssignment`. |
| `errorHandler` | `middleware/errorHandler.js` | Final catch-all. Normalizes Mongoose `ValidationError`, duplicate-key (`11000`), `CastError`, and JWT errors into the standard envelope; defaults to `500 SERVER_ERROR`. |

### 3.3 Authentication Design

- **Algorithm:** RS256 (asymmetric). The backend signs tokens with a private key and verifies with the corresponding public key.
- **Key management:** `utils/jwtKeys.js` reads `JWT_PRIVATE_KEY_B64` / `JWT_PUBLIC_KEY_B64` (base64-encoded PEM) from the environment.
  - In non-production environments, if these are unset, a fresh 2048-bit RSA key pair is generated **in memory at process start**. This means tokens issued before a restart become invalid after restart — acceptable for dev/test, **must** be set explicitly in production.
  - In production, missing keys cause a hard error at signing/verification time.
- **Token payload:** `{ userId, baseRole }`, expiry controlled by `JWT_EXPIRES_IN` (default `8h`).
- **Password storage:** bcrypt with 12 salt rounds (`User` model `pre('save')` hook). The `password` field has `select: false` and is stripped from `toJSON()` output.

### 3.4 Role Model

There are two categories of roles:

1. **Base roles** (`student`, `faculty`, `hod`, `admin`) — permanent, embedded directly in the JWT at login/registration. Checked via `requireRole`.
2. **Dynamic roles** (`mentor`, `cc`, `rep`) — assigned by an HOD after account creation, stored in the `role_assignments` collection, and **never** embedded in the JWT. They are re-evaluated on every request via `requireDynamicRole`, so revocation takes effect immediately without requiring the user to log in again.

See [Database.md](./Database.md) for the `RoleAssignment` schema and [API.md](./API.md) for the HOD role-assignment endpoints.

### 3.5 Services Layer

| Service | File | Purpose |
|---|---|---|
| Readiness Score Engine | `services/readinessScore.js` | Recomputes a student's 0–100 placement readiness score and tier whenever a verification event occurs. Writes the result back to `Student` and appends a snapshot to `ReadinessScoreHistory`. See [Database.md](./Database.md) §6 for the formula. |
| Notification Factory | `services/notification.js` | Centralizes creation of `Notification` documents for verification outcomes, score updates, new placement drives, and role assignments. |

### 3.6 Standard Response Envelope

Every API response (success or error) follows the same JSON shape (`utils/response.js`):

```json
// success
{ "success": true, "data": <payload>, "error": null, "meta": { ... } }

// error
{ "success": false, "data": null, "error": { "message": "...", "code": "..." } }
```

`meta` is commonly used for pagination (`total`, `page`, `limit`, `pages`) and counts (`total`, `unread`).

### 3.7 Validation & Sanitization

- **express-validator** is used declaratively on every mutating route (`body(...)` chains) for type/format/range checks. On failure, `400 VALIDATION_ERROR` is returned with all messages joined.
- **`utils/validators.js`** provides reusable chains:
  - `driveLink(field)` — requires an HTTPS URL under `drive.google.com` or `docs.google.com`.
  - `optionalDriveLink(field)` — same, but allows empty/null.
  - `httpsUrl(field, required)` — generic HTTPS URL validator (GitHub, portfolio, live demo links).
- **`utils/sanitize.js`** provides `sanitizeField`, which strips all HTML tags/attributes via `sanitize-html` to prevent XSS in free-text fields (career objective, feedback, rejection reasons, drive descriptions, etc.). Applied via `.customSanitizer(sanitizeField)`.

### 3.8 Rate Limiting

`express-rate-limit` is applied on the auth routes only (`routes/auth.js`):

| Endpoint | Limit | Window |
|---|---|---|
| `POST /api/auth/login` | 10 requests / IP (1000 in test) | 15 minutes |
| `POST /api/auth/register` | 5 requests / IP (1000 in test) | 1 hour |

---

## 4. Frontend Architecture

### 4.1 Stack

- **React 19** with **Vite 5** as the build tool/dev server.
- **React Router 7** for client-side routing.
- **Tailwind CSS 3** for styling.
- **Axios** for HTTP, **Recharts** for charts, **lucide-react** for icons.

### 4.2 Application Shell (`src/main.jsx`, `src/App.jsx`)

- `AuthProvider` (`src/contexts/AuthContext.jsx`) wraps the entire app, exposing `user`, `loading`, login/logout functions, and persisting `token`/`user` in `localStorage`.
- `App.jsx` defines all routes. A `HomeRedirect` component sends authenticated users to a role-appropriate landing page:
  - `hod` → `/hod/dashboard`
  - `faculty` → `/faculty/queue`
  - `admin` → `/admin/dashboard`
  - `student` (default) → `/dashboard`
- `ProtectedRoute` (`src/components/ProtectedRoute.jsx`) gates each route by `requiredRoles`, redirecting unauthenticated or unauthorized users.
- `Layout` (`src/components/Layout.jsx`) provides the shared navigation/shell for authenticated pages.

### 4.3 Page Map

| Area | Pages |
|---|---|
| Auth | `LoginPage` |
| Student | `Dashboard`, `Profile`, `Skills`, `Certifications`, `Projects`, `Resumes`, `Coding`, `Drives` |
| Faculty | `Queue` (verification queue), `Mentees` |
| HOD | `Dashboard`, `Search`, `Roles`, `Drives` |
| Admin | `Dashboard` |

### 4.4 Reusable Components

`Layout`, `Modal`, `Drawer`, `ConfirmModal`, `ProtectedRoute`, `ReadinessRing`, `ScoreBar`, `StatusBadge`, `TierBadge`, `EmptyState`, `AssignRoleModal`.

### 4.5 API Client (`src/services/api.js`)

A single Axios instance (`baseURL` from `VITE_API_URL`, default `http://localhost:5000/api`):

- **Request interceptor** — attaches `Authorization: Bearer <token>` from `localStorage`.
- **Response interceptor** —
  - Unwraps the backend's `{ success, data, meta }` envelope into `{ data, meta }` for successful responses.
  - On `401`, clears `token`/`user` from `localStorage` and redirects to `/login`.
  - Normalizes error responses into a single `Error` whose message is taken from `error.response.data.error.message` (or equivalent fallbacks).

---

## 5. Data Flow Example — Verification → Score Update

This is the core intelligence loop of the platform:

1. A student submits a skill, certification, or project (`POST /api/students/:id/skills|certifications|projects`), creating a record with `status: 'pending'` and a `VerificationLog` entry (`action: 'submitted'`).
2. The item appears in the faculty/HOD verification queue (`GET /api/verification/queue`).
3. Faculty or HOD approves or rejects the item (`POST /api/verification/:type/:itemId/approve|reject`):
   - The item's `status` is updated (`verified`/`reviewed` or `rejected`), with `verified_by`/`verified_at` (or `rejection_reason`) set.
   - A `VerificationLog` entry is appended (immutable, append-only collection).
   - `recalculateScore(studentId)` is invoked — see [Database.md](./Database.md) §6 for the formula. This updates `Student.readiness_score` / `readiness_tier` and appends a `ReadinessScoreHistory` snapshot.
   - Notifications are created for the student (`verification_approved`/`rejected`, `score_updated`). For team projects, all team members' scores are recalculated and they're each notified.

---

## 6. Cross-Cutting Concerns

- **CORS** is origin-allowlisted via `ALLOWED_ORIGINS`; credentials are enabled.
- **Error handling** is centralized — no route should leak raw Mongoose/Express errors to clients.
- **Auditability** — all verification decisions are recorded permanently in `verification_logs`, which the schema itself enforces as append-only (update/delete operations throw at the Mongoose layer).
- **Data privacy** — search results (`GET /api/search/students`) explicitly exclude the `links` field to avoid leaking personal social/coding profile URLs in bulk search.

For database schema details, see [Database.md](./Database.md). For the full endpoint reference, see [API.md](./API.md). For security posture, see [Security.md](./Security.md). For deployment, see [Deployment.md](./Deployment.md). For the test suite, see [Testing.md](./Testing.md).
