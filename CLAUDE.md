# Lexical Notes App - Quick Context

> **Note:** This is a condensed overview. For comprehensive details, see `CLAUDE-EXTENSIVE.md`.

## Overview

The purpose of this app is to make me more effective, strategic and focused. 

A knowledge and task management application combining rich-text note-taking with powerful task management. Built on Lexical editor (Meta), featuring bidirectional note linking, reference IDs for cross-linking, task scheduling, projects, hierarchical tagging, and a built-in terminal for quick commands.

**Tech Stack:** React 18, Lexical, Supabase (PostgreSQL), Tailwind CSS, Vite, Lucide React

## Core Concepts

### 1. Notes System
- Built on Lexical editor with rich formatting (bold, underline, highlights, code, lists, links)
- Unique **reference IDs** (e.g., `a3x7k9`) for permanent linking
- Bidirectional navigation (up/down/left/right relationships)
- Special note types: HOME, Inbox, Tasks, Today, Week, Projects, Log, Diagrams

### 2. Tasks System
- Separate database table (not in note content)
- Statuses: BACKLOG, PLANNED, DOING, BLOCKED, OVERDUE, DONE, CANCELLED
- Scheduling with natural language dates ("Today", "Tomorrow", "Mon")
- Project organization, starring, types: Deep Work, Quick Wins, Grunt Work, People Time, Planning
- Hierarchical tagging with slash-separated paths
- **Inline editing**: Click status/type/due cells in task list for dropdown editors

### 3. Special Pages
- **HOME**: Main entry point
- **Inbox**: Quick capture
- **Tasks**: Master list (List and Kanban views)
- **Today**: Starred + scheduled for today
- **Week/Someday**: Filtered task views
- **Projects**: Project list and individual project notes
- **Log**: Activity tracking (press 'L' to navigate)

## Database Schema

**Tables:** notes, tasks, activity_log, settings, tags, task_tags, note_tags

See `CLAUDE-EXTENSIVE.md` for complete schema details and `schema.sql` for SQL definitions.

## Key Features

### 1. Reference ID Linking
- 6-char unique IDs (format: `[a-z][0-9][a-z0-9]{4}`)
- Type ref_id in note → becomes clickable badge → navigates to target
- Works for notes, tasks, and diagrams

### 2. Hierarchical Tagging
- Multi-level tags: `work/qbotica/projects/calvetti`
- Autocomplete filtered by hierarchy level
- Filter tasks by tags (includes descendants)

### 3. Workspace Mode
- Full-screen focused work environment per task
- Split view: scratchpad (left) + AI chat (right)
- Session tracking with persistence (>2min saved to DB)
- Built-in collapsible terminal

### 4. Draw.io Diagram Integration
- Embedded Draw.io editor (embed.diagrams.net)
- Dual storage: XML (editing) + SVG (preview)
- Inline previews via ref_id in notes

### 5. Terminal Commands
Built-in terminal with 20+ commands including task creation, navigation, timers, and Claude AI integration.
See `CLAUDE-EXTENSIVE.md` for complete command reference.

### 6. Other Key Features
- **20+ Themes**: Terminal, Sonokai, Monokai Pro, Claude AI, Things 3, Trello (see `themes.md`)
- **Font Customization**: 10+ fonts with ligature support
- **UI Modes**: Standard, Hacker Terminal, Expanded View
- **Global Search**: Fuzzy search across notes/tasks with keyboard navigation
- **Activity Logging**: Comprehensive tracking with smart grouping and filters
- **Music Player**: Floating Spotify/YouTube player
- **Kanban Board**: Drag-and-drop task cards
- **Navigation History**: Browser-like back/forward (Option+Left/Right), last 20 pages in localStorage
- **Keyboard Shortcuts**: Press `?` for help modal

## Architecture

**Central Hub:** App.jsx manages all state and command routing
**Data Layer:** services/ (notes, tasks, tags, claude, activity, settings, theme, music)
**Editor:** lexical/ (RefId nodes and transform plugins)
**Utilities:** utils/ (commandParser, dateUtils, tagUtils, workspaceStorage, navigationHistory)

See `CLAUDE-EXTENSIVE.md` for detailed component specifications and file structure.

## Important Behaviors

- **Optimistic Updates**: UI updates first, DB second, rollback on error
- **Auto-save**: Debounced saves for notes
- **Task Order**: Priority field (0 = highest)
- **Task Types**: deep_work, quick_wins, grunt_work, people_time, planning (stored as snake_case in DB)
- **OVERDUE Detection**: Automatic on task fetch (past scheduled_date)
- **Ref ID Generation**: PostgreSQL function `generate_reference_id()`
- **URL Routing**: `/<ref_id>` format with history.pushState
- **Navigation History**: Managed by `navigationHistory.js`, stores last 20 pages in localStorage
- **Special Notes**: Identified by `note_type` or `list_metadata`
- **Theme System**: Algorithmic palette generation (chroma.js) from primary colors; all components use CSS variables (`--color-*`); semantic colors for actions (success/error/warning/info)

## Quick Tips for LLMs

1. **App.jsx** is the central hub - check it first
2. Use **optimistic updates** pattern (UI first, DB second, rollback on error)
3. **Ref_id format** is strict: `[a-z][0-9][a-z0-9]{4}`
4. **OVERDUE status** is automatic - not user-selectable
5. **Task order**: Sort by `priority` ASC
6. **Terminal commands**: Case-insensitive, parsed by `commandParser.js` → `App.jsx` handlers
7. **Colors**: Never use hex codes or hardcoded Tailwind colors; use CSS variables (`var(--color-semantic-success)`) or theme classes (`bg-semantic-success`); semantic colors for actions (complete=success, delete=error, start=accent-primary)

## Token Optimization Guidelines

**This file (~4K tokens) covers most common tasks. Only request CLAUDE-EXTENSIVE.md (~15K tokens) when you need:**
- Detailed workflow explanations
- Complete service method signatures
- Debugging procedures
- Implementation examples
- Full database schema details

**Best practices:**
- Use Grep/Glob to locate files before reading
- Read files on-demand, not preemptively
- Ask clarifying questions before exploring codebase
- Reference file locations instead of re-reading (e.g., "See src/App.jsx:45")
- Check this file first for common tasks:
  - Adding terminal commands: `commandParser.js` + `App.jsx`
  - Modifying task list UI (inline dropdowns): `TaskList.jsx`
  - Understanding ref_id detection: `RefIdTransformPlugin.jsx`
  - Creating custom themes: `CustomThemeBuilder.jsx` + `themeService.js`
  - Navigation history: `navigationHistory.js`

**Example token-efficient workflow:**
```
User: "Add a new task status"
✅ Good: Check CLAUDE.md → Grep for status patterns → Read only TaskList.jsx
❌ Bad: Read App.jsx + TaskList.jsx + CLAUDE-EXTENSIVE.md + TasksService.js
```

## Documentation Files

- **README.md**: General project overview
- **CLAUDE.md** (this file): Quick LLM context (~4K tokens)
- **CLAUDE-EXTENSIVE.md**: Detailed specifications, workflows, debugging (~15K tokens)
- **themes.md**: Theme system documentation
- **schema.sql**: Complete database schema

## Setup

Standard Vite+React setup with Supabase backend. See `CLAUDE-EXTENSIVE.md` for detailed setup instructions and debugging guide.

---

**For detailed information:** All comprehensive technical details, API specs, workflows, examples, and troubleshooting are in `CLAUDE-EXTENSIVE.md`. This file provides quick reference for 80% of common tasks.
