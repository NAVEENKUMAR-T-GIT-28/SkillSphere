# Faculty Dashboard Page Contract

**Module:** Faculty Portal

**Page:** Dashboard

**Route:** `/faculty/dashboard`

**Access:** Faculty

**Version:** 1.0

**Status:** Stable

---

# 1. Purpose

The Faculty Dashboard serves as the command center for faculty members.

It provides a real-time overview of:

- Pending verification workload
- Assigned mentees
- Student readiness
- Recent student activities
- Quick navigation to daily tasks

This page **does not own any business data**.

It is a **read-only composition layer** built from multiple backend services.

---

# 2. Route

```
/faculty/dashboard
```

---

# 3. Authorization

Allowed Roles

```
Faculty
```

Not Allowed

```
Student

Placement Officer

HOD

Admin
```

---

# 4. Page Architecture

```
Faculty Dashboard

│

├── Welcome Header

├── Quick Statistics

├── Today's Priorities

├── Verification Overview

├── Readiness Distribution

├── Top Mentees

├── Recent Activity

└── Quick Actions
```

The page consumes multiple APIs but performs **no write operations**.

---

# 5. Data Sources

| Section | Source |
|----------|--------|
| Faculty Information | Faculty Service |
| Dashboard Summary | Dashboard Read Model |
| Verification Overview | Verification Service |
| Mentee Summary | Student Summary Read Model |
| Top Mentees | Student Search |
| Recent Activity | Activity Timeline |
| Quick Actions | Dashboard Summary |

---

# 6. UI Layout

```
---------------------------------------------------------

Welcome Header

---------------------------------------------------------

Summary Cards

---------------------------------------------------------

Today's Priorities

Verification Overview

Readiness Distribution

---------------------------------------------------------

Top Mentees

Recent Activity

---------------------------------------------------------

Quick Actions

---------------------------------------------------------
```

---

# 7. Required APIs

## Dashboard Summary

```
GET /api/faculty/dashboard
```

Response

```json
{
  "summary": {
    "pendingReviews": 42,
    "myMentees": 38,
    "placementReady": 12,
    "averageReadiness": 72.4,
    "completedReviewsToday": 18
  }
}
```

---

## Faculty Information

```
GET /api/faculty/profile/summary
```

Response

```json
{
  "id": "",
  "name": "",
  "designation": "",
  "department": "",
  "avatar": "",
  "assignedSections": [
    "CS-A",
    "CS-B"
  ]
}
```

---

## Today's Priorities

```
GET /api/faculty/dashboard/priorities
```

Response

```json
{
  "projects": 18,
  "skills": 12,
  "certificates": 7,
  "internships": 3,
  "resumeReviews": 2
}
```

---

## Verification Overview

```
GET /api/faculty/dashboard/verifications
```

Response

```json
{
  "projects": 13,
  "skills": 11,
  "certificates": 7,
  "internships": 6,
  "achievements": 5
}
```

---

## Readiness Distribution

```
GET /api/faculty/dashboard/readiness
```

Response

```json
[
  {
    "range": "80-100",
    "count": 8
  },
  {
    "range": "60-79",
    "count": 14
  },
  {
    "range": "40-59",
    "count": 10
  },
  {
    "range": "20-39",
    "count": 4
  },
  {
    "range": "0-19",
    "count": 2
  }
]
```

---

## Top Mentees

```
GET /api/faculty/dashboard/top-mentees
```

Response

```json
[
  {
    "studentId": "",
    "name": "",
    "department": "Computer Science",
    "readinessScore": 92,
    "trend": "+5"
  }
]
```

---

## Recent Activity

```
GET /api/faculty/dashboard/activity
```

Response

```json
[
  {
    "id": "",
    "type": "PROJECT_SUBMITTED",
    "studentName": "",
    "message": "",
    "createdAt": ""
  }
]
```

---

# 8. UI Components

## Welcome Header

Displays

- Faculty Name
- Department
- Assigned Sections
- Current Date
- Notification Shortcut

---

## Summary Cards

Displays

- Pending Reviews
- My Mentees
- Placement Ready
- Average Readiness
- Reviews Completed Today

Each card navigates to its corresponding module.

---

## Today's Priorities

Displays pending verification counts grouped by category.

Categories

- Projects
- Skills
- Certificates
- Internships
- Resume Reviews

---

## Verification Overview

Displays verification statistics using a donut chart.

Categories

- Projects
- Skills
- Certificates
- Internships
- Achievements

---

## Readiness Distribution

Displays student readiness grouped into score ranges.

Example

```
80–100

60–79

40–59

20–39

0–19
```

---

## Top Mentees

Displays

- Student Photo
- Student Name
- Department
- Readiness Score
- Weekly Trend

Clicking a student navigates to the Faculty Student Profile.

---

## Recent Activity

Displays the latest student events.

Examples

- Project Submitted
- Skill Verified
- Resume Uploaded
- Certificate Approved
- Internship Submitted

---

## Quick Actions

Shortcuts

- Review Queue
- My Mentees
- Add Mentor Note
- Schedule Meeting
- Upload Notice

---

# 9. State Management

Loading

```
Skeleton UI
```

Loaded

```
Dashboard Rendered
```

Refreshing

```
Background Refresh
```

Empty

```
No Dashboard Data Available
```

Error

```
Unable to load dashboard.
```

---

# 10. Navigation

```
Dashboard

↓

Verification Center

↓

My Mentees

↓

Student Profile

↓

Notifications
```

---

# 11. Performance

- Parallel API requests
- Lazy-load charts
- Skeleton placeholders
- Pagination for activity feed
- Cached dashboard summary
- Auto refresh every 5 minutes

---

# 12. Permissions

Faculty can

- View Dashboard
- View Assigned Students
- View Verification Statistics
- Open Student Profile
- Navigate to Verification Center

Faculty cannot

- Modify student profile data
- Create placement drives
- Manage faculty accounts

---

# 13. Synchronization

The dashboard is a **read-only page**.

It never writes data.

Updates are reflected automatically after backend events such as

- Project Verified
- Skill Approved
- Internship Reviewed
- Resume Uploaded
- Student Profile Updated

The Dashboard Read Model is synchronized through the Event Bus.

---

# 14. Development Rules

- Dashboard must never update business collections.
- Dashboard consumes only read-model APIs.
- All widgets must support loading and empty states.
- Cards should be reusable components.
- Charts should use aggregated backend data.
- Avoid client-side aggregation whenever possible.
- Navigation should require at most one click to reach core workflows.

---

# 15. Future Enhancements

- AI-powered mentoring insights
- Students requiring intervention
- Upcoming placement deadlines
- Department benchmarking
- Mentoring performance trends
- Calendar integration
- Faculty productivity analytics

---

# End of Document

**Document:** `DASHBOARD_PAGE_CONTRACT.md`

**Module:** Faculty Portal

**Version:** 1.0

**Status:** Stable