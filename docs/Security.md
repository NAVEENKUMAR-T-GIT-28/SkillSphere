# SkillSphere — Security Documentation

This document describes the security controls **implemented in the current codebase**, and separately lists controls described as goals/roadmap items in the project README that are **not yet implemented**. Keeping these distinct is important for accurate risk assessment.

---

## 1. Authentication

- **JWT, RS256 (asymmetric).** The backend signs tokens with a private key and verifies them with the corresponding public key (`backend/utils/jwtKeys.js`, `backend/middleware/auth.js`).
- **Token contents:** `{ userId, baseRole, iat, exp }`. No PII is embedded in the token.
- **Expiry:** controlled by `JWT_EXPIRES_IN` (default `8h`).
- **Password hashing:** bcrypt, 12 salt rounds (`backend/models/User.js`). Passwords are never returned in API responses (`select: false` + `toJSON()` override).
- **Account deactivation:** `User.is_active` is checked at login; deactivated accounts receive `403 ACCOUNT_DEACTIVATED`.

### ⚠️ Key Management Caveat (Development Mode)

If `JWT_PRIVATE_KEY_B64` / `JWT_PUBLIC_KEY_B64` are not set and `NODE_ENV !== 'production'`, the server **generates a fresh RSA key pair in memory at startup**. Consequences:

- All tokens become invalid on every server restart.
- Multiple server instances (e.g. behind a load balancer) would each generate different keys, breaking token verification across instances.

**Production requirement:** `JWT_PRIVATE_KEY_B64` and `JWT_PUBLIC_KEY_B64` (base64-encoded PEM, RSA 2048-bit minimum) **must** be set as environment secrets and shared across all instances. In `production`, missing keys cause a hard failure rather than silent key generation — this is correct and should not be changed.

---

## 2. Authorization Model

Three layers, composed per-route:

| Layer | Mechanism |
|---|---|
| Base role | `requireRole(...roles)` checks `req.user.baseRole` from the JWT (`student`, `faculty`, `hod`, `admin`). |
| Ownership | `requireOwnerOrRole(...bypassRoles)` ensures a student can only act on the `Student` document matching their own `user_id`; HOD/faculty (as configured per-route) bypass this. |
| Dynamic role | `requireDynamicRole`/`requireDynamicRoleWithScope` re-checks the `role_assignments` collection on every request for `mentor`/`cc`/`rep` — these are **not** trusted from the JWT, so revocation by an HOD takes effect immediately. |

This design means a compromised/long-lived JWT cannot retain a revoked dynamic role's privileges — only the permanent base role persists for the token's lifetime.

---

## 3. Input Validation & Sanitization

- **express-validator** on every mutating endpoint — type checks, ranges (e.g. CGPA 0–10, semester 1–8, ratings 1–5), enum checks (proficiency levels, categories, statuses), ISO 8601 date validation.
- **URL validation:**
  - Drive-hosted evidence (`Certification.drive_link`, `Resume.drive_link`) restricted to `https://drive.google.com/...` or `https://docs.google.com/...`.
  - Project/coding URLs (`github_url`, `live_demo_url`, `profile_url`) must be HTTPS.
- **XSS mitigation:** `sanitize-html` strips all tags/attributes from free-text fields before storage (career objectives, project descriptions, feedback, rejection reasons, role-assignment notes, drive company/role names, certification updates, etc.) via `customSanitizer(sanitizeField)`.
- **NoSQL injection:** All queries are built via Mongoose's query builder with typed/validated inputs rather than raw string interpolation into `$where` or similar operators. Regex-based searches (`search.js`, `hod.js` `/users` and `/class`) use user input directly in `RegExp` — see §6 for residual risk.

---

## 4. Rate Limiting

`express-rate-limit` is applied to the two unauthenticated, abuse-prone endpoints:

| Endpoint | Limit |
|---|---|
| `POST /api/auth/login` | 10 requests / 15 min / IP |
| `POST /api/auth/register` | 5 requests / hour / IP |

In `NODE_ENV=test`, these limits are raised to 1000 to avoid breaking the test suite.

**Not currently implemented:** global API rate limiting for authenticated endpoints (the README's stated target of "100 req/min authenticated, 10 req/min unauthenticated" is a roadmap goal, not present in code).

---

## 5. CORS

`server.js` configures CORS with an explicit allow-list derived from `ALLOWED_ORIGINS` (comma-separated env var, default `http://localhost:5173`). Requests with no `Origin` header are allowed (covers same-origin, curl, server-to-server health checks); any other origin not in the list triggers a CORS error. `credentials: true` is enabled, with `methods: ['GET','POST','PATCH','DELETE','OPTIONS']` and `allowedHeaders: ['Content-Type','Authorization']`.

---

## 6. Known Gaps / Hardening Recommendations

These are observations from reading the code, intended for the security review/hardening sprint (README "Phase 5"):

1. **RSA key management in production** — must be provisioned via a secrets manager; rotate per the README's "quarterly" policy, with overlap support (accept old + new public keys during rotation window) since the current `getKeys()` only supports a single active key pair.
2. **Regex-based search inputs** (`routes/search.js` `name` filter, `routes/hod.js` `/users` and via `RegExp` construction) build a `RegExp` directly from user-supplied strings. Unescaped special regex characters (e.g. `.*`, `(`, `)`) could cause unexpected matches or, in pathological cases, ReDoS with crafted input. Recommend escaping regex metacharacters before constructing the `RegExp`.
3. **Global rate limiting** is not implemented beyond auth routes — consider applying `express-rate-limit` (or a reverse-proxy equivalent) to all `/api/*` routes per the README's NFR targets.
4. **File/document handling** — the MVP relies entirely on externally-hosted Google Drive links (no file upload pipeline exists), so malware-scanning and storage-encryption concerns described in the README's NFRs apply to Google Drive's infrastructure, not SkillSphere's. If a future phase adds direct uploads, malware scanning and storage encryption must be added at that time.
5. **TLS / encryption at rest** — these are deployment-platform responsibilities (see [Deployment.md](./Deployment.md)); ensure the chosen MongoDB host (e.g. Atlas) has encryption-at-rest enabled and that the app is only ever served over HTTPS in production.
6. **Audit trail integrity** is enforced at the application/ODM layer (`VerificationLog` pre-hooks throw on update/delete). For defense-in-depth, consider also restricting the corresponding MongoDB user's role to disallow `update`/`remove` on `verification_logs` at the database level.
7. **CORS error responses** — when `cors()` rejects an origin, Express's default error handling will surface a generic error; verify the global `errorHandler` returns the standard envelope (currently it will, via the default `500`/`err.message` branch) without leaking allow-list contents.
8. **GDPR-style data export/deletion** (mentioned in README NFRs) is not yet implemented — no endpoint currently supports exporting or deleting a student's full data footprint on request.

---

## 7. Secrets & Environment Variables

| Variable | Sensitivity | Notes |
|---|---|---|
| `MONGODB_URI` | High | Contains DB credentials |
| `JWT_PRIVATE_KEY_B64` | Critical | Compromise allows forging any token |
| `JWT_PUBLIC_KEY_B64` | Low (public by design) | Must match the private key in use |
| `JWT_EXPIRES_IN` | Low | Operational tuning |
| `ALLOWED_ORIGINS` | Medium | Misconfiguration can open CORS too broadly |

None of these should ever be committed to source control. `.env` is present in `.gitignore` for both `backend/` and the repo root.

---

## 8. Reporting

This is an internal departmental system (per the project README's license). Security issues should be reported to the project maintainers directly rather than through public channels.
