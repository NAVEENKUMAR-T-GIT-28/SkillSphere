# SkillSphere — API Reference

**Base URL:** `http://localhost:5000/api` (development) — configurable via `VITE_API_URL` on the frontend.

All endpoints are prefixed with `/api`. All responses use the standard envelope:

```json
// Success
{ "success": true, "data": <payload>, "error": null, "meta": { } }

// Error
{ "success": false, "data": null, "error": { "message": "...", "code": "ERROR_CODE" } }
```

## Authentication

Protected endpoints require an `Authorization: Bearer <jwt>` header. Tokens are issued by `/auth/login` and `/auth/register`, signed with RS256, and expire after `JWT_EXPIRES_IN` (default `8h`).

## Access Notation

- **Public** — no token required.
- **Authenticated** — any valid token.
- **Owner / Faculty / HOD** — the resource owner (student matching `:studentId`), or any user with base role `faculty` or `hod`.
- **Faculty, HOD** — base role must be `faculty` or `hod`.
- **HOD** — base role must be `hod`.
- **Admin** — base role must be `admin`.
- **Student** — base role must be `student`.

---

## 1. Health

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Returns `{ status, timestamp, uptime, environment }`. |

---

## 2. Auth (`routes/auth.js`)

| Method | Route | Access | Rate Limit | Description |
|---|---|---|---|---|
| `POST` | `/auth/register` | Public | 5/hour/IP | Register a `student` or `faculty` account and create the corresponding profile. |
| `POST` | `/auth/login` | Public | 10/15min/IP | Authenticate and receive a JWT + user summary. |

### `POST /auth/register`

Body fields:

| Field | Required | Notes |
|---|---|---|
| `email` | yes | Valid email, normalized |
| `password` | yes | Min 8 chars |
| `base_role` | yes | `student` or `faculty` only — HOD/admin accounts are created via `/admin/create-hod` |
| `full_name` | yes | |
| `department` | yes | |
| `roll_number`, `batch_year`, `graduation_year` | required if `base_role = student` | |
| `section`, `semester`, `cgpa`, `phone` | optional (student) | |
| `employee_id` | required if `base_role ∈ {faculty, hod}` | |
| `designation` | optional | |

Response `201`:
```json
{ "token": "...", "user": { "id": "...", "email": "...", "baseRole": "student", "name": "...", "profileId": "..." } }
```

Errors: `400 VALIDATION_ERROR`, `409 EMAIL_EXISTS`.

### `POST /auth/login`

Body: `{ "email": "...", "password": "..." }`

Response `200`: same shape as register's `user`/`token`.

Errors: `400 VALIDATION_ERROR`, `401 INVALID_CREDENTIALS`, `403 ACCOUNT_DEACTIVATED`.

---

## 3. Students (`routes/students.js`)

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/students/dashboard` | Student | Dashboard payload: live readiness breakdown, module summaries, last 3 notifications. |
| `GET` | `/students/:studentId/profile` | Owner / Faculty / HOD | Full student profile (with `user_id` populated). |
| `PATCH` | `/students/:studentId/profile` | Owner / HOD | Update profile fields; triggers `profile_completeness` recalculation. |
| `GET` | `/students/:studentId/applications` | Owner / Faculty / HOD | All placement applications for the student, with drive populated. |
| `GET` | `/students/:studentId/score` | Owner / Faculty / HOD | Recalculates and returns the full readiness score breakdown. |

### `PATCH /students/:studentId/profile` — allowed fields

`full_name`, `phone`, `profile_photo_url`, `career_objective` (≤500 chars, sanitized), `department`, `section`, `semester` (1–8), `cgpa` (0–10), `links` (object — merged, not replaced).

---

## 4. Skills (`routes/skills.js`)

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/skill-taxonomy` | Public | List active taxonomy skills for the picker. Query: `category`. |
| `GET` | `/students/:studentId/skills` | Owner / Faculty / HOD | List a student's skills. Query: `status`. |
| `POST` | `/students/:studentId/skills` | Owner / HOD | Add a skill from the taxonomy (status starts `pending`). |
| `DELETE` | `/students/:studentId/skills/:skillId` | Owner / HOD | Remove a skill (only if not yet `verified`). |

### `POST .../skills` body

| Field | Required | Notes |
|---|---|---|
| `taxonomy_id` | yes | Must be a valid, active `SkillTaxonomy` `_id` |
| `proficiency` | yes | `beginner`\|`intermediate`\|`advanced`\|`expert` |
| `evidence_note` | conditionally | **Required** if proficiency is `advanced` or `expert` |

Errors: `404 SKILL_NOT_FOUND`, `400 EVIDENCE_REQUIRED`, `409 DUPLICATE_SKILL`.

### `DELETE .../skills/:skillId`

Errors: `404 NOT_FOUND`, `400 CANNOT_DELETE_VERIFIED`.

---

## 5. Certifications (`routes/certifications.js`)

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/students/:studentId/certifications` | Owner / Faculty / HOD | List certifications. Query: `status`, `category`. |
| `POST` | `/students/:studentId/certifications` | Owner / HOD | Add a certification (status starts `pending`). |
| `PATCH` | `/students/:studentId/certifications/:certId` | Owner / HOD | Update a certification (only if not `verified`/`expired`). |
| `DELETE` | `/students/:studentId/certifications/:certId` | Owner / HOD | Delete a certification (only if not `verified`). |

### `POST .../certifications` body

`title` (required), `issuer` (required), `category` (`technical`\|`language`\|`soft_skills`\|`domain`\|`academic`, required), `issue_date` (ISO 8601, required), `expiry_date` (ISO 8601, optional), `drive_link` (required, Google Drive HTTPS), `credential_id`, `verification_url` (optional).

### `PATCH .../certifications/:certId`

Updatable fields: `title`, `issuer`, `category`, `issue_date`, `expiry_date`, `credential_id`, `verification_url`, `drive_link`. If the cert was `rejected`, updating it resets `status` to `pending` and clears `rejection_reason`.

Errors: `404 NOT_FOUND`, `400 CANNOT_UPDATE_LOCKED` / `400 CANNOT_DELETE_VERIFIED`.

---

## 6. Projects (`routes/projects.js`)

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/students/:studentId/projects` | Owner / Faculty / HOD | List all projects the student is a member of. |
| `POST` | `/students/:studentId/projects` | Owner / HOD | Add a new project (status starts `pending`). |
| `PATCH` | `/students/:studentId/projects/:projectId` | Owner / HOD | Update a project (only if not `reviewed`). |
| `DELETE` | `/students/:studentId/projects/:projectId` | Owner / HOD | Delete a project (only if not `reviewed`). |
| `POST` | `/projects/:projectId/rate` | Faculty, HOD | Submit/overwrite the faculty rating; sets status to `reviewed` and recalculates scores for all team members. |

### `POST .../projects` body

`title` (required), `description` (≤1000 chars, sanitized, optional), `tech_stack` (array, min 1 item, required), `github_url` (required HTTPS), `live_demo_url` (optional HTTPS), `thumbnail_url` (optional), `complexity_tier` (`basic`\|`intermediate`\|`advanced`, required), `team_member_ids` (optional array of `Student._id`), `is_featured` (optional boolean).

### `PATCH .../projects/:projectId`

Updatable fields: `title`, `description`, `tech_stack`, `github_url`, `live_demo_url`, `thumbnail_url`, `complexity_tier`, `is_featured`. Errors: `400 CANNOT_EDIT_REVIEWED`.

### `POST /projects/:projectId/rate`

Body (all required, integers 1–5): `functionality`, `code_quality`, `documentation`, `innovation`, `complexity`. Optional: `feedback` (sanitized).

Effect: computes `average` (mean of the 5 dimensions, rounded to 2 decimals), sets `status: 'reviewed'`, recalculates the readiness score for every member in `student_ids` and sends each a `score_updated` notification.

---

## 7. Resumes (`routes/resumes.js`)

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/students/:studentId/resumes` | Owner / Faculty / HOD | List all resume versions, newest first. |
| `POST` | `/students/:studentId/resumes` | Owner / HOD | Add a new version. Auto-increments `version`; sets `is_latest: true` and demotes the previous latest. |
| `DELETE` | `/students/:studentId/resumes/:resumeId` | Owner / HOD | Delete a version. If it was the latest, the next most recent version becomes `is_latest: true`. |

### `POST .../resumes` body

`drive_link` (required, Google Drive HTTPS), `label` (optional, sanitized).

---

## 8. Coding Profiles (`routes/codingProfiles.js`)

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/students/:studentId/coding-profiles` | Owner / Faculty / HOD | List all platform profiles for the student. |
| `POST` | `/students/:studentId/coding-profiles` | Owner / HOD | Add a platform profile. |
| `PATCH` | `/students/:studentId/coding-profiles/:profileId` | Owner / HOD | Update stats (`problems_solved`, `contest_rating`, `badges`, etc.); recalculates readiness score. |
| `DELETE` | `/students/:studentId/coding-profiles/:profileId` | Owner / HOD | Remove a platform profile. |

### `POST .../coding-profiles` body

`platform` (`leetcode`\|`hackerrank`\|`codechef`\|`skillrack`\|`github`\|`codeforces`, required), `username` (required), `profile_url` (required HTTPS), `problems_solved`, `contest_rating`, `badges` (optional). Unique per `(student_id, platform)`.

---

## 9. Verification Queue (`routes/faculty.js`, mounted at `/verification`)

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/verification/queue` | Faculty, HOD | Pending skills, certifications, and projects. Query: `type` (`skill`\|`certification`\|`project`), `page`, `limit`. |
| `POST` | `/verification/:type/:itemId/approve` | Faculty, HOD | Approve a pending item; recalculates score and notifies the student(s). |
| `POST` | `/verification/:type/:itemId/reject` | Faculty, HOD | Reject with a required reason; recalculates score and notifies the student. |

`:type` must be `skill`, `certification`, or `project` — otherwise `400 INVALID_TYPE`.

### `GET /verification/queue`

Without `type`, returns up to 10 items of each kind plus totals:
```json
{
  "skills": { "items": [...], "total": 12 },
  "certifications": { "items": [...], "total": 4 },
  "projects": { "items": [...], "total": 7 }
}
```
With `type`, that section is paginated by `page`/`limit` (default 20); the others remain capped at 10.

### `POST /verification/:type/:itemId/approve`

Body: `comment` (optional, sanitized).

Effects:
- `skill`/`certification` → `status: 'verified'`, `verified_by`, `verified_at` set.
- `project` → `status: 'reviewed'`.
- Appends `VerificationLog` (`action: 'approved'`).
- Recalculates the submitting student's readiness score; sends `verification_approved` and `score_updated` notifications.
- For team projects, also recalculates and notifies every other team member.

Errors: `400 INVALID_TYPE`, `404 NOT_FOUND`, `400 ALREADY_PROCESSED` (already `verified`/`reviewed`).

### `POST /verification/:type/:itemId/reject`

Body: `reason` (required, sanitized), `comment` (optional, sanitized).

Effects: `status: 'rejected'`, `rejection_reason` set, `VerificationLog` (`action: 'rejected'`), score recalculated, `verification_rejected` notification sent.

---

## 10. Search (`routes/search.js`)

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/search/students` | Faculty, HOD | Multi-filter student search, sorted by `readiness_score` desc by default. `links` field is excluded from results. |

### Query Parameters

| Param | Type | Effect |
|---|---|---|
| `cgpa_min`, `cgpa_max` | number | `cgpa` range filter |
| `department` | string | Exact match |
| `section` | string (comma-separated) | `$in` if multiple |
| `batch_year` | string (comma-separated numbers) | `$in` if multiple |
| `graduation_year` | string (comma-separated numbers) | `$in` if multiple |
| `tier` | string (comma-separated) | `readiness_tier` `$in` if multiple |
| `name` | string | Case-insensitive partial match on `full_name` |
| `skills` | string (comma-separated skill names) | Returns only students with **all** listed skills `verified` (via aggregation) |
| `page`, `limit` | number | Pagination (default `1`, `20`) |
| `sort_by`, `sort_order` | string | Default `readiness_score`, `desc` |

Response `meta`: `{ total, page, limit, pages }`.

---

## 11. Placement Drives & Applications (`routes/placement.js`)

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/placement-drives` | Authenticated | List drives. Query: `status`, `page`, `limit`. |
| `POST` | `/placement-drives` | HOD | Create a drive; notifies all currently-eligible students. |
| `GET` | `/placement-drives/:id` | Authenticated | Drive details. If the caller is a student, includes `eligibility_status`. |
| `DELETE` | `/placement-drives/:id` | HOD | Delete a drive, cascading to its applications. |
| `GET` | `/placement-drives/:id/shortlist` | Faculty, HOD | Eligible students + existing applications. |
| `POST` | `/placement-drives/:id/apply` | Student | Apply to a drive. |
| `PATCH` | `/applications/:id/status` | Faculty, HOD | Update an application's pipeline status. |

### `POST /placement-drives` body

`company_name`, `role_title` (required, sanitized), `drive_date`, `application_deadline` (ISO 8601, required), `drive_type` (`oncampus`\|`offcampus`\|`internship`, required), `eligibility` (optional object — see [Database.md §3.11](./Database.md#311-placementdrive)), plus optional `job_description_url`, `ctc`, `location`, `openings`.

### `POST /placement-drives/:id/apply`

Validates: application deadline not passed (`400 DEADLINE_PASSED`), drive not `closed` (`400 DRIVE_CLOSED`), student profile exists (`404 PROFILE_NOT_FOUND`), eligibility rules satisfied (`403 NOT_ELIGIBLE` with reasons), not already applied (`409 ALREADY_APPLIED`).

### `PATCH /applications/:id/status` body

`status` (required: `shortlisted`\|`round1`\|`round2`\|`selected`\|`rejected`), `notes` (optional, sanitized). Updates `last_status_update`.

### Eligibility Evaluation

Both `findEligibleStudents(drive)` (bulk, for shortlisting/notifications) and `checkStudentEligibility(student, drive)` (single student, for `apply`/detail views) evaluate the drive's `eligibility` object:

- `min_cgpa` — student `cgpa >= min_cgpa`
- `batch_years` — student `batch_year` in list
- `departments` — student `department` in list
- `sections` — student `section` in list
- `min_readiness_score` — student `readiness_score >= min_readiness_score`
- `required_skills` — student has **all** listed skill names with `status: 'verified'`

---

## 12. HOD (`routes/hod.js`, mounted at `/hod`)

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/hod/dashboard` | HOD | Aggregated KPIs (see below). |
| `GET` | `/hod/students` | HOD | All students, filterable by `department`, `batch_year`, `section`, `tier`; paginated. |
| `POST` | `/hod/role-assignments` | HOD | Assign a dynamic role (`rep`\|`mentor`\|`cc`). |
| `GET` | `/hod/role-assignments` | HOD | List active role assignments, enriched with assignee names. |
| `DELETE` | `/hod/role-assignments/:id` | HOD | Revoke a role assignment (sets `revoked_at`, optional `reason`). |
| `GET` | `/hod/verification-logs` | HOD | Audit trail. Filterable by `item_type`, `action`, `student_id`; paginated. |
| `GET` | `/hod/users` | HOD | Search students/faculty by name, email, roll number, or employee ID for role-assignment pickers. Query: `search` (required), `role` (`student`\|`faculty`, required), `limit`. |
| `GET` | `/hod/classes` | HOD | Distinct `(department, section, batch_year)` combinations present in `students`, with a `label`. |

### `GET /hod/dashboard` response shape

```json
{
  "overview": { "total_students": N, "avg_readiness_score": N, "active_drives": N, "active_roles": N },
  "tier_distribution": [ { "_id": "placement_ready", "count": N }, ... ],
  "department_stats": [ { "department": "...", "count": N, "avg_score": N, "avg_cgpa": N }, ... ],
  "verification": {
    "pending": { "skills": N, "certifications": N, "projects": N },
    "completed": { "skills": N, "certifications": N, "projects": N }
  },
  "placement": { "active_drives": N, "total_applications": N, "selected_students": N },
  "top_students": [ ...top 10 by readiness_score ],
  "top_skills": [ { "_id": "skill name", "count": N }, ... top 10 verified ]
}
```

### `POST /hod/role-assignments` body

`user_id` (required, ObjectId), `role` (`rep`\|`mentor`\|`cc`, required), `scope_type` (`student`\|`class`\|`section`, required), `scope_id` (optional ObjectId), `scope_label` (required), `scope_data` (optional: `{ department, section, batch_year }`).

Errors: `404 USER_NOT_FOUND`, `409 ROLE_EXISTS` (duplicate active assignment for the same role + scope).

---

## 13. Notifications (`routes/notifications.js`)

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/notifications` | Authenticated | List own notifications. Query: `is_read`, `page`, `limit`. `meta` includes `unread` count. |
| `PATCH` | `/notifications/:id/read` | Authenticated | Mark one notification as read. |
| `PATCH` | `/notifications/read-all` | Authenticated | Mark all unread notifications as read; returns `modified` count. |

---

## 14. My Access (`routes/myAccess.js`, mounted at `/my`)

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/my/mentees` | Faculty, HOD | Students the caller mentors (via active `mentor` role assignments). |
| `GET` | `/my/class` | Faculty, Student, HOD | Students in the caller's assigned class/section (via active `cc`/`rep` role assignment). Errors: `403 ROLE_NOT_ASSIGNED`, `400 INVALID_SCOPE` (legacy label format only). |

---

## 15. Admin (`routes/admin.js`)

| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/admin/create-hod` | Admin | Create a new HOD account + Faculty-style profile. |

Body: `email`, `password` (min 8), `full_name`, `department`, `employee_id` (all required), `phone`, `designation` (optional, defaults to "Head of Department").

---

## 16. Error Codes Reference

| Code | HTTP Status | Meaning |
|---|---|---|
| `NO_TOKEN` | 401 | Missing `Authorization` header |
| `TOKEN_EXPIRED` | 401 | JWT expired |
| `INVALID_TOKEN` | 401 | JWT malformed/invalid signature |
| `NOT_AUTHENTICATED` | 401 | `requireRole` called without `req.user` |
| `INSUFFICIENT_ROLE` | 403 | Base role not permitted |
| `NOT_OWNER` | 403 | Student attempting to access another student's resource |
| `PROFILE_NOT_FOUND` | 404 | Student profile missing for the authenticated user |
| `ROLE_NOT_ASSIGNED` | 403 | No active dynamic role of the required type |
| `SCOPE_MISMATCH` | 403 | Dynamic role exists but scope doesn't match |
| `VALIDATION_ERROR` | 400 | express-validator failure |
| `DUPLICATE_KEY` | 409 | Mongoose unique index violation |
| `CAST_ERROR` | 400 | Invalid ObjectId or type |
| `ROUTE_NOT_FOUND` | 404 | Unmatched route (global 404 handler) |
| `SERVER_ERROR` | 500 | Unhandled error (default) |
| *(plus route-specific codes documented above, e.g. `EVIDENCE_REQUIRED`, `DUPLICATE_SKILL`, `ALREADY_APPLIED`, `NOT_ELIGIBLE`, etc.)* | varies | |
