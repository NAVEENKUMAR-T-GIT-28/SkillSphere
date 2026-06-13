# SkillSphere — Database Documentation

**Database:** MongoDB (Mongoose ODM)
**Design style:** Distributed document collections with `ObjectId` references (not deeply embedded), so each entity is independently queryable/updatable and remains convertible to a relational schema later.

---

## 1. Collections Overview

| Collection (model) | Purpose |
|---|---|
| `users` (`User`) | Authentication credentials and permanent base role. |
| `students` (`Student`) | Student profile, academic data, computed readiness score/tier and completeness. |
| `faculty` (`Faculty`) | Faculty/HOD/Admin profile (one record per non-student user with a profile). |
| `role_assignments` (`RoleAssignment`) | Dynamic roles: `rep`, `mentor`, `cc`, with scope and revocation tracking. |
| `skill_taxonomy` (`SkillTaxonomy`) | Admin-managed master list of valid skills (50 seeded across 8 categories). |
| `skills` (`Skill`) | One document per skill a student has claimed, referencing the taxonomy. |
| `certifications` (`Certification`) | Certification entries with Google Drive evidence link and verification status. |
| `projects` (`Project`) | Project portfolio entries, supports teams, includes faculty rating subdocument. |
| `resumes` (`Resume`) | Versioned resume entries (Drive links), one `is_latest: true` per student. |
| `coding_profiles` (`CodingProfile`) | One document per coding platform per student with manually entered stats. |
| `placement_drives` (`PlacementDrive`) | Company drives with embedded eligibility rules. |
| `applications` (`Application`) | Student × Drive join table tracking pipeline status. |
| `notifications` (`Notification`) | In-app notifications per user. |
| `verification_logs` (`VerificationLog`) | Immutable, append-only audit trail of all verification actions. |
| `readiness_score_history` (`ReadinessScoreHistory`) | Snapshot of a student's score/tier/breakdown every time it's recalculated. |

---

## 2. Entity-Relationship Summary

```
users (1) ──────── (1) students
users (1) ──────── (1) faculty           [faculty, hod, admin profiles]
users (1) ──────── (N) role_assignments
users (1) ──────── (N) notifications

students (1) ────── (N) skills
students (1) ────── (N) certifications
students (N) ────── (N) projects          [via student_ids array]
students (1) ────── (N) resumes
students (1) ────── (N) coding_profiles
students (1) ────── (N) applications
students (1) ────── (N) readiness_score_history

skill_taxonomy (1) ── (N) skills           [taxonomy_id reference]

placement_drives (1) ── (N) applications
```

---

## 3. Schema Reference

### 3.1 `User`

| Field | Type | Notes |
|---|---|---|
| `email` | String | Required, unique, lowercase, trimmed, validated format |
| `password` | String | Required, min 8 chars, `select: false`, bcrypt-hashed (12 rounds) on save |
| `base_role` | String enum | `student`, `faculty`, `hod`, `admin` |
| `is_active` | Boolean | Default `true`; deactivated accounts cannot log in |
| `created_at` / `updated_at` | Date | Auto timestamps |

Instance methods: `comparePassword(candidate)`, and a `toJSON()` override that strips `password`.

### 3.2 `Student`

| Field | Type | Notes |
|---|---|---|
| `user_id` | ObjectId → User | Required, unique (1:1) |
| `full_name`, `phone`, `profile_photo_url`, `career_objective` | String | `career_objective` max 500 chars |
| `roll_number` | String | Required, unique |
| `department` | String | Required |
| `batch_year`, `graduation_year` | Number | Required |
| `section` | String | |
| `semester` | Number | 1–8 |
| `cgpa` | Number | 0–10 |
| `links` | Embedded object | `github`, `linkedin`, `portfolio`, `leetcode`, `hackerrank`, `codechef`, `skillrack`, `codeforces` — always fetched with profile (small fixed set) |
| `readiness_score` | Number | 0–100, default 0, recomputed on verification events |
| `readiness_tier` | String enum | `beginner` \| `developing` \| `placement_ready` \| `industry_ready`, default `beginner` |
| `profile_completeness` | Number | 0–100%, recomputed on every save |

**Indexes:** `{ department, batch_year, section }` (compound), `{ cgpa }`, `{ readiness_score: -1 }`, plus unique on `user_id` and `roll_number`.

**Computed behavior:**
- `calculateCompleteness()` — weighted scoring across 11 profile fields (weights summing to 70) plus a 30-point allocation spread proportionally across the 8 link fields (any filled link contributes `30 / 8` rounded). Runs in a `pre('save')` hook whenever the document is modified.

### 3.3 `Faculty`

One record per `faculty`/`hod`/`admin` user with a human profile.

| Field | Type | Notes |
|---|---|---|
| `user_id` | ObjectId → User | Required, unique |
| `full_name`, `department` | String | Required |
| `designation` | String | Optional (e.g. "Head of Department" for HOD accounts) |
| `employee_id` | String | Required, unique |
| `phone` | String | Optional |

### 3.4 `RoleAssignment`

| Field | Type | Notes |
|---|---|---|
| `user_id` | ObjectId → User | Required — who holds the role |
| `role` | String enum | `rep`, `mentor`, `cc` |
| `scope_type` | String enum | `student`, `class`, `section` |
| `scope_id` | ObjectId | Optional — e.g. the specific student a mentor is assigned to |
| `scope_label` | String | Human-readable label (e.g. `"CSE-A-2024"`) |
| `scope_data` | Embedded | `{ department, section, batch_year }` — structured scope for class/section lookups |
| `assigned_by` | ObjectId → User | Required |
| `assigned_at` | Date | Default now |
| `revoked_at` | Date | `null` = active |
| `revoke_reason` | String | Optional |

**Indexes:** `{ user_id, revoked_at }`, `{ user_id, role, revoked_at }`.
No `timestamps` — uses `assigned_at`/`revoked_at` explicitly.

### 3.5 `SkillTaxonomy`

| Field | Type | Notes |
|---|---|---|
| `name` | String | Required, unique |
| `category` | String enum | `programming`, `cloud`, `ai_ml`, `cybersecurity`, `design`, `soft_skills`, `domain`, `devops` |
| `is_trending` | Boolean | Default `false` |
| `is_active` | Boolean | Default `true` — inactive skills are hidden from the picker |

Seeded with 50 skills: programming (10), cloud (6), ai_ml (7), cybersecurity (5), design (5), soft_skills (6), domain (6), devops (5).

### 3.6 `Skill`

One document per skill **claimed by a student** (not the taxonomy entry itself).

| Field | Type | Notes |
|---|---|---|
| `student_id` | ObjectId → Student | Required |
| `taxonomy_id` | ObjectId → SkillTaxonomy | Required |
| `skill_name` | String | Denormalized copy of taxonomy name (fast reads) |
| `proficiency` | String enum | `beginner`, `intermediate`, `advanced`, `expert` |
| `evidence_note` | String | Required (enforced in route, not schema) when proficiency is `advanced`/`expert` |
| `status` | String enum | `pending` (default), `verified`, `rejected` |
| `verified_by` | ObjectId → User | Set on approve/reject |
| `verified_at` | Date | Set on approve/reject |
| `rejection_reason` | String | Set on reject |

**Indexes:** `{ student_id }`, `{ student_id, status }`, `{ taxonomy_id, status }`, and a **unique** compound index `{ student_id, taxonomy_id }` preventing duplicate skill claims.

### 3.7 `Certification`

| Field | Type | Notes |
|---|---|---|
| `student_id` | ObjectId → Student | Required |
| `title`, `issuer` | String | Required |
| `category` | String enum | `technical`, `language`, `soft_skills`, `domain`, `academic` |
| `issue_date` | Date | Required |
| `expiry_date` | Date | Nullable — used for expiry alert jobs |
| `credential_id`, `verification_url` | String | Optional |
| `drive_link` | String | Required — must be a `drive.google.com`/`docs.google.com` HTTPS URL |
| `status` | String enum | `pending` (default), `verified`, `rejected`, `expired` |
| `verified_by`, `verified_at`, `rejection_reason` | — | Same pattern as `Skill` |

**Indexes:** `{ student_id }`, `{ student_id, status }`, `{ expiry_date }` (for the planned expiry-alert cron job — see [Future Enhancements] in README).

### 3.8 `Project`

| Field | Type | Notes |
|---|---|---|
| `student_ids` | [ObjectId → Student] | All team members (includes creator) |
| `created_by` | ObjectId → Student | Required — original submitter |
| `title` | String | Required |
| `description` | String | Max 1000 chars |
| `tech_stack` | [String] | At least one entry required (enforced in route) |
| `github_url` | String | Required HTTPS URL |
| `live_demo_url`, `thumbnail_url` | String | Optional |
| `complexity_tier` | String enum | `basic`, `intermediate`, `advanced` |
| `faculty_rating` | Embedded | `rated_by`, `rated_at`, five 1–5 dimensions (`functionality`, `code_quality`, `documentation`, `innovation`, `complexity`), `average`, `feedback` |
| `is_featured` | Boolean | Default `false` |
| `status` | String enum | `pending` (default), `reviewed`, `rejected` |
| `rejection_reason` | String | |

**Indexes:** `{ student_ids }`, `{ created_by }`, `{ tech_stack }`.

### 3.9 `Resume`

| Field | Type | Notes |
|---|---|---|
| `student_id` | ObjectId → Student | Required |
| `version` | Number | Required, auto-incremented per student |
| `drive_link` | String | Required, must be a Google Drive HTTPS link |
| `label` | String | Optional (e.g. "ATS-optimized v2") |
| `is_latest` | Boolean | Default `true`; only one `true` per student maintained by route logic |
| `uploaded_at` | Date | Default now |

**Indexes:** `{ student_id }`, `{ student_id, is_latest }`. No `timestamps`.

### 3.10 `CodingProfile`

| Field | Type | Notes |
|---|---|---|
| `student_id` | ObjectId → Student | Required |
| `platform` | String enum | `leetcode`, `hackerrank`, `codechef`, `skillrack`, `github`, `codeforces` |
| `username` | String | Required |
| `profile_url` | String | Required HTTPS URL |
| `problems_solved` | Number | Default 0, min 0 — manually entered in MVP |
| `contest_rating` | Number | Default 0, min 0 |
| `badges` | [String] | |
| `last_updated` | Date | Default now |

**Indexes:** `{ student_id }`, unique compound `{ student_id, platform }` — one profile per platform per student.

### 3.11 `PlacementDrive`

| Field | Type | Notes |
|---|---|---|
| `created_by` | ObjectId → User | Required (HOD) |
| `company_name`, `role_title` | String | Required |
| `job_description_url`, `ctc`, `location` | String | Optional |
| `drive_date`, `application_deadline` | Date | Required |
| `openings` | Number | Optional, min 0 |
| `drive_type` | String enum | `oncampus`, `offcampus`, `internship` |
| `eligibility` | Embedded | `min_cgpa`, `batch_years[]`, `departments[]`, `sections[]`, `required_skills[]`, `min_readiness_score` — all evaluated at query time, not stored per-student |
| `status` | String enum | `upcoming` (default), `active`, `closed` |

**Indexes:** `{ status }`, `{ drive_date }`, `{ application_deadline }`.

### 3.12 `Application`

| Field | Type | Notes |
|---|---|---|
| `student_id` | ObjectId → Student | Required |
| `drive_id` | ObjectId → PlacementDrive | Required |
| `status` | String enum | `eligible` (default), `applied`, `shortlisted`, `round1`, `round2`, `selected`, `rejected` |
| `applied_at` | Date | Set when student applies |
| `last_status_update` | Date | Default now, updated on every status change |
| `notes` | String | Faculty/HOD notes |

**Indexes:** `{ drive_id }`, `{ student_id }`, `{ drive_id, status }`, and a **unique** compound `{ student_id, drive_id }` preventing duplicate applications. No `updatedAt` (only `created_at`).

### 3.13 `Notification`

| Field | Type | Notes |
|---|---|---|
| `user_id` | ObjectId → User | Required |
| `type` | String enum | `verification_approved`, `verification_rejected`, `drive_announced`, `score_updated`, `role_assigned`, `general` |
| `title`, `message` | String | Required |
| `is_read` | Boolean | Default `false` |
| `link` | String | Frontend route to deep-link to |

**Indexes:** `{ user_id, is_read }`, `{ user_id, created_at: -1 }`. No `updatedAt`.

### 3.14 `VerificationLog`

Immutable audit trail.

| Field | Type | Notes |
|---|---|---|
| `item_type` | String enum | `skill`, `certification`, `project` |
| `item_id` | ObjectId | The verified item's `_id` |
| `student_id` | ObjectId → Student | Required |
| `actor_id` | ObjectId → User | Who performed the action |
| `action` | String enum | `submitted`, `approved`, `rejected`, `clarification_requested` |
| `comment` | String | Optional context/reason |
| `timestamp` | Date | Default now |

**Indexes:** `{ item_type, item_id }`, `{ student_id }`, `{ actor_id }`, `{ timestamp: -1 }`. No `timestamps`.

**Append-only enforcement:** Mongoose `pre` hooks throw on `findOneAndUpdate`, `updateOne`, `updateMany`, `findOneAndDelete`, `deleteOne`, and `deleteMany` — these operations are structurally impossible at the application layer, guaranteeing the audit trail cannot be altered or erased.

### 3.15 `ReadinessScoreHistory`

| Field | Type | Notes |
|---|---|---|
| `student_id` | ObjectId → Student | Required |
| `score` | Number | 0–100 |
| `tier` | String enum | `beginner`, `developing`, `placement_ready`, `industry_ready` |
| `breakdown` | Embedded | `skills_score`, `certs_score`, `projects_score`, `coding_score`, `faculty_score` |
| `calculated_at` | Date | Default now |

**Index:** `{ student_id, calculated_at: -1 }`. No `timestamps`.

---

## 4. Validation Patterns

- **Google Drive links** (`Certification.drive_link`, `Resume.drive_link`) must match `^https://(drive|docs)\.google\.com/`.
- **External links** (`Project.github_url`, `live_demo_url`, `CodingProfile.profile_url`) must be HTTPS URLs (generic).
- **Free-text fields** that accept user input (career objective, project descriptions, feedback, rejection reasons, drive company/role names) are passed through `sanitizeField` (strips all HTML) before persistence.

---

## 5. Referential Integrity Notes

MongoDB does not enforce foreign keys; integrity is maintained at the application layer:

- Deleting a `PlacementDrive` cascades to `Application` documents for that drive (`DELETE /api/placement-drives/:id`).
- A `Skill` cannot be deleted once `status: 'verified'` (must be revoked by faculty through a future workflow).
- A `Certification`/`Project` cannot be edited or deleted once `verified`/`reviewed` — a new version must be submitted instead.
- The `Skill` unique index `{ student_id, taxonomy_id }` prevents a student from adding the same taxonomy skill twice.
- The `Application` unique index `{ student_id, drive_id }` prevents duplicate applications to the same drive.
- The `CodingProfile` unique index `{ student_id, platform }` prevents duplicate platform entries.

---

## 6. Readiness Score Engine

Implemented in `backend/services/readinessScore.js`, invoked via `recalculateScore(studentId)` after every verification decision and faculty project rating.

### Formula (max 100)

| Component | Max | Calculation |
|---|---|---|
| **Skills** | 20 | `min(verified_skill_count × 2.5, 20)` — needs 8 verified skills for full marks |
| **Certifications** | 20 | `min(verified_cert_count × 5, 20)` — needs 4 verified certs for full marks |
| **Projects** | 25 | Sum of tier points for projects with `status: 'reviewed'`: `basic = 5`, `intermediate = 8`, `advanced = 12`, capped at 25 |
| **Coding** | 15 | `min(total_problems_solved / 20, 15)` across all platforms — needs 300 total problems for full marks |
| **Faculty Assessment** | 5 | Average of `faculty_rating.average` across all rated/reviewed projects, capped at 5 (0 if no rated projects) |

`total = round(skills + certs + projects + coding + faculty)`

### Tier Classification

| Tier | Score Range |
|---|---|
| `industry_ready` | 85 – 100 |
| `placement_ready` | 65 – 84 |
| `developing` | 40 – 64 |
| `beginner` | 0 – 39 |

### Side Effects of `recalculateScore`

1. Updates `Student.readiness_score` and `Student.readiness_tier`.
2. Appends a snapshot to `ReadinessScoreHistory` with the rounded breakdown (each component rounded to 2 decimals).
3. Returns `{ score, tier, breakdown }` to the caller for use in API responses and notifications.

> **Note:** the breakdown values stored in `ReadinessScoreHistory` and surfaced via the API (`skills_score`, `certs_score`, etc.) represent each component's **points scored**, not a percentage — e.g. `skills_score: 17.5` means 17.5 of a possible 20 points.
