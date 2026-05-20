# Entity Diagram And Workflow

## Entity Relationship Diagram

```mermaid
erDiagram
    PERSON ||--o{ PROJECT : creates
    PERSON ||--o{ TASK : assigned_to
    PROJECT ||--o{ TASK : contains

    PERSON {
        int id PK
        string name
        string email
        datetime created_at
        datetime updated_at
    }

    PROJECT {
        int id PK
        string name
        string description
        int created_by_person_id FK
        datetime created_at
        datetime updated_at
    }

    TASK {
        int id PK
        int project_id FK
        string title
        string description
        int assigned_person_id FK
        string status
        string priority
        int sort_order
        datetime created_at
        datetime updated_at
    }
```

## Simple Entity Explanation

```text
Person
  creates many Projects
  can be assigned many Tasks

Project
  is created by one Person
  contains many Tasks

Task
  belongs to one Project
  can be assigned to one Person
```

## Main Workflow

```mermaid
flowchart TD
    A[Person opens app] --> B[Create project]
    B --> C[Open project detail page]
    C --> D[Create task]
    D --> E[Task appears in To Do]
    E --> F[Drag task to In Progress]
    F --> G[Work on task]
    G --> H[Drag task to Done]
```

## Kanban Status Workflow

Tasks can move freely between the three Kanban columns.

```mermaid
stateDiagram-v2
    [*] --> ToDo: New task

    ToDo --> InProgress: Start work
    InProgress --> Done: Finish task

    InProgress --> ToDo: Move back
    Done --> InProgress: Reopen task
    ToDo --> Done: Mark complete directly
    Done --> ToDo: Reset task

    Done --> [*]
```

## Kanban Board Layout

```text
Project Detail Page

+----------------+----------------+----------------+
| To Do          | In Progress    | Done           |
+----------------+----------------+----------------+
| Task A         | Task C         | Task E         |
| Task B         | Task D         | Task F         |
+----------------+----------------+----------------+
```

## Drag And Drop Data Update

When a task is dragged, the system updates:

```text
task.status
task.sort_order
task.updated_at
```

Example:

```text
Task: Book movers
Old status: To Do
New status: In Progress
New sort order: 2
```

## Project Completion Rule

The MVP does not need a manual project status.

Project status can be calculated:

```text
If project has no tasks:
  Project is empty

If project has at least one task not in Done:
  Project is active

If all project tasks are Done:
  Project is complete
```
