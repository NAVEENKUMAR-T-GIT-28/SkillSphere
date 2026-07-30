# Faculty My Mentees Page Contract

**Module:** Faculty Portal

**Page:** My Mentees

**Route:** `/faculty/mentees`

**Access:** Faculty

**Version:** 1.0

**Status:** Stable

---

# 1. Purpose

The My Mentees page provides faculty members with a centralized view of all students assigned to them for mentoring.

Faculty can

- Monitor student progress
- Track readiness
- Identify students needing attention
- View portfolio completion
- Navigate to Student Profile
- Add mentor notes (future)
- Schedule mentoring sessions (future)

Faculty **cannot edit student portfolio data** from this page.

---

# 2. Route

```
/faculty/mentees
```

---

# 3. Authorization

Allowed

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
My Mentees

│

├── Summary Cards

├── Search & Filters

├── Student Tabs

├── Student Table

└── Student Actions
```

---

# 5. Data Ownership

| Data | Owner |
|-------|-------|
| Student Profile | Student Service |
| Student Search | Student Search Read Model |
| Readiness Score | Student Summary |
| Portfolio Progress | Student Summary |
| Placement Status | Student Summary |
| Mentor Notes | Faculty Service (Future) |

Faculty never edits student profile data.

---

# 6. Data Sources

| Section | Source |
|----------|--------|
| Summary Cards | Dashboard Read Model |
| Student List | Student Search |
| Readiness Score | Student Summary |
| Portfolio Completion | Student Summary |
| Placement Status | Student Summary |
| Last Activity | Activity Timeline |

---

# 7. UI Layout

```
------------------------------------------------------

Summary Cards

------------------------------------------------------

Search

Filters

Tabs

------------------------------------------------------

Student Table

------------------------------------------------------

Pagination

------------------------------------------------------
```

---

# 8. Required APIs

## Summary Cards

```
GET /api/faculty/mentees/summary
```

Response

```json
{
  "totalMentees":38,
  "placementReady":12,
  "needsAttention":8,
  "averageReadiness":72.4,
  "activeThisWeek":28
}
```

---

## Student List

```
GET /api/faculty/mentees
```

Query Parameters

```
page

limit

search

section

tier

status

readiness

sort
```

Response

```json
{
  "data":[
    {
      "studentId":"",
      "name":"",
      "rollNumber":"",
      "department":"",
      "section":"",
      "readinessScore":92,
      "portfolioCompletion":85,
      "placementStatus":"READY",
      "lastActivity":"",
      "riskLevel":"LOW"
    }
  ]
}
```

---

## Student Summary

```
GET /api/faculty/student/{studentId}/summary
```

Response

```json
{
  "resumeScore":90,
  "codingScore":82,
  "projectCount":5,
  "certificateCount":7,
  "verifiedSkills":10,
  "developerScore":88
}
```

---

# 9. Summary Card Model

```typescript
interface MenteeSummary{

totalMentees:number

placementReady:number

needsAttention:number

averageReadiness:number

activeThisWeek:number

}
```

---

# 10. Student Table Model

```typescript
interface Mentee{

studentId:string

name:string

rollNumber:string

department:string

section:string

avatar:string

readinessScore:number

portfolioCompletion:number

placementStatus:
"READY"
|
"NOT_READY"
|
"IN_PROGRESS"

riskLevel:
"LOW"
|
"MEDIUM"
|
"HIGH"

lastActivity:Date

}
```

---

# 11. Student Detail Model

```typescript
interface StudentQuickSummary{

studentId:string

resumeScore:number

codingScore:number

developerScore:number

projectCount:number

certificateCount:number

verifiedSkills:number

}
```

---

# 12. UI Components

## Summary Cards

Displays

- Total Mentees
- Placement Ready
- Needs Attention
- Average Readiness
- Active This Week

---

## Search

Search by

- Student Name
- Roll Number

---

## Filters

Section

Tier

Readiness

Placement Status

Sort

---

## Tabs

```
All

Placement Ready

Needs Attention

Inactive
```

Each tab displays student count.

---

## Student Table

Each row displays

- Student Avatar
- Student Name
- Roll Number
- Department
- Section
- Readiness Score
- Portfolio Completion
- Placement Status
- Last Activity
- Risk Level
- Actions

---

## Actions

Available

```
View Student Profile

View Portfolio

Add Mentor Note (Future)

Schedule Meeting (Future)
```

---

# 13. Validation

Search

```
Minimum 2 characters
```

Filters

```
Multiple filters supported
```

Pagination

```
Server-side only
```

---

# 14. State Management

Loading

```
Skeleton Table
```

Refreshing

```
Background Refresh
```

Empty

```
No mentees assigned.
```

Error

```
Unable to load mentees.
```

---

# 15. Synchronization

Student updates profile

↓

Student Summary Updated

↓

Student Search Updated

↓

Faculty My Mentees refreshed

Student readiness changes

↓

Dashboard Updated

↓

My Mentees Updated

Faculty never manually refreshes student data.

---

# 16. Events Consumed

```
StudentProfileUpdated

ResumeUploaded

ProjectVerified

SkillVerified

CertificateVerified

CodingProfileSynced

PlacementStatusUpdated

ReadinessScoreUpdated
```

No events are published from this page.

---

# 17. Navigation

```
Dashboard

↓

My Mentees

↓

Student Profile

↓

Back
```

---

# 18. Permissions

Faculty can

- View assigned mentees
- Search students
- Filter students
- View student profile
- View portfolio progress

Faculty cannot

- Edit profile
- Delete student
- Verify submissions
- Modify readiness score

---

# 19. Performance

- Server-side pagination
- Debounced search
- Server-side filtering
- Lazy-loaded avatars
- Cached summary cards
- Refresh every 5 minutes

---

# 20. Development Rules

- Student data is read-only.
- Readiness scores must come from Student Summary.
- Portfolio completion must come from backend aggregation.
- Search and filtering must be server-side.
- Student cards should never aggregate data on the frontend.
- Navigation to Student Profile should require one click.

---

# 21. Future Enhancements

- Mentor Notes
- Student Timeline
- Meeting Scheduler
- AI Mentoring Suggestions
- Student Risk Prediction
- Bulk Messaging
- Attendance Integration
- Academic Performance Trends

---

# End of Document

**Document:** `MY_MENTEES_PAGE_CONTRACT.md`

**Module:** Faculty Portal

**Version:** 1.0

**Status:** Stable