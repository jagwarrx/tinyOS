# Reference ID Implementation Guide

## Overview

This guide explains how to implement clickable reference IDs in your notes app, allowing you to link notes together by typing their reference IDs (e.g., `a3x7k9`).

## Database Setup

### 1. Run the Migration

Execute `add_reference_ids.sql` in your Supabase SQL Editor. This will:
- Create the `generate_reference_id()` function
- Add `ref_id` column to `notes` and `tasks` tables
- Generate unique reference IDs for all existing records
- Create indexes for fast lookups

### 2. Verify the Migration

```sql
-- Check that all notes and tasks have ref_ids
SELECT COUNT(*), COUNT(ref_id) FROM notes;
SELECT COUNT(*), COUNT(ref_id) FROM tasks;

-- Sample some reference IDs
SELECT id, ref_id, title FROM notes LIMIT 10;
SELECT id, ref_id, text FROM tasks LIMIT 10;
```

## Frontend Implementation

### Step 1: Display Reference IDs

Add reference ID display to your note editor header and task list items.

#### Option A: In NoteEditor Component

```jsx
// In NoteEditor.jsx, add ref_id display in the header
<div className="flex items-center gap-3 mb-4">
  {note.ref_id && (
    <span className="text-xs font-mono text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
      {note.ref_id}
    </span>
  )}
  <input
    type="text"
    value={note.title}
    onChange={(e) => handleTitleChange(e.target.value)}
    className="flex-1 text-2xl font-bold..."
  />
</div>
```

#### Option B: In TaskList Component

```jsx
// In TaskList.jsx, add ref_id next to task text
<div className="flex items-baseline gap-2">
  {task.ref_id && (
    <span className="text-xs font-mono text-gray-400 dark:text-gray-600">
      [{task.ref_id}]
    </span>
  )}
  <span className="task-text">{task.text}</span>
</div>
```

### Step 2: Parse Reference IDs in Content

Create a utility to detect reference IDs in note content.

```javascript
// src/utils/refIdParser.js
export function parseRefIds(text) {
  // Match pattern: lowercase letter + digit + 4 alphanumeric chars
  const refIdPattern = /\b([a-z][0-9][a-z0-9]{4})\b/g
  const matches = []
  let match

  while ((match = refIdPattern.exec(text)) !== null) {
    matches.push({
      refId: match[1],
      index: match.index,
      length: match[1].length
    })
  }

  return matches
}

export function isValidRefId(text) {
  return /^[a-z][0-9][a-z0-9]{4}$/.test(text)
}
```

### Step 3: Make Reference IDs Clickable in Lexical Editor

Add a custom Lexical node type for reference ID links.

```javascript
// src/lexical/nodes/RefIdNode.js
import { TextNode } from 'lexical'

export class RefIdNode extends TextNode {
  static getType() {
    return 'refid'
  }

  static clone(node) {
    return new RefIdNode(node.__text, node.__refId, node.__key)
  }

  constructor(text, refId, key) {
    super(text, key)
    this.__refId = refId
  }

  createDOM(config) {
    const element = super.createDOM(config)
    element.className = 'refid-link'
    element.style.color = '#3b82f6' // blue-500
    element.style.cursor = 'pointer'
    element.style.textDecoration = 'underline'
    element.title = `Go to ${this.__refId}`
    return element
  }

  updateDOM(prevNode, dom, config) {
    return false
  }

  static importJSON(serializedNode) {
    const node = new RefIdNode(
      serializedNode.text,
      serializedNode.refId
    )
    return node
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: 'refid',
      refId: this.__refId,
      version: 1
    }
  }
}
```

### Step 4: Add Click Handler for Reference IDs

In your App.jsx, add a handler to navigate to notes/tasks by ref_id:

```javascript
// In App.jsx
const navigateToRefId = async (refId) => {
  try {
    // First try to find a note with this ref_id
    const { data: noteData, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .eq('ref_id', refId)
      .maybeSingle()

    if (noteData) {
      setSelectedNote(noteData)
      setSidebarOpen(false)
      return `Navigated to note: ${noteData.title}`
    }

    // If not found, try to find a task
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('ref_id', refId)
      .maybeSingle()

    if (taskData) {
      // Show task details or navigate to its project
      alert(`Found task: ${taskData.text}\nStatus: ${taskData.status}`)
      return `Found task: ${taskData.text}`
    }

    return `Reference ID "${refId}" not found`
  } catch (error) {
    console.error('Error navigating to ref_id:', error)
    return `Error finding reference ID: ${error.message}`
  }
}
```

### Step 5: Add Command Support

Update your terminal command parser to support ref_id navigation:

```javascript
// In utils/commandParser.js
export function parseCommand(input) {
  const trimmed = input.trim()

  // Check if input matches a ref_id pattern
  if (/^[a-z][0-9][a-z0-9]{4}$/.test(trimmed)) {
    return {
      type: 'GOTO_REFID',
      payload: { refId: trimmed }
    }
  }

  // ... rest of existing command parsing
}
```

```javascript
// In App.jsx handleCommand function
case 'GOTO_REFID': {
  const { refId } = command.payload
  return await navigateToRefId(refId)
}
```

### Step 6: Add Copy Reference ID Feature

Add a button to quickly copy a note's reference ID:

```javascript
// In NoteEditor.jsx
const copyRefId = (refId) => {
  navigator.clipboard.writeText(refId)
  alert(`Copied ${refId} to clipboard`)
}

// In the header toolbar
{note.ref_id && (
  <button
    onClick={() => copyRefId(note.ref_id)}
    className="text-xs text-gray-500 hover:text-gray-700"
    title="Copy reference ID"
  >
    📋 {note.ref_id}
  </button>
)}
```

## Usage Examples

### Linking Notes Together

1. **Get the reference ID** of the target note (displayed in the header)
2. **Type it in another note**: "See note a3x7k9 for more details"
3. **Click on it** to navigate directly to that note

### Terminal Commands

```bash
# Navigate by reference ID
a3x7k9

# Go to a specific note
goto a3x7k9

# Copy reference ID and paste elsewhere
# The ref_id acts as a permanent link to that note
```

### Task References

```markdown
# In a note:
Follow up on task b5m2n8
Blocked by a3x7k9
Related to project c1xyz7
```

## Advanced Features

### Backlinks

Show all notes that reference the current note:

```javascript
const findBacklinks = async (refId) => {
  const { data, error } = await supabase
    .from('notes')
    .select('id, title, ref_id')
    .like('content', `%${refId}%`)

  return data || []
}
```

### Auto-complete

Add auto-complete for reference IDs:

```javascript
const searchRefIds = async (partial) => {
  const { data: notes } = await supabase
    .from('notes')
    .select('ref_id, title')
    .ilike('ref_id', `${partial}%`)
    .limit(10)

  const { data: tasks } = await supabase
    .from('tasks')
    .select('ref_id, text')
    .ilike('ref_id', `${partial}%`)
    .limit(10)

  return [...(notes || []), ...(tasks || [])]
}
```

## Benefits

1. **Permanent Links**: Reference IDs never change, unlike titles
2. **Fast Lookups**: Indexed for quick queries
3. **Type Safety**: Short, memorable, and easy to type
4. **Cross-Linking**: Link notes, tasks, and any future entities
5. **Copy-Paste**: Easy to share in chat, docs, or commits

## Next Steps

1. Run the migration in Supabase
2. Add ref_id display to your UI components
3. Implement click handlers for navigation
4. Add terminal command support
5. Test with some notes and tasks
6. Consider adding backlinks feature

## Troubleshooting

### Reference ID not generating
- Check that the `generate_reference_id()` function was created
- Verify the default value is set on the column
- Manually generate: `UPDATE notes SET ref_id = generate_reference_id() WHERE ref_id IS NULL;`

### Duplicate reference ID error
- This should never happen due to the UNIQUE constraint
- If it does, re-run the ref_id generation for affected rows

### Navigation not working
- Verify indexes exist: `\d notes` and `\d tasks` in psql
- Check that `fetchByRefId` service methods are working
- Ensure ref_id is being passed correctly to the handler
