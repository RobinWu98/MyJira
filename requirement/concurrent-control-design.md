# Concurrent Control Design

## Goal

Prevent users from silently overwriting each other's task changes.

This first version focuses only on tasks, because tasks are the most active part of the app:

- task edit form
- assignee changes
- priority changes
- Kanban drag and drop reorder

Projects and people can use the same pattern later.

## Strategy

Use optimistic locking with an integer `version`.

Each task has:

```prisma
version Int @default(1)
```

When the frontend loads a task, it receives the current version.

When the frontend saves a task, it sends that version back.

The backend only updates the task if the version still matches.

If another user saved first, the version has already changed and the backend returns:

```http
409 Conflict
```

## Task Edit Flow

Frontend sends:

```json
{
  "title": "Updated task title",
  "priority": "HIGH",
  "version": 3
}
```

Backend updates with:

```ts
where: {
  id: taskId,
  version: input.version
}
```

On success:

- update task fields
- increment `version`
- create activity logs for assignee and priority changes when needed

On conflict:

- do not update the task
- do not create activity logs
- return `409 Conflict`

## Kanban Reorder Flow

Frontend sends every moved/visible task with its version:

```json
{
  "tasks": [
    {
      "id": 1,
      "status": "TODO",
      "sortOrder": 0,
      "version": 4
    }
  ]
}
```

Backend updates inside a transaction.

Each row update requires:

- `id`
- `projectId`
- `version`

If any task has a stale version:

- the transaction is rolled back
- backend returns `409 Conflict`

## Frontend Behavior

When a task edit conflicts:

- keep the edit modal open
- show a warning message
- refresh the project data in the background

When a Kanban reorder conflicts:

- show a warning above the board
- refresh the project data

## MVP Acceptance Criteria

- `Task` has a `version` column.
- Task edit requests include `version`.
- Reorder requests include `version`.
- Successful task edits increment version.
- Successful reorder updates increment version for affected tasks.
- Stale task edit returns `409 Conflict`.
- Stale reorder returns `409 Conflict`.
- Task activity logs are only written after successful optimistic-lock updates.
- Frontend and backend builds pass.
