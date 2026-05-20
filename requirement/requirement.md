# Simple Project Task Tracker - MVP Design

## Purpose

The purpose of this MVP is to provide a simple online tool where people can create projects and manage tasks inside each project.

The main goal is:

> A person can create a project, add tasks to it, and move those tasks through a simple Kanban board.

This MVP should stay small and easy to build.

## MVP Scope

The MVP only needs three main entities:

- Person
- Project
- Task

The main user actions are:

- Create a project
- View projects
- Edit a project
- Delete a project
- Add tasks to a project
- View tasks inside a project
- Edit tasks
- Delete tasks
- Drag tasks between Kanban columns

## Main Product Flow

1. A person opens the application.
2. The person creates a project.
3. Inside the project, the person creates tasks.
4. Tasks appear on a Kanban board.
5. The person drags tasks between columns as work progresses.

## Main Pages

## 1. Projects Page

This is the first page users should see.

It shows all projects created in the system.

### Project List Columns

- Project name
- Description
- Created by
- Number of tasks
- Last updated

### Project Actions

Users should be able to:

- Create project
- View project
- Edit project
- Delete project

## 2. Project Detail Page

This page shows one project and its tasks.

The main feature of this page is the Kanban board.

### Project Header

At the top of the page, show:

- Project name
- Project description
- Created by
- Created date

### Project Actions

Users should be able to:

- Edit project
- Delete project
- Create task

## 3. Kanban Board

The Kanban board is the main task management view.

Tasks should be grouped into simple columns.

### Kanban Columns

Use these columns for the MVP:

- To Do
- In Progress
- Done

This is enough for a first version.

### Kanban Behaviour

Users should be able to:

- See tasks grouped by status
- Drag a task from one column to another
- Automatically update the task status after dragging
- Click a task to view details
- Edit a task
- Delete a task

Example:

```text
Project: Office Move

To Do            In Progress       Done
------------------------------------------------
Book movers      Pack IT room      Confirm date
Order boxes      Update staff
```

## 4. Task Form

Users should be able to create and edit tasks.

### Task Fields

Keep task fields simple:

- Task title
- Description
- Assigned person
- Status
- Priority
- Created date
- Updated date

### Task Status Values

Task status should match the Kanban columns:

- To Do
- In Progress
- Done

### Task Priority Values

Use simple priority values:

- High
- Normal
- Low

Priority is useful but should not make the MVP complicated.

## Entity Design

## Person

A person represents someone using the system or being assigned work.

```text
person
- id
- name
- email
- created_at
- updated_at
```

For the easiest MVP, full login and permissions can be added later. The app can start by letting users choose a person from a list.

## Project

A project is a container for tasks.

```text
project
- id
- name
- description
- created_by_person_id
- created_at
- updated_at
```

Relationships:

```text
Project belongs to one Person as creator
Project has many Tasks
```

## Task

A task is a single piece of work inside a project.

```text
task
- id
- project_id
- title
- description
- assigned_person_id
- status
- priority
- sort_order
- created_at
- updated_at
```

Relationships:

```text
Task belongs to one Project
Task can be assigned to one Person
```

## Why Task Needs `sort_order`

The `sort_order` field is useful for the Kanban board.

It allows tasks to keep their position inside a column.

Example:

```text
To Do
1. Order boxes
2. Book movers
3. Print labels
```

When a user drags tasks up or down, or moves a task between columns, the app can update:

- task status
- task sort order

## Simple Database Relationships

```text
Person
  creates many Projects
  can be assigned many Tasks

Project
  has many Tasks

Task
  belongs to one Project
  can be assigned to one Person
```

## Main MVP Features

## Project CRUD

Users can:

- Create projects
- View projects
- Edit projects
- Delete projects

## Task CRUD

Inside a project, users can:

- Create tasks
- View tasks
- Edit tasks
- Delete tasks

## Kanban Drag And Drop

Inside a project, users can:

- Move tasks from To Do to In Progress
- Move tasks from In Progress to Done
- Move tasks back to an earlier column
- Reorder tasks inside the same column

The system should save the new task position after drag and drop.

## What This MVP Does Not Include

To keep the MVP easy, do not include these yet:

- Departments
- Admin permissions
- Complex login roles
- Comments
- Task activity history
- Attachments
- Notifications
- Reports
- Custom workflows
- Due dates
- Advanced search
- Company-wide dashboard

These can be added later once the basic project and Kanban workflow works well.

## MVP Success Criteria

The MVP is successful if:

- A person can create a project
- A person can edit and delete a project
- A person can create tasks inside a project
- A person can edit and delete tasks
- Tasks are displayed in a Kanban board
- A person can drag tasks between To Do, In Progress, and Done
- Dragging a task updates and saves its status
- Tasks keep their order inside each column

## Recommended First Build Order

1. Create the Person entity.
2. Create the Project entity.
3. Create the Task entity.
4. Build the Projects page.
5. Build project create, edit, and delete.
6. Build the Project Detail page.
7. Build task create, edit, and delete.
8. Display tasks grouped by status.
9. Add drag and drop between columns.
10. Save task status and sort order after dragging.

## Later Improvements

After the MVP works, possible improvements are:

- User login
- Departments
- Comments
- Due dates
- Task activity history
- Dashboard
- Filters
- Search
- File attachments
- Email notifications
- Admin access control



