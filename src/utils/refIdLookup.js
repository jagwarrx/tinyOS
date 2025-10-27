import { supabase } from '../supabaseClient'

/**
 * Check if a string is a valid reference ID format
 * Format: [lowercase letter][digit][4 alphanumeric chars]
 * Examples: a3x7k9, b5m2n8, z9abc7
 */
export function isValidRefId(text) {
  return /^[a-z][0-9][a-z0-9]{4}$/.test(text)
}

/**
 * Look up a reference ID and return the corresponding note or task
 * Returns: { type: 'note'|'task', data: {...}, found: boolean }
 */
export async function lookupRefId(refId) {
  if (!isValidRefId(refId)) {
    return { found: false, type: null, data: null }
  }

  try {
    // First, try to find a note with this ref_id
    const { data: noteData, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .eq('ref_id', refId)
      .maybeSingle()

    if (noteData) {
      return {
        found: true,
        type: 'note',
        data: noteData
      }
    }

    // If not found, try to find a task
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('ref_id', refId)
      .maybeSingle()

    if (taskData) {
      return {
        found: true,
        type: 'task',
        data: taskData
      }
    }

    // Not found
    return { found: false, type: null, data: null }
  } catch (error) {
    console.error('Error looking up ref_id:', refId, error)
    return { found: false, type: null, data: null, error }
  }
}

/**
 * Look up multiple reference IDs at once
 * Returns: Map<refId, { type, data }>
 */
export async function lookupMultipleRefIds(refIds) {
  const validRefIds = refIds.filter(isValidRefId)
  const results = new Map()

  if (validRefIds.length === 0) {
    return results
  }

  try {
    // Batch lookup notes
    const { data: notesData } = await supabase
      .from('notes')
      .select('*')
      .in('ref_id', validRefIds)

    if (notesData) {
      notesData.forEach(note => {
        results.set(note.ref_id, { type: 'note', data: note })
      })
    }

    // Find ref_ids not found in notes
    const remainingRefIds = validRefIds.filter(refId => !results.has(refId))

    if (remainingRefIds.length > 0) {
      // Batch lookup tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .in('ref_id', remainingRefIds)

      if (tasksData) {
        tasksData.forEach(task => {
          results.set(task.ref_id, { type: 'task', data: task })
        })
      }
    }

    return results
  } catch (error) {
    console.error('Error looking up multiple ref_ids:', error)
    return results
  }
}

/**
 * Extract all reference IDs from text content
 * Pattern: [refid] where refid is [a-z][0-9][a-z0-9]{4}
 * Returns array of unique ref_ids found in the text
 */
export function extractRefIdsFromText(text) {
  if (!text) return []

  const refIdPattern = /\[([a-z][0-9][a-z0-9]{4})\]/g
  const matches = new Set()
  let match

  while ((match = refIdPattern.exec(text)) !== null) {
    matches.add(match[1])
  }

  return Array.from(matches)
}

/**
 * Extract reference IDs from Lexical editor content
 * Parses the JSON content and extracts ref_ids from text nodes
 */
export function extractRefIdsFromLexicalContent(content) {
  if (!content) return []

  try {
    const parsed = typeof content === 'string' ? JSON.parse(content) : content
    const refIds = new Set()

    function traverse(node) {
      if (!node) return

      // If it's a text node, extract ref_ids
      if (node.text) {
        const foundIds = extractRefIdsFromText(node.text)
        foundIds.forEach(id => refIds.add(id))
      }

      // Traverse children
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(traverse)
      }
    }

    traverse(parsed.root)
    return Array.from(refIds)
  } catch (error) {
    console.error('Error extracting ref_ids from Lexical content:', error)
    return []
  }
}

/**
 * Get the display title for a note or task
 */
export function getDisplayTitle(item, type) {
  if (type === 'note') {
    return item.title || 'Untitled'
  } else if (type === 'task') {
    return item.text || 'Untitled task'
  }
  return 'Unknown'
}
