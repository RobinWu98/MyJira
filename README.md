# Project Task Tracker

A small full-stack MVP for managing projects and tasks on a Kanban board.

## Stack

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

## Project Structure

```text
backend/   Express API, Prisma schema, validation, REST routes
frontend/  React app, pages, forms, Kanban board
```

## Local Setup

### 1. Backend

```text
cd backend
copy .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Backend URL:

```text
http://localhost:4000
```

Health check:

```text
http://localhost:4000/api/health
```

### 2. Frontend

```text
cd frontend
copy .env.example .env
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Database

The backend expects PostgreSQL. Update `backend/.env` with your database connection string:

```text
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/project_task_tracker?schema=public"
```

## MVP Features

- View projects
- Create, edit, and delete projects
- View project details
- Create, edit, and delete tasks
- Assign tasks to seeded people
- Set task status and priority
- Move tasks across To Do, In Progress, and Done
- Save task order after drag and drop

## API Overview

```text
GET    /api/health
GET    /api/people

GET    /api/projects
POST   /api/projects
GET    /api/projects/:projectId
PATCH  /api/projects/:projectId
DELETE /api/projects/:projectId

GET    /api/projects/:projectId/tasks
POST   /api/projects/:projectId/tasks
PATCH  /api/projects/:projectId/tasks/reorder

PATCH  /api/tasks/:taskId
DELETE /api/tasks/:taskId
```

## Notes

The MVP uses seeded people instead of full authentication. Login, roles, comments, due dates, attachments, and notifications are intentionally left for later iterations.
