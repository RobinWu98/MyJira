# Full Stack MVP Build Plan

## 1. Product Summary

This project is a simple project task tracker inspired by Jira-style task management, but intentionally much smaller for the MVP.

The application allows a person to:

- Create projects
- View all projects
- Add tasks inside a project
- Manage tasks on a simple Kanban board
- Move tasks between To Do, In Progress, and Done
- Save task status and ordering after drag and drop

The goal is not to build a full Jira clone. The goal is to build a clean, working full-stack MVP that proves the core workflow:

```text
Create project -> Create tasks -> Move tasks through a Kanban board
```

## 2. Recommended Full Stack

The recommended stack uses an explicitly separated frontend and backend.

```text
Frontend: React + Vite + TypeScript
Backend: Express + TypeScript
Database: PostgreSQL
ORM: Prisma
Validation: Zod
API Style: REST
Drag and Drop: @dnd-kit
Frontend Data Fetching: TanStack Query
Styling: Tailwind CSS
```

## 3. Why This Stack

### React + Vite + TypeScript

React is used to build the user interface. Vite is used because it is fast, simple, and well suited for modern frontend projects. TypeScript helps prevent mistakes by adding type safety.

This is a good fit because the frontend needs interactive screens, forms, tables, modals, and a Kanban board.

### Express + TypeScript

Express is used to build the backend REST API. It is lightweight, easy to understand, and gives full control over how the backend is structured.

TypeScript should be used on the backend as well so the whole project has consistent typing.

### PostgreSQL

PostgreSQL is used as the main database. It is reliable, widely used, and works well for relational data such as people, projects, and tasks.

The data model for this MVP is relational:

- A person can create many projects
- A project has many tasks
- A task belongs to a project
- A task can be assigned to a person

### Prisma

Prisma is the ORM used by the backend to communicate with PostgreSQL.

It is useful because it:

- Defines database models clearly
- Generates type-safe database queries
- Handles migrations
- Reduces the amount of raw SQL needed
- Fits naturally with TypeScript

### Zod

Zod is used for validating request data.

For example, when the frontend sends a request to create a task, the backend should validate that:

- The title is not empty
- The status is one of the allowed statuses
- The priority is one of the allowed priorities
- Required IDs are valid

This protects the backend from invalid or incomplete data.

### REST API

REST is recommended because the MVP is mostly CRUD-based.

The app needs simple actions:

- Create project
- Get projects
- Update project
- Delete project
- Create task
- Update task
- Delete task
- Reorder tasks

These map cleanly to REST endpoints.

### @dnd-kit

`@dnd-kit` is used for drag and drop on the Kanban board.

It supports:

- Moving tasks between columns
- Reordering tasks inside a column
- React-friendly drag behavior
- Accessible drag-and-drop patterns

### TanStack Query

TanStack Query is used on the frontend to manage API data.

It helps with:

- Loading states
- Error states
- API caching
- Refetching data
- Updating the UI after create, edit, delete, or drag-and-drop actions

This keeps frontend API handling cleaner than manually managing every loading and error state.

### Tailwind CSS

Tailwind CSS is used for styling.

It is a good fit for this type of dashboard-style app because it makes it quick to build:

- Tables
- Forms
- Buttons
- Toolbars
- Kanban columns
- Task cards
- Responsive layouts

## 4. MVP Scope

The MVP includes only the core task tracking workflow.

### Included

- Person data
- Project CRUD
- Task CRUD
- Project list page
- Project detail page
- Kanban board
- Drag and drop between columns
- Reordering tasks inside columns
- Saving status and sort order after dragging

### Not Included In MVP

The following features should not be included in the first version:

- Full login system
- User roles and permissions
- Departments
- Comments
- Attachments
- Notifications
- Reports
- Custom workflows
- Due dates
- Advanced search
- Company dashboard
- Activity history

These can be added after the MVP works.

## 5. MVP Result

The finished MVP should allow a user to complete this flow:

1. Open the application.
2. See a list of projects.
3. Create a new project.
4. Open the project detail page.
5. Create tasks for the project.
6. See tasks displayed in three Kanban columns:
   - To Do
   - In Progress
   - Done
7. Drag tasks from one column to another.
8. Reorder tasks inside a column.
9. Refresh the page and see the task statuses and order saved.
10. Edit or delete projects and tasks.

The MVP is successful when the project and task workflow works from end to end with persisted database data.

## 6. Core Entities

### Person

A person represents someone who creates projects or can be assigned tasks.

For the MVP, full authentication is not required. The application can start with a simple seeded list of people.

Fields:

```text
id
name
email
created_at
updated_at
```

### Project

A project is a container for tasks.

Fields:

```text
id
name
description
created_by_person_id
created_at
updated_at
```

Relationships:

```text
Project belongs to one Person as creator
Project has many Tasks
```

### Task

A task is a single piece of work inside a project.

Fields:

```text
id
project_id
title
description
assigned_person_id
status
priority
sort_order
created_at
updated_at
```

Relationships:

```text
Task belongs to one Project
Task can be assigned to one Person
```

## 7. Status And Priority Values

### Task Status

Task status must match the Kanban columns.

```text
TODO
IN_PROGRESS
DONE
```

Display labels:

```text
To Do
In Progress
Done
```

### Task Priority

The MVP should support three priority values.

```text
HIGH
NORMAL
LOW
```

Display labels:

```text
High
Normal
Low
```

## 8. Database Model

The Prisma schema should follow this structure.

```prisma
model Person {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  projectsCreated Project[] @relation("ProjectCreator")
  assignedTasks    Task[]   @relation("TaskAssignee")
}

model Project {
  id                Int      @id @default(autoincrement())
  name              String
  description       String?
  createdByPersonId Int
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  createdBy Person @relation("ProjectCreator", fields: [createdByPersonId], references: [id])
  tasks     Task[]
}

model Task {
  id               Int          @id @default(autoincrement())
  projectId        Int
  title            String
  description      String?
  assignedPersonId Int?
  status           TaskStatus   @default(TODO)
  priority         TaskPriority @default(NORMAL)
  sortOrder        Int
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  project        Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignedPerson Person? @relation("TaskAssignee", fields: [assignedPersonId], references: [id])
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

enum TaskPriority {
  HIGH
  NORMAL
  LOW
}
```

## 9. REST API Requirements

All backend endpoints should use `/api` as the base path.

### People

```text
GET /api/people
```

Returns all people that can create projects or be assigned to tasks.

For the MVP, people can be created using seed data instead of a full user management screen.

### Projects

```text
GET /api/projects
POST /api/projects
GET /api/projects/:projectId
PATCH /api/projects/:projectId
DELETE /api/projects/:projectId
```

Project list responses should include:

- Project name
- Description
- Creator name
- Number of tasks
- Last updated date

### Tasks

```text
GET /api/projects/:projectId/tasks
POST /api/projects/:projectId/tasks
PATCH /api/tasks/:taskId
DELETE /api/tasks/:taskId
PATCH /api/projects/:projectId/tasks/reorder
```

The reorder endpoint should update:

- Task status
- Task sort order
- Updated date

## 10. Request Validation Requirements

The backend should validate incoming request bodies with Zod.

### Create Project Validation

Required:

- `name`
- `createdByPersonId`

Optional:

- `description`

Rules:

- Project name must not be empty
- Creator person ID must exist

### Create Task Validation

Required:

- `title`
- `status`
- `priority`

Optional:

- `description`
- `assignedPersonId`

Rules:

- Task title must not be empty
- Status must be one of `TODO`, `IN_PROGRESS`, or `DONE`
- Priority must be one of `HIGH`, `NORMAL`, or `LOW`
- Assigned person ID must exist if provided

### Reorder Tasks Validation

The reorder endpoint should accept a list of task positions.

Example request:

```json
{
  "tasks": [
    {
      "id": 1,
      "status": "TODO",
      "sortOrder": 1
    },
    {
      "id": 2,
      "status": "IN_PROGRESS",
      "sortOrder": 1
    }
  ]
}
```

Rules:

- Every task ID must belong to the project
- Every status must be valid
- Every sort order must be a number
- Updates should be saved together so the board does not end in a half-updated state

## 11. Frontend Pages

### Projects Page

Route:

```text
/
```

Purpose:

Show all projects in the system.

Required UI:

- Page header
- Create project button
- Project table
- Edit project action
- Delete project action
- View project action

Project table columns:

- Project name
- Description
- Created by
- Number of tasks
- Last updated
- Actions

### Project Detail Page

Route:

```text
/projects/:projectId
```

Purpose:

Show one project and its task board.

Required UI:

- Project name
- Project description
- Created by
- Created date
- Edit project button
- Delete project button
- Create task button
- Kanban board

### Kanban Board

The board must show three columns:

- To Do
- In Progress
- Done

Each task card should show:

- Task title
- Priority
- Assigned person
- Edit action
- Delete action

Required behavior:

- Tasks are grouped by status
- Tasks are ordered by `sort_order`
- User can drag a task between columns
- User can reorder tasks inside the same column
- Frontend sends the updated board order to the backend
- Backend saves the new status and order

## 12. Suggested Folder Structure

### Root

```text
project-task-tracker/
  frontend/
  backend/
  README.md
```

### Frontend

```text
frontend/
  src/
    api/
    components/
      kanban/
      projects/
      tasks/
      ui/
    pages/
    routes/
    types/
    utils/
    App.tsx
    main.tsx
```

### Backend

```text
backend/
  prisma/
    schema.prisma
    seed.ts
  src/
    app.ts
    server.ts
    config/
    db/
      prisma.ts
    middleware/
    modules/
      people/
      projects/
      tasks/
```

Each backend module should keep related files together.

Example:

```text
modules/projects/
  project.routes.ts
  project.controller.ts
  project.service.ts
  project.schemas.ts
```

## 13. Backend Build Order

1. Initialize backend project with Express and TypeScript.
2. Add Prisma and connect PostgreSQL.
3. Create Prisma models for Person, Project, and Task.
4. Create and run database migrations.
5. Add seed data for people.
6. Build people endpoint.
7. Build project CRUD endpoints.
8. Build task CRUD endpoints.
9. Build task reorder endpoint.
10. Add Zod validation.
11. Add centralized error handling.
12. Test endpoints with Postman, Thunder Client, or curl.

## 14. Frontend Build Order

1. Initialize frontend project with React, Vite, and TypeScript.
2. Add Tailwind CSS.
3. Add React Router.
4. Add TanStack Query.
5. Create API client functions.
6. Build Projects page.
7. Build create/edit project form.
8. Build Project Detail page.
9. Build create/edit task form.
10. Build Kanban board layout.
11. Add `@dnd-kit` drag and drop.
12. Connect drag and drop to reorder API.
13. Add loading, error, and empty states.
14. Polish responsive layout.

## 15. Acceptance Criteria

The MVP is complete when all of the following are true.

### Project Management

- User can view all projects.
- User can create a project.
- User can edit a project.
- User can delete a project.
- Project list shows task count.
- Project list shows last updated date.

### Task Management

- User can view tasks inside a project.
- User can create a task.
- User can edit a task.
- User can delete a task.
- Task can be assigned to a person.
- Task has a priority.

### Kanban Board

- Tasks appear in the correct status column.
- Tasks are sorted by `sort_order`.
- User can drag a task to another column.
- User can reorder tasks inside one column.
- Dragging updates the task status.
- Dragging updates the task order.
- Refreshing the page keeps the latest board order.

### Data And API

- All data is stored in PostgreSQL.
- Backend validates request data.
- Backend returns useful error messages.
- Frontend shows loading states.
- Frontend shows error states.
- Frontend updates after create, edit, delete, and drag actions.

## 16. Local Development Setup

The application should run locally with two separate development servers.

### Backend

```text
cd backend
npm install
npm run dev
```

Expected backend URL:

```text
http://localhost:4000
```

### Frontend

```text
cd frontend
npm install
npm run dev
```

Expected frontend URL:

```text
http://localhost:5173
```

The frontend should call the backend using an environment variable.

```text
VITE_API_BASE_URL=http://localhost:4000/api
```

## 17. Deployment Recommendation

For a simple deployment:

```text
Frontend: Vercel or Netlify
Backend: Render, Railway, or Fly.io
Database: Supabase, Neon, Railway, or Render PostgreSQL
```

The frontend and backend should have separate environment variables.

Backend environment variables:

```text
DATABASE_URL
PORT
CORS_ORIGIN
```

Frontend environment variables:

```text
VITE_API_BASE_URL
```

## 18. Later Improvements

After the MVP works, the next improvements can be added in this order:

1. User login and authentication.
2. Project ownership and permissions.
3. Due dates.
4. Task comments.
5. Task activity history.
6. Search and filters.
7. File attachments.
8. Email notifications.
9. Dashboard and reports.
10. Custom workflow columns.

## 19. Final MVP Definition

The MVP should be considered finished when a person can manage real project tasks from start to finish:

```text
Create a project
Create tasks
Assign tasks
Move tasks through To Do, In Progress, and Done
Persist the board state
Edit and delete projects or tasks
```

This gives a complete, realistic foundation while keeping the first version small enough to build, test, and improve.
