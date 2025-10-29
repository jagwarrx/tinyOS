# Lexical Notes App - Extensive Documentation

This file contains detailed technical information about the Lexical Notes App. For a quick overview, see `CLAUDE.md`.

## Table of Contents
1. [Detailed Database Schemas](#detailed-database-schemas)
2. [Component Specifications](#component-specifications)
3. [Service Method Details](#service-method-details)
4. [Feature Deep Dives](#feature-deep-dives)
5. [Common Workflows](#common-workflows)
6. [Configuration Details](#configuration-details)

---

## Detailed Database Schemas

### Notes Table (Complete)
```sql
id: UUID (primary key)
title: TEXT
content: JSONB (Lexical editor state)
note_type: TEXT (null, 'task_list', 'project', 'project_list', 'diagram')
ref_id: TEXT UNIQUE (e.g., 'a3x7k9')
is_home: BOOLEAN
is_starred: BOOLEAN
list_metadata: JSONB (for special views like Today, Week)
up_id, down_id, left_id, right_id: UUID (bidirectional links)
project_status: TEXT (for project notes)
project_start_date: TEXT
project_due_date: TEXT
project_context: TEXT
diagram_xml: TEXT (Draw.io diagram XML data)
diagram_svg: TEXT (Rendered SVG for preview)
created_at, updated_at: TIMESTAMP
```

### Tasks Table (Complete)
```sql
id: UUID (primary key)
text: TEXT (task description)
status: TEXT (BACKLOG, PLANNED, DOING, BLOCKED, OVERDUE, DONE, CANCELLED)
priority: INTEGER (0 = highest)
project_id: UUID (references notes.id)
scheduled_date: TEXT (YYYY-MM-DD format or natural language)
is_starred: BOOLEAN
task_type: TEXT (null, 'next', 'waiting', 'someday')
context: TEXT (why this task matters)
work_notes: TEXT (how to do it, blockers, etc.)
workspace_data: JSONB (scratchpad, chat history, session data)
ref_id: TEXT UNIQUE (e.g., 'b5m2n8')
created_at, updated_at: TIMESTAMP
```

### Activity Log Table
```sql
id: UUID (primary key)
action_type: TEXT (e.g., 'task_created', 'note_updated', 'timer_started', 'log_entry')
entity_type: TEXT (e.g., 'task', 'note', 'project', 'timer')
entity_id: UUID (references the entity)
entity_ref_id: TEXT (ref_id of the entity)
entity_title: TEXT (title/text of the entity)
details: JSONB (action-specific metadata)
timestamp: TIMESTAMPTZ (default: now())
```

### Settings Table
```sql
key: TEXT (primary key)
value: JSONB (can store any JSON data)
description: TEXT (optional description)
updated_at: TIMESTAMPTZ (default: now())
```

**Common Settings Keys:**
- `theme`: Current theme ID
- `music_links`: Object with spotify/youtube arrays
- `show_priority_formula`: Boolean for UI preference

### Tags Table (Hierarchical)
```sql
id: UUID (primary key)
name: TEXT (last segment of path, e.g., "calvetti")
full_path: TEXT UNIQUE (complete path, e.g., "work/qbotica/projects/calvetti")
level: INTEGER (0-indexed depth in hierarchy)
created_at: TIMESTAMP
```

### Task_Tags Junction Table
```sql
id: UUID (primary key)
task_id: UUID (references tasks.id, CASCADE on delete)
tag_id: UUID (references tags.id, CASCADE on delete)
created_at: TIMESTAMP
UNIQUE(task_id, tag_id)
```

### Note_Tags Junction Table
```sql
id: UUID (primary key)
note_id: UUID (references notes.id, CASCADE on delete)
tag_id: UUID (references tags.id, CASCADE on delete)
created_at: TIMESTAMP
UNIQUE(note_id, tag_id)
```

---

## Component Specifications

### Component Structure
```
src/
   App.jsx                           # Main app, state management, command handling
   components/
      Editor.jsx                    # Lexical rich text editor
      NoteEditor.jsx                # Note editing view with editor
      NotesList.jsx                 # Sidebar list of notes
      TaskList.jsx                  # Displays tasks with actions
      TaskDetail.jsx                # Detailed task view/edit panel
      Terminal.jsx                  # Command line interface with hover navigation icons
      Timer.jsx                     # Pomodoro timer
      DatePicker.jsx                # Date selection for scheduling
      StatusFilter.jsx              # Task status filter UI
      CollapsibleFilterBar.jsx     # Filter bar with collapse
      RefIdBadge.jsx                # Badge for ref_id display
      ProjectsList.jsx              # Projects view
      InboxList.jsx                 # Inbox items view
      DiagramEditor.jsx             # Draw.io diagram editor modal
      TagInput.jsx                  # Tag input with autocomplete
      TagDisplay.jsx                # Tag badges with remove functionality
      TagFilter.jsx                 # Collapsible tag filter panel
      workspace/
         WorkspaceView.jsx          # Main workspace container
         WorkspaceScratchpad.jsx    # Left panel scratch notes
         WorkspaceChat.jsx          # Right panel AI chat
   lexical/
      RefIdNode.jsx                 # Custom Lexical node for ref_ids
      RefIdTransformPlugin.jsx     # Auto-transforms ref_ids to badges
   utils/
      commandParser.js              # Terminal command parsing
      dateUtils.js                  # Date formatting utilities
      refIdLookup.js                # Ref_id lookup utilities
      tagUtils.js                   # Tag path parsing and validation
      workspaceStorage.js           # LocalStorage utilities for workspace
   services/
      notesService.js               # CRUD for notes
      tasksService.js               # CRUD for tasks
      tagService.js                 # Tag operations
      activityLogService.js         # Activity logging
      settingsService.js            # Settings management
      musicLinksService.js          # Music player integration
      themeService.js               # Theme management
      claudeService.js              # Claude AI integration
   contexts/
      NotesContext.jsx              # (If using context)
   hooks/
       useAutoSave.js                # Auto-save hook for notes
```

### State Management (App.jsx)

Key state variables:
- `notes`: All notes from database
- `selectedNote`: Currently viewed note
- `currentTasks`: Tasks for current view
- `allTasks`: All tasks (for statistics)
- `selectedTask`: Task detail panel
- `homeNote`, `tasksNote`, `todayNote`, `weekNote`, `projectsNote`, `inboxNote`, `somedayNote`, `logNote`: Special note references
- `currentTheme`: Current theme object (20+ available themes)
- `timerConfig`: Timer state
- `statusFilter`: Array of status values to filter by
- `taskTypeFilter`: Single task type value
- `view`: Current view mode ('list', 'kanban')
- `showSearch`: Search modal visibility
- `showKeyboardHelp`: Keyboard shortcuts modal visibility
- `showSettings`: Settings modal visibility
- `logUpdateTrigger`: Trigger for refreshing activity log
- `uiPreferences`: UI-specific settings (e.g., show_priority_formula)

---

## Service Method Details

### NotesService (src/services/notesService.js)
- `fetchAll()`: Get all notes
- `fetchById(id)`: Get note by UUID
- `fetchByRefId(refId)`: Get note by ref_id
- `create(note)`: Create new note
- `update(id, changes)`: Update note
- `delete(id)`: Delete note

### TasksService (src/services/tasksService.js)
- `fetchAll()`: Get all tasks
- `fetchByProject(projectId)`: Get tasks for project
- `fetchByRefId(refId)`: Get task by ref_id
- `create(task)`: Create new task
- `update(id, changes)`: Update task
- `delete(id)`: Delete task
- `scheduleTask(id, scheduledDate)`: Schedule task (auto-changes status)
- `reorderTasks(tasks)`: Bulk update task priorities

### TagService (src/services/tagService.js)
- `createTagsFromPath(tagPath)`: Create all hierarchical levels for a tag path
- `fetchAllTags()`: Get all tags ordered by full_path
- `searchTags(query)`: Search tags by partial path or name (limit 20 results)
- `tagTask(taskId, tagPath)`: Associate task with tag (creates all hierarchy levels)
- `untagTask(taskId, tagId)`: Remove tag from task
- `getTaskTags(taskId)`: Get all tags for a task (sorted by level)
- `getTaskLeafTags(taskId)`: Get only deepest-level tags for a task
- `clearTaskTags(taskId)`: Remove all tags from task
- `getTasksForTag(tagId, includeDescendants)`: Get tasks with specific tag
- `deleteTag(tagId)`: Delete tag (cascade removes task_tags)
- `tagNote(noteId, tagPath)`: Associate note with tag
- `getNoteTags(noteId)`: Get all tags for a note
- `filterTasksByTags(tasks, selectedTagIds, allTags)`: Filter tasks by tags (OR logic)

### ClaudeService (src/services/claudeService.js)
- `callClaude(prompt, options)`: Main API call function
  - Options: `maxTokens` (default: 1024), `temperature` (0-1, default: 1.0), `model` (default: claude-sonnet-4-5)
- `getJoke()`: Get a programming joke (200 tokens)
- `getTip()`: Get a productivity tip (200 tokens)
- `getQuote()`: Get an inspiring quote (200 tokens)
- `getFact()`: Get a tech fact (200 tokens)
- `getAdvice(topic)`: Get advice on a topic (300 tokens)
- `explainConcept(concept)`: Explain a concept (400 tokens)
- `summarizeText(text)`: Summarize text (300 tokens)
- `brainstormIdeas(topic)`: Brainstorm ideas (400 tokens)

**Implementation Details:**
- Uses Supabase Edge Function `claude-proxy` for secure API calls
- API key stored in Supabase secrets (never exposed to client)
- CORS configured for cross-origin requests
- Temperature must be between 0 and 1 (API constraint)
- Model: `claude-sonnet-4-5` (latest Sonnet 4.5)
- Anthropic API version: `2023-06-01`

### ActivityLogService (src/services/activityLogService.js)
- `fetchAll(limit)`: Get recent activity log entries (default 200)
- `create(logEntry)`: Create new log entry
- `update(id, changes)`: Update log entry (for text logs)
- `deleteById(id)`: Delete log entry
- Log entry structure: `action_type`, `entity_type`, `entity_id`, `entity_ref_id`, `entity_title`, `details` (JSONB), `timestamp`
- Action types: task/note/project operations, timer events, reminders, custom text logs

### SettingsService (src/services/settingsService.js)
- `getSetting(key)`: Get setting value by key
- `setSetting(key, value, description)`: Upsert setting
- `getUIPreferences()`: Get UI-specific settings
- `updateUIPreferences(prefs)`: Update UI settings
- Settings stored as key-value pairs in `settings` table

### MusicLinksService (src/services/musicLinksService.js)
- `fetchAllMusicLinks()`: Get all music links (Spotify + YouTube)
- `fetchMusicLinksByType(type)`: Get links by type ('spotify' or 'youtube')
- `createMusicLink(musicLink)`: Add new music link
- `updateMusicLink(id, type, updates)`: Update music link
- `deleteMusicLink(id, type)`: Remove music link
- `setAsDefault(id, type)`: Set as default for type
- `extractSpotifyId(url)`: Extract playlist ID from Spotify URL
- `extractYoutubeId(url)`: Extract video ID from YouTube URL
- Music links stored in `settings` table under `music_links` key

### ThemeService (src/services/themeService.js)
- `loadAndApplyTheme()`: Load theme from DB/localStorage and apply
- `saveTheme(themeId)`: Save theme preference to DB
- `changeTheme(themeId)`: Change and apply new theme
- `getCurrentThemeId()`: Get active theme ID
- Falls back: Database → localStorage → default theme
- Migrates old 'light'/'dark' values to 'sonokai-default'

---

## Feature Deep Dives

### 1. Reference ID Linking
- Every note and task gets a unique 6-character ref_id (format: `[a-z][0-9][a-z0-9]{4}`)
- Type a ref_id in a note (e.g., `a3x7k9`) and it becomes a clickable badge
- Badges display as `[NOTE | Note Title] a3x7k9` or `[TASK | Task Text] b5m2n8`
- Clicking a badge navigates to that note or shows task details
- Implemented via custom Lexical nodes: `RefIdNode` and `RefIdTransformPlugin`

**Reference ID Generation:**
Handled by PostgreSQL function `generate_reference_id()`:
- Format: `[a-z][0-9][a-z0-9]{4}` (6 chars)
- First char: lowercase letter
- Second char: digit
- Remaining 4: alphanumeric lowercase
- Guaranteed unique via UNIQUE constraint and retry logic

### 2. Task Scheduling
- Tasks can be scheduled to specific dates
- Dates display naturally: "Today", "Tomorrow", "Mon", "Wed, Dec 25"
- When scheduling a BACKLOG task, it auto-changes to PLANNED
- Tasks scheduled for today automatically appear in the Today view
- OVERDUE status is automatically set for tasks past their scheduled_date
- See: `src/utils/dateUtils.js` for date formatting

### 3. Advanced Theme System
- **20+ Professional Color Schemes** organized into 7 collections
- Collections: Original Classic (3), Terminal (5), Sonokai (6), Monokai Pro (5), Claude AI (2), Things 3 (2), Trello (1)
- **Dynamic CSS Variables** for instant theme switching without page reloads
- **WYSIWYG Theme Previews** in Settings showing actual UI appearance
- **Dual Persistence**: Database (settings table) + localStorage cache
- **Special Features**: Gradient backgrounds (Trello), theme-specific colors, dark mode support
- See: `src/config/themes/` for theme definitions, `src/services/themeService.js` for management
- Reference: `themes.md` for complete documentation

### 4. Workspace Mode Details

**Focused Work Environment** for individual tasks with split view layout.

**Key Components:**
- `WorkspaceView.jsx`: Main workspace container with header, session tracking, and layout
- `WorkspaceScratchpad.jsx`: Left panel for task-specific scratch notes with bullet support
- `WorkspaceChat.jsx`: Right panel with AI assistant integration
- `workspaceStorage.js`: LocalStorage utilities for session tracking and data persistence

**Workspace Features:**

1. **Scratchpad**:
   - Task-specific scratch notes with auto-save to localStorage
   - Bullet point support (type `-` converts to `•`, Tab to indent, Shift+Tab to outdent)
   - Save to Work Notes button to transfer scratchpad content to task's work_notes field
   - Status indicators showing when task has existing work notes or workspace data

2. **AI Chat**:
   - Context-aware initial greeting based on task and project
   - Full chat history persistence across sessions
   - Task context automatically provided to AI (task text, context, work notes, project info)
   - Clear chat history option

3. **Session Tracking**:
   - Format: "This Session: Xm (Total: Ym)" displayed in header
   - Current session starts when entering workspace, resets on each new entry
   - Total duration accumulates across all workspace sessions for that task
   - Session data stored in localStorage with `activeMinutes` and `currentSessionStart`
   - Sessions > 2 minutes logged to activity_log with duration, scratchpad length, message count

4. **Workspace Data Model** (stored in `tasks.workspace_data` JSONB field):
   ```javascript
   {
     scratchpad: string,           // Current scratchpad content
     chat_history: array,          // Chat message history
     last_session_duration: number, // Duration of last session in minutes
     last_updated: timestamp       // ISO timestamp of last save
   }
   ```

5. **Exit Behavior**:
   - Sessions > 2 minutes: Saves workspace_data to database and logs to activity_log
   - Sessions < 2 minutes: Only saves to localStorage (temporary)
   - Unsaved scratchpad content: Prompts user to save to Work Notes before exiting
   - "Clear Session" button: Clears scratchpad and chat history but preserves task work_notes

**Database Integration:**
- `workspace_data` column in `tasks` table (JSONB)
- Activity log entries with `action_type: 'workspace_session_ended'`
- localStorage keys: `workspace_{taskId}_scratchpad`, `workspace_{taskId}_chat`, `workspace_{taskId}_session`

**Usage Flow:**
1. Open task detail panel (double-click task or arrow navigation + right arrow)
2. Click "Enter Workspace" button at bottom of task panel
3. Work in scratchpad and/or chat with AI assistant
4. Session time automatically tracked in header
5. Exit workspace with "Exit Workspace" button (auto-saves if session > 2 minutes)
6. Next time you enter workspace for same task, previous scratchpad and chat history restored

### 5. Hierarchical Tagging System

**Multi-Level Tag Hierarchy** with unlimited depth using slash-separated paths.

**Tag Path Format:**
- Use forward slashes to create hierarchy: `work/qbotica/projects/calvetti`
- Each segment becomes a separate tag at its level
- Example: `work/qbotica/projects/calvetti` creates 4 tags:
  - Level 0: `work`
  - Level 1: `work/qbotica`
  - Level 2: `work/qbotica/projects`
  - Level 3: `work/qbotica/projects/calvetti`

**TagInput Features:**
1. **Level-based Autocomplete**:
   - Typing `work/` shows only Level 1 tags under "work"
   - Typing `work/qbotica/` shows only Level 2 tags under "work/qbotica"
   - Autocomplete updates as you type each segment

2. **Validation**:
   - Max path length: 200 characters
   - Valid characters: letters, numbers, spaces, hyphens, underscores
   - No leading/trailing slashes
   - No empty segments (e.g., `work//projects` is invalid)

3. **Keyboard Navigation**:
   - Up/Down arrows to navigate suggestions
   - Enter to select highlighted suggestion or add current input
   - Escape to close suggestions

**Tag Filtering Logic:**
- A task matches if it has ANY of the selected tags or their descendants
- Example: Selecting "work" tag shows tasks tagged with:
  - "work" (direct match)
  - "work/qbotica" (descendant)
  - "work/qbotica/projects" (descendant)
  - "work/qbotica/projects/calvetti" (descendant)

**Tag Display:**
- **In Task Detail Panel**: Shows only leaf tags (deepest level) to reduce clutter
- **In Tag Filter**: Shows full hierarchical tree with expand/collapse
- **Tag Colors**: Uses `syntax-blue` color scheme for consistency
- **Remove Tags**: Click × button on tag badge to remove

**Tag Validation** (src/utils/tagUtils.js):
```javascript
validateTagPath(tagPath) {
  // Returns: { valid: boolean, error: string }
  // Checks:
  // - Max length 200 chars
  // - No leading/trailing slashes
  // - No empty segments
  // - Valid characters only
}

parseTagPath(tagPath) {
  // Returns: [{ name, full_path, level }, ...]
  // Example: "work/qbotica/projects"
  // Returns:
  // [
  //   { name: "work", full_path: "work", level: 0 },
  //   { name: "qbotica", full_path: "work/qbotica", level: 1 },
  //   { name: "projects", full_path: "work/qbotica/projects", level: 2 }
  // ]
}
```

### 6. Draw.io Diagram Integration

**Embedded Diagram Editor** with full Draw.io integration using embed.diagrams.net.

**Database Storage:**
- `diagram_xml`: Raw Draw.io XML format for full editing capabilities
- `diagram_svg`: Rendered SVG for lightweight preview display
- `note_type: 'diagram'`: Identifies note as diagram type

**Key Components:**
- `DiagramEditor.jsx`: Modal component with embedded Draw.io iframe
- `RefIdNode.jsx`: Enhanced to render inline diagram previews when diagram note referenced
- `NoteEditor.jsx`: Displays full-size diagram with white background and edit button

**Draw.io Integration Details:**
1. **Embed URL**: `https://embed.diagrams.net/?embed=1&ui=kennedy&spin=1&proto=json&saveAndExit=1&noSaveBtn=0`
2. **PostMessage API**: Two-way communication between app and Draw.io iframe
3. **Supported Events**:
   - `init`: Editor ready, triggers diagram load
   - `load`: Diagram successfully loaded
   - `save`: User clicked "Save & Exit", triggers SVG export
   - `export`: SVG export complete, saves to database
   - `exit`: User closed without saving
   - `autosave`: Auto-save event (not currently used)

**Blank Diagram XML** (for new diagrams):
```xml
<mxfile host="app.diagrams.net">
  <diagram name="Page-1">
    <mxGraphModel>
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

**SVG Storage:**
- Draw.io exports SVG as base64 data URI: `data:image/svg+xml;base64,...`
- App decodes base64 using `atob()` before storing
- Stored as plain SVG text for efficient rendering

**Usage Flow:**
1. User types `/diagram "System Architecture"` in terminal
2. App creates note with note_type='diagram'
3. DiagramEditor modal opens with Draw.io iframe
4. User creates diagram using Draw.io tools
5. User clicks "Save & Exit" in Draw.io toolbar
6. App receives `save` event with XML data
7. App requests SVG export via postMessage
8. App receives `export` event with SVG data (base64 decoded)
9. Both XML and SVG saved to database
10. Diagram displayed in note view with white background and centered layout

**Inline Diagram Previews:**
- Type diagram note's ref_id in any other note (e.g., `a3x7k9`)
- RefIdTransformPlugin detects ref_id and looks up note
- If note is diagram type, creates RefIdNode with diagram_svg
- Renders as inline preview with purple border and caption
- Click preview to navigate to full diagram note
- Shift+Click opens side-by-side view

**Known Issues and Fixes:**
1. **Loading Spinner Stuck**: Caused by not sending diagram XML for new diagrams
   - Fix: Always send blank diagram XML on init for new diagrams
2. **SVG as Text**: SVG was showing as base64 data URI instead of rendering
   - Fix: Decode base64 before storing using `atob()`
3. **UnknownMessage Error**: Caused by sending unsupported `configure` action
   - Fix: Removed configure action, Draw.io works fine without it

### 7. Claude AI Integration

**Direct Claude API integration** via Supabase Edge Function for secure API calls.

**Setup Requirements:**
1. Deploy Edge Function: `supabase functions deploy claude-proxy`
2. Set API key: `supabase secrets set CLAUDE_API_KEY=sk-ant-api03-...`
3. Edge Function handles CORS and secure API calls
4. Temperature range: 0-1 (default: 1.0)
5. Max tokens configurable per command (default: 1024)

**Loading Animation:**
- Three bouncing dots with staggered wave effect
- Smooth opacity and scale transitions
- "Thinking..." text with pulse animation
- Implemented with custom CSS keyframes (`@keyframes loadingWave`)
- See: `src/index.css` and `src/components/Terminal.jsx`

### 8. Terminal Commands

Quick command interface for productivity. Commands include:

```bash
# Task management
/task "Task text" [:today] [:project] [:note "Details"]
/inbox "Item title" :note "Details"
complete task N
star task N

# Navigation
goto home
goto tasks
goto today
goto week
goto projects
goto inbox

# Projects
/project "Project Name"

# Diagrams
/diagram "Diagram Title"

# Timer
start timer 25

# Claude AI Commands (requires Edge Function setup)
/joke          # Get a programming joke
/tip           # Get a productivity tip
/quote         # Get an inspiring quote
/fact          # Get a tech fact
/ask <query>   # Ask Claude anything
/explain <concept>  # Get explanation
/brainstorm <topic> # Brainstorm ideas

# Help
help
```

See: `src/utils/commandParser.js` for full command parsing logic

### 9. Activity Logging System

**Comprehensive Activity Tracking** for all task/note/project actions.

**Activity Types:**
- Task operations (created, updated, completed, deleted)
- Note updates (smart grouping of consecutive edits)
- Project changes (status updates, metadata changes)
- Timer events (started, completed, cancelled)
- Reminders and custom text logs

**Features:**
- **Smart Grouping**: Consecutive note edits grouped automatically
- **Time Filters**: Today, Yesterday, This Week, All Time
- **Category Filters**: Text Logs, Task Activity, Note Activity, Reminders, Other
- **Inline Editing**: Edit text logs and reminders directly
- **Expandable Groups**: Collapse/expand note edit groups and long text

See: `src/components/LogPage.jsx`, `src/services/activityLogService.js`

### 10. Other Key Features

**Task Status System:**
- **BACKLOG**: Not yet planned
- **PLANNED**: Scheduled or planned (shows circle icon)
- **DOING**: Currently working on (blue)
- **BLOCKED**: Waiting on something (yellow)
- **OVERDUE**: Auto-set for tasks past scheduled_date (red, bold)
- **DONE**: Completed (green)
- **CANCELLED**: Won't do (red)

OVERDUE is special: it's automatically set by the system when tasks are fetched, not manually selectable.

**Today View Logic:**
Shows tasks that meet ANY of these criteria:
- Task is starred (is_starred = true)
- Task is scheduled for today's date
- Excludes CANCELLED tasks
- Includes DONE tasks if they match criteria

**Bidirectional Navigation:**
- Notes can link to other notes via up/down/left/right relationships
- Example: Projects page → left_id points to individual projects
- Individual projects → left_id points back to Projects page
- Enables graph-like navigation through notes

**URL Routing by Ref ID:**
Browser URL automatically updates to reflect the currently selected note:
- Format: `/<ref_id>` (e.g., `/a3x7k9` for note with ref_id "a3x7k9")
- Uses `window.history.pushState()` for URL updates without page reload
- On page load, app reads URL path and navigates to corresponding note
- Enables direct linking to notes by copying browser URL

---

## Common Workflows

### Creating a new note
1. User clicks "+" in sidebar or uses terminal
2. App creates note in database
3. App adds to notes state
4. App selects new note
5. User edits in NoteEditor

### Adding a task via terminal
1. User types: `/task "Task text" :today :note "Details"`
2. `parseCommand` extracts: text, scheduleToday flag, note text
3. App creates task in database with scheduled_date = today
4. App creates linked note if :note provided
5. Task appears in Today view

### Navigating by ref_id
1. User types `a3x7k9` in a note
2. After 500ms, `RefIdTransformPlugin` detects pattern
3. Plugin looks up ref_id in database via `lookupRefId`
4. If found, creates `RefIdNode` with title and type
5. Node renders as `RefIdBadge` component
6. User clicks badge → `onRefIdNavigate` handler
7. App navigates to note or shows task details

### Scheduling a task
1. User hovers over task → calendar icon appears
2. User clicks icon → DatePicker opens
3. User selects date (or quick option like "Tomorrow")
4. App calls `scheduleTask(taskId, date)`
5. If status is BACKLOG, auto-changes to PLANNED
6. Date displays in purple text next to task
7. If date is today, task appears in Today view

### Using Claude AI commands
1. User types `/joke` in terminal
2. Terminal sets `isLoading` state to true
3. Loading animation appears (wave bounce dots + "Thinking...")
4. `handleCommand` in App.jsx calls `getJoke()` from claudeService
5. claudeService invokes Supabase Edge Function `claude-proxy`
6. Edge Function calls Anthropic API with stored CLAUDE_API_KEY
7. Response returned to client
8. Terminal sets `isLoading` to false
9. Response displayed in terminal output
10. If error occurs, error message displayed with ✗ symbol

### Adding tags to tasks
1. Open task detail panel
2. Click "Add Tag" or start typing in tag input
3. Autocomplete shows relevant tags based on typed path
4. Select existing tag or create new hierarchical tag
5. Tag appears as badge in task detail panel
6. All parent tags automatically created in database
7. Task can be filtered by any tag in hierarchy

### Using Workspace Mode
1. Open task detail panel (double-click task or arrow → right arrow)
2. Click "Enter Workspace" button at bottom
3. Work in scratchpad (left) and/or chat with AI (right)
4. Session time tracked in header: "This Session: 5m (Total: 23m)"
5. Exit workspace (auto-saves if session > 2 minutes)
6. Next entry restores previous scratchpad and chat history

### Creating and referencing diagrams
1. Type `/diagram "Architecture"` in terminal
2. Draw.io editor opens in modal
3. Create diagram using Draw.io tools
4. Click "Save & Exit" in Draw.io toolbar
5. Diagram saved to database (XML + SVG)
6. Type diagram's ref_id in another note to show inline preview
7. Click preview to navigate to full diagram
8. Hover over diagram and click edit icon to modify

---

## Configuration Details

### File Locations for Common Tasks

**Adding a new terminal command:**
1. Add pattern matching in `src/utils/commandParser.js`
2. Add handler in `App.jsx` handleCommand function

**Adding a new task status:**
1. Update status options in `src/components/TaskList.jsx`
2. Update color coding in same component

**Modifying ref_id detection:**
1. Update pattern in `src/utils/refIdLookup.js`
2. Update `RefIdTransformPlugin.jsx` if needed
3. Update database function in SQL migration

**Adding a new special view:**
1. Create note with appropriate `note_type` or `list_metadata`
2. Add handler in `App.jsx` fetchTasksForView function
3. Add navigation option in sidebar

### Important Behaviors

**Optimistic Updates:**
Most CRUD operations use optimistic UI updates for instant feedback, with rollback on error.

**Auto-save:**
Notes auto-save after a debounce period (see `useAutoSave` hook).

**Task Order:**
Tasks have a `priority` field (lower number = higher priority). Tasks are displayed in priority order.

**OVERDUE Detection:**
On every task fetch (page load, view change), the system checks for tasks with:
- `scheduled_date` in the past
- Status NOT IN (DONE, CANCELLED, OVERDUE)

These are automatically updated to OVERDUE status.

### Known Design Patterns

- **Optimistic UI**: Update UI immediately, sync with DB, rollback on error
- **Debounced saves**: Don't save on every keystroke, wait for pause
- **Ref tracking**: Use refs for components that need direct manipulation (Terminal)
- **Conditional rendering**: Many UI elements shown only on hover (calendar, star icons)
- **Two-step deselection**: On Today page, clicking selected task requires two clicks to deselect
- **Terminal-centric Navigation**: Navigation icons (Home, Tasks, Projects, Inbox, Log, Settings) relocated from left sidebar to terminal bar header, appearing on hover for cleaner UI

---

## Debugging Tips

- Check browser console for Supabase errors
- Verify database migrations ran: `SELECT * FROM notes LIMIT 1;` should show all columns
- Check ref_id generation: `SELECT generate_reference_id();` should return valid ID
- Task not appearing in Today? Check `is_starred` and `scheduled_date` values
- Badge not appearing? Wait 500ms after typing ref_id
- Navigation not working? Check `left_id`, `right_id`, etc. are valid UUIDs
- Claude commands failing? Check:
  - Edge Function deployed: Visit Supabase Dashboard → Edge Functions
  - Secret set: `supabase secrets list --project-ref <project-ref>`
  - Check browser Network tab for Edge Function errors (500 = missing key, 400 = invalid params)
  - Temperature must be 0-1, not higher
  - Model name must be exact: `claude-sonnet-4-5`
- Theme not applying? Check:
  - Browser console for CSS variable errors
  - Theme ID exists in `src/config/themes/index.js`
  - Settings table has theme entry
  - localStorage has cached theme
- Search not working? Verify:
  - Notes have content (not empty)
  - Search modal is open (check showSearch state)
  - Search results being filtered correctly
- Activity log not updating? Check:
  - Activity log entries being created (check database)
  - logUpdateTrigger being incremented on actions
  - Filters not hiding all entries
- Music player not loading? Verify:
  - Valid Spotify playlist ID or YouTube video ID
  - Music links stored in settings table
  - Embeds not blocked by browser security
- Kanban drag-and-drop not working? Ensure:
  - HTML5 drag-and-drop supported
  - Task status updates propagating
  - onStatusChange callback defined
- Diagram not loading? Check:
  - Draw.io iframe loaded (check browser console)
  - PostMessage communication working (look for init/load/save events in console)
  - SVG properly decoded from base64 (should be plain SVG text, not data URI)
  - White background and centering applied (check CSS)
  - Edit icon appears on hover (check z-index and group-hover classes)

---

## Environment Setup

1. Install dependencies: `npm install`
2. Set up Supabase project
3. Run all SQL migrations in Supabase SQL Editor
4. Create `.env` file with:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
5. **Claude AI Setup (Optional):**
   - Get API key from https://console.anthropic.com/
   - Install Supabase CLI: `brew install supabase/tap/supabase`
   - Deploy Edge Function: `supabase functions deploy claude-proxy --project-ref <project-ref>`
   - Set secret: `supabase secrets set CLAUDE_API_KEY=<your-key> --project-ref <project-ref>`
6. Run dev server: `npm run dev`
7. Visit: `http://localhost:5173`

---

## Tips for LLMs Working on This Codebase

1. **Always check App.jsx first**: It's the central hub for state and handlers
2. **Database queries use Supabase client**: See `src/supabaseClient.js`
3. **Lexical editor state is complex**: Stored as JSONB, manipulated via Lexical API
4. **Optimistic updates**: Update UI first, then database. Rollback on error.
5. **Special notes are identified by**: `note_type` field or `list_metadata` field
6. **Task display order**: Sort by `priority` ASC (0 is highest)
7. **Date handling**: Use `dateUtils.js` functions, not raw Date objects
8. **Ref_id format is strict**: Must match `[a-z][0-9][a-z0-9]{4}` pattern
9. **OVERDUE status is automatic**: Don't let users manually select it
10. **Terminal commands are case-insensitive**: Parser uses `.toLowerCase()`

---

## Future Enhancement Ideas

- **Recurring tasks**: Automatic task regeneration on schedules
- **Calendar view**: Visual calendar with task scheduling
- **Backlinks panel**: Show all notes referencing current note
- **Ref_id autocomplete**: Autocomplete suggestions when typing ref_ids
- **Task dependencies**: Link tasks that depend on each other
- **Subtasks**: Hierarchical task breakdown
- **Tag colors/icons**: Visual categorization for tags
- **Tag statistics**: Task count per tag
- **Tag renaming**: Cascading updates for hierarchical tags
- **Tag merging**: Merge tags and update all references
- **Note templates**: Predefined note structures
- **Export to Markdown**: Export notes and tasks to markdown files
- **Real-time collaboration**: Multi-user support with conflict resolution
- **Attachments**: File uploads linked to notes/tasks
- **Time tracking**: Integrated time tracking per task
- **Analytics**: Productivity metrics and insights
- **Mobile app**: Native mobile version
- **Offline mode**: Full offline functionality with sync
- **Diagram templates**: Flowchart, sequence, architecture templates
- **Diagram versioning**: Track diagram history
- **Export diagrams**: PNG/PDF export functionality
