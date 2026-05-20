# Credential And Authentication Design

## 1. Purpose

This document defines the credential layer for the project task tracker.

The current app has `Person`, but `Person` is only a data record. A person can create projects or be assigned to tasks, but there is no real login, password, session, or access control.

The credential feature will add:

- User login
- User roles
- JWT-based authentication
- Backend route protection
- Frontend permission-aware UI

The first goal is:

```text
A user can log in and the app can identify their role.
```

Different abilities for each role can be expanded later.

## 2. Recommended Auth Model

Use the existing `Person` entity as the user account.

This keeps the model simple:

```text
Person = app user
```

A person can:

- Log in
- Belong to a department
- Create projects
- Be assigned tasks
- Have a role

## 3. User Roles

The app should support three roles:

```text
ADMIN
MANAGER
USER
```

### ADMIN

Admin is the highest permission level.

Initial meaning:

```text
Can access the app as an authenticated user.
Future: can manage all resources.
```

### MANAGER

Manager is the middle permission level.

Initial meaning:

```text
Can access the app as an authenticated user.
Future: can manage some project/task workflows.
```

### USER

User is the normal permission level.

Initial meaning:

```text
Can access the app as an authenticated user.
Future: mostly view and update allowed personal task fields.
```

## 4. Permission Matrix Placeholder

Detailed role abilities will be decided later.

For now, keep a placeholder table so permissions can be appended without redesigning authentication.

```text
Action                         ADMIN   MANAGER   USER
------------------------------------------------------
View projects                  Yes     Yes       Yes
Create project                 Yes     Yes       No
Edit project                   Yes     Yes       No
Delete project                 Yes     Yes       No
View tasks                     TBD     TBD       TBD
Create task                    TBD     TBD       TBD
Edit task                      TBD     TBD       TBD
Delete task                    TBD     TBD       TBD
Move task on Kanban            TBD     TBD       TBD
View Work View                 TBD     TBD       TBD
Manage departments             TBD     TBD       TBD
Manage users                   TBD     TBD       TBD
```

The implementation should be designed so this table can be filled in later.

## 5. JWT Decision

Use JWT for the first credential version.

Reason:

- The app has separate React frontend and Express backend.
- JWT is simple to wire into REST APIs.
- The frontend can send the token in an `Authorization` header.
- It keeps the first auth implementation understandable.

JWT request format:

```text
Authorization: Bearer <token>
```

## 6. Password Storage

Never store plain text passwords.

Store only a password hash.

Recommended library:

```text
bcrypt
```

Person should store:

```text
password_hash
```

Login should compare:

```text
input password -> bcrypt compare -> stored password hash
```

## 7. Updated Person Entity

Add credential fields to `Person`.

```text
person
- id
- department_id
- name
- email
- password_hash
- role
- created_at
- updated_at
```

Recommended role enum:

```text
ADMIN
MANAGER
USER
```

## 8. Prisma Model Direction

Recommended future Prisma change:

```prisma
model Person {
  id           Int      @id @default(autoincrement())
  departmentId Int?
  name         String
  email        String   @unique
  passwordHash String
  role         UserRole @default(USER)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  department      Department? @relation(fields: [departmentId], references: [id])
  projectsCreated Project[]   @relation("ProjectCreator")
  assignedTasks    Task[]     @relation("TaskAssignee")
}

enum UserRole {
  ADMIN
  MANAGER
  USER
}
```

## 9. Auth API Design

Recommended auth endpoints:

```text
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

Optional later:

```text
POST /api/auth/register
POST /api/auth/change-password
POST /api/auth/reset-password
```

For the first version, registration is optional. Seeded users are enough.

## 10. Login Endpoint

Endpoint:

```text
POST /api/auth/login
```

Request:

```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

Response:

```json
{
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "ADMIN",
    "departmentId": 1
  }
}
```

Rules:

- Email is required.
- Password is required.
- If credentials are invalid, return `401 Unauthorized`.
- Do not reveal whether the email or password was wrong.

## 11. Me Endpoint

Endpoint:

```text
GET /api/auth/me
```

Headers:

```text
Authorization: Bearer <token>
```

Response:

```json
{
  "id": 1,
  "name": "Admin User",
  "email": "admin@example.com",
  "role": "ADMIN",
  "departmentId": 1
}
```

Rules:

- If token is valid, return current user.
- If token is missing, return `401 Unauthorized`.
- If token is invalid or expired, return `401 Unauthorized`.

## 12. Logout Endpoint

Endpoint:

```text
POST /api/auth/logout
```

With JWT stored on the frontend, logout can initially be frontend-only:

```text
Remove token from local storage.
Clear auth state.
Redirect to login page.
```

The backend endpoint can still exist and return:

```json
{
  "message": "Logged out"
}
```

Later, if token blacklisting is needed, backend logout can become meaningful.

## 13. JWT Payload

Recommended JWT payload:

```json
{
  "sub": "1",
  "email": "admin@example.com",
  "role": "ADMIN"
}
```

Meaning:

```text
sub:
  Person ID

email:
  User email

role:
  User role
```

Recommended expiration:

```text
8 hours
```

This can be adjusted later.

## 14. Backend Middleware

Add auth middleware.

### requireAuth

Purpose:

```text
Require a valid JWT.
Attach the current user to the request.
```

Behavior:

```text
No token:
  401 Unauthorized

Invalid token:
  401 Unauthorized

Valid token:
  req.user = current user
```

### requireRole

Purpose:

```text
Restrict a route to specific roles.
```

Example:

```ts
requireRole(["ADMIN", "MANAGER"])
```

For the first version, this middleware can exist even if detailed permissions are not fully assigned yet.

## 15. Frontend Auth Flow

Recommended frontend behavior:

```text
If no token:
  show login page

If token exists:
  call /api/auth/me

If /me succeeds:
  show app

If /me fails:
  clear token
  show login page
```

Store token in:

```text
localStorage
```

This is acceptable for the first implementation. Later, the app can move to httpOnly cookies for stronger security.

## 16. Frontend Auth State

Create an auth provider.

Frontend should track:

```text
token
currentUser
isAuthenticated
role
login()
logout()
```

Example:

```ts
currentUser.role === "ADMIN"
```

This allows UI decisions such as:

```text
Show Edit button only if role allows editing.
Show Delete button only if role allows deleting.
```

## 17. API Client Change

The frontend API client should automatically include the JWT token.

Current request:

```text
GET /api/projects
```

Authenticated request:

```text
GET /api/projects
Authorization: Bearer <token>
```

The API client should read token from auth state or localStorage.

## 18. Seed Users

For the first credential version, seed users for each role.

Example:

```text
Admin User
admin@example.com
password: admin123
role: ADMIN

Manager User
manager@example.com
password: manager123
role: MANAGER

Normal User
user@example.com
password: user123
role: USER
```

These are development credentials only.

Before real deployment, passwords must be changed.

## 19. First Build Scope

The first credential implementation should include:

```text
Person passwordHash and role
JWT login
/api/auth/me
Frontend login page
Frontend logout
Token stored in localStorage
API client sends Authorization header
Seed users for ADMIN, MANAGER, USER
Auth middleware structure
Role middleware structure
```

The first implementation does not need a complete permission matrix yet.

## 20. Later Permission Work

Later, we can append exact ability rules such as:

```text
ADMIN can manage everything.
MANAGER can manage tasks and projects in their department.
USER can view and update assigned tasks only.
```

Possible future permissions:

```text
project:create
project:update
project:delete
task:create
task:update
task:delete
task:move
department:manage
user:manage
report:view
```

These can be mapped to roles later.

## 21. Recommended Build Order

1. Add `UserRole` enum.
2. Add `passwordHash` and `role` to Person.
3. Add bcrypt dependency.
4. Add JWT dependency.
5. Update seed data with admin, manager, and user accounts.
6. Add auth schemas.
7. Add auth service.
8. Add auth routes.
9. Add `requireAuth` middleware.
10. Add `requireRole` middleware.
11. Add frontend login page.
12. Add frontend auth provider.
13. Update API client to send token.
14. Add logout button.
15. Add basic UI role checks.
16. Later append detailed abilities.

## 22. Security Notes

Important rules:

- Never store plain passwords.
- Do not commit real production secrets.
- Use `JWT_SECRET` from environment variables.
- Do not expose passwordHash in API responses.
- Backend must enforce permissions, not only the frontend.
- Frontend button hiding is useful for UX, but not security.

Required backend environment variable:

```text
JWT_SECRET
```

Example local value:

```text
JWT_SECRET=local-dev-secret-change-later
```

## 23. Profile Page Scope

The next credential feature should include a profile page.

Route:

```text
/profile
```

The page should allow the logged-in user to view and manage their own account details.

Recommended sections:

```text
Personal Details
Password
Admin People Management, only for ADMIN
```

## 24. Personal Details

Every logged-in user should be able to view:

```text
Name
Email address
Contact number
Department
Role
```

Recommended editing rules for the first version:

```text
User can edit:
- Name
- Contact number

User cannot edit:
- Role
- Department

Email can be displayed first and made editable later.
```

Email is used for login, so changing email should be handled carefully later.

## 25. Contact Number

Add contact number to `Person`.

```text
contact_number
```

This field should be optional.

Example:

```text
0400 000 000
```

## 26. Password Change

The first version should support password change for logged-in users.

This is not the same as email-based forgotten password reset.

Profile page password fields:

```text
Current password
New password
Confirm new password
```

Rules:

```text
Current password must be correct.
New password and confirm password must match.
New password should have a minimum length.
Only passwordHash is stored.
Plain text password is never stored.
```

Recommended endpoint:

```text
PATCH /api/profile/password
```

Request:

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password",
  "confirmPassword": "new-password"
}
```

## 27. Profile API

Recommended endpoints:

```text
GET   /api/profile
PATCH /api/profile
PATCH /api/profile/password
```

`GET /api/profile` returns the current logged-in user.

`PATCH /api/profile` updates allowed profile fields:

```text
name
contactNumber
```

`PATCH /api/profile/password` changes the current user's password.

## 28. Admin People Management

Admins should be able to manage other people.

For the first version, admin management can live inside the Profile page. Later it can move to a dedicated admin page.

Admin can:

```text
Create person
View all people
Edit person
Delete person
Set role: ADMIN, MANAGER, USER
Set department
Set contact number
Set email
Reset another user's password
```

Admin should never see an existing password.

Admin can only set a new password.

## 29. Admin People API

Recommended endpoints:

```text
GET    /api/admin/people
POST   /api/admin/people
GET    /api/admin/people/:personId
PATCH  /api/admin/people/:personId
DELETE /api/admin/people/:personId
PATCH  /api/admin/people/:personId/password
```

All admin people endpoints require:

```text
Authenticated user
Role is ADMIN
```

If the user is not authenticated:

```text
401 Unauthorized
```

If the user is authenticated but not admin:

```text
403 Forbidden
```

## 30. Updated Person Model

The Person model should support credentials and profile fields.

```prisma
model Person {
  id            Int      @id @default(autoincrement())
  departmentId  Int?
  name          String
  email         String   @unique
  contactNumber String?
  passwordHash  String
  role          UserRole @default(USER)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  department      Department? @relation(fields: [departmentId], references: [id])
  projectsCreated Project[]   @relation("ProjectCreator")
  assignedTasks    Task[]     @relation("TaskAssignee")
}
```

## 31. First Implementation Target

The first coding pass should include:

```text
JWT login
/api/auth/me
/api/profile
/api/profile/password
/api/admin/people CRUD
Seeded admin, manager, and user accounts
Frontend login page
Frontend profile page
Admin people management inside profile page
```

Detailed role abilities for project/task features can still be appended later.
