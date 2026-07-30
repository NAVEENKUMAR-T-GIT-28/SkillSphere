# SkillSphere Coding Profiles Page Data Contract

Version: 1.0
Module: Student Coding Profiles
Status: Source of Truth
Owner: Coding Domain

---

# Purpose

This document defines the complete data contract for the Student Coding Profiles page.

It includes

- Platform Integration
- Coding Statistics
- Developer Analytics
- Coding DNA
- Developer Strength Score
- Achievements
- Certificates
- StudentSearch Synchronization

The Coding Domain aggregates programming platform statistics and computes coding insights for students.

---

# Route

/student/coding-profiles

---

# Authorization

Bearer JWT

Role Required

Student

---

# Architecture

              Coding Profiles UI
                      │
                      ▼
        GET /api/coding-profiles
                      │
                      ▼
         Coding Profiles Controller
                      │
                      ▼
          Coding Profiles Service
                      │
                      ▼
          Coding Platform Services
                      │
          ┌──────────┼───────────┐
          ▼          ▼           ▼
     LeetCode   HackerRank   SkillRack
                      │
                      ▼
                  GitHub
                      │
                      ▼
             Coding Repository
                      │
                      ▼
             StudentSearch.coding
                      │
                      ▼
          Dashboard Coding Widget

---

# Frontend Layout

Coding Profiles Page

├── Summary Header
├── Platform Cards
├── Developer Analytics
├── Developer Strength
├── Coding DNA
├── Achievements
└── Certificates

================================================================================
SECTION 1
SUMMARY HEADER
================================================================================

Displays

• Student Name

• Problem Solved

• Certificates

• Top Skill

• Platforms Linked

• SkillRack Rank

• Last Synced

Frontend Needs

{
    "student_name":"NAVEENKUMAR T",

    "problems_solved":2380,

    "certificates":30,

    "top_skill":"Python",

    "platforms_linked":4,

    "skillrack_rank":1949,

    "last_synced":"2026-07-06"
}

Backend Source

Aggregated Coding Summary

================================================================================
SECTION 2
LEETCODE CARD
================================================================================

Displays

Easy

Medium

Hard

Total Solved

Profile Link

Last Sync

Frontend Needs

{
    "linked":true,

    "profile_url":"https://leetcode.com/u/Naveenkumar_T/",

    "total_solved":66,

    "easy":45,

    "medium":17,

    "hard":4,

    "ranking":2163291,

    "last_synced":"2026-07-06"
}

================================================================================
SECTION 3
HACKERRANK CARD
================================================================================

Displays

Profile

Top Badge

Stars

Certificates

Badges

Frontend Needs

{
    "linked":true,

    "profile_url":"https://www.hackerrank.com/profile/naveenkumarsnr28",

    "top_badge":"Python",

    "stars":5,

    "certificates":2
}

================================================================================
SECTION 4
SKILLRACK CARD
================================================================================

Displays

Problems Solved

Points

Rank

Certificates

Frontend Needs

{
    "linked":true,

    "solved":2245,

    "points":10340,

    "rank":1949,

    "certificates":28
}

================================================================================
SECTION 5
GITHUB CARD
================================================================================

Displays

Avatar

Username

Bio

Followers

Following

Repositories

Profile Link

Frontend Needs

{
    "linked":true,

    "name":"NAVEENKUMAR T",

    "followers":5,

    "following":1,

    "repositories":20
}

================================================================================
SECTION 6
DEVELOPER ANALYTICS
================================================================================

Displays

Developer Insights

Example

[
    "Strong C foundation",

    "Strong Python proficiency",

    "2380+ solved problems",

    "Top performer on SkillRack"
]

================================================================================
SECTION 7
DEVELOPER STRENGTH
================================================================================

Displays

Overall Coding Score

Tier

Platform Breakdown

Frontend Needs

{
    "score":91,

    "tier":"Elite",

    "problem_solved":2380,

    "certificates":30,

    "hackerrank_badges":4,

    "skillrack_rank":1949
}

================================================================================
SECTION 8
CODING DNA
================================================================================

Displays

Language Distribution

Example

{
    "C":1238,

    "Python":882,

    "Java":122
}

================================================================================
SECTION 9
ACHIEVEMENTS
================================================================================

Displays

Coding Milestones

Example

[
    "2380 Problems Solved",

    "30 Certificates Earned",

    "SkillRack Rank #1949",

    "Python 5★ HackerRank"
]

================================================================================
SECTION 10
CERTIFICATES
================================================================================

Displays

Coding Certificates

Example

[
    "Problem Solving Basic",

    "Python Basic",

    "SkillRack Certificates"
]

================================================================================
GET API
================================================================================

GET

/api/coding-profiles

Returns

Complete Coding Dashboard

================================================================================
SYNC API
================================================================================

POST

/api/coding-profiles/sync

Purpose

Refresh all linked platforms.

================================================================================
LINK PLATFORM
================================================================================

POST

/api/coding-profiles/link

Request

{
    "platform":"leetcode",

    "username":"Naveenkumar_T"
}

================================================================================
UNLINK PLATFORM
================================================================================

DELETE

/api/coding-profiles/link/:platform

================================================================================
DATABASE OWNERSHIP
================================================================================

Source of Truth

coding_profiles

Responsible For

• Platform Usernames

• Cached Statistics

• Sync Status

• Coding Analytics

• Developer Strength

• Coding DNA

================================================================================
STUDENTSEARCH PROJECTION
================================================================================

Projection

{
    "coding":{

        "dna_score":91,

        "total_problems":2380,

        "platforms_linked":4,

        "top_skill":"Python"
    }
}

Dashboard stores only lightweight coding summary.

================================================================================
FIELD OWNERSHIP
================================================================================

| UI Field | Collection | StudentSearch | Owner Domain |
|----------|------------|---------------|--------------|
| LeetCode | coding_profiles | No | Coding |
| HackerRank | coding_profiles | No | Coding |
| SkillRack | coding_profiles | No | Coding |
| GitHub | coding_profiles | No | Coding |
| Coding DNA | coding_profiles | Yes | Coding |
| Developer Strength | coding_profiles | Yes | Coding |
| Coding Insights | coding_profiles | No | Coding |

================================================================================
EVENTBUS
================================================================================

CodingProfileLinked

↓

Refresh Platform Data

------------------------------------------------------------

CodingProfileSynced

↓

Recalculate Developer Score

------------------------------------------------------------

DeveloperStrengthCalculated

↓

Update StudentSearch.coding

================================================================================
SYNCHRONIZATION FLOW
================================================================================

Platform APIs

        │

        ▼

Coding Service

        │

        ▼

coding_profiles

        │

        ▼

Domain Events

        │

        ▼

StudentSearch.coding

        │

        ▼

Dashboard Coding Widget

================================================================================
VALIDATION
================================================================================

Platform Username

Required

------------------------------------------------------------

Supported Platforms

LeetCode

HackerRank

SkillRack

GitHub

------------------------------------------------------------

Profile URL

Must be valid

================================================================================
ERROR RESPONSES
================================================================================

400

Invalid Username

------------------------------------------------------------

404

Platform Profile Not Found

------------------------------------------------------------

409

Platform Already Linked

------------------------------------------------------------

422

Platform Sync Failed

------------------------------------------------------------

500

Internal Server Error

================================================================================
PERFORMANCE GUIDELINES
================================================================================

✔ Coding platform APIs should never be called during page load.

✔ Always read cached data from coding_profiles.

✔ Synchronization should execute asynchronously.

✔ StudentSearch stores only coding summary.

================================================================================
CQRS RULES
================================================================================

✔ coding_profiles is the Write Model.

✔ StudentSearch is the Read Model.

✔ Dashboard never queries external platforms directly.

✔ External APIs are synchronized by the Coding Domain.

================================================================================
DEVELOPMENT RULES
================================================================================

✔ Platform statistics are read-only for students.

✔ External platform data is cached.

✔ Failed synchronizations must preserve previous data.

✔ Developer Strength is calculated by the Coding Domain.

================================================================================
END OF DOCUMENT

CODING_PROFILES_PAGE_CONTRACT.md

Version: 1.0

Status: Source of Truth

Module: Student Coding Profiles