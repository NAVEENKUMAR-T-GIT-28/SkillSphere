# SkillSphere System Flow Architecture

This document describes the rigorous layered architecture enforced across the SkillSphere backend.

## Architectural Layers

```
HTTP Request
     ↓
[ Route ]           (Registers endpoint, mounts middleware, delegates to Controller)
     ↓
[ Middleware ]      (Authentication, Authorization, Rate Limiting)
     ↓
[ Validator ]       (express-validator: sanitizes and validates req.body / req.query)
     ↓
[ Controller ]      (Thin orchestrator. Extracts data from request, calls Service, sends Response)
     ↓
[ Service ]         (Heavy lifter. Contains 100% of business logic, orchestrates Repositories)
     ↓
[ Repository ]      (Data Access Layer. Exclusively handles mongoose methods, returns pure data)
     ↓
[ Model ]           (Mongoose schemas, validations, indexes)
     ↓
[ MongoDB ]         (Persistence)
```

## Layer Responsibilities

### 1. Routes (`routes/`)
- Pure mapping of HTTP verb + URL to a Controller method.
- Completely devoid of logic (`req, res => {}` inline functions are strictly prohibited).
- Responsible for ordering middleware (e.g. `authenticate` -> `requireRole` -> `validator` -> `controller`).

### 2. Controllers (`controllers/`)
- Thin orchestration layer.
- **Rules**:
  - NO database calls (`Project.find()`).
  - NO aggregation pipelines.
  - NO business logic or complex calculations.
  - MUST delegate all complex workflows to `services/`.
- Extracts `req.body`, `req.params`, `req.user`, passes them to a Service, then formats the response using `utils/response.js`.

### 3. Services (`services/`)
- The heart of the application.
- **Rules**:
  - Completely decoupled from Express (no `req` or `res` objects).
  - Can call multiple Repositories.
  - Handles business workflows (e.g. calculating readiness scores, triggering notifications, syncing search data).
  - Strictly **Service → Repository**. A Repository must NEVER call a Service (prevents circular dependencies).

### 4. Repositories (`repositories/`)
- Standardized Data Access layer.
- **Rules**:
  - Standard method signatures (`findById`, `findMany`, `create`, `updateById`, `deleteById`, `count`).
  - Abstracts away Mongoose implementation details from the Services.
  - Cannot import Services or Controllers.

### 5. Models (`models/`)
- Defines the data schema, references (`ref`), timestamps, and `unique` indexes.
- Strips sensitive data (like passwords) using `.toJSON()` overrides.

## Example Workflow: Placement Application

1. **Route**: `POST /api/placement-drives/:id/apply` hits `placementRoutes`.
2. **Middleware**: `authenticate` verifies JWT. `requireRole('student')` verifies role.
3. **Controller**: `placementController.apply` extracts `driveId` and `userId`.
4. **Service**: `placementService.applyToDrive` verifies the deadline, fetches the student via `studentRepo`, runs the eligibility check via `eligibilityService`, checks for duplicates, and creates the application.
5. **Repository**: `placementRepo.createApplication` executes `Application.create()`.
6. **Model**: Mongoose creates the document.
7. **Controller**: Receives the newly created application and returns `success(res, application, {}, 201)`.
