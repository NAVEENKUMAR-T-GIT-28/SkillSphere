# SkillSphere Database Standards

Version: 2.0

Document: Database Standards

Status: Source of Truth

Applies To

- Student Module
- Faculty Module
- Placement Module
- Administration Module
- Analytics
- Future Services

---

# Purpose

This document defines the database architecture, ownership model, synchronization strategy, collection standards, and persistence rules used throughout SkillSphere.

These standards ensure that every piece of data has a single source of truth, minimizes duplication, and keeps read models synchronized using an Event-Driven Architecture.

---

# Database Philosophy

SkillSphere is **not** a CRUD application.

It is an **event-driven intelligence platform** built using:

- MongoDB
- CQRS
- Repository Pattern
- Event Bus
- Read Models
- Domain Ownership

The database is designed around **business domains**, not UI pages.

---

# Core Design Principles

## 1. Single Source of Truth

Every editable field must have exactly **one owner collection**.

Example

```
Student Name

Owner

students.fullName
```

Never store editable names inside

- skills
- projects
- certificates
- resumes
- coding_profiles

Instead store

```
studentId
```

and resolve through the owner.

---

## 2. Data Categories

Every stored value belongs to one of three categories.

### Owner Data

Editable.

Source of truth.

Example

```
students
projects
skills
internships
```

---

### Read Model Data

Derived.

Rebuildable.

Never edited directly.

Example

```
student_search

dashboard_summary

placement_summary
```

---

### Snapshot Data

Historical.

Immutable.

Example

```
placement_application

cgpa = 8.42

resume_score = 78

captured_at = apply_time
```

Snapshots never change after creation.

---

# Database Layers

```
Presentation Layer

↓

Read Models

↓

Operational Collections

↓

Master Collections

↓

Infrastructure Collections
```

---

## Layer 1

Master Data

Contains core entities.

```
users

students

faculty

departments

skill_taxonomy

companies
```

Owns business identity.

---

## Layer 2

Operational Data

Business workflows.

```
skills

projects

internships

certifications

achievements

coding_profiles

resumes

notifications

placement_drives

applications
```

---

## Layer 3

Supporting Collections

```
files

audit_logs

activity_logs

event_store

scheduled_jobs
```

---

## Layer 4

Read Models

Optimized for querying.

```
student_search

dashboard_summary

faculty_dashboard

placement_dashboard
```

---

## Layer 5

Analytics

Derived intelligence.

```
resume_analysis

coding_snapshots

developer_metrics

placement_statistics
```

Never updated manually.

---

# Collection Ownership

Every collection must declare

- Owner
- Published Events
- Consumed Events
- Read Models Updated

Example

```
Collection

projects

Owner

Project Domain

Publishes

ProjectCreated

ProjectUpdated

ProjectVerified

Consumes

StudentDeleted

Updates

student_search

dashboard_summary
```

---

# Collection Design Rules

Each collection should represent exactly one business concept.

Correct

```
projects

skills

resumes
```

Avoid

```
studentPortfolio

everythingInsideOneCollection
```

---

# Document Size

Documents should remain focused.

Avoid

```
student

skills[]

projects[]

certificates[]

coding[]

internships[]

achievements[]
```

Prefer

```
students

skills

projects

internships

certifications
```

Each in its own collection.

---

# Relationship Standard

MongoDB references should be used.

Store

```
studentId
```

Never embed entire student objects.

Correct

```
{
    studentId
}
```

Avoid

```
{
    student:{
       name,
       email,
       cgpa
    }
}
```

---

# Read Models

Read Models exist only for performance.

Examples

```
student_search

dashboard_summary

placement_summary
```

Read Models

- are rebuildable
- never receive direct writes
- never own data

---

# Synchronization

Synchronization always happens through EventBus.

Correct Flow

```
MongoDB

↓

Domain Event

↓

Event Bus

↓

Projection Handler

↓

Read Model
```

Incorrect Flow

```
Controller

↓

Update Mongo

↓

Update StudentSearch

↓

Update Dashboard
```

Controllers must never synchronize multiple collections.

---

# Event Synchronization Rules

Every write operation

```
Create

Update

Delete
```

must

1. Update Owner Collection

2. Publish Domain Event

3. Update Read Models asynchronously

---

# Versioning

Important entities should be versioned.

Versioned Collections

```
resumes

projects

student_profiles
```

Each document should include

```
version

createdAt

updatedAt
```

Historical versions should never be overwritten.

---

# File Storage

Binary files should never be stored in MongoDB.

Store only metadata.

```
files

id

storageKey

mimeType

size

checksum

uploadedBy
```

Operational collections reference

```
fileId
```

Actual files remain in object storage.

---

# Resume Design

Separate

```
resumes
```

from

```
resume_analysis
```

Resume owns

- file
- version

Analysis owns

- ATS
- grammar
- keywords
- recommendations

---

# Coding Platform Design

Separate

```
coding_profiles
```

from

```
coding_snapshots
```

Profile

```
student

platform

username

lastSync
```

Snapshot

```
date

rating

problemsSolved

streak

contestRank
```

Allows historical graphs.

---

# Status Design

A single field should represent one concept.

Avoid

```
status
```

when it mixes

- lifecycle
- verification
- publication

Prefer

```
verificationStatus

completionStatus

publicationStatus
```

---

# Audit Metadata

Every collection should contain

```
_id

createdAt

updatedAt

createdBy

updatedBy

version
```

Soft deletable collections additionally include

```
isDeleted

deletedAt

deletedBy
```

---

# Naming Conventions

Collections

Plural

```
students

projects

skills
```

Fields

camelCase

```
profileCompletion

resumeScore

verificationStatus
```

Database references

```
studentId

facultyId

companyId
```

---

# Index Standards

Always index

- Foreign Keys
- Frequently searched fields
- Status
- CreatedAt
- UpdatedAt

Compound indexes should be used for

```
studentId + status

studentId + platform

companyId + driveDate
```

---

# Snapshot Rules

Business processes requiring historical accuracy must create snapshots.

Examples

Placement Applications

Resume Submitted for Drive

Interview Score

CGPA at Application

Snapshots are immutable.

---

# Cache Rules

Caches are disposable.

Examples

```
dashboard_summary

student_summary
```

They may be deleted and rebuilt.

Never edit them manually.

---

# Conflict Resolution

Concurrent updates should use optimistic concurrency.

Each update checks

```
version
```

If versions mismatch

```
409 Conflict
```

The client must refresh before retrying.

---

# Database Transactions

Use transactions only when multiple owner collections must change atomically.

Read Models should **not** participate in transactions.

They are updated asynchronously through events.

---

# Data Retention

Operational Data

Retained permanently unless deleted by policy.

Audit Logs

Minimum 1 year.

Notifications

Archive after retention period.

Analytics Snapshots

Never overwrite.

---

# Performance Guidelines

Prefer

- Read Models
- Indexes
- Pagination
- Projection Queries

Avoid

- Large embedded arrays
- Multi-collection joins in request paths
- Runtime aggregations for dashboards

---

# Development Rules

✅ Every field has one owner.

✅ Never duplicate editable data.

✅ Read Models are read-only.

✅ Snapshots are immutable.

✅ Synchronization happens only through EventBus.

✅ Files live outside MongoDB.

✅ Controllers never synchronize multiple collections.

✅ Operational collections own business data.

✅ Read Models own performance.

✅ Analytics collections own intelligence.

---

# End of Document

DATABASE_STANDARDS.md

Version: 2.0

Status: Source of Truth