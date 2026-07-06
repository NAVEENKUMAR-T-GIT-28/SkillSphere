# SkillSphere — Target Architecture & Migration Plan
**Mode:** Design only — no code changed. This builds directly on `SkillSphere_Architecture_Audit.md`.
**Design horizon:** current monolith → modular monolith → microservice-ready, mobile-ready, AI/ATS/Readiness-engine-ready.

---

## 0. Design Philosophy

The current codebase is already 70% of the way to a good architecture — the fix is **consolidation and boundary-drawing**, not a rewrite. The guiding principle for every decision below:

> **Organize by feature/domain, not by technical layer, at the top level — then apply consistent technical layering *within* each domain.**

This is what makes a future microservice extraction ("pull the Placement domain into its own service") a folder move instead of a rewrite, and it's what a monorepo mobile app or an ATS/Readiness engine can plug into without touching unrelated code.

---

## 1. Ideal Folder Structure

```
skillsphere/
├── apps/
│   ├── web/                        # current React app (Vite)
│   ├── mobile/                     # future React Native / Expo app (shares packages/*)
│   └── api/                        # current Express backend
│
├── services/                       # future microservices, extracted one at a time
│   ├── readiness-engine/           # future — scoring as an independent service
│   ├── ats-engine/                 # future — resume parsing/matching as an independent service
│   └── notification-service/       # future — if notification volume/fanout justifies it
│
├── packages/                       # shared code, versioned independently, used by web + mobile + api
│   ├── ui/                         # design-system React components (framework-agnostic where possible)
│   ├── types/                      # shared TypeScript types/interfaces + DTOs (single source of truth)
│   ├── constants/                  # roles, tiers, status enums — shared by frontend AND backend
│   ├── validation-schemas/         # Zod/Yup schemas usable both client-side and server-side
│   └── config/                     # shared lint/tsconfig/tailwind base configs
│
├── docs/
│   ├── architecture/                # ADRs (Architecture Decision Records), one file per decision
│   ├── api/                         # OpenAPI spec (generated or hand-maintained), versioned
│   └── runbooks/
│
└── infra/                          # IaC, docker-compose for local dev, CI pipelines
```

### `apps/api/` (backend) — internal structure

```
apps/api/src/
├── config/                # env, db, feature-flag config — unchanged in spirit from today
├── shared/                # cross-domain infrastructure (see §6)
│   ├── middleware/
│   ├── errors/
│   ├── utils/
│   └── response/
├── modules/               # ⭐ one folder per business domain — this is the core change
│   ├── auth/
│   │   ├── auth.routes.js
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   ├── auth.repository.js
│   │   ├── auth.validator.js
│   │   ├── auth.dto.js
│   │   └── auth.test.js
│   ├── students/
│   │   ├── students.routes.js / .controller.js / .service.js / .repository.js
│   │   ├── skills/            (sub-module: same 5-file pattern)
│   │   ├── certifications/
│   │   ├── projects/
│   │   ├── internships/
│   │   ├── achievements/
│   │   ├── resumes/
│   │   └── coding-profiles/
│   │       └── platforms/     (github, leetcode, hackerrank, skillrack adapters)
│   ├── verification/          # the generic approve/reject engine — stays generic, stays central
│   ├── search/                # ONE search module (kills the v1/v2 split — see §migration)
│   ├── roles/                 # static + dynamic role assignment, unified
│   ├── mentorship/            # "my mentees" / access-scope resolution
│   ├── placement/             # drives + applications
│   ├── notifications/
│   ├── readiness/             # scoring engine — designed as an extractable service from day 1
│   ├── audit/                 # verification logs / audit trail
│   └── profile/               # student profile (merge v1 profile module here, not separate)
├── models/                # Mongoose schemas — stay centralized (Mongo has no schema-per-module concept
│                           #   at the DB level; this is the one place "layer-first" still wins)
├── jobs/                  # background/async jobs (search sync, score recalculation) — see §6
├── app.js                 # Express app assembly (mounts modules/*/routes)
└── server.js              # entrypoint only — boot + listen
```

**Why `modules/` instead of `controllers/`, `services/`, `repositories/` as top-level folders:** today, understanding "how does verification work end to end" means jumping across 4 different top-level folders. Co-locating a domain's routes/controller/service/repo/validator/tests means a new engineer (or an AI coding agent) can load *one folder* and have full context — this matters even more once an LLM is doing the day-to-day maintenance.

### `apps/web/` (frontend) — internal structure

```
apps/web/src/
├── app/                   # routing shell, providers, layout composition
│   ├── App.jsx
│   ├── router.jsx         # route table extracted from App.jsx (see §Routing)
│   └── providers.jsx      # composes Auth/Toast/QueryClient providers in one place
├── features/              # ⭐ one folder per feature, mirrors backend modules/
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   ├── useAuth.js          (hook, not just context)
│   │   └── auth.api.js
│   ├── student-profile/
│   │   ├── components/ (Hero, Sidebar, Stats, Skeleton, sections/*)
│   │   ├── hooks/ (useStudentProfile.js)
│   │   ├── ProfilePage.jsx
│   │   └── profile.api.js
│   ├── student-portfolio/     # skills, certifications, projects, internships, achievements
│   │   └── (one shared CRUD pattern — see §21 under-engineered/over-engineered)
│   ├── coding-profiles/
│   ├── verification/
│   ├── mentorship/
│   ├── placement/
│   ├── search/
│   ├── roles/
│   └── notifications/
├── shared/                # ⭐ true cross-feature reusable code only
│   ├── components/        # Modal, Drawer, EmptyState, Badges, ScoreBar, ReadinessRing, ui/*
│   ├── hooks/              # useDebounce, usePagination, useLocalStorage, useFetch
│   ├── contexts/           # AuthContext, ToastContext
│   ├── layouts/            # Layout.jsx, role-based nav shell
│   ├── constants/          # roles.js, status.js, tiers.js
│   ├── utils/              # formatters, date, codingUtils
│   └── api/                # api.client.js (the single Axios instance) + interceptors
├── types/                 # if/when migrated to TypeScript — see §Types
└── main.jsx
```

---

## 2. Ideal Frontend Architecture

- **Feature-first, not type-first.** Files that change together live together (a page, its hooks, its API calls, its sub-components).
- **`shared/` is a strict allowlist**, not a dumping ground: something only qualifies for `shared/` once it's used by ≥2 features. Everything else starts inside its feature folder and only "graduates" to `shared/` when a second consumer appears.
- **Data-fetching layer**: introduce a thin query layer (e.g., TanStack Query) over the existing Axios `api.client.js` — this replaces manual `useState`/`useEffect` fetch-and-loading boilerplate that's currently duplicated across every page (Projects.jsx, Internships.jsx, Achievements.jsx, etc. — the five large CRUD pages flagged in the audit), and gives you free caching, which directly benefits the mentee/search list views.
- **Presentational vs. container split** for the five large student CRUD pages: extract a single generic `<EntityListPage>` / `useEntityCrud(entityConfig)` pattern (see §21) so Skills/Certifications/Projects/Internships/Achievements stop being five ~500-line near-duplicates and become five ~40-line config objects consuming one shared implementation.
- **Routing centralized** in `app/router.jsx` as a declarative route table (array of `{ path, roles, Component }`) rendered by a single `<RoleProtectedRoute>` — removing the current 300-line hand-written JSX block in `App.jsx` where the same `ProtectedRoute > Layout > Page` wrapper is repeated ~19 times.

---

## 3. Ideal Backend Architecture

- **Modular monolith today, microservice-ready tomorrow.** Each `modules/*` folder should only talk to another module through its **service's public exports** — never reach into another module's repository or model directly. This one rule is what makes `readiness/` or `search/` extractable into `services/readiness-engine` later without a rewrite: the module boundary already *is* the future service boundary.
- **Single search module**, not v1/v2. `search/` owns both the live-query path (if still needed for anything) and the denormalized `StudentSearch` path internally, but exposes one versioned API surface externally. Kill the parallel `routes/search.js` file entirely (see Migration).
- **Event-driven sync instead of scattered fire-and-forget calls.** Replace the ~8 duplicated `syncStudentSearch(id).catch(...)` call sites with a single internal event bus (even an in-process `EventEmitter` is enough at current scale): `studentEvents.emit('student.updated', studentId)` → one listener registered once in `jobs/studentSearchSync.job.js`. This also naturally becomes the seam for a future message queue (SQS/Kafka) when this becomes a real microservice boundary, and it's the natural hook point for a future **Readiness Engine** or **ATS Engine** to subscribe without touching the modules that emit the events.
- **DTOs enforced at every module boundary** — a module never returns a raw Mongoose document to its controller; it returns a DTO shape. This is what makes the eventual mobile app and any future AI agent consuming this API safe from schema churn.
- **`roles/` module absorbs both static and dynamic role concerns** — the current split between `middleware/roleGuard.js`, `middleware/dynamicRoleGuard.js` (currently dead), and inline role logic in `myAccessService.js` becomes one module with one exported `authorize(rule)` middleware factory that internally decides "is this a base-role check or a dynamic-role check" from the rule definition, so there's exactly one place that answers "can this user do this."

---

## 4. Ideal Naming Conventions

| Concern | Convention | Example |
|---|---|---|
| Route files | `<domain>.routes.js` (consistent everywhere, not just coding-profile) | `verification.routes.js` |
| Controllers | `<domain>.controller.js` | `placement.controller.js` |
| Services | `<domain>.service.js` | `readiness.service.js` |
| Repositories | `<domain>.repository.js` (spelled out, not `Repo`) | `student.repository.js` |
| DTOs | `<domain>.dto.js`, exporting `toXDTO(doc)` functions | `student.dto.js` → `toStudentSummaryDTO()` |
| Validators | `<domain>.validator.js` | `placement.validator.js` |
| React pages | `<Noun>Page.jsx` | `ProfilePage.jsx`, `SearchPage.jsx` |
| React hooks | `use<Noun>.js` | `useStudentProfile.js`, `useEntityCrud.js` |
| React components | PascalCase noun, no verbs | `TierBadge.jsx`, not `ShowTierBadge.jsx` |
| Constants | SCREAMING_SNAKE for values, camelCase for the file | `roles.js` exports `ROLES.HOD` |
| Booleans (anywhere) | `is`/`has`/`can` prefix | `isPlacementReady`, `canReviewDrive` |
| Events (future bus) | `<domain>.<pastTenseVerb>` | `student.updated`, `verification.approved` |

One repo-wide rule change: **drop the inconsistent `.routes.js` suffix** — either every route file has it, or none do. Recommend: every module's route file keeps the suffix (`auth.routes.js`) since it disambiguates from `auth.service.js` sitting right next to it in the same folder — this only works well once files are co-located (§1), which is exactly why it isn't practical under the current flat `routes/` folder.

---

## 5. Ideal Component Hierarchy (Frontend)

```
App
 └─ Providers (Auth, Toast, QueryClient)
     └─ Router (declarative table)
         └─ RoleProtectedRoute
             └─ AppLayout (persistent nav shell)
                 └─ <Feature>Page
                     ├─ <Feature>Header / Toolbar
                     ├─ <Feature>List | <Feature>Table   (generic, config-driven where possible)
                     ├─ <Feature>Drawer | <Feature>Modal (detail/edit)
                     └─ shared/components/* (Badge, ScoreBar, EmptyState, ConfirmModal)
```

Three tiers only: **Layout → Page → Feature-component**, with `shared/components` as a horizontal cross-cut available at any tier. No component should need to know about a sibling feature's internals to render.

---

## 6. Ideal Shared Folder

```
shared/
├── components/     # Modal, Drawer, EmptyState, Badge*, ScoreBar, ReadinessRing, ConfirmModal, ui/*
├── hooks/          # useDebounce, usePagination, useEntityCrud, useLocalStorage
├── contexts/       # AuthContext, ToastContext (thin — real logic lives in hooks)
├── layouts/        # AppLayout (role-aware nav), AuthLayout
├── api/            # api.client.js (single Axios instance + interceptors), NOT per-domain calls
├── constants/      # roles, status, tiers — mirrored 1:1 with packages/constants on the backend
└── utils/          # formatters, date, codingUtils
```

Backend equivalent (`apps/api/src/shared/`):
```
shared/
├── middleware/     # auth, roleGuard (unified authorize()), ownerGuard, errorHandler, rateLimiter
├── errors/         # AppError base class + typed subclasses (NotFoundError, ForbiddenError, etc.)
├── response/       # the existing {success,data,error} envelope helper — keep as-is, it's good
├── events/         # the new in-process event bus (§3)
└── utils/          # pagination, sanitize, classQuery, jwtKeys
```

---

## 7. Ideal Hooks (Frontend)

| Hook | Replaces |
|---|---|
| `useEntityCrud(config)` | The hand-rolled fetch/loading/error state duplicated in Skills/Certifications/Projects/Internships/Achievements pages |
| `usePagination(items, pageSize)` | Ad-hoc pagination state in `hod/Search.jsx`, `MyMenteesWorkspace.jsx` |
| `useDebounce(value, delay)` | Search input filtering in `StudentSearchInput.jsx`/`hod/Search.jsx` |
| `useAuth()` | Already exists (`AuthContext`) — keep, but move token-refresh concerns here |
| `useRoleGuard(requiredRoles)` | Logic currently embedded in `ProtectedRoute.jsx` — extract so it's testable independent of routing |
| `useQuery`/`useMutation` (TanStack Query) | Manual `useEffect` + `useState` fetch boilerplate everywhere |

---

## 8. Ideal Services (Backend)

Each module's `service.js` should:
- Accept and return **DTOs**, never raw Mongoose docs.
- Contain **all** business rules for its domain (scoring formulas, eligibility rules, state-transition rules).
- Call **only its own module's repository** plus other modules' **service exports** (never another module's repository directly) — this is the rule that keeps module boundaries real.
- Emit domain events for side effects (`readiness.service.js` emits `readiness.recalculated` instead of directly importing `studentSearchSync`).

`verification.service.js` keeps its current generic `getRepo(type)`/`approveItem`/`rejectItem` dispatch pattern unchanged — it's already the right design (§37 of the audit).

---

## 9. Ideal Repositories (Backend)

- One repository per Mongoose model, no exceptions (fixes `placementRepo` and `skillRepo` currently owning two models each — split into `placementDrive.repository.js` + `application.repository.js`, and `skill.repository.js` + `skillTaxonomy.repository.js`).
- Every repository exports exactly: `findById`, `findOne`, `findMany`, `create`, `updateById`, `deleteById`, `count` — plus domain-specific reads named `find<Adjective>By<Key>` (`findVerifiedByStudent`, `findPendingByType`). No aliasing (kills `findAll`/`findMany` and `count`/`countDocuments` duplication in `studentRepo.js`).
- Repositories are the **only** files allowed to `require()` a Mongoose model.

---

## 10. Ideal DTOs

Centralize DTO shapes in `packages/types/dto/` (or `apps/api/src/modules/<domain>/<domain>.dto.js` co-located per module, mirrored into `packages/types` if/when TypeScript lands). Every module gets at minimum:
- `to<Entity>SummaryDTO(doc)` — for list views (search results, mentee lists)
- `to<Entity>DetailDTO(doc)` — for single-record views (drawers, profile pages)
- `to<Entity>PublicDTO(doc)` — strips internal fields (`__v`, sensitive flags) for any externally-facing use (future mobile app, future public API)

This directly future-proofs the **ATS Engine** and **Readiness Engine**: both need a stable, versioned shape for "what is a student" independent of the Mongoose schema underneath.

---

## 11. Ideal API Layout

```
/api/v1/auth/...
/api/v1/students/...
/api/v1/students/:id/{skills,certifications,projects,internships,achievements,resumes,coding-profile}
/api/v1/verification/...
/api/v1/search/...            ← single search endpoint, no v1/v2 split at the URL level
/api/v1/placement-drives/...
/api/v1/applications/...
/api/v1/roles/...             ← merges today's /hod/role-assignments + /my/*
/api/v1/mentorship/mentees    ← renamed from /my/mentees for clarity
/api/v1/notifications/...
/api/v1/audit-logs/...        ← renamed from /hod/verification-logs, promoted to first-class resource
/api/v1/readiness/...         ← new, explicit surface for the future Readiness Engine
/api/v1/ats/...               ← new, explicit surface for the future ATS Engine
```

Everything lives under `/api/v1` uniformly (today's app has `/api/*` and a separate `/api/v1/student/profile` — inconsistent). Internal version bump (`v2`) happens per-resource when needed, not as a parallel universe of files (fixes the search v1/v2 duplication pattern at the root).

---

## 12. Ideal Models

Keep Mongoose models centralized in `apps/api/src/models/` (schema-per-file, as today — this part of the current architecture is already correct, §28 of audit). Additions for future-proofing:
- Add a lightweight **schema version field** (`schemaVersion: Number`) to `StudentSearch` and `Student` so future migrations (and a future microservice reading the same DB) can detect shape drift safely.
- `VerificationLog` stays append-only (unchanged — flagged in audit §36 as "never change casually").

---

## 13. Ideal Utilities

Split `utils/` cleanly by whether the code is generic-language-level or domain-aware:
- **Generic** (`shared/utils/`): `pagination.js`, `sanitize.js`, `response.js` formatting.
- **Domain-aware** (belongs in the owning module, not `utils/`): `classQuery.js` → moves into `roles/` or `students/`; `skillrackMapper.js` → moves into `coding-profiles/platforms/skillrack/`.
- Rename `utils/validators.js` to `utils/assertions.js` to end the naming collision with the `validators/` directory (§17 of audit).

---

## 14. Ideal Constants

Single source of truth shared by **both** frontend and backend via `packages/constants/`:
```
packages/constants/
├── roles.js        # ROLES.STUDENT / FACULTY / HOD / ADMIN, DYNAMIC_ROLES.MENTOR / CC / REP
├── status.js        # verification statuses, application statuses
└── tiers.js          # readiness tiers (beginner/developing/placement_ready/industry_ready)
```
Today these exist twice in spirit (frontend `constants/*.js`, backend magic strings scattered through services like `readinessScore.js`'s tier thresholds). Backend imports the same package instead of re-declaring `'industry_ready'` as a string literal in multiple files.

---

## 15. Ideal Configs

- `config/env.js` pattern (already good — validates required vars at boot, §37 strength) — extend to a typed config object per environment (`development.js`/`test.js`/`production.js`) as the number of env vars grows with new services.
- One `.env.example` per app/service, committed, documenting every var.
- Shared lint/prettier/tsconfig base in `packages/config/`, extended by each app — avoids drift between `apps/web` and any future `apps/mobile`.

---

## 16. Ideal Types

Given the codebase is currently plain JS: recommend **incremental TypeScript adoption**, starting with `packages/types/` (pure `.d.ts`/`.ts` type definitions, zero runtime cost) for the DTO shapes in §10, consumed via JSDoc `@type` annotations in the still-JS backend/frontend files. This gets type safety at module boundaries without a disruptive full-codebase TS migration, and it's the single highest-leverage prep step for a future AI coding agent working in this repo (typed boundaries are the difference between an agent guessing a shape and knowing it).

---

## 17. Ideal Contexts

Keep contexts minimal — they should hold **state**, not **logic**:
- `AuthContext` → holds `{ user, loading }` only; login/logout/refresh logic moves into `useAuth()` hook (§7).
- `ToastContext` → stays as-is, it's already minimal and correctly scoped.
- No new global contexts recommended; feature-local state (e.g., search filters) stays in the feature's own hook/URL params, not lifted to a context.

---

## 18. Ideal Providers

```jsx
<QueryClientProvider>      {/* new — TanStack Query */}
  <ToastProvider>
    <AuthProvider>
      <RouterProvider />
    </AuthProvider>
  </ToastProvider>
</QueryClientProvider>
```
Composed once in `app/providers.jsx`, imported by `main.jsx` — keeps `App.jsx` down to routing concerns only (§2).

---

## 19. Ideal Layouts

- `AppLayout` — today's `Layout.jsx`, unchanged in responsibility (role-aware sidebar/nav), just relocated to `shared/layouts/`.
- `AuthLayout` — new, minimal wrapper for `LoginPage` (currently has no layout wrapper at all; fine today, but useful once there's a password-reset/onboarding flow to share chrome with).

---

## 20. Ideal Routing

Replace the current 300-line hand-written `<Routes>` block in `App.jsx` with a declarative, data-driven table:

```js
// app/routes.config.js
export const routes = [
  { path: '/dashboard', roles: ['student'], Component: StudentDashboardPage },
  { path: '/profile',   roles: ['student'], Component: ProfilePage },
  { path: '/hod/search', roles: ['hod'],    Component: SearchPage },
  // ...
];
```
```jsx
// app/router.jsx
{routes.map(r => (
  <Route path={r.path} element={
    <RoleProtectedRoute roles={r.roles}><AppLayout><r.Component /></AppLayout></RoleProtectedRoute>
  }/>
))}
```
This turns "add a new page" into a one-line config addition instead of a 12-line JSX block, and makes the full route/role map inspectable and testable as data (useful for generating API-permission docs automatically later).

---

## 21. Ideal Feature Organization — Over/Under-engineered Call-outs

- **Under-engineered**: the five student portfolio pages (Skills/Certifications/Projects/Internships/Achievements) each hand-roll the same list+add+edit+delete+status-badge pattern in 400–630 lines. Target: one `<EntityCrudPage config={skillsConfig} />` implementation (~150 lines) + five ~30-line config files declaring fields/validation/labels per entity.
- **Under-engineered**: dynamic role authorization has two divergent code paths (§26/§34 of audit) — needs to become the single `roles/` module described in §3.
- **Over-engineered relative to current use**: `dynamicRoleGuard.js`'s `requireDynamicRoleWithScope` generality (scope-param-driven) is more flexible than anything currently calling it — good bones, wrong location; it should become the *only* implementation once `roles/` is unified, not deleted.
- **Right-sized already, don't touch**: `services/verification.js`'s generic dispatch — this is the target pattern other domains should imitate, not something needing more abstraction.

---

## Everything That Can Be Merged

| Merge | Into |
|---|---|
| `routes/search.js` + `routes/searchV2.js` | Single `search/` module, one versioned endpoint |
| `routes/codingProfiles.js` + `routes/codingProfile.routes.js` | Single `coding-profiles/` module |
| `middleware/roleGuard.js` + `middleware/dynamicRoleGuard.js` + inline role checks in `myAccessService.js` | Single `roles/authorize()` |
| `controllers/profile/*` + `services/profile/*` + `validators/profile/*` + `dto/profile.dto.js` | Single `modules/profile/` |
| Frontend `services/api.js` + `services/api/index.js` | One export surface (keep `index.js`, delete the top-level shim) |
| Five student CRUD pages | One `EntityCrudPage` + five configs |
| `utils/classQuery.js` | Into `roles/` (it's a scope-resolution helper, not a generic util) |

## Everything That Can Be Deleted

- `backend/routes/search.js` (dead, unmounted — after confirming v2 fully covers its use case)
- `backend/routes/codingProfiles.js` (dead, unmounted — legacy plural endpoint)
- `frontend/src/pages/shared/Mentees.jsx` (orphaned, superseded by `MyMenteesWorkspace.jsx`)
- `backend/test-repos.js`, `backend/test-routes.js`, `backend/test.git.js` (root-level ad-hoc scripts outside the `tests/` framework — confirm they're not still used for manual smoke-testing before removing)
- `codingProfileRepo.findAllLegacy` once the legacy coding-profile shape is confirmed fully migrated
- `studentRepo.js`'s `findAll`/`countDocuments` aliases (keep one name each)

## Everything Duplicated

- Coding-profile routes (plural/singular) — see Merge table
- Search routes (v1/v2) — see Merge table
- `syncStudentSearch(...).catch(...)` call pattern at ~8 sites — see §3 event bus
- List/CRUD page structure across 5 student portfolio pages — see §21
- Dynamic-role-check logic (guard middleware vs. inline service queries) — see Merge table

## Everything Obsolete

- `routes/search.js` v1 live-query search (no caller anywhere in the stack)
- `routes/codingProfiles.js` legacy plural endpoint
- `pages/shared/Mentees.jsx`
- The stale code comments in `studentSearchSync.js` and `searchV2.js` (documentation debt, not code, but actively misleading — fix in Phase 1 regardless of any structural migration)

## Everything Over-Engineered

- `dynamicRoleGuard.js`'s scope-param generality relative to its current zero call sites (not wrong, just prematurely built and then abandoned mid-adoption)
- Five separate near-identical validator files for skills/certifications/projects/internships/achievements where a single parameterized validator-factory would cover all five with less code

## Everything Under-Engineered

- The five student CRUD pages (§21)
- Dynamic role authorization consolidation (§3, §26)
- StudentSearch sync fan-out (needs the event-bus seam before it becomes a real problem at scale, §3/§30 of audit)
- No structured request logging/observability layer yet (console.log only) — will matter once there are multiple services

---

## Migration Plan

### Phase 1 — Zero-risk cleanup (no behavior change, days not weeks)
- Delete/retire `routes/search.js` and `routes/codingProfiles.js` (confirm zero external consumers first — internal audit already shows none).
- Fix the two stale/contradictory code comments (`studentSearchSync.js`, `searchV2.js`).
- Delete `pages/shared/Mentees.jsx`.
- De-duplicate `studentRepo.js` aliasing (`findAll`→`findMany`, `countDocuments`→`count`), updating call sites.
- Rename `utils/validators.js` → `utils/assertions.js`.
- Adopt consistent `.routes.js` suffix (or drop it) across all 20 route files — pick one, apply everywhere.
- **Goal**: remove confusion and dead weight without touching business logic. Fully reversible, low review burden.

### Phase 2 — Structural reorganization (no behavior change, weeks)
- Introduce `modules/` folder structure on the backend; move existing controller/service/repository/validator/route files into their domain folders **file-move only**, updating `require()` paths — no logic rewrites.
- Introduce `features/` folder structure on the frontend the same way.
- Unify dynamic + static role checking into one `roles/authorize()` used everywhere; remove the now-redundant `dynamicRoleGuard.js` in favor of the unified version (functionally equivalent, single call site pattern).
- Split `placementRepo.js` and `skillRepo.js` into one-repo-per-model.
- Extract `app/router.jsx` + `routes.config.js` from `App.jsx`.
- Introduce the in-process event bus and migrate the ~8 `syncStudentSearch` call sites to emit-and-listen.
- **Goal**: same runtime behavior, dramatically better navigability. This phase is where an AI coding agent's future effectiveness in this repo is won or lost.

### Phase 3 — New capability enablement (weeks to months, incremental)
- Build `EntityCrudPage`/config pattern; migrate the five student portfolio pages one at a time (each migration is independently shippable and testable).
- Introduce DTO layer formally (`to<Entity>DTO` functions) at each module boundary.
- Stand up `readiness/` and `ats/` as clearly-bounded modules *inside* the monolith first (correct data contracts, correct events) — only extract to `services/readiness-engine` and `services/ats-engine` once the module boundary has proven stable under real load, per the modular-monolith-first philosophy in §0.
- Begin incremental TypeScript adoption starting with `packages/types/` DTOs.
- Scaffold `apps/mobile/` sharing `packages/ui`, `packages/types`, `packages/constants` — validates that the shared-package boundaries drawn in Phase 2 actually hold up under a second consumer.
- **Goal**: this is where "future AI integration / microservices / mobile / analytics / ATS / Readiness engine" actually become buildable, because Phases 1–2 already drew the seams.

---

## Risk Analysis

| Risk | Phase | Severity | Mitigation |
|---|---|---|---|
| Deleting `search.js`/`codingProfiles.js` breaks an undiscovered external consumer (e.g., a Postman collection, a partner integration) | 1 | Low–Medium | Grep entire repo + check any deployment/API-gateway configs before deletion; deprecate with a 410 response for one release cycle instead of hard-deleting, if any doubt remains |
| File-move refactor (Phase 2) introduces subtle `require()` path bugs | 2 | Medium | Do it file-by-file behind the existing 85%-line-coverage test suite (a real strength to lean on, per audit §37); one module migrated + tests green before starting the next |
| Unifying role-check logic changes authorization behavior at the edges (e.g., an edge case only the inline `myAccessService` logic handled) | 2 | Medium–High | Write characterization tests against *current* behavior for every dynamic-role code path before touching it; unify only once both paths are provably equivalent |
| Event-bus migration for `syncStudentSearch` silently drops a sync trigger during the transition (in-flight requests using old direct-call pattern racing new listener registration) | 2 | Medium | Ship both mechanisms in parallel for one release, verify via logging that event-driven sync fires everywhere the direct calls used to, then remove the direct calls |
| `EntityCrudPage` generalization (Phase 3) fails to cover an edge case one of the five pages has (e.g., Projects' team-member multi-select, Resumes' file upload) | 3 | Medium | Build the generic component against the *most complex* page (Projects) first, not the simplest — de-risks the abstraction early |
| Extracting Readiness/ATS to real microservices too early, before the module boundary is proven | 3 | High (if rushed) | Explicitly gated in the plan: modular-monolith module first, service extraction only after boundary stability is demonstrated in production |
| TypeScript adoption stalls half-migrated, leaving mixed JS/TS confusion | 3 | Low–Medium | Scope strictly to `packages/types/` + JSDoc consumption first; do not attempt full-file `.ts` conversion until DTO-level typing has proven value |

## Estimated Effort

| Phase | Scope | Rough effort (1 engineer, focused) |
|---|---|---|
| Phase 1 | Cleanup, dead-code removal, comment fixes, naming fixes | 2–4 days |
| Phase 2 | Full module/feature restructuring, role-check unification, router extraction, event bus | 3–5 weeks |
| Phase 3 | CRUD page consolidation, DTO layer, readiness/ATS module scaffolding, TS types package, mobile-app scaffold | 6–10 weeks, but independently shippable in slices (each bullet is separately releasable) |

Total to a fully microservice-and-mobile-ready modular monolith: **roughly 2–3 months of focused work**, none of which requires a "big bang" cutover — every phase and most individual bullets within Phase 2/3 can ship independently behind the existing test suite.

---

**NO CODE WAS MODIFIED. This is a design and planning document only.**