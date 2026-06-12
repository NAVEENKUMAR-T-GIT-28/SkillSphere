# SkillSphere — Developer Reference
## Database Models, Relations, Auth & MVP Core Structure

> **Stack:** React + JavaScript + Tailwind CSS · Node.js + Express · MongoDB + Mongoose  
> **Auth:** Email + Password login · JWT access tokens · Role-based route guards  
> **Files:** Google Drive links only (no upload infra in MVP)  
> **Deploy:** Render (backend) + Render/Vercel (frontend) · MongoDB Atlas free tier

---

## Table of Contents

1. [Core Design Principle](#1-core-design-principle)
2. [Collections Overview](#2-collections-overview)
3. [Collection Schemas](#3-collection-schemas)
4. [Relations Map](#4-relations-map)
5. [Auth System](#5-auth-system)
6. [Role Guard Middleware](#6-role-guard-middleware)
7. [API Route Structure](#7-api-route-structure)
8. [Readiness Score Logic](#8-readiness-score-logic)
9. [MVP Build Order](#9-mvp-build-order)
10. [Environment Variables](#10-environment-variables)

---

## 1. Core Design Principle

MongoDB is used in **distributed document style** — not everything embedded in one giant document. Each logical entity is its own collection with references (`ObjectId`). This keeps the data:

- **Queryable independently** — fetch certifications without pulling the full student profile
- **Updatable without rewriting** — update one skill without touching the student document
- **SQL-convertible later** — each collection maps cleanly to a SQL table with foreign keys
- **Scalable** — large arrays (skills, certs, projects) don't bloat the parent document

**Rule of thumb used here:**
- Embed only when data is always fetched together and never exceeds ~10 items (e.g. social links, coding profile URLs inside the student document)
- Reference everything else (skills, certifications, projects, resumes, drives, applications)

---

## 2. Collections Overview

| Collection | Purpose | References |
|---|---|---|
| `users` | Auth credentials + base role | — |
| `students` | Student profile + academic info | `users._id` |
| `faculty` | Faculty profile | `users._id` |
| `role_assignments` | Dynamic roles: Rep, Mentor, CC | `users._id`, scope `_id` |
| `skills` | Student skill entries | `students._id`, `skill_taxonomy._id` |
| `skill_taxonomy` | Master skill list (admin-managed) | — |
| `certifications` | Cert entries with Drive link | `students._id` |
| `projects` | Project entries with GitHub link | `students._id` |
| `resumes` | Resume versions with Drive link | `students._id` |
| `coding_profiles` | Coding platform links per student | `students._id` |
| `verification_logs` | Immutable audit trail | `users._id`, item ref |
| `placement_drives` | Drive details + eligibility rules | `users._id` (created by) |
| `applications` | Student × Drive join | `students._id`, `placement_drives._id` |
| `notifications` | In-app notifications | `users._id` |
| `readiness_score_history` | Score snapshots over time | `students._id` |

---

## 3. Collection Schemas

### 3.1 `users`

Auth credentials and base role. Every person in the system has a user record.

```js
{
  _id: ObjectId,
  email: String,          // unique, college email
  password: String,       // bcrypt hashed, min 8 chars
  base_role: String,      // enum: 'student' | 'faculty' | 'hod' | 'admin'
  is_active: Boolean,     // default true, HOD can deactivate
  created_at: Date,
  updated_at: Date
}
```

**Notes:**
- `base_role` is the permanent role assigned at registration
- Dynamic roles (Rep, Mentor, CC) live in `role_assignments` — not here
- Password stored as bcrypt hash, never plain text
- `email` must be unique across the collection

---

### 3.2 `students`

Student profile and academic data. One record per student user.

```js
{
  _id: ObjectId,
  user_id: ObjectId,        // ref: users._id (1:1)
  
  // personal
  full_name: String,
  phone: String,
  profile_photo_url: String, // Google Drive link or Imgur link
  career_objective: String,  // max 500 chars
  
  // academic
  roll_number: String,       // unique within department
  department: String,
  batch_year: Number,        // e.g. 2022 (year of joining)
  graduation_year: Number,   // e.g. 2026
  section: String,           // e.g. 'A', 'B'
  semester: Number,
  cgpa: Number,              // 0.0 - 10.0

  // social + coding links (embed — always fetched with profile, small fixed set)
  links: {
    github: String,
    linkedin: String,
    portfolio: String,
    leetcode: String,
    hackerrank: String,
    codechef: String,
    skillrack: String,
    codeforces: String
  },

  // computed score (recalculated on every verification action)
  readiness_score: Number,   // 0 - 100
  readiness_tier: String,    // enum: 'beginner' | 'developing' | 'placement_ready' | 'industry_ready'

  // profile completeness %
  profile_completeness: Number, // 0 - 100, recalculated on update

  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
```js
{ user_id: 1 }          // unique
{ roll_number: 1 }      // unique
{ department: 1, batch_year: 1, section: 1 }  // compound — used in search
{ cgpa: 1 }             // for range queries in shortlisting
{ readiness_score: -1 } // for sorted results
```

---

### 3.3 `faculty`

Faculty profile. One record per faculty user.

```js
{
  _id: ObjectId,
  user_id: ObjectId,     // ref: users._id (1:1)
  full_name: String,
  department: String,
  designation: String,   // e.g. 'Assistant Professor'
  employee_id: String,   // unique
  phone: String,
  created_at: Date,
  updated_at: Date
}
```

---

### 3.4 `role_assignments`

Handles all dynamic roles: Rep (student), Mentor (faculty → students), CC (faculty → class).  
HOD assigns and revokes these. Every change is logged here immutably.

```js
{
  _id: ObjectId,
  user_id: ObjectId,      // ref: users._id — who is being assigned the role
  role: String,           // enum: 'rep' | 'mentor' | 'cc'

  // scope defines what they can access
  scope_type: String,     // enum: 'student' | 'class' | 'section'
  scope_id: ObjectId,     // student._id (for mentor) | class identifier (for cc/rep)
  scope_label: String,    // human-readable e.g. 'CSE-A 2026' — for display only

  assigned_by: ObjectId,  // ref: users._id — must be HOD
  assigned_at: Date,
  revoked_at: Date,       // null = currently active
  revoke_reason: String
}
```

**Query pattern — get active roles for a user:**
```js
RoleAssignment.find({ user_id: userId, revoked_at: null })
```

**Query pattern — get all mentees of a faculty mentor:**
```js
RoleAssignment.find({ user_id: facultyId, role: 'mentor', revoked_at: null })
// returns array of { scope_id: studentId }
```

---

### 3.5 `skill_taxonomy`

Master list of all valid skills. Admin-managed. Students pick from this list only — no free-text skills.

```js
{
  _id: ObjectId,
  name: String,           // e.g. 'React.js'
  category: String,       // enum: 'programming' | 'cloud' | 'ai_ml' | 'cybersecurity' | 'design' | 'soft_skills' | 'domain' | 'devops'
  is_trending: Boolean,   // HOD/admin marks trending — shown as 'In Demand'
  is_active: Boolean,     // soft delete
  created_at: Date
}
```

**Seed ~50 skills at launch.** HOD/admin can add more via admin panel.

---

### 3.6 `skills`

One document per skill per student. Referenced, not embedded — students can have 20+ skills.

```js
{
  _id: ObjectId,
  student_id: ObjectId,       // ref: students._id
  taxonomy_id: ObjectId,      // ref: skill_taxonomy._id
  skill_name: String,         // denormalized copy for fast read (avoid join on display)

  proficiency: String,        // enum: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  evidence_note: String,      // required if proficiency is advanced or expert

  status: String,             // enum: 'pending' | 'verified' | 'rejected'
  verified_by: ObjectId,      // ref: users._id (faculty who actioned)
  verified_at: Date,
  rejection_reason: String,

  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
```js
{ student_id: 1 }
{ student_id: 1, status: 1 }   // get all verified skills for a student
{ taxonomy_id: 1, status: 1 }  // search: who has React (verified)?
```

---

### 3.7 `certifications`

One document per certification per student. Drive link instead of file upload.

```js
{
  _id: ObjectId,
  student_id: ObjectId,    // ref: students._id

  title: String,           // e.g. 'AWS Solutions Architect'
  issuer: String,          // e.g. 'Amazon Web Services'
  category: String,        // enum: 'technical' | 'language' | 'soft_skills' | 'domain' | 'academic'
  issue_date: Date,
  expiry_date: Date,       // null if no expiry
  credential_id: String,   // cert ID from issuer
  verification_url: String,// issuer verify URL

  drive_link: String,      // Google Drive link to certificate PDF/image

  status: String,          // enum: 'pending' | 'verified' | 'rejected' | 'expired'
  verified_by: ObjectId,   // ref: users._id
  verified_at: Date,
  rejection_reason: String,

  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
```js
{ student_id: 1 }
{ student_id: 1, status: 1 }
{ expiry_date: 1 }   // for expiry alert cron job
```

---

### 3.8 `projects`

One document per project. Team projects link multiple students via `student_ids`.

```js
{
  _id: ObjectId,
  student_ids: [ObjectId],  // ref: students._id — supports team projects
  created_by: ObjectId,     // ref: students._id — who submitted

  title: String,
  description: String,      // max 1000 chars
  tech_stack: [String],     // e.g. ['React', 'Node.js', 'MongoDB']
  github_url: String,       // required
  live_demo_url: String,    // optional
  thumbnail_url: String,    // Google Drive or Imgur link, optional

  complexity_tier: String,  // enum: 'basic' | 'intermediate' | 'advanced'
                            // basic = CRUD, intermediate = API-integrated, advanced = ML/deployed

  // faculty evaluation
  faculty_rating: {
    rated_by: ObjectId,     // ref: users._id (faculty)
    rated_at: Date,
    functionality: Number,  // 1-5
    code_quality: Number,   // 1-5
    documentation: Number,  // 1-5
    innovation: Number,     // 1-5
    complexity: Number,     // 1-5
    average: Number,        // computed: sum/5
    feedback: String
  },

  is_featured: Boolean,     // student marks as featured project
  status: String,           // enum: 'pending' | 'reviewed'

  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
```js
{ student_ids: 1 }
{ created_by: 1 }
{ tech_stack: 1 }   // search: who has built with React?
```

---

### 3.9 `resumes`

Multiple versions per student. Drive link only. Latest version drives ATS display.

```js
{
  _id: ObjectId,
  student_id: ObjectId,   // ref: students._id
  version: Number,        // auto-increment per student: 1, 2, 3...
  drive_link: String,     // Google Drive link to resume PDF/DOCX
  label: String,          // optional: 'SDE Resume v2', 'Internship Resume'
  is_latest: Boolean,     // only one true per student at a time
  uploaded_at: Date
}
```

**Indexes:**
```js
{ student_id: 1 }
{ student_id: 1, is_latest: 1 }
```

---

### 3.10 `coding_profiles`

One document per platform per student. Links stored as strings — manual entry in MVP.

```js
{
  _id: ObjectId,
  student_id: ObjectId,   // ref: students._id
  platform: String,       // enum: 'leetcode' | 'hackerrank' | 'codechef' | 'skillrack' | 'github' | 'codeforces'
  username: String,       // platform username
  profile_url: String,    // full URL to their profile

  // manually entered stats in MVP (auto-sync in Phase 2)
  problems_solved: Number,
  contest_rating: Number,
  badges: [String],

  last_updated: Date,     // when student last updated these stats
  created_at: Date
}
```

**Indexes:**
```js
{ student_id: 1 }
{ student_id: 1, platform: 1 }  // unique per student per platform
```

---

### 3.11 `verification_logs`

Immutable audit trail. Append-only — no updates or deletes allowed on this collection.

```js
{
  _id: ObjectId,
  item_type: String,      // enum: 'skill' | 'certification' | 'project'
  item_id: ObjectId,      // ref to the item being verified
  student_id: ObjectId,   // ref: students._id — for quick lookup
  actor_id: ObjectId,     // ref: users._id — who took the action
  action: String,         // enum: 'submitted' | 'approved' | 'rejected' | 'clarification_requested'
  comment: String,        // rejection reason or clarification note
  timestamp: Date
}
```

**Enforce append-only in Mongoose:**
```js
VerificationLogSchema.pre('findOneAndUpdate', function() {
  throw new Error('verification_logs is append-only');
});
VerificationLogSchema.pre('updateOne', function() {
  throw new Error('verification_logs is append-only');
});
```

---

### 3.12 `placement_drives`

Each placement drive created by placement officer or HOD.

```js
{
  _id: ObjectId,
  created_by: ObjectId,   // ref: users._id

  company_name: String,
  role_title: String,     // e.g. 'Software Engineer'
  job_description_url: String,  // Drive link to JD PDF
  ctc: String,            // e.g. '6 LPA' — string for flexibility
  location: String,
  drive_date: Date,
  application_deadline: Date,
  openings: Number,
  drive_type: String,     // enum: 'oncampus' | 'offcampus' | 'internship'

  // eligibility rules — stored as JSON, evaluated at query time
  eligibility: {
    min_cgpa: Number,           // e.g. 7.0
    batch_years: [Number],      // e.g. [2026]
    departments: [String],      // e.g. ['CSE', 'IT']
    sections: [String],         // e.g. ['A', 'B'] — empty = all
    required_skills: [String],  // skill names (verified) — AND logic
    min_readiness_score: Number // e.g. 60
  },

  status: String,         // enum: 'upcoming' | 'active' | 'closed'
  created_at: Date,
  updated_at: Date
}
```

---

### 3.13 `applications`

Student × Drive join table. One document per student per drive.

```js
{
  _id: ObjectId,
  student_id: ObjectId,        // ref: students._id
  drive_id: ObjectId,          // ref: placement_drives._id

  status: String,              // enum: 'eligible' | 'applied' | 'shortlisted' | 'round1' | 'round2' | 'selected' | 'rejected'
  applied_at: Date,
  last_status_update: Date,
  notes: String,               // placement officer notes

  created_at: Date
}
```

**Indexes:**
```js
{ drive_id: 1 }
{ student_id: 1 }
{ drive_id: 1, status: 1 }   // get all shortlisted for a drive
```

---

### 3.14 `notifications`

In-app notifications. Each user gets their own notification records.

```js
{
  _id: ObjectId,
  user_id: ObjectId,    // ref: users._id
  type: String,         // enum: 'verification_approved' | 'verification_rejected' | 'drive_announced' | 'score_updated' | 'role_assigned' | 'general'
  title: String,
  message: String,
  is_read: Boolean,     // default false
  link: String,         // optional deep link e.g. '/certifications/abc123'
  created_at: Date
}
```

---

### 3.15 `readiness_score_history`

Snapshot of score every time it's recalculated. Used for trend graphs in Phase 2.

```js
{
  _id: ObjectId,
  student_id: ObjectId,  // ref: students._id
  score: Number,
  tier: String,
  breakdown: {
    skills_score: Number,
    certs_score: Number,
    projects_score: Number,
    coding_score: Number,
    faculty_score: Number
  },
  calculated_at: Date
}
```

---

## 4. Relations Map

```
users (1) ──────────── (1) students
users (1) ──────────── (1) faculty
users (1) ──────────── (N) role_assignments
users (1) ──────────── (N) notifications

students (1) ────────── (N) skills
students (1) ────────── (N) certifications
students (1) ────────── (N) projects          [many-to-many via student_ids array]
students (1) ────────── (N) resumes
students (1) ────────── (N) coding_profiles
students (1) ────────── (N) applications
students (1) ────────── (N) readiness_score_history

skill_taxonomy (1) ──── (N) skills

placement_drives (1) ── (N) applications

users (actor) ──────── (N) verification_logs  [append-only]

role_assignments:
  faculty  → role: 'mentor' → scope: student._id   (1 faculty : N students)
  faculty  → role: 'cc'     → scope: class label   (1 faculty : 1 class)
  student  → role: 'rep'    → scope: section label (2 students : 1 section)
```

---

## 5. Auth System

### 5.1 Flow

```
POST /api/auth/register
  → validate email + password
  → hash password with bcrypt (saltRounds: 12)
  → create users document
  → create students or faculty profile document
  → return JWT

POST /api/auth/login
  → find user by email
  → compare password with bcrypt
  → sign JWT with { userId, baseRole }
  → return { token, user: { id, email, baseRole, name } }
```

### 5.2 JWT Payload

```js
{
  userId: "64f...",
  baseRole: "student",   // permanent base role
  iat: 1720000000,
  exp: 1720028800        // 8 hours
}
```

Dynamic roles (mentor, rep, cc) are **not** in the JWT. They are fetched from `role_assignments` at request time when needed for scoped access decisions.

### 5.3 Auth Middleware

```js
// middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;   // { userId, baseRole }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { authenticate };
```

---

## 6. Role Guard Middleware

### 6.1 Base Role Guard

Checks the permanent base role from JWT. Use for routes that any HOD, any faculty, or any student can access.

```js
// middleware/roleGuard.js

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.baseRole)) {
      return res.status(403).json({ error: 'Access denied — insufficient role' });
    }
    next();
  };
};

// Usage on routes:
// router.get('/dashboard', authenticate, requireRole('hod'), handler)
// router.get('/queue',     authenticate, requireRole('faculty', 'hod'), handler)
// router.get('/profile',   authenticate, requireRole('student'), handler)

module.exports = { requireRole };
```

### 6.2 Dynamic Role Guard

For routes that require Mentor, CC, or Rep access. Checks `role_assignments` collection.

```js
// middleware/dynamicRoleGuard.js
const RoleAssignment = require('../models/RoleAssignment');

// Check if user has a dynamic role (mentor, cc, rep)
const requireDynamicRole = (...roles) => {
  return async (req, res, next) => {
    const assignment = await RoleAssignment.findOne({
      user_id: req.user.userId,
      role: { $in: roles },
      revoked_at: null
    });
    if (!assignment) {
      return res.status(403).json({ error: 'Access denied — role not assigned' });
    }
    req.roleAssignment = assignment;  // attach scope info for downstream use
    next();
  };
};

module.exports = { requireDynamicRole };
```

### 6.3 Ownership Guard

For routes where a student can only access their own data.

```js
// middleware/ownerGuard.js
const Student = require('../models/Student');

const requireOwnerOrRole = (...allowedRoles) => {
  return async (req, res, next) => {
    // HOD or allowed roles bypass ownership check
    if (allowedRoles.includes(req.user.baseRole)) return next();

    // Student can only access their own data
    const student = await Student.findOne({ user_id: req.user.userId });
    if (!student || student._id.toString() !== req.params.studentId) {
      return res.status(403).json({ error: 'Access denied — not your resource' });
    }
    req.student = student;
    next();
  };
};

module.exports = { requireOwnerOrRole };
```

### 6.4 Role × Route Matrix

| Route | Middleware chain |
|---|---|
| `POST /auth/register` | public |
| `POST /auth/login` | public |
| `GET /students/:id/profile` | authenticate → requireOwnerOrRole('faculty', 'hod') |
| `PATCH /students/:id/profile` | authenticate → requireOwnerOrRole('hod') |
| `POST /students/:id/skills` | authenticate → requireOwnerOrRole('hod') |
| `GET /faculty/verification-queue` | authenticate → requireRole('faculty', 'hod') |
| `POST /faculty/verify/:itemId` | authenticate → requireRole('faculty', 'hod') |
| `GET /search/students` | authenticate → requireRole('hod', 'faculty') |
| `POST /placement-drives` | authenticate → requireRole('hod') |
| `GET /hod/dashboard` | authenticate → requireRole('hod') |
| `POST /hod/role-assignments` | authenticate → requireRole('hod') |

---

## 7. API Route Structure

### Folder structure

```
/server
  /models
    User.js
    Student.js
    Faculty.js
    RoleAssignment.js
    Skill.js
    SkillTaxonomy.js
    Certification.js
    Project.js
    Resume.js
    CodingProfile.js
    VerificationLog.js
    PlacementDrive.js
    Application.js
    Notification.js
    ReadinessScoreHistory.js
  /routes
    auth.js
    students.js
    faculty.js
    skills.js
    certifications.js
    projects.js
    resumes.js
    placement.js
    hod.js
    search.js
  /middleware
    auth.js
    roleGuard.js
    dynamicRoleGuard.js
    ownerGuard.js
  /services
    readinessScore.js   ← score calculation logic
    notification.js     ← create notification records
  /utils
    response.js         ← standard response envelope
  server.js
  .env
```

### Standard response envelope

```js
// utils/response.js
const success = (res, data, meta = {}) => {
  res.json({ success: true, data, error: null, meta });
};
const error = (res, message, statusCode = 400, code = null) => {
  res.status(statusCode).json({ success: false, data: null, error: { message, code } });
};
module.exports = { success, error };
```

### Key routes

```
AUTH
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh        (Phase 2)

STUDENT PROFILE
GET    /api/students/:id/profile
PATCH  /api/students/:id/profile
GET    /api/students/:id/score

SKILLS
GET    /api/students/:id/skills
POST   /api/students/:id/skills
DELETE /api/students/:id/skills/:skillId
GET    /api/skill-taxonomy      (public — for skill picker dropdown)

CERTIFICATIONS
GET    /api/students/:id/certifications
POST   /api/students/:id/certifications
PATCH  /api/students/:id/certifications/:certId
DELETE /api/students/:id/certifications/:certId

PROJECTS
GET    /api/students/:id/projects
POST   /api/students/:id/projects
PATCH  /api/students/:id/projects/:projectId

RESUMES
GET    /api/students/:id/resumes
POST   /api/students/:id/resumes

CODING PROFILES
GET    /api/students/:id/coding-profiles
POST   /api/students/:id/coding-profiles
PATCH  /api/students/:id/coding-profiles/:profileId

VERIFICATION (faculty)
GET    /api/verification/queue
POST   /api/verification/:type/:itemId/approve
POST   /api/verification/:type/:itemId/reject

SEARCH
GET    /api/search/students?cgpa_min=7&skills=React,Node&section=A&tier=placement_ready

PLACEMENT DRIVES
GET    /api/placement-drives
POST   /api/placement-drives
GET    /api/placement-drives/:id
GET    /api/placement-drives/:id/shortlist
POST   /api/placement-drives/:id/apply          (student applies)
PATCH  /api/applications/:id/status             (placement officer updates status)

HOD
GET    /api/hod/dashboard
GET    /api/hod/students                        (all students, any filter)
POST   /api/hod/role-assignments
DELETE /api/hod/role-assignments/:id
GET    /api/hod/verification-logs

NOTIFICATIONS
GET    /api/notifications                       (own notifications)
PATCH  /api/notifications/:id/read
```

---

## 8. Readiness Score Logic

Recalculated every time a verification action happens (skill/cert/project approved or rejected).

```js
// services/readinessScore.js

const recalculateScore = async (studentId) => {

  // 1. Verified skills score (max 20)
  const verifiedSkills = await Skill.find({ student_id: studentId, status: 'verified' });
  const skillScore = Math.min(verifiedSkills.length * 2.5, 20);
  // 2.5 per verified skill, capped at 20 (needs 8 verified skills for full marks)

  // 2. Certifications score (max 20)
  const verifiedCerts = await Certification.find({ student_id: studentId, status: 'verified' });
  const certScore = Math.min(verifiedCerts.length * 5, 20);
  // 5 per verified cert, capped at 20 (needs 4 certs for full marks)

  // 3. Projects score (max 25)
  const projects = await Project.find({ student_ids: studentId, status: 'reviewed' });
  let projectScore = 0;
  for (const p of projects) {
    const tierPoints = { basic: 5, intermediate: 8, advanced: 12 }[p.complexity_tier] || 0;
    const ratingBonus = p.faculty_rating?.average ? (p.faculty_rating.average / 5) * 3 : 0;
    projectScore += tierPoints + ratingBonus;
  }
  projectScore = Math.min(projectScore, 25);

  // 4. Coding score (max 15) — manual stats in MVP
  const codingProfiles = await CodingProfile.find({ student_id: studentId });
  let totalProblems = codingProfiles.reduce((sum, cp) => sum + (cp.problems_solved || 0), 0);
  const codingScore = Math.min(totalProblems / 20, 15);
  // 1 point per 20 problems, capped at 15 (needs 300 problems for full marks)

  // 5. Faculty assessment score (max 5)
  // Average of all faculty ratings across all reviewed projects
  const ratedProjects = projects.filter(p => p.faculty_rating?.average);
  const facultyScore = ratedProjects.length > 0
    ? Math.min((ratedProjects.reduce((s, p) => s + p.faculty_rating.average, 0) / ratedProjects.length), 5)
    : 0;

  // Total
  const total = Math.round(skillScore + certScore + projectScore + codingScore + facultyScore);

  // Tier classification
  const tier =
    total >= 85 ? 'industry_ready' :
    total >= 65 ? 'placement_ready' :
    total >= 40 ? 'developing' : 'beginner';

  // Update student document
  await Student.findByIdAndUpdate(studentId, {
    readiness_score: total,
    readiness_tier: tier
  });

  // Save snapshot to history
  await ReadinessScoreHistory.create({
    student_id: studentId,
    score: total,
    tier,
    breakdown: { skillScore, certScore, projectScore, codingScore, facultyScore },
    calculated_at: new Date()
  });

  return { score: total, tier };
};

module.exports = { recalculateScore };
```

---

## 9. MVP Build Order

Build in this exact sequence. Each step is independently testable before moving on.

### Week 1 — Auth + Profile
- [ ] Set up Express server, MongoDB Atlas connection, `.env`
- [ ] `users` model + register + login endpoints
- [ ] JWT middleware + base role guard
- [ ] `students` and `faculty` model + profile CRUD
- [ ] Profile completeness % calculation on update

### Week 2 — Skills + Certifications + Verification
- [ ] `skill_taxonomy` model + seed 50 skills
- [ ] `skills` model + student add/delete skill endpoints
- [ ] `certifications` model + student CRUD (Drive link)
- [ ] Faculty verification queue endpoint (GET pending items)
- [ ] Approve / Reject endpoints + `verification_logs` append
- [ ] Trigger `recalculateScore` after each verification action

### Week 3 — Projects + Resumes + Score
- [ ] `projects` model + student CRUD (GitHub link)
- [ ] Faculty project rating endpoint
- [ ] `resumes` model + Drive link versioning
- [ ] `coding_profiles` model + manual stats entry
- [ ] Readiness score service fully wired up
- [ ] Score visible on student profile

### Week 4 — Search + Placement Drives
- [ ] Search endpoint with MongoDB `$and` query builder
- [ ] Filter by: CGPA, skills, section, batch, readiness tier
- [ ] Results sorted by `readiness_score` descending
- [ ] `placement_drives` model + CRUD
- [ ] Eligibility rule evaluation + auto-shortlist generation
- [ ] `applications` model + student apply endpoint

### Week 5 — HOD Dashboard + Role Assignment
- [ ] HOD dashboard stats endpoint (aggregation pipeline)
- [ ] `role_assignments` model + HOD assign/revoke endpoints
- [ ] Mentor can see their mentees
- [ ] CC can see their class
- [ ] Rep can see their section
- [ ] `notifications` model + create notification on key events

### Week 6 — Polish + Deploy
- [ ] Input validation on all endpoints (express-validator)
- [ ] Error handling middleware (global catch)
- [ ] React frontend: auth pages + student profile pages
- [ ] React frontend: faculty verification queue
- [ ] React frontend: HOD dashboard + search
- [ ] Deploy backend to Render
- [ ] Deploy frontend to Vercel or Render
- [ ] Connect to MongoDB Atlas

---

## 10. Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/skillsphere

# JWT
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRES_IN=8h

# (Phase 2 — not needed in MVP)
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_S3_BUCKET=
# SENDGRID_API_KEY=
```

---

## Appendix — SQL Conversion Guide

When migrating to PostgreSQL later, each MongoDB collection maps directly to a SQL table:

| MongoDB Collection | SQL Table | Key change |
|---|---|---|
| `users` | `users` | — |
| `students` | `students` | `links` object → separate `student_links` table |
| `faculty` | `faculty` | — |
| `role_assignments` | `role_assignments` | — |
| `skills` | `skills` | — |
| `skill_taxonomy` | `skill_taxonomy` | — |
| `certifications` | `certifications` | — |
| `projects` | `projects` | `student_ids` array → `student_projects` join table |
| `resumes` | `resumes` | — |
| `coding_profiles` | `coding_profiles` | — |
| `verification_logs` | `verification_logs` | — |
| `placement_drives` | `placement_drives` | `eligibility` JSON → `drive_eligibility` table |
| `applications` | `applications` | — |
| `notifications` | `notifications` | — |
| `readiness_score_history` | `readiness_score_history` | `breakdown` JSON → columns |

The distributed MongoDB design chosen here is intentionally SQL-shaped — references instead of deep embedding — so this migration is straightforward when needed.

---

*SkillSphere Dev Reference — v1.0 MVP*  
*Internal document — for development team use only*
