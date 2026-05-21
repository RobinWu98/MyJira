# Entity Frame And Detailed Workflow

This document is an owner-facing overview of the current system. It shows the main business entities, how they connect, who can perform each action, and how work moves through the application from login to project delivery.

## System Context

```mermaid
flowchart LR
    Owner[Business Owner / Manager] --> UI[React Web App]
    Team[Team Member] --> UI
    Admin[Admin User] --> UI

    UI --> API[Express REST API]
    API --> Auth[JWT Authentication]
    API --> Validation[Zod Request Validation]
    API --> ORM[Prisma ORM]
    ORM --> DB[(PostgreSQL Database)]

    UI -. stores auth token .-> Browser[(Browser Local Storage)]
```

## Detailed Entity Relationship Diagram

```mermaid
erDiagram
    DEPARTMENT ||--o{ PERSON : contains
    DEPARTMENT ||--o{ TASK : owns_work_for

    PERSON ||--o{ PROJECT : creates
    PERSON ||--o{ TASK : is_assigned_to
    PERSON ||--o{ TASK_LOG : performs

    PROJECT ||--o{ TASK : contains
    TASK ||--o{ TASK_LOG : records

    DEPARTMENT {
        int id PK
        string name UK
        string description
        datetime createdAt
        datetime updatedAt
    }

    PERSON {
        int id PK
        int departmentId FK
        string name
        string email UK
        string contactNumber
        string passwordHash
        enum role
        datetime createdAt
        datetime updatedAt
    }

    PROJECT {
        int id PK
        string name
        string description
        int createdByPersonId FK
        datetime startDate
        datetime createdAt
        datetime updatedAt
    }

    TASK {
        int id PK
        int projectId FK
        int departmentId FK
        string title
        string description
        int assignedPersonId FK
        enum status
        enum priority
        int sortOrder
        datetime startDate
        datetime completedAt
        int version
        datetime createdAt
        datetime updatedAt
    }

    TASK_LOG {
        int id PK
        int taskId FK
        int actorId FK
        enum type
        string message
        json metadata
        datetime createdAt
    }
```

## Entity Meaning

| Entity | Business meaning | Important notes |
| --- | --- | --- |
| `Department` | A business unit or team area. | People can belong to a department; tasks can also be tagged to a department for filtering and reporting. |
| `Person` | A user or team member in the system. | Holds login identity, contact details, role, and optional department. |
| `Project` | A container for work. | Created by one person and contains many tasks. Project status is calculated from its tasks. |
| `Task` | A single piece of project work. | Has status, priority, assignee, department, Kanban order, start/completion dates, and version for conflict protection. |
| `TaskLog` | The activity history of a task. | Records task creation, assignee changes, priority changes, and user notes. |

## Role And Permission Frame

```mermaid
flowchart TB
    UserRole[USER] --> UserActions[View projects, work board, task details, profile]
    ManagerRole[MANAGER] --> ManagerActions[Create/edit/delete projects and manage project work]
    AdminRole[ADMIN] --> AdminActions[Manage people, roles, departments assignment, passwords]

    ManagerRole --> UserActions
    AdminRole --> ManagerActions
    AdminRole --> UserActions
```

| Area | User | Manager | Admin |
| --- | --- | --- | --- |
| Login/logout | Yes | Yes | Yes |
| View projects | Yes | Yes | Yes |
| View project board | Yes | Yes | Yes |
| Create/edit/delete projects | No | Yes | Yes |
| Create/edit/update tasks | Yes | Yes | Yes |
| Drag and reorder tasks | Yes | Yes | Yes |
| Add task notes | Yes | Yes | Yes |
| View company task report | Yes | Yes | Yes |
| Update own profile/password | Yes | Yes | Yes |
| Create/edit/delete people | No | No | Yes |
| Reset another user's password | No | No | Yes |

## Application Navigation Frame

```mermaid
flowchart TD
    Login[Login Page] --> AuthCheck{Authenticated?}
    AuthCheck -- No --> Login
    AuthCheck -- Yes --> Projects[Projects Page]

    Projects --> ProjectCreate[Create Project Modal]
    Projects --> ProjectEdit[Edit Project Modal]
    Projects --> ProjectDetail[Project Detail / Kanban Board]
    Projects --> WorkView[Company Tasks Report]
    Projects --> Profile[Profile Page]

    ProjectDetail --> TaskCreate[Create Task Modal]
    ProjectDetail --> TaskEdit[Edit Task Modal]
    ProjectDetail --> TaskActivity[Task Activity Modal]
    ProjectDetail --> Kanban[Drag And Drop Board]

    Profile --> OwnDetails[Update Profile]
    Profile --> OwnPassword[Change Password]
    Profile --> AdminPeople[Admin People Management]
```

## End-To-End Data Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as React UI
    participant Query as TanStack Query
    participant API as Express API
    participant DB as PostgreSQL via Prisma

    User->>UI: Perform action
    UI->>Query: Run query or mutation
    Query->>API: REST request with JSON
    API->>API: Validate input with Zod
    API->>API: Check JWT and role when required
    API->>DB: Read/write through Prisma
    DB-->>API: Return persisted data
    API-->>Query: JSON response
    Query->>Query: Invalidate/refetch affected data
    Query-->>UI: Updated state
    UI-->>User: Updated page, board, modal, or report
```

## Authentication Workflow

```mermaid
sequenceDiagram
    participant User
    participant Login as Login Page
    participant API as /api/auth
    participant DB as Person Table
    participant Browser as Local Storage

    User->>Login: Enter email and password
    Login->>API: POST /login
    API->>DB: Find person by email
    API->>API: Compare password with passwordHash
    API-->>Login: Return JWT token and user profile
    Login->>Browser: Store token
    Login-->>User: Navigate to Projects Page

    User->>Login: Reopen app later
    Login->>API: GET /me with Bearer token
    API-->>Login: Return current user
```

## Project Management Workflow

```mermaid
flowchart TD
    A[Manager/Admin opens Projects Page] --> B[System loads project list]
    B --> C{Choose action}

    C --> D[Create project]
    D --> E[Select creator, name, description, start date]
    E --> F[API validates creator exists]
    F --> G[Project saved]

    C --> H[Edit project]
    H --> I[Update name, description, creator, start date]
    I --> J[Project updated]

    C --> K[Delete project]
    K --> L[Confirm deletion]
    L --> M[Project removed]
    M --> N[Related tasks removed by cascade]

    G --> O[Project list refreshes]
    J --> O
    N --> O
```

## Task Board Workflow

```mermaid
flowchart TD
    A[User opens a project] --> B[System loads project detail and tasks]
    B --> C[Tasks are grouped by status and sorted by sortOrder]

    C --> D{User action}
    D --> E[Create task]
    E --> F[Choose title, assignee, department, status, priority, start date]
    F --> G[Task saved at end of selected column]
    G --> H[Task activity log: TASK_CREATED]

    D --> I[Edit task]
    I --> J[Update task fields]
    J --> K{Changed assignee or priority?}
    K -- Yes --> L[Create activity log entry]
    K -- No --> M[Save task update only]
    L --> N[Board refreshes]
    M --> N

    D --> O[Delete task]
    O --> P[Task removed]
    P --> N

    H --> N


```

## Kanban Status And Reorder Workflow

Tasks can move freely between columns. The system stores both the workflow status and the card position.

```mermaid
stateDiagram-v2
    [*] --> TODO: New task
    TODO --> IN_PROGRESS: Start work
    IN_PROGRESS --> DONE: Finish work
    IN_PROGRESS --> TODO: Move back
    DONE --> IN_PROGRESS: Reopen
    TODO --> DONE: Mark complete directly
    DONE --> TODO: Reset
```

```mermaid
sequenceDiagram
    participant User
    participant Board as Kanban Board
    participant API as /api/projects/:id/tasks/reorder
    participant DB as Task Table

    User->>Board: Drag task to another position or column
    Board->>Board: Calculate new status and sortOrder for visible cards
    Board->>API: PATCH reorder payload with id, status, sortOrder, version
    API->>DB: Update each task if version still matches
    alt Versions match
        DB-->>API: Saved tasks
        API-->>Board: Refreshed task list
        Board-->>User: Board stays updated
    else Someone else changed the board
        API-->>Board: Conflict error
        Board-->>User: Ask user to refresh and try again
    end
```

## Task Activity Workflow

```mermaid
flowchart TD
    A[User opens task activity modal] --> B[System loads task logs]
    B --> C[Display timeline]
    C --> D{Activity source}

    D --> E[Task created]
    D --> F[Assignee changed]
    D --> G[Priority changed]
    D --> H[User adds note]

    H --> I[POST note to task logs]
    I --> J[Log saved with actor]
    J --> K[Timeline refreshes]
```

## Company Task Report Workflow

```mermaid
flowchart TD
    A[User opens Company Tasks] --> B[Load task report]
    B --> C[Default sort: priority high to low, then start date]

    C --> D{User adjusts controls}
    D --> E[Filter by priority]
    D --> F[Filter by status or not done]
    D --> G[Filter by assignee]
    D --> H[Filter by department]
    D --> I[Filter by start date range]
    D --> J[Filter by incomplete duration]
    D --> K[Sort by priority, start date, duration, or updated date]
    D --> L[Group by project, department, or person]

    E --> M[API returns matching report]
    F --> M
    G --> M
    H --> M
    I --> M
    J --> M
    K --> M
    L --> M
    M --> N[User sees owner-friendly workload view]
```

## Admin People Workflow

```mermaid
flowchart TD
    A[Admin opens Profile Page] --> B[People management section]
    B --> C{Admin action}

    C --> D[Create person]
    D --> E[Set name, email, contact, department, role, password]
    E --> F[Password is hashed]
    F --> G[Person saved]

    C --> H[Edit person]
    H --> I[Update details, department, role]
    I --> J[Person updated]

    C --> K[Reset password]
    K --> L[New password is hashed]
    L --> M[Password updated]

    C --> N[Delete person]
    N --> O{Is this own account?}
    O -- Yes --> P[Block delete]
    O -- No --> Q[Person deleted]
```

## Project Status Calculation

The project does not need a separate stored status. The UI calculates status from tasks:

| Condition | Owner-facing project status |
| --- | --- |
| Project has no tasks | Empty |
| At least one task is not done | In Progress |
| All tasks are done | Done |

## Task Lifecycle Fields

| Field | Why it matters |
| --- | --- |
| `status` | Places the task in `To Do`, `In Progress`, or `Done`. |
| `priority` | Helps owners see urgent work first. |
| `sortOrder` | Preserves manual card order inside each Kanban column. |
| `startDate` | Supports planning and report filters. |
| `completedAt` | Automatically set when a task reaches `Done`; cleared when reopened. |
| `version` | Prevents one user's stale update from overwriting another user's newer change. |

## Owner Summary

```text
The owner can explain the system as:

1. People belong to departments and have roles.
2. Managers/Admins create projects.
3. Projects contain tasks.
4. Tasks are assigned to people and optionally tagged to departments.
5. Tasks move through To Do, In Progress, and Done.
6. Every important task change can appear in activity history.
7. The report page gives an owner-level view across all company tasks.
```
