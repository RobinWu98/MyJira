# Task Activity MVP

## Goal

Add a task activity history so users can open a task from the Kanban board and see what happened to it.

For this MVP, activity includes:

- task creation
- assignee changes
- priority changes
- manual notes from users

Status, department, attachments, mentions, notifications, and full audit history are intentionally outside this first version.

## User Experience

### Kanban Card Click

Clicking the body of a task card opens a task activity modal.

The existing pencil button remains the edit action. The existing trash button remains the delete action.

### Activity Conversation Modal

The modal should feel like a conversation box, not a database log.

The modal shows a compact task header:

- task title
- current priority
- current assignee
- current status

The main area is a scrollable conversation:

- manual notes render as chat bubbles
- the current user's notes align right
- other users' notes align left
- system events render as centered timeline dividers
- entries are displayed oldest first so the conversation reads naturally from top to bottom

The bottom of the modal has a sticky composer:

- textarea
- send button
- clear feedback while a note is being sent

Examples:

- centered: `Alice created this task.`
- centered: `Alice changed assignee from Bob to Cindy.`
- centered: `David changed priority from Normal to High.`
- left bubble: `Sarah: Waiting on confirmation from the client.`
- right bubble: `You: I will check this today.`

## Data Model

Add a `TaskLog` table.

Fields:

- `id`
- `taskId`
- `actorId`
- `type`
- `message`
- `metadata`
- `createdAt`

Types:

- `TASK_CREATED`
- `ASSIGNEE_CHANGED`
- `PRIORITY_CHANGED`
- `NOTE`

`actorId` is nullable so older/imported/system logs can exist even if no user is attached.

## Backend Behavior

### Task Creation

When a task is created, backend creates one log:

- type: `TASK_CREATED`
- actor: current logged-in user if available
- message: `{actorName} created this task.`

### Task Update

Before updating a task, backend loads the existing task with assignee and priority.

After comparing old vs new values:

- if `assignedPersonId` changed, create an `ASSIGNEE_CHANGED` log
- if `priority` changed, create a `PRIORITY_CHANGED` log

The backend owns this logic so activity is trustworthy and not dependent on frontend behavior.

### Manual Note

Endpoint:

`POST /api/tasks/:taskId/logs`

Payload:

```json
{
  "message": "Waiting for backend confirmation."
}
```

Only logged-in users can add notes.

### Read Logs

Endpoint:

`GET /api/tasks/:taskId/logs`

Returns logs ordered newest first.

## Frontend Behavior

Add a `TaskActivityModal`.

It fetches logs when opened and allows the user to submit a note.

The backend returns logs newest first. The frontend reverses them to display oldest first for conversation flow.

Rendering rules:

- `NOTE` entries are chat bubbles
- `TASK_CREATED`, `ASSIGNEE_CHANGED`, and `PRIORITY_CHANGED` entries are centered system events
- current user's notes align right
- other users' notes align left
- after logs load or a new note is sent, the conversation scrolls to the bottom

After a note is submitted:

- clear the input
- refresh the log list

After task creation/update:

- existing project/task invalidation still runs
- backend logs are created automatically

## MVP Acceptance Criteria

- Clicking a Kanban task card opens activity modal.
- Clicking pencil still opens edit modal.
- Clicking delete still deletes task.
- Creating a task creates a creation activity.
- Changing assignee creates an assignee activity.
- Changing priority creates a priority activity.
- User can add a manual note.
- Activity modal displays logs oldest first as a conversation.
- Current user's manual notes align right.
- Other users' manual notes align left.
- System events are centered and visually quieter than notes.
- Frontend and backend builds pass.
