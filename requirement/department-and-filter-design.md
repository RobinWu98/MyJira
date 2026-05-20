# Department And Filter Design

## 1. Purpose

This document describes the next product step after the working MVP.

The MVP currently supports:

- People
- Projects
- Tasks
- Kanban task movement

The next useful layer is:

- Department ownership
- Project and task filtering
- Better visibility into priority, start date, and incomplete task duration

The goal is to help users answer questions like:

```text
Which department owns this work?
Which high-priority tasks are not done?
Which projects have incomplete work running the longest?
Which tasks started earliest and are still not complete?
```

## 2. Recommended Next Entities

The next version should introduce one new main entity:

```text
Department
```

It should also add new date fields to support filtering:

```text
Project.start_date
Task.start_date
Task.completed_at
```

The existing `created_at` field should not be used as the work start date. Created date means when the record was entered into the system. Start date means when the work actually began or is planned to begin.

## 3. Department Entity

### Department Purpose

A department represents a business group or team that owns projects and people.

Examples:

```text
IT
Operations
Finance
Human Resources
Marketing
Facilities
```

Departments should help users group and filter work.

### Department Fields

```text
department
- id
- name
- description
- created_at
- updated_at
```

### Department Relationships

Recommended relationships:

```text
Department has many People
Department has many Tasks
Person belongs to one Department
Task belongs to one Project
Task belongs to one Department
Task can be assigned to one Person
```

This means a project can contain work across multiple departments. Department ownership belongs to individual tasks, not the project as a whole.

## 4. Updated Entity Design

### Department

```text
department
- id
- name
- description
- created_at
- updated_at
```

### Person

Add `department_id`.

```text
person
- id
- department_id
- name
- email
- created_at
- updated_at
```

### Project

Add `start_date`.

```text
project
- id
- name
- description
- created_by_person_id
- start_date
- created_at
- updated_at
```

### Task

Add `department_id`, `start_date`, and `completed_at`.

```text
task
- id
- project_id
- department_id
- title
- description
- assigned_person_id
- status
- priority
- sort_order
- start_date
- completed_at
- created_at
- updated_at
```

## 5. Why Add Start Date And Completed Date

The requested filters include:

```text
Priority
Date started
Longest duration of incomplete task
```

Priority already exists on Task.

Start date does not currently exist. The app has `created_at`, but that is not always the same as the date work started. A task could be created today but scheduled to start next week, or created weeks before work begins.

`completed_at` is useful because it gives the system a clear completion date. When a task moves to Done, the backend should set `completed_at`. When a task moves out of Done, the backend should clear `completed_at`.

## 6. Filter Design Recommendation

Filters should be separated into two levels:

```text
Project filters
Task filters
```

This matters because projects and tasks have different meanings.

A project can be filtered by creator, start date, task count, and incomplete task duration. Department filtering belongs to tasks, because one project can contain work for multiple departments.

A task can be filtered by status, priority, assignee, start date, and duration.

## 7. Project Filters

### Project Filter Fields

Recommended project filters:

```text
Department
Created by
Project start date range
Project status
Priority summary
Has incomplete tasks
Longest incomplete task duration
Last updated
```

### Project Status

Project status can still be calculated instead of stored.

```text
Empty:
  Project has no tasks

Active:
  Project has at least one task not Done

Complete:
  Project has tasks and all tasks are Done
```

### Project Priority Filter

Projects do not currently have their own priority. There are two options.

#### Option A: Project Priority Is Calculated From Tasks

This is my recommended option for the next step.

The project priority is calculated from the highest priority incomplete task.

Example:

```text
If any incomplete task is High:
  Project priority = High

Else if any incomplete task is Normal:
  Project priority = Normal

Else if any incomplete task is Low:
  Project priority = Low

Else:
  Project priority = None or Complete
```

Why this is better:

- Avoids adding another field too early
- Reflects real current work
- Makes project list more useful
- Keeps project priority from becoming stale

#### Option B: Add Project Priority Field

This is simpler to query but less meaningful unless users actively maintain it.

```text
project.priority = HIGH | NORMAL | LOW
```

I do not recommend this yet unless users specifically need manual project priority.

### Project Start Date Filter

Project start date should use `project.start_date`.

Examples:

```text
Show projects that started this week
Show projects that started this month
Show projects that started before 2026-05-01
```

### Longest Duration Of Incomplete Task

This should be calculated per project.

Definition:

```text
For each project, find all tasks where status is not Done.
For each incomplete task, calculate duration from task.start_date to today.
The project longest incomplete duration is the largest duration found.
```

Example:

```text
Project: Office Move

Incomplete tasks:
- Order boxes, started 2026-05-01
- Pack IT room, started 2026-05-10
- Update staff, started 2026-05-12

Today: 2026-05-20

Longest incomplete task duration:
19 days
```

If a task has no `start_date`, use `created_at` as a fallback only for calculation display.

Recommended display:

```text
19 days
```

Recommended sort options:

```text
Longest incomplete duration first
Shortest incomplete duration first
```

## 8. Task Filters

### Task Filter Fields

Recommended task filters:

```text
Project
Department
Assigned person
Status
Priority
Task start date range
Incomplete duration
Last updated
```

### Task Priority Filter

Priority filter should use the existing task priority field.

Values:

```text
High
Normal
Low
```

Useful combinations:

```text
High priority + not Done
High priority + In Progress
High priority + started before this week
```

### Task Start Date Filter

Task start date should use `task.start_date`.

Common presets:

```text
Today
This week
This month
Last 30 days
Custom range
No start date
```

### Task Duration Filter

Incomplete duration should apply only to tasks that are not Done.

Definition:

```text
If task.status is not Done:
  duration = today - task.start_date

If task.start_date is empty:
  duration = today - task.created_at

If task.status is Done:
  incomplete duration does not apply
```

Useful filter options:

```text
Incomplete for more than 3 days
Incomplete for more than 7 days
Incomplete for more than 14 days
Incomplete for more than 30 days
```

Useful sort options:

```text
Longest incomplete duration first
Newest started first
Oldest started first
Priority high to low
```

## 9. Recommended UI Design

### Projects Page

The Projects page should gain a filter bar above the project table.

Recommended controls:

```text
Department dropdown
Created by dropdown
Start date range
Project status segmented control
Priority dropdown
Sort dropdown
Clear filters button
```

Recommended project table columns:

```text
Project name
Department
Created by
Calculated priority
Project status
Number of tasks
Incomplete tasks
Longest incomplete task
Start date
Last updated
Actions
```

### Project Detail Page

The Project Detail page should keep the Kanban board, but add task filters above the board.

Recommended controls:

```text
Assignee dropdown
Priority dropdown
Start date range
Incomplete duration dropdown
Clear filters button
```

The Kanban board should still show the three status columns. Filters should hide non-matching task cards but keep the columns visible.

### Optional Task List View

Filtering by longest duration is sometimes easier in a table than in a Kanban board.

I recommend adding tabs later:

```text
Board
List
```

The List tab can show:

```text
Task title
Project
Department
Assigned person
Status
Priority
Start date
Incomplete duration
Last updated
```

This does not need to be added immediately, but it will make advanced filters much easier to understand.

## 10. Backend API Design

### Department API

```text
GET    /api/departments
POST   /api/departments
GET    /api/departments/:departmentId
PATCH  /api/departments/:departmentId
DELETE /api/departments/:departmentId
```

For the next step, departments can be seeded first before building full department CRUD.

### Project Filtering API

Recommended endpoint:

```text
GET /api/projects
```

Query parameters:

```text
createdByPersonId
status
priority
startDateFrom
startDateTo
hasIncompleteTasks
sort
```

Example:

```text
GET /api/projects?priority=HIGH&hasIncompleteTasks=true&sort=longestIncompleteTask_desc
```

The backend should return calculated fields:

```text
calculatedStatus
calculatedPriority
taskCount
incompleteTaskCount
longestIncompleteTaskDays
```

### Task Filtering API

Recommended endpoint:

```text
GET /api/projects/:projectId/tasks
```

Query parameters:

```text
assignedPersonId
status
priority
startDateFrom
startDateTo
incompleteForMoreThanDays
sort
```

Example:

```text
GET /api/projects/1/tasks?priority=HIGH&incompleteForMoreThanDays=7&sort=duration_desc
```

Optional global task search endpoint:

```text
GET /api/tasks
```

This is useful later when users want to see tasks across all projects.

Query parameters:

```text
departmentId
projectId
assignedPersonId
status
priority
startDateFrom
startDateTo
incompleteForMoreThanDays
sort
```

## 11. Prisma Model Direction

Recommended future Prisma changes:

```prisma
model Department {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  people   Person[]
  projects Project[]
}

model Person {
  id           Int      @id @default(autoincrement())
  departmentId Int?
  name         String
  email        String   @unique
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  department      Department? @relation(fields: [departmentId], references: [id])
  projectsCreated Project[]   @relation("ProjectCreator")
  assignedTasks    Task[]     @relation("TaskAssignee")
}

model Project {
  id                Int       @id @default(autoincrement())
  name              String
  description       String?
  createdByPersonId Int
  startDate         DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  createdBy Person @relation("ProjectCreator", fields: [createdByPersonId], references: [id])
  tasks     Task[]
}

model Task {
  id               Int          @id @default(autoincrement())
  projectId        Int
  departmentId     Int?
  title            String
  description      String?
  assignedPersonId Int?
  status           TaskStatus   @default(TODO)
  priority         TaskPriority @default(NORMAL)
  sortOrder        Int
  startDate        DateTime?
  completedAt      DateTime?
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  project        Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  department     Department? @relation(fields: [departmentId], references: [id])
  assignedPerson Person?     @relation("TaskAssignee", fields: [assignedPersonId], references: [id])
}
```

## 12. Workflow Updates

### Department Workflow

Recommended first version:

1. Seed departments.
2. Assign each person to a department.
3. Add department selection when creating a task.
4. Show department on task cards and task reports.
5. Add department filter on the Work View.

Department CRUD can come after this if needed.

### Project Filter Workflow

1. User opens Projects page.
2. User selects department, priority, status, or date filters.
3. Frontend sends query parameters to backend.
4. Backend returns filtered projects with calculated summary fields.
5. User can sort by longest incomplete task duration.
6. User opens a project to inspect tasks.

### Task Filter Workflow

1. User opens Project Detail page.
2. User selects assignee, priority, start date, or duration filters.
3. Frontend sends query parameters to backend.
4. Backend returns matching tasks.
5. Kanban board displays only matching cards in their status columns.
6. User can clear filters and return to the full board.

## 13. Recommended Build Order

1. Add `Department` model.
2. Add `departmentId` to Person.
3. Add `startDate` to Project.
4. Add `departmentId`, `startDate`, and `completedAt` to Task.
5. Create migration.
6. Seed departments and assign seeded people to departments.
7. Add department API.
8. Update project create/edit form with start date.
9. Update task create/edit form with department and start date.
10. Update task status logic to set or clear `completedAt`.
11. Add project filter query parameters.
12. Add calculated project fields.
13. Add Projects page filter bar.
14. Add task filter query parameters.
15. Add Project Detail task filter bar.
16. Add sort by longest incomplete duration.

## 14. My Recommendation

For your app, I recommend this design:

```text
Department belongs to Task
Person belongs to Department
Project does not belong to Department
Project priority is calculated from incomplete task priority
Longest incomplete task duration is calculated, not stored
Start date is stored separately from created date
Completed date is stored when task moves to Done
```

This keeps the model clean while giving you the filters you want.

The first filter version should support:

```text
Projects:
- Department
- Calculated priority
- Start date range
- Longest incomplete task duration sort

Tasks:
- Priority
- Start date range
- Incomplete duration threshold
- Longest duration sort
```

That gives useful visibility without turning the next step into a large reporting system.

## 15. Notion-Style Work View

The filtering experience should behave more like Notion than a simple search form.

The user should have three separate controls:

```text
Filter
Sort
Group
```

Each control has a different purpose.

```text
Filter:
  Decides which tasks are included.

Sort:
  Decides the order of included tasks.

Group:
  Optionally organizes included tasks into sections.
```

The data flow should be:

```text
Start with all tasks
Apply filters
Apply sorting
Apply optional grouping
Render the result
```

This should feel similar to SQL:

```sql
SELECT tasks
FROM tasks
WHERE filter_conditions
ORDER BY sort_1, sort_2
```

The UI grouping happens after filtering and sorting. If no group is selected, the result should stay as one flat task list.

## 16. Group Behavior

Group by should be optional.

Supported group options for the next version:

```text
No group
Department
Person
```

### No Group

If no group is selected, filters and sorts apply to all matching tasks and the result is shown as a flat list.

Example:

```text
Filter:
- Status is not Done
- Priority is High

Sort:
- Start date oldest first

Result:
One flat list of all matching tasks.
```

### Group By Department

If `groupBy=department`, filters apply first, then matching tasks are grouped by the department selected on each task.

Example:

```text
Filter:
- Status is not Done
- Priority is High

Sort:
- Start date oldest first

Group:
- Department

Result:
IT
  Task A
  Task B

Finance
  Task C
```

### Group By Person

If `groupBy=person`, filters apply first, then matching tasks are grouped by assigned person.

Example:

```text
Filter:
- Incomplete duration greater than 14 days

Sort:
- Longest incomplete duration first

Group:
- Person

Result:
Alex Chen
  Task A
  Task B

Unassigned
  Task C
```

For task reporting, group by person should use `task.assignedPersonId`, not project creator. This is more useful because task filters are about actual task ownership.

## 17. Filter Design

The filter menu should allow multiple filters at the same time.

Recommended first filter fields:

```text
Priority
Status
Start date
Incomplete duration
Department
Person
```

### Priority Filter

```text
Priority is High
Priority is Normal
Priority is Low
```

### Status Filter

```text
Status is To Do
Status is In Progress
Status is Done
Status is not Done
```

### Start Date Filter

```text
Start date is today
Start date is this week
Start date is this month
Start date is before a date
Start date is after a date
Start date is between two dates
Start date is empty
```

### Incomplete Duration Filter

Incomplete duration applies only to tasks that are not Done.

```text
Incomplete for more than 3 days
Incomplete for more than 7 days
Incomplete for more than 14 days
Incomplete for more than 30 days
```

### Department Filter

Department filter should include tasks whose `departmentId` matches the selected department.

```text
Department is IT
Department is Finance
Department is Operations
```

### Person Filter

Person filter should include tasks assigned to the selected person.

```text
Assigned person is Alex Chen
Assigned person is Priya Shah
Assigned person is Unassigned
```

## 18. Sort Design

Sort should be separate from filter.

For example, "emergency first and date second" should be implemented as:

```text
Sort 1:
  Priority high to low

Sort 2:
  Start date oldest first
```

This behaves like SQL:

```sql
ORDER BY priority DESC, start_date ASC
```

The first version should support up to two sort rules.

Recommended sort options:

```text
Priority high to low
Priority low to high
Start date oldest first
Start date newest first
Longest incomplete duration first
Shortest incomplete duration first
Last updated newest first
```

Sort rules should be optional.

Supported cases:

```text
No sort:
  Use default ordering.

One sort:
  Sort by one selected field.

Two sorts:
  Sort by the first field, then use the second field as a tie-breaker.
```

Recommended default sort:

```text
Priority high to low
Start date oldest first
```

This puts urgent and older incomplete work near the top.

## 19. Work View Page

I recommend adding a new page for this feature:

```text
/work
```

The Kanban board should remain focused on moving tasks. The Work View should be focused on filtering, sorting, grouping, and reviewing tasks.

Recommended layout:

```text
Work View

[ Filter ] [ Sort ] [ Group ]

Active chips:
Priority is High
Status is not Done
Sort by Priority high to low, Start date oldest first
Grouped by Department

Results
```

If no group is selected:

```text
Task title | Project | Department | Person | Priority | Status | Start date | Open duration
```

If group by department is selected:

```text
IT
  Task title | Project | Person | Priority | Status | Start date | Open duration

Finance
  Task title | Project | Person | Priority | Status | Start date | Open duration
```

If group by person is selected:

```text
Alex Chen
  Task title | Project | Department | Priority | Status | Start date | Open duration

Unassigned
  Task title | Project | Department | Priority | Status | Start date | Open duration
```

## 20. Task Report API

The Notion-style Work View should use one reporting endpoint.

```text
GET /api/tasks/report
```

Recommended query parameters:

```text
groupBy=department | person
priority=HIGH | NORMAL | LOW
status=TODO | IN_PROGRESS | DONE
statusNot=DONE
departmentId=number
assignedPersonId=number
startDateFrom=YYYY-MM-DD
startDateTo=YYYY-MM-DD
incompleteForMoreThanDays=number
sort=priority_desc,startDate_asc
```

Examples:

```text
GET /api/tasks/report?statusNot=DONE&sort=priority_desc,startDate_asc
```

```text
GET /api/tasks/report?groupBy=department&priority=HIGH&statusNot=DONE&sort=priority_desc,startDate_asc
```

```text
GET /api/tasks/report?groupBy=person&incompleteForMoreThanDays=14&sort=duration_desc
```

### Flat Response

If no group is selected:

```ts
{
  groupBy: null,
  tasks: [
    {
      id: 1,
      title: "Set up laptops",
      projectName: "Office Move",
      departmentName: "IT",
      assignedPersonName: "Alex Chen",
      priority: "HIGH",
      status: "IN_PROGRESS",
      startDate: "2026-05-01",
      incompleteDurationDays: 19
    }
  ]
}
```

### Grouped Response

If group is selected:

```ts
{
  groupBy: "department",
  groups: [
    {
      groupId: 1,
      groupName: "IT",
      tasks: [
        {
          id: 1,
          title: "Set up laptops",
          projectName: "Office Move",
          assignedPersonName: "Alex Chen",
          priority: "HIGH",
          status: "IN_PROGRESS",
          startDate: "2026-05-01",
          incompleteDurationDays: 19
        }
      ]
    }
  ]
}
```

## 21. Implementation Rule

The backend should always follow this order:

```text
1. Build base task query.
2. Apply filters.
3. Include project, department, and assigned person.
4. Calculate incomplete duration.
5. Apply one or two sort rules.
6. If groupBy is empty, return a flat task list.
7. If groupBy is department, group by task.department.
8. If groupBy is person, group by task.assignedPerson.
```

This keeps the feature predictable and matches the way users expect filter, sort, and group-by tools to work.

## 22. Updated Build Order For Filter, Sort, And Group

1. Add Department model and date fields.
2. Add seed departments.
3. Add department relationships to people and projects.
4. Add start date and completed date to tasks.
5. Add `/api/tasks/report`.
6. Add filter support.
7. Add two-level sort support.
8. Add optional group-by support.
9. Build `/work` page.
10. Add Filter, Sort, and Group controls.
11. Render flat results when no group is selected.
12. Render grouped results when department or person is selected.
13. Add active filter/sort/group chips.
14. Add clear filters and reset view actions.

## 23. Notion-Style Task Page Toolbar

The Work View should prioritize the task results, not the controls.

The filter, sort, and group controls should not be shown as a large always-visible form. Instead, the task page should use a compact Notion-style toolbar in the top-right corner.

Recommended layout:

```text
Work View                                      [Filter] [Sort] [Group by] [New]
```

The left side should identify the task view.

Examples:

```text
Company tasks
All tasks
Work View
```

The right side should contain small action buttons:

```text
Filter
Sort
Group by
Reset
New task later
```

For the next implementation, `New task` can be left out if task creation still belongs inside a project. The important part is the compact Filter, Sort, and Group behavior.

## 24. Filter Button Behavior

The Filter button should open a small popover only when clicked.

Default page state:

```text
No large filter panel is visible.
Tasks are visible immediately.
```

When the user clicks Filter:

```text
Filter popover opens.
User can add or change task filters.
```

The first version can show supported filters directly inside the popover:

```text
Priority
Status
Department
Assigned person
Start date from
Start date to
Incomplete duration
```

Later, this can become more Notion-like with `+ Add filter`, where each filter row has:

```text
Attribute
Operator
Value
```

Example future filter rows:

```text
Priority       is        High
Status         is not    Done
Start date     before    2026-05-01
Department     is        IT
```

For now, the popover is enough if it keeps controls hidden until the user asks for them.

## 25. Sort Button Behavior

The Sort button should open a popover only when clicked.

Sort should support up to two ordered rules:

```text
Primary sort
Secondary sort
```

Example:

```text
Primary sort:
  Priority high to low

Secondary sort:
  Start date oldest first
```

This means:

```text
Urgent tasks first.
For tasks with the same priority, older started tasks first.
```

This matches SQL-style sorting:

```sql
ORDER BY priority DESC, start_date ASC
```

The sort popover should allow either:

```text
No sort
One sort
Two sorts
```

## 26. Group By Button Behavior

The Group by button should open a popover only when clicked.

Supported group options:

```text
No group
Department
Person
```

Behavior:

```text
No group:
  Show one flat list of filtered and sorted tasks.

Group by Department:
  Show filtered and sorted tasks under department sections.

Group by Person:
  Show filtered and sorted tasks under assigned person sections.
```

The Group by control should not replace filters. It only changes how the current filtered and sorted result is displayed.

## 27. Active Chips

Even though the controls are hidden by default, the page should show compact chips when filter, sort, or group rules are active.

Example:

```text
[Status: Not Done] [Priority: High] [Sort: Priority, Start date] [Group: Department]
```

These chips help the user understand why the visible task list looks the way it does.

The chips should appear near the toolbar or just below the page header.

## 28. Updated UI Rule

The Work View should follow this rule:

```text
Tasks first.
Controls on demand.
Active state visible as chips.
```

This keeps the page closer to Notion:

```text
Compact toolbar
Click-to-open controls
Task database remains the main focus
```

Implementation direction:

```text
Replace the always-visible Filter/Sort/Group form.
Add top-right toolbar buttons.
Add FilterPopover, SortPopover, and GroupPopover.
Keep using GET /api/tasks/report.
Build query parameters from the popover state.
Render flat or grouped tasks the same way as before.
```
