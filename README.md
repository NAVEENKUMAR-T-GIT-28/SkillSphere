# SkillSphere
### Centralized Student Skill & Placement Intelligence Platform

> **Version:** 2.0 — Production-Grade System Design  
> **Classification:** Internal — Department Use  
> **Status:** Ready for Development  
> **Last Updated:** June 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Problem Statement](#problem-statement)
3. [Core Objectives](#core-objectives)
4. [Tech Stack](#tech-stack)
5. [System Architecture](#system-architecture)
6. [Project Structure](#project-structure)
7. [Key Modules](#key-modules)
8. [Data Models](#data-models)
9. [API Reference](#api-reference)
10. [Readiness Score Engine](#readiness-score-engine)
11. [Role & Access Control](#role--access-control)
12. [Getting Started](#getting-started)
13. [Environment Variables](#environment-variables)
14. [Seeding the Database](#seeding-the-database)
15. [SDLC & Development Roadmap](#sdlc--development-roadmap)
16. [Non-Functional Requirements](#non-functional-requirements)
17. [Future Enhancements](#future-enhancements)

---

## Documentation

Detailed, code-verified documentation lives in [`/docs`](./docs):

- [Architecture](./docs/Architecture.md) — system design, middleware stack, auth design, services
- [API Reference](./docs/API.md) — full endpoint reference with access rules and error codes
- [Database](./docs/Database.md) — schema reference, relationships, readiness score formula
- [Deployment](./docs/Deployment.md) — local setup, environment variables, CI pipeline, production guidance
- [Testing](./docs/Testing.md) — test stack, coverage map, conventions
- [Security](./docs/Security.md) — implemented controls and hardening recommendations

---

## Overview

SkillSphere is a **production-grade, centralized student talent intelligence and placement management platform** designed to serve the complete lifecycle of a student's professional development — from skill acquisition and certification to placement readiness and recruiter shortlisting.

The platform acts as the **single source of truth** for all student skill, project, certification, resume, and placement data across an academic department. It eliminates the fragmented, spreadsheet-driven approach currently used by most institutions and replaces it with an intelligent, verifiable, analytics-driven system modeled after enterprise talent management platforms.

> **Vision:** Build a unified intelligence ecosystem that measures, verifies, and surfaces student talent — enabling faculty, placement coordinators, and department heads to make data-driven decisions at speed.

---

## Problem Statement

Academic departments managing student placements face systemic inefficiencies rooted in data fragmentation and manual process dependency:

| Pain Point | Impact |
|---|---|
| Student data in isolated spreadsheets with no version control | Placement efficiency 3–5× slower |
| Unverified certification claims | Fraudulent or inflated credentials go undetected |
| No standardized ATS-readiness benchmark | Resume quality varies enormously |
| Faculty have no visibility into project quality | Poor resource allocation for mentoring |
| Placement teams manually scan hundreds of profiles | Shortlisting takes days instead of minutes |
| Coding performance never aggregated across platforms | No holistic view of technical ability |
| No institutional 'placement readiness' metric | Subjective and inconsistent evaluations |
| HOD cannot see skill trends or predict placement outcomes | Leadership flying blind |

---

## Core Objectives

1. **Centralize** all student skill, certification, project, resume, and coding performance data into a single verified database
2. **Intelligent Scoring** — implement a Placement Readiness Score engine (0–100 scale) quantifying each student's placement fitness
3. **Multi-tier Verification** — faculty validate certifications, projects, and skills before they contribute to a student's score
4. **ATS Resume Analysis** — automated scoring, keyword gap detection, and improvement recommendations
5. **Advanced Search** — HOD and placement officers discover talent by any combination of skills, scores, CGPA, and certifications
6. **Real-time Analytics Dashboard** — department leadership sees skill coverage, placement trends, and readiness distributions live

---

## Tech Stack

| Layer | Technology | Justification |
|---|---|---|
| **Frontend** | React 18 + JavaScript + Tailwind CSS | Component reusability, rapid UI development |
| **API Layer** | Node.js + Express.js | High I/O performance, large ecosystem |
| **Primary Database** | MongoDB + Mongoose | Flexible schema, document references, easy migration to SQL |
| **Auth** | JWT (jsonwebtoken) + bcrypt | Stateless auth, secure password hashing |
| **Validation** | express-validator | Declarative request validation |
| **File References** | Google Drive links (MVP) | No upload infrastructure needed in MVP |
| **Deployment** | Render (backend) + Vercel/Render (frontend) | Easy CI/CD, free tier available |
| **Dev Tools** | Nodemon, Vite | Hot reload for development |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│   Student Portal │ Faculty Queue │ HOD Dashboard │ Login    │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST (Axios)
┌─────────────────────────▼───────────────────────────────────┐
│                    Express.js API Layer                      │
│  Auth │ Students │ Skills │ Certs │ Projects │ HOD │ Search  │
│               Middleware: JWT │ RBAC │ Ownership            │
└─────────────────────────┬───────────────────────────────────┘
                          │ Mongoose ODM
┌─────────────────────────▼───────────────────────────────────┐
│                     MongoDB Atlas                            │
│  users │ students │ skills │ certifications │ projects       │
│  placement_drives │ applications │ verification_logs         │
│  notifications │ readiness_score_history                     │
└─────────────────────────────────────────────────────────────┘
```

**Design principle:** MongoDB is used in **distributed document style** — each logical entity is its own collection with `ObjectId` references. This keeps data independently queryable, updatable without rewrites, and directly SQL-convertible later.

---

## Project Structure

```
skillsphere/
├── backend/
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   ├── roleGuard.js          # Base role enforcement
│   │   ├── dynamicRoleGuard.js   # Mentor/CC/Rep checks
│   │   ├── ownerGuard.js         # Student owns their data
│   │   └── errorHandler.js       # Global error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Faculty.js
│   │   ├── Skill.js
│   │   ├── SkillTaxonomy.js
│   │   ├── Certification.js
│   │   ├── Project.js
│   │   ├── Resume.js
│   │   ├── CodingProfile.js
│   │   ├── PlacementDrive.js
│   │   ├── Application.js
│   │   ├── Notification.js
│   │   ├── RoleAssignment.js
│   │   ├── VerificationLog.js    # Append-only audit trail
│   │   └── ReadinessScoreHistory.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── students.js
│   │   ├── skills.js
│   │   ├── certifications.js
│   │   ├── projects.js
│   │   ├── resumes.js
│   │   ├── codingProfiles.js
│   │   ├── faculty.js            # Verification queue
│   │   ├── placement.js
│   │   ├── hod.js
│   │   ├── search.js
│   │   └── notifications.js
│   ├── services/
│   │   ├── readinessScore.js     # Score calculation engine
│   │   └── notification.js       # Notification factory
│   ├── seeds/
│   │   ├── skillTaxonomy.js      # 50 skills across 8 categories
│   │   └── devUsers.js           # Dev accounts (student/faculty/hod/admin)
│   ├── utils/
│   │   └── response.js           # Standard response envelope
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── Modal.jsx
    │   │   ├── Drawer.jsx
    │   │   ├── ReadinessRing.jsx
    │   │   ├── ScoreBar.jsx
    │   │   ├── StatusBadge.jsx
    │   │   ├── TierBadge.jsx
    │   │   ├── EmptyState.jsx
    │   │   ├── ConfirmModal.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── contexts/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── student/
    │   │   │   ├── Dashboard.jsx
    │   │   │   ├── Profile.jsx
    │   │   │   ├── Skills.jsx
    │   │   │   ├── Certifications.jsx
    │   │   │   ├── Projects.jsx
    │   │   │   ├── Resumes.jsx
    │   │   │   ├── Coding.jsx
    │   │   │   └── Drives.jsx
    │   │   ├── faculty/
    │   │   │   ├── Queue.jsx
    │   │   │   └── Mentees.jsx
    │   │   └── hod/
    │   │       ├── Dashboard.jsx
    │   │       ├── Search.jsx
    │   │       ├── Roles.jsx
    │   │       └── Drives.jsx
    │   ├── services/
    │   │   └── api.js            # Axios instance + interceptors
    │   ├── App.jsx
    │   └── main.jsx
    ├── tailwind.config.js
    └── vite.config.js
```

---

## Key Modules

### Module 1 — Authentication & Access Control
- Institutional email login with JWT tokens (8-hour expiry)
- 5 base roles: `student`, `faculty`, `hod`, `admin`, plus dynamic roles (`mentor`, `cc`, `rep`)
- bcrypt password hashing (12 salt rounds)
- Middleware stack: `authenticate` → `requireRole` → `requireOwnerOrRole`

### Module 2 — Student Profile Management
- Personal info, academic data (CGPA, batch, section, semester)
- Professional links (GitHub, LinkedIn, Portfolio)
- Coding platform links (LeetCode, HackerRank, CodeChef, SkillRack, Codeforces)
- Real-time profile completeness percentage (0–100%)

### Module 3 — Skill Management
- Curated taxonomy of 200+ skills across 8 categories
- Proficiency levels: Beginner / Intermediate / Advanced / Expert
- Evidence note required for Advanced/Expert claims
- Verification gating — only verified skills count toward readiness score

### Module 4 — Certification Management
- Google Drive link submission (PDF/image)
- Faculty verification workflow: Approve / Reject / Request Clarification
- Auto-expiry detection with 30-day and 7-day advance alerts
- 48-hour SLA with escalation to HOD

### Module 5 — Resume Management
- Google Drive link versioning (auto-incremented version numbers)
- Latest version tracking (only one `is_latest: true` per student)
- Version history with labels

### Module 6 — Project Portfolio
- GitHub URL with live demo link
- Complexity tiers: Basic (CRUD) / Intermediate (API-integrated) / Advanced (ML/deployed)
- Faculty evaluation rubric: 5 dimensions × 5-point scale
- Team project support (multiple student IDs per project)
- Featured project marking

### Module 7 — Coding Platform Intelligence
- Manual stats entry in MVP (problems solved, contest rating, badges)
- Platforms: LeetCode, HackerRank, CodeChef, SkillRack, GitHub, Codeforces
- Aggregated coding score (normalized 0–15)

### Module 8 — Placement Readiness Score Engine
See [Readiness Score Engine](#readiness-score-engine) section below.

### Module 9 — Verification Workflow Engine
- Unified faculty queue showing pending skills, certifications, and projects
- Side-by-side review interface with Drive link access
- Immutable audit trail (`verification_logs` collection — append-only)
- SLA countdown timers with HOD escalation at 48 hours

### Module 10 — Advanced Search & Talent Discovery
- MongoDB `$and` query builder across CGPA, skills, department, section, batch, readiness tier
- Skill filter uses aggregation pipeline to find students with ALL required verified skills
- Results sorted by readiness score descending

### Module 11 — Placement Drive Management
- Drive creation with eligibility rule builder
- Auto-shortlisting based on CGPA, skills, readiness score, department/section/batch
- Application pipeline: Eligible → Applied → Shortlisted → Round 1 → Round 2 → Selected/Rejected
- Bulk notifications to eligible students

### Module 12 — Analytics & HOD Dashboard
- KPI cards: total students, avg readiness score, active drives, pending verifications
- Readiness tier distribution bar chart
- Top performing students table
- Department-wise average score comparison
- Top verified skills leaderboard

---

## Data Models

### Collections Overview

| Collection | Purpose |
|---|---|
| `users` | Auth credentials + base role |
| `students` | Student profile + academic info |
| `faculty` | Faculty profile |
| `role_assignments` | Dynamic roles: Rep, Mentor, CC |
| `skills` | Student skill entries (referenced, not embedded) |
| `skill_taxonomy` | Master skill list (admin-managed) |
| `certifications` | Cert entries with Drive link |
| `projects` | Project entries with GitHub link |
| `resumes` | Resume versions with Drive link |
| `coding_profiles` | One doc per platform per student |
| `verification_logs` | Immutable append-only audit trail |
| `placement_drives` | Drive details + eligibility rules |
| `applications` | Student × Drive join table |
| `notifications` | In-app notifications |
| `readiness_score_history` | Score snapshots over time |

### Key Relationships

```
users (1) ──────── (1) students
users (1) ──────── (1) faculty
users (1) ──────── (N) role_assignments
users (1) ──────── (N) notifications

students (1) ────── (N) skills
students (1) ────── (N) certifications
students (N) ────── (N) projects          [via student_ids array]
students (1) ────── (N) resumes
students (1) ────── (N) coding_profiles
students (1) ────── (N) applications
students (1) ────── (N) readiness_score_history

placement_drives (1) ── (N) applications
```

### Student Document (key fields)

```js
{
  user_id: ObjectId,         // 1:1 with users
  full_name, phone, profile_photo_url, career_objective,
  roll_number,               // unique
  department, batch_year, graduation_year, section, semester,
  cgpa,                      // 0.0 – 10.0
  links: {                   // embedded — always fetched with profile
    github, linkedin, portfolio,
    leetcode, hackerrank, codechef, skillrack, codeforces
  },
  readiness_score,           // 0 – 100, recomputed on verification events
  readiness_tier,            // beginner | developing | placement_ready | industry_ready
  profile_completeness       // 0 – 100 %
}
```

---

## API Reference

All routes are prefixed with `/api`. Responses follow the standard envelope:

```json
{ "success": true, "data": {}, "error": null, "meta": {} }
```

### Auth

| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register student or faculty |
| `POST` | `/auth/login` | Public | Login and receive JWT |

### Student Profile

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/students/dashboard` | Student | Dashboard with score + modules |
| `GET` | `/students/:id/profile` | Owner / Faculty / HOD | Get profile |
| `PATCH` | `/students/:id/profile` | Owner / HOD | Update profile |
| `GET` | `/students/:id/score` | Owner / Faculty / HOD | Score breakdown |
| `GET` | `/students/:id/applications` | Owner / Faculty / HOD | Get applications |

### Skills

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/skill-taxonomy` | Public | Skill picker dropdown |
| `GET` | `/students/:id/skills` | Owner / Faculty / HOD | List skills |
| `POST` | `/students/:id/skills` | Owner / HOD | Add skill |
| `DELETE` | `/students/:id/skills/:skillId` | Owner / HOD | Remove skill |

### Certifications

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/students/:id/certifications` | Owner / Faculty / HOD | List certs |
| `POST` | `/students/:id/certifications` | Owner / HOD | Add cert |
| `PATCH` | `/students/:id/certifications/:certId` | Owner / HOD | Update cert |
| `DELETE` | `/students/:id/certifications/:certId` | Owner / HOD | Delete cert |

### Projects

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/students/:id/projects` | Owner / Faculty / HOD | List projects |
| `POST` | `/students/:id/projects` | Owner / HOD | Add project |
| `PATCH` | `/students/:id/projects/:projectId` | Owner / HOD | Update project |
| `DELETE` | `/students/:id/projects/:projectId` | Owner / HOD | Delete project |
| `POST` | `/projects/:projectId/rate` | Faculty / HOD | Rate project |

### Resumes

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/students/:id/resumes` | Owner / Faculty / HOD | List versions |
| `POST` | `/students/:id/resumes` | Owner / HOD | Add version |
| `DELETE` | `/students/:id/resumes/:resumeId` | Owner / HOD | Delete version |

### Coding Profiles

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/students/:id/coding-profiles` | Owner / Faculty / HOD | List profiles |
| `POST` | `/students/:id/coding-profiles` | Owner / HOD | Add platform |
| `PATCH` | `/students/:id/coding-profiles/:profileId` | Owner / HOD | Update stats |
| `DELETE` | `/students/:id/coding-profiles/:profileId` | Owner / HOD | Remove platform |

### Verification (Faculty)

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/verification/queue` | Faculty / HOD | All pending items |
| `POST` | `/verification/:type/:itemId/approve` | Faculty / HOD | Approve item |
| `POST` | `/verification/:type/:itemId/reject` | Faculty / HOD | Reject with reason |

### Search

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/search/students` | Faculty / HOD | Multi-filter search |

Query params: `cgpa_min`, `cgpa_max`, `skills` (comma-separated), `department`, `section`, `batch_year`, `graduation_year`, `tier`, `name`, `page`, `limit`, `sort_by`, `sort_order`

### Placement Drives

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/placement-drives` | All | List drives |
| `POST` | `/placement-drives` | HOD | Create drive |
| `GET` | `/placement-drives/:id` | All | Drive details |
| `DELETE` | `/placement-drives/:id` | HOD | Delete drive |
| `GET` | `/placement-drives/:id/shortlist` | Faculty / HOD | Eligible students |
| `POST` | `/placement-drives/:id/apply` | Student | Apply to drive |
| `PATCH` | `/applications/:id/status` | Faculty / HOD | Update status |

### HOD

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/hod/dashboard` | HOD | Aggregated KPIs |
| `GET` | `/hod/students` | HOD | All students with filters |
| `GET` | `/hod/role-assignments` | HOD | Active assignments |
| `POST` | `/hod/role-assignments` | HOD | Assign role |
| `DELETE` | `/hod/role-assignments/:id` | HOD | Revoke role |
| `GET` | `/hod/verification-logs` | HOD | Audit trail |

### Notifications

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/notifications` | Authenticated | Own notifications |
| `PATCH` | `/notifications/:id/read` | Authenticated | Mark read |
| `PATCH` | `/notifications/read-all` | Authenticated | Mark all read |

### Admin

| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/admin/create-hod` | Admin | Create HOD user |

### Role Access

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/my/mentees` | Faculty, HOD | List students mentored |
| `GET` | `/my/class` | Faculty, Student, HOD | List students in assigned class/section |

---

## Readiness Score Engine

Score is recalculated every time a verification action occurs (skill/cert/project approved or rejected).

### Formula

```
Readiness Score = Skills (20) + Certs (20) + Projects (25) + Coding (15) + Faculty (5)
                                  max = 100
```

| Component | Max | Calculation |
|---|---|---|
| Verified Skills | 20 | 2.5 pts per verified skill (needs 8 for full marks) |
| Certifications | 20 | 5 pts per verified cert (needs 4 for full marks) |
| Projects | 25 | Basic=5, Intermediate=8, Advanced=12 + rating bonus (up to 3 pts) |
| Coding Performance | 15 | 1 pt per 20 problems solved (needs 300 for full marks) |
| Faculty Assessment | 5 | Average of all faculty project ratings normalized to 5 |

### Tier Classification

| Tier | Score Range | Action |
|---|---|---|
| **Industry Ready** | 85 – 100 | Prioritize for premium drives |
| **Placement Ready** | 65 – 84 | Flag for targeted drives immediately |
| **Developing** | 40 – 64 | Faculty mentoring recommended |
| **Beginner** | 0 – 39 | Critical intervention — alert HOD |

---

## Role & Access Control

### Base Roles (permanent, stored in JWT)

| Role | JWT `baseRole` | Description |
|---|---|---|
| Student | `student` | Profile owner, data submitter |
| Faculty | `faculty` | Verifier, evaluator |
| HOD | `hod` | Executive decision-maker, full access |
| Admin | `admin` | Platform operator |

### Dynamic Roles (stored in `role_assignments`, checked at request time)

| Role | Assigned To | Scope |
|---|---|---|
| `mentor` | Faculty → Students | Can view mentee profiles |
| `cc` | Faculty → Class | Can view class profiles |
| `rep` | Student → Section | Can represent their section |

### Middleware Chain

```
authenticate          →  verifies JWT, attaches req.user
requireRole(...)      →  checks base role from JWT
requireOwnerOrRole(…) →  student can only access own data; HOD bypasses
requireDynamicRole(…) →  checks role_assignments collection
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Git

### Backend Setup

```bash
cd backend
npm install

# Create .env file (see Environment Variables section)
cp .env.example .env

# Seed skill taxonomy (50 skills across 8 categories)
npm run seed

# Seed dev user accounts
node seeds/devUsers.js

# Start development server
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install

# Start Vite dev server
npm run dev
```

Frontend runs on `http://localhost:5173`

### Dev Accounts

After running `node seeds/devUsers.js`:

| Role | Email | Password |
|---|---|---|
| Student | `student@skillsphere.dev` | `Password123` |
| Faculty | `faculty@skillsphere.dev` | `Password123` |
| HOD | `hod@skillsphere.dev` | `Password123` |
| Admin | `admin@skillsphere.dev` | `Password123` |

---

## Environment Variables

Create `/backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/skillsphere

# JWT
JWT_SECRET=your_super_secret_key_min_32_chars_long
JWT_EXPIRES_IN=8h
```

---

## Seeding the Database

### Skill Taxonomy (required)

```bash
cd backend
npm run seed
# Seeds 50 skills across 8 categories:
# programming (10), cloud (6), ai_ml (7), cybersecurity (5),
# design (5), soft_skills (6), domain (6), devops (5)
```

### Dev Users (optional)

```bash
node seeds/devUsers.js
# Creates student, faculty, hod, admin accounts
# Uses Password123 for all — dev only
```

---

## SDLC & Development Roadmap

SkillSphere follows an **Agile-Scrum delivery model** with 2-week sprints across 5 phases. Total timeline: **9 months** to production.

### Phase 1 — Foundation & Core Infrastructure (Months 1–2)

| Sprint | Focus |
|---|---|
| Sprint 1 | Architecture, CI/CD, Docker, DB schema v1 |
| Sprint 2 | Auth system: SSO, JWT, RBAC, password reset |
| Sprint 3 | Student profile CRUD, photo upload, completeness engine |
| Sprint 4 | Skill taxonomy, certification upload, verification queue v1 |

### Phase 2 — Intelligence Features (Months 3–5)

| Sprint | Focus |
|---|---|
| Sprint 5 | Resume ATS engine, keyword gap analysis, version history |
| Sprint 6 | Project portfolio, GitHub API integration, faculty rubric |
| Sprint 7 | Coding platform sync (LeetCode, HackerRank, CodeChef, SkillRack) |
| Sprint 8 | Readiness score engine, tier classification, score history |
| Sprint 9 | Verification workflow, SLA timers, escalation, audit trail |
| Sprint 10 | Notification system: in-app, email, expiry alerts |

### Phase 3 — Placement Management & Search (Months 5–7)

| Sprint | Focus |
|---|---|
| Sprint 11 | Elasticsearch integration, multi-filter search, boolean queries |
| Sprint 12 | Placement drive engine, eligibility builder, auto-shortlisting |
| Sprint 13 | Application pipeline, bulk notifications, placement officer dashboard |

### Phase 4 — Analytics & Reporting (Months 7–8)

| Sprint | Focus |
|---|---|
| Sprint 14 | HOD executive dashboard, skill heatmap, at-risk student alerts |
| Sprint 15 | Automated PDF reports, NAAC/NBA format, scheduled email delivery |

### Phase 5 — Hardening & Launch (Months 8–9)

| Sprint | Focus |
|---|---|
| Sprint 16 | Load testing (k6), penetration testing, OWASP audit, caching |
| Sprint 17 | UAT sessions, feedback resolution, regression testing |
| Sprint 18 | Production deployment, monitoring (Grafana), admin training |

---

## Non-Functional Requirements

### Performance Targets

| Metric | Target |
|---|---|
| Search response time | < 1.5 seconds (P95) |
| Dashboard load time | < 2 seconds (P95) |
| Shortlist generation (10k students) | < 5 seconds |
| File upload (5MB resume) | < 3 seconds |

### Security

- All data in transit encrypted via TLS 1.3
- All data at rest encrypted via AES-256
- JWT tokens signed with RS256; private keys rotated quarterly
- Role-based access enforced at API gateway level (not just UI)
- File uploads scanned for malware before storage
- SQL injection protection via parameterized queries / ORM
- Rate limiting: 100 req/min (authenticated), 10 req/min (unauthenticated)
- OWASP Top 10 compliance via quarterly penetration testing
- GDPR-ready data export and deletion per student request

### Reliability

- Target uptime: **99.5%** (planned maintenance excluded)
- RTO (Recovery Time Objective): < 4 hours
- RPO (Recovery Point Objective): < 1 hour

### Scalability

- Target: 10,000+ students, 500+ faculty, 100+ concurrent users during peak placement season
- Horizontal scaling: stateless API servers behind load balancer
- Database: primary-replica MongoDB with read replicas for analytics

---

## Future Enhancements

| Feature | Business Value | Phase |
|---|---|---|
| **AI Recommendation Engine** | Personalized skill gap closure using LLM + collaborative filtering | Phase 2+ |
| **Recruiter Portal** | Direct industry access to verified talent profiles | Phase 2+ |
| **Interview Scheduling** | End-to-end placement workflow with calendar integration | Phase 2+ |
| **Skill Gap Analysis** | Compare department skills vs. industry job posting requirements | Phase 2+ |
| **Mobile App** | React Native with push notifications | Phase 3 |
| **Multi-Department / College** | Multi-tenant architecture with department isolation | Phase 3 |
| **ATS Resume Parser** | Automated ATS scoring and keyword gap detection | Phase 2 |
| **GitHub Auto-Sync** | Live commit count, language breakdown, star count from GitHub API | Phase 2 |
| **Coding Platform Auto-Sync** | Scheduled sync every 6 hours from LeetCode, HackerRank, etc. | Phase 2 |

---

## Success Metrics

| KPI | Target |
|---|---|
| Student profile completion rate | > 90% |
| Certificate verification TAT | < 48 hours (median) |
| Resume upload rate (final year) | > 95% |
| ATS score improvement (avg) | > +15 pts first to latest version |
| Readiness score accuracy | > 85% correlation with placement outcomes |
| Shortlist generation time | < 5 minutes |
| System uptime | ≥ 99.5% |
| HOD report generation time | < 30 seconds |

---

## Contributing

This is an internal departmental system. Development follows the sprint plan above. All PRs require:

1. Code review from at least one team member
2. Passing validation on all new API endpoints
3. No reduction in test coverage
4. Updated API documentation for any new/modified endpoints

---

## License

Internal — Department Use Only. All rights reserved.

---

*SkillSphere v2.0 — Centralized Student Skill & Placement Intelligence Platform*  
*Built for academic departments that take placement seriously.*