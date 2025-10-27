# Task Scheduling Feature

This document describes the new task scheduling functionality added to the notes application.

## Overview

Tasks can now be scheduled for specific dates with natural language display. When a task is scheduled and has BACKLOG status, it automatically changes to PLANNED. Tasks scheduled for today automatically appear in the Today view.

## Features Implemented

### 1. Database Schema
- Added `scheduled_date` column to the tasks table (DATE type)
- Created index on `scheduled_date` for faster lookups
- OVERDUE status is automatically set for tasks with past scheduled dates
- See: `add_scheduled_date_to_tasks.sql`

### 2. Date Utilities
- Natural language date formatting (Today, Tomorrow, Mon Dec 25, etc.)
- Helper functions for date manipulation
- See: `src/utils/dateUtils.js`

### 3. Date Picker Component
- Quick shortcuts: Today, Tomorrow, Next Monday, Next Weekend
- Custom date selection
- Clear date option
- See: `src/components/DatePicker.jsx`

### 4. Task List Updates
- Calendar icon to schedule tasks (hidden until hover)
- Natural language date display for scheduled tasks
- Click date to edit/change scheduled date
- Star icon to add/remove tasks from Today (shown on hover)
- Star is filled yellow when task is starred
- PLANNED status now shows a Circle icon indicator
- See: `src/components/TaskList.jsx`

### 5. Today View Logic & Overdue Detection
- Shows starred tasks OR tasks scheduled for today
- Tasks scheduled for the current date automatically appear
- Excludes CANCELLED tasks
- **Automatic OVERDUE detection**: When tasks are fetched, any task with a past `scheduled_date` and status NOT IN (DONE, CANCELLED, OVERDUE) is automatically updated to OVERDUE status
- OVERDUE check happens on every view load/change
- See: `src/App.jsx` - `fetchTasksForView()` and `checkAndUpdateOverdueTasks()` functions

### 6. Status Management
- When scheduling a date on a BACKLOG task, status auto-changes to PLANNED
- PLANNED status displays with a circle icon in status dropdown
- All status changes are optimistic with rollback on error
- See: `src/services/tasksService.js` - `scheduleTask()` method

## User Interface

### Task Row Elements (left to right):
1. Task number
2. Checkbox (complete/uncomplete)
3. Task text
4. Project badge (if applicable)
5. Status dropdown (clickable with color coding)
6. Scheduled date (purple text with calendar icon, if set)
7. Calendar icon (hover to show, click to schedule)
8. Star icon (hover to show, click to add to Today)

### Status Colors:
- BACKLOG: Gray
- PLANNED: Purple (with circle icon)
- DOING: Blue
- BLOCKED: Yellow
- OVERDUE: Red (bold, with alert icon) - **Auto-set, not manually selectable**
- DONE: Green
- CANCELLED: Red

### Date Display Examples:
- "Today"
- "Tomorrow"
- "Mon" (this week)
- "Last Tue" (past week)
- "Wed, Dec 25" (further dates)

## Usage

### Scheduling a Task:
1. Hover over a task in any task list
2. Click the calendar icon that appears on the right
3. Select a quick date or enter a custom date
4. Task status will auto-change to PLANNED if it was BACKLOG

### Starring a Task for Today:
1. Hover over a task
2. Click the star icon
3. Star turns yellow and task appears in Today view
4. Click again to unstar

### Today View Behavior:
- Shows all starred tasks
- Shows all tasks scheduled for today's date
- Both criteria work independently (OR logic)
- Excludes CANCELLED tasks
- Shows DONE tasks if they match criteria

### OVERDUE Status (Auto-set):
- **NOT manually selectable** - only automatically set by the system
- Automatically applied when a task has:
  - A `scheduled_date` in the past (before today)
  - Status is NOT already DONE, CANCELLED, or OVERDUE
- Check happens every time tasks are fetched (page load, view change)
- Once marked OVERDUE, users can manually change to any other status
- Visual indicators:
  - Red bold text
  - Alert circle icon (⚠️)
  - Same red color as CANCELLED but with bold styling

## Technical Details

### Database Migration
Run the SQL migration to add the `scheduled_date` column:
```sql
-- See: add_scheduled_date_to_tasks.sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_date date;
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date);
```

### Key Functions

#### App.jsx:
- `scheduleTask(taskId, scheduledDate)` - Schedule/unschedule a task
- `fetchTasksForView(noteTitle)` - Updated to include scheduled_date logic for Today
- `checkAndUpdateOverdueTasks(tasks)` - Automatically detect and update overdue tasks

#### tasksService.js:
- `scheduleTask(id, scheduledDate)` - Service method with auto-status change

#### dateUtils.js:
- `formatDateNatural(dateString)` - Convert ISO date to natural language
- `getTodayISO()` - Get today's date in YYYY-MM-DD format
- `isToday(dateString)` - Check if date is today

## Files Created/Modified

### New Files:
- `add_scheduled_date_to_tasks.sql` - Database migration
- `src/utils/dateUtils.js` - Date utility functions
- `src/components/DatePicker.jsx` - Date picker component
- `TASK_SCHEDULING_FEATURE.md` - This documentation

### Modified Files:
- `src/components/TaskList.jsx` - Added date picker, star button, status icons
- `src/components/NoteEditor.jsx` - Passed onScheduleTask prop to TaskList
- `src/App.jsx` - Added scheduleTask handler, updated Today view logic
- `src/services/tasksService.js` - Added scheduleTask method

## Future Enhancements

Possible improvements:
- Recurring tasks
- Date range filtering
- Calendar view
- Reminders/notifications
- Overdue task highlighting
- Week view scheduling
