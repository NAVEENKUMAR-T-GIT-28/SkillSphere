# SkillSphere — Testing Documentation

## 1. Test Stack

| Tool | Purpose |
|---|---|
| **Jest** | Test runner / assertion framework |
| **Supertest** | HTTP assertions against the Express app without a running server |
| **cross-env** | Sets `NODE_ENV=test` consistently across platforms |

Configuration lives in `backend/package.json` under the `jest` key.

---

## 2. Running Tests

From `backend/`:

```bash
npm install

# Run all tests once
npm test

# Watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
```

`npm test` runs `cross-env NODE_ENV=test jest --runInBand`. `--runInBand` runs test files serially in the current process — important because tests share a single MongoDB test database.

---

## 3. Test Environment Bootstrap

Two global hooks configure the environment:

### `tests/globalSetup.js`
- Runs once before any test worker starts.
- Generates an in-memory RSA key pair (`JWT_PRIVATE_KEY_B64`/`JWT_PUBLIC_KEY_B64`) if not already set, so `auth.js`/`jwtKeys.js` can sign and verify tokens during tests without requiring real secrets or triggering console warnings.

### `tests/setup/setupAfterFramework.js`
- Runs after the test framework is installed for each test file.
- Connects to the test database (`MONGO_URI_TEST` or locally `mongodb://127.0.0.1:27017/skillsphere_test`).
- Clears all collections `beforeAll` to prevent cross-contamination between test suites.
- Suppresses expected `console.error` logs (from error tests) to keep test output clean.
- Disconnects `afterAll`.
---

## 4. Test Helpers

| Helper | File | Purpose |
|---|---|---|
| Factories | `tests/helpers/factories.js` | Functions to quickly create `User`, `Student`, `Faculty`, `Skill`, `Certification`, `Project`, etc. with sensible defaults for use across test files. |
| Token helper | `tests/helpers/tokenHelper.js` | Generates valid signed JWTs for a given role/user, for use in `Authorization` headers in Supertest requests. |

---

## 5. Test Coverage Map

| Test file | Covers |
|---|---|
| `tests/middleware/auth.test.js` | JWT verification — missing token, expired token, invalid token, valid token attaching `req.user`. |
| `tests/middleware/roleGuard.test.js` | `requireRole` — base role allow/deny logic. |
| `tests/middleware/ownerGuard.test.js` | `requireOwnerOrRole` — ownership checks, bypass roles, missing profile cases. |
| `tests/middleware/dynamicRoleGuard.test.js` | `requireDynamicRole` — active/revoked role assignment lookups. |
| `tests/middleware/dynamicRoleGuard.scope.test.js` | `requireDynamicRoleWithScope` — scope-specific role checks. |
| `tests/middleware/errorHandler.test.js` | Global error handler — Mongoose `ValidationError`, duplicate key (`11000`), `CastError`, `JsonWebTokenError`, and default 500 mapping. |
| `tests/models/verificationLog.test.js` | Append-only enforcement — asserts that `updateOne`, `deleteOne`, etc. throw on `VerificationLog`. |
| `tests/routes/auth.test.js` | Registration (student/faculty), login, validation errors, duplicate email, rate limiting behavior. |
| `tests/routes/students.test.js` | Profile retrieval/update, dashboard payload, ownership enforcement, score endpoint. |
| `tests/routes/skills.test.js` | Add/list/delete skills, taxonomy lookups, evidence requirement for advanced/expert, duplicate prevention. |
| `tests/routes/search.skills.test.js` | Skill-based filtering in `/search/students` (aggregation `$and`-of-skills logic). |
| `tests/routes/search.test.js` | General student search filters (CGPA, department, tier, pagination, sorting). |
| `tests/routes/certifications.test.js` | Add/update/delete certifications, locked-state enforcement, status reset on resubmission. |
| `tests/routes/projects.test.js` | Add/update/delete projects, team membership, locked-state on reviewed projects, faculty rating endpoint and score recalculation side effects. |
| `tests/routes/resumes.test.js` | Version auto-increment, `is_latest` toggling on add/delete. |
| `tests/routes/codingProfiles.test.js` | Add/update/delete platform profiles, uniqueness per platform, score recalculation on stat updates. |
| `tests/routes/faculty.test.js` | Verification queue listing, approve/reject flows for skills/certs/projects, notification + score-recalculation side effects, already-processed guards. |
| `tests/routes/placement.test.js` | Drive CRUD, eligibility evaluation, apply flow (deadline/closed/eligibility/duplicate checks), shortlist endpoint, application status updates. |
| `tests/routes/hod.test.js` / `hod.additional.test.js` | Dashboard aggregations, student listing/filtering, role assignment create/list/revoke, verification logs, user search, classes endpoint. |
| `tests/routes/notifications.test.js` | List/filter notifications, mark-as-read (single and bulk), unread counts. |
| `tests/routes/myAccess.test.js` | Mentee listing for mentors, class listing for CC/rep roles (including scope_data vs. legacy label parsing). |
| `tests/routes/admin.test.js` | HOD account creation by admin, role restriction. |
| `tests/utils/response.test.js` | Standard envelope helper functions (`success`, `error`). |
| `tests/utils/sanitize.test.js` | `sanitizeField` strips HTML correctly. |
| `tests/utils/validators.test.js` | `driveLink`, `optionalDriveLink`, `httpsUrl` validation chains. |

---

## 6. Coverage Thresholds

Configured in `backend/package.json`:

```json
"coverageThreshold": {
  "global": {
    "branches": 70,
    "functions": 83,
    "lines": 85,
    "statements": 85
  }
}
```

`collectCoverageFrom` includes `middleware/**`, `models/**`, `routes/**`, `services/**`, `utils/**`, excluding `node_modules` and `seeds/**`. A `npm run test:coverage` run that drops below any threshold will fail — this is enforced in CI (see [Deployment.md](./Deployment.md) §3 for the CI pipeline).

---

## 7. Frontend Testing

The frontend currently has **no automated test suite** — `frontend/package.json` defines only `dev`, `build`, `preview`, and `lint` scripts. CI runs ESLint and a production build (`vite build`) as the frontend quality gate. Adding component/integration tests (e.g. Vitest + React Testing Library) is a recommended addition for future sprints.

---

## 8. Writing New Tests — Conventions

- Place route tests under `tests/routes/<resource>.test.js`, middleware tests under `tests/middleware/`, etc., matching the existing structure.
- Use the factories in `tests/helpers/factories.js` to create fixtures rather than inlining raw Mongoose `.create()` calls, to keep tests consistent with schema evolution.
- Use `tests/helpers/tokenHelper.js` to generate `Authorization` headers for the relevant role rather than mocking `authenticate` middleware directly — this exercises the real JWT verification path.
- Each test file should clean up (or rely on the shared DB's per-suite isolation) so that unique-index constraints (e.g. `email`, `roll_number`, `employee_id`, `(student_id, taxonomy_id)`) don't cause cross-test collisions.
- When adding a new mutating endpoint, also add a test asserting the standard response envelope shape (`success`, `data`, `error`, `meta`) and the relevant `VALIDATION_ERROR` cases.
