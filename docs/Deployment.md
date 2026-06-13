# SkillSphere — Deployment & Setup Documentation

## 1. Prerequisites

- Node.js v18+ (CI uses Node 20)
- MongoDB (Atlas cluster or local instance)
- Git

---

## 2. Local Development Setup

### 2.1 Backend

```bash
cd backend
npm install
```

Create `backend/.env` (no `.env.example` is currently checked into the repo — create this file manually using the table in §4):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/skillsphere
JWT_PRIVATE_KEY_B64=<base64-encoded PEM RSA private key>
JWT_PUBLIC_KEY_B64=<base64-encoded PEM RSA public key>
JWT_EXPIRES_IN=8h
ALLOWED_ORIGINS=http://localhost:5173
```

> If `JWT_PRIVATE_KEY_B64`/`JWT_PUBLIC_KEY_B64` are omitted in development, the server will auto-generate an ephemeral RSA key pair at startup (with a console warning). This is convenient for local development but means **all issued tokens are invalidated on every restart**. See [Security.md](./Security.md) §1.

Generate a key pair if you want persistent tokens locally:

```bash
node -e "
const crypto = require('crypto');
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});
console.log('JWT_PRIVATE_KEY_B64=' + Buffer.from(privateKey).toString('base64'));
console.log('JWT_PUBLIC_KEY_B64=' + Buffer.from(publicKey).toString('base64'));
"
```

Seed reference data:

```bash
# Required — seeds the skill taxonomy (50 skills / 8 categories)
npm run seed

# Optional — seeds dev accounts (student/faculty/hod/admin, password "Password123")
node seeds/devUsers.js
```

Start the server:

```bash
npm run dev     # nodemon, auto-reload
# or
npm start       # production mode (node server.js)
```

Backend runs at `http://localhost:5000`. Health check: `GET http://localhost:5000/api/health`.

### 2.2 Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` (Vite default).

Optional `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

If unset, the Axios client (`src/services/api.js`) defaults to `http://localhost:5000/api`.

### 2.3 Dev Accounts (after `node seeds/devUsers.js`)

| Role | Email | Password |
|---|---|---|
| Student | `student@skillsphere.dev` | `Password123` |
| Faculty | `faculty@skillsphere.dev` | `Password123` |
| HOD | `hod@skillsphere.dev` | `Password123` |
| Admin | `admin@skillsphere.dev` | `Password123` |

> Dev seed accounts use a known shared password and are intended for **development/test environments only**. Do not run `devUsers.js` against a production database.

---

## 3. CI Pipeline (`.github/workflows/test.yml`)

Triggers: `push` and `pull_request` against `main` and `develop`.

Runs on `ubuntu-latest` with a `mongo:7` service container exposed on `27017`.

| Stage | Command | Notes |
|---|---|---|
| Checkout | `actions/checkout@v4` | |
| Node setup | `actions/setup-node@v4`, Node 20, npm cache keyed off both lockfiles | |
| Backend install | `npm ci` (in `backend/`) | |
| Backend tests | `npm test` | `MONGO_URI_TEST`, `JWT_SECRET`, `NODE_ENV=test` env vars set |
| Backend coverage | `npm run test:coverage` | Same env; enforces thresholds in `package.json` (see [Testing.md](./Testing.md) §6) |
| Coverage artifact | `actions/upload-artifact@v4` | Uploads `backend/coverage/`, retained 14 days, runs `if: always()` |
| Frontend install | `npm ci` (in `frontend/`) | |
| Frontend lint | `npm run lint` | ESLint |
| Frontend build | `npm run build` | `vite build` — fails the pipeline on build errors |

> Note: the workflow sets `JWT_SECRET`, but the application's actual JWT configuration uses `JWT_PRIVATE_KEY_B64`/`JWT_PUBLIC_KEY_B64` (RS256) — in the test environment these are generated dynamically by `tests/setup/setupAfterFramework.js`, so `JWT_SECRET` in CI appears to be unused by the current code. Verify this if CI behavior changes unexpectedly after JWT-related edits.

There is currently **no deployment job** in the workflow — it covers build/test verification only. Deployment is manual/platform-driven (see §5).

---

## 4. Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | HTTP port |
| `NODE_ENV` | No | `development` | `development` \| `test` \| `production` — affects request logging, JWT key generation behavior, and error stack traces |
| `MONGODB_URI` | Yes | — | Mongoose connection string. Server exits if connection fails. |
| `JWT_PRIVATE_KEY_B64` | Production: Yes / Dev: No | auto-generated in dev | Base64 PEM RSA private key for signing JWTs |
| `JWT_PUBLIC_KEY_B64` | Production: Yes / Dev: No | auto-generated in dev | Base64 PEM RSA public key for verifying JWTs |
| `JWT_EXPIRES_IN` | No | `8h` | Token lifetime (jsonwebtoken format, e.g. `8h`, `1d`) |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173` | Comma-separated list of allowed CORS origins |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | No | `http://localhost:5000/api` | Base URL the Axios client targets |

---

## 5. Production Deployment Guidance

The README identifies the intended targets as **Render** (backend) and **Vercel or Render** (frontend). General guidance (platform-agnostic, since no platform-specific config files are checked in):

### 5.1 Backend

1. Provision a Node 18+ runtime.
2. Set environment variables per §4, with `NODE_ENV=production`. `JWT_PRIVATE_KEY_B64`/`JWT_PUBLIC_KEY_B64` are **mandatory** in production — the app throws if absent.
3. Point `MONGODB_URI` at a production MongoDB cluster (e.g. MongoDB Atlas) with encryption at rest enabled.
4. Set `ALLOWED_ORIGINS` to the deployed frontend's exact origin(s) (comma-separated for multiple environments, e.g. staging + production).
5. Run `npm run seed` once against the production database to populate `skill_taxonomy` (idempotent — re-running will attempt to recreate the unique-named entries; check for duplicate-key handling before re-running against a populated DB).
6. **Do not** run `node seeds/devUsers.js` against production — instead, create the first HOD/admin accounts via a one-off script or the `/admin/create-hod` endpoint (which itself requires an existing `admin` account — bootstrap the first `admin` user directly in the database or via a dedicated seed script).
7. Start with `npm start`.
8. Configure the platform's health check against `GET /api/health`.

### 5.2 Frontend

1. Set `VITE_API_URL` to the deployed backend's `/api` base URL at build time (Vite inlines env vars at build, not runtime).
2. Run `npm run build`; deploy the resulting `dist/` directory as a static site.
3. Configure SPA fallback routing (all paths → `index.html`) since this is a client-side-routed React app (React Router).

### 5.3 Database

- Use MongoDB Atlas (or equivalent) with TLS enabled by default.
- Ensure the connecting database user has appropriate least-privilege access (read/write on the `skillsphere` database; consider restricting `update`/`delete` on `verification_logs` per [Security.md](./Security.md) §6).
- Set up automated backups consistent with the README's stated RPO (< 1 hour) / RTO (< 4 hours) targets.

### 5.4 Monitoring

The README's roadmap (Phase 5, Sprint 18) calls for Grafana-based monitoring. No monitoring/observability code (metrics endpoints, structured logging) is currently present beyond the development request logger in `server.js` and `console.error` calls in the error handler — this is a gap to address before production hardening.

---

## 6. Operational Notes

- **Health check:** `GET /api/health` returns `{ status: 'healthy', timestamp, uptime, environment }` — suitable for load balancer / platform health probes.
- **Graceful startup ordering:** the server only starts listening after a successful MongoDB connection; a failed initial connection causes `process.exit(1)`, which most platforms will interpret as a crash and restart accordingly.
- **CORS misconfiguration** is a common deployment issue — if the frontend reports network/CORS errors after deployment, verify `ALLOWED_ORIGINS` exactly matches the frontend's origin (scheme + host + port, no trailing slash).
