/**
 * Tag Service
 * Handles all tag-related database operations
 */

import { supabase } from '../supabaseClient'
import { parseTagPath, validateTagPath } from '../utils/tagUtils'

/**
 * Create or get existing tags from a tag path
 * Automatically creates all hierarchical levels
 * Example: "work/qbotica/projects/calvetti" creates 4 tags
 *
 * @param {string} tagPath - Tag path (e.g., "work/qbotica/projects/calvetti")
 * @returns {Promise<Array>} - Array of created/existing tag objects
 */
export async function createTagsFromPath(tagPath) {
  try {
    // Validate tag path
    const validation = validateTagPath(tagPath)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Parse into hierarchical levels
    const tagLevels = parseTagPath(tagPath)

    if (tagLevels.length === 0) {
      throw new Error('Invalid tag path')
    }

    // Create or get each tag level
    const createdTags = []

    for (const tagLevel of tagLevels) {
      // Check if tag already exists
      const { data: existingTag, error: fetchError } = await supabase
        .from('tags')
        .select('*')
        .eq('full_path', tagLevel.full_path)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
        throw fetchError
      }

      if (existingTag) {
        createdTags.push(existingTag)
      } else {
        // Create new tag
        const { data: newTag, error: createError } = await supabase
          .from('tags')
          .insert({
            name: tagLevel.name,
            full_path: tagLevel.full_path,
            level: tagLevel.level
          })
          .select()
          .single()

        if (createError) throw createError

        createdTags.push(newTag)
      }
    }

    return createdTags
  } catch (error) {
    console.error('Error creating tags from path:', error)
    throw error
  }
}

/**
 * Get all tags
 *
 * @returns {Promise<Array>} - Array of all tags
 */
export async function fetchAllTags() {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('full_path', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching all tags:', error)
    throw error
  }
}

/**
 * Search tags by partial path or name
 *
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Matching tags
 */
export async function searchTags(query) {
  try {
    if (!query || query.trim().length === 0) {
      return []
    }

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .or(`full_path.ilike.%${query}%,name.ilike.%${query}%`)
      .order('level', { ascending: true })
      .order('full_path', { ascending: true })
      .limit(20)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error searching tags:', error)
    throw error
  }
}

/**
 * Tag a task with a tag path
 * Automatically creates all hierarchical tags
 *
 * @param {string} taskId - Task UUID
 * @param {string} tagPath - Tag path (e.g., "work/qbotica/projects/calvetti")
 * @returns {Promise<Array>} - Array of created tag associations
 */
export async function tagTask(taskId, tagPath) {
  try {
    // Create or get all hierarchical tags
    const tags = await createTagsFromPath(tagPath)

    // Associate all hierarchical tags with the task
    const associations = []

    for (const tag of tags) {
      // Check if already associated
      const { data: existing, error: fetchError } = await supabase
        .from('task_tags')
        .select('*')
        .eq('task_id', taskId)
        .eq('tag_id', tag.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (!existing) {
        // Create association
        const { data: association, error: createError } = await supabase
          .from('task_tags')
          .insert({
            task_id: taskId,
            tag_id: tag.id
          })
          .select()
          .single()

        if (createError) throw createError
        associations.push(association)
      } else {
        associations.push(existing)
      }
    }

    return associations
  } catch (error) {
    console.error('Error tagging task:', error)
    throw error
  }
}

/**
 * Remove a tag from a task
 * Only removes the specific tag, not its hierarchy
 *
 * @param {string} taskId - Task UUID
 * @param {string} tagId - Tag UUID
 * @returns {Promise<void>}
 */
export async function untagTask(taskId, tagId) {
  try {
    const { error } = await supabase
      .from('task_tags')
      .delete()
      .eq('task_id', taskId)
      .eq('tag_id', tagId)

    if (error) throw error
  } catch (error) {
    console.error('Error untagging task:', error)
    throw error
  }
}

/**
 * Get all tags for a task (with full tag details)
 *
 * @param {string} taskId - Task UUID
 * @returns {Promise<Array>} - Array of tag objects
 */
export async function getTaskTags(taskId) {
  try {
    const { data, error } = await supabase
      .from('task_tags')
      .select(`
        tag_id,
        tags (
          id,
          name,
          full_path,
          level,
          created_at
        )
      `)
      .eq('task_id', taskId)

    if (error) throw error

    // Flatten the data structure
    const tags = (data || []).map(item => item.tags).filter(Boolean)

    // Sort by level (shallowest first)
    return tags.sort((a, b) => a.level - b.level)
  } catch (error) {
    console.error('Error fetching task tags:', error)
    throw error
  }
}

/**
 * Get all leaf tags for a task (deepest level only)
 * Example: If task has "work", "work/qbotica", "work/qbotica/projects"
 * Returns only "work/qbotica/projects"
 *
 * @param {string} taskId - Task UUID
 * @returns {Promise<Array>} - Array of leaf tag objects
 */
export async function getTaskLeafTags(taskId) {
  try {
    const allTags = await getTaskTags(taskId)

    // Filter to only leaf tags (tags that aren't parents of other tags)
    const leafTags = allTags.filter(tag => {
      const isParent = allTags.some(otherTag =>
        otherTag.full_path !== tag.full_path &&
        otherTag.full_path.startsWith(tag.full_path + '/')
      )
      return !isParent
    })

    return leafTags
  } catch (error) {
    console.error('Error fetching task leaf tags:', error)
    throw error
  }
}

/**
 * Remove all tags from a task
 *
 * @param {string} taskId - Task UUID
 * @returns {Promise<void>}
 */
export async function clearTaskTags(taskId) {
  try {
    const { error } = await supabase
      .from('task_tags')
      .delete()
      .eq('task_id', taskId)

    if (error) throw error
  } catch (error) {
    console.error('Error clearing task tags:', error)
    throw error
  }
}

/**
 * Get all tasks for a tag (and optionally its descendants)
 *
 * @param {string} tagId - Tag UUID
 * @param {boolean} includeDescendants - Include tasks tagged with descendant tags
 * @returns {Promise<Array>} - Array of task IDs
 */
export async function getTasksForTag(tagId, includeDescendants = false) {
  try {
    if (!includeDescendants) {
      // Simple query for just this tag
      const { data, error } = await supabase
        .from('task_tags')
        .select('task_id')
        .eq('tag_id', tagId)

      if (error) throw error
      return (data || []).map(item => item.task_id)
    } else {
      // Get the tag's full path
      const { data: tag, error: tagError } = await supabase
        .from('tags')
        .select('full_path')
        .eq('id', tagId)
        .single()

      if (tagError) throw tagError

      // Get all descendant tags
      const { data: descendantTags, error: descError } = await supabase
        .from('tags')
        .select('id')
        .like('full_path', `${tag.full_path}%`)

      if (descError) throw descError

      const tagIds = descendantTags.map(t => t.id)

      // Get all tasks with these tags
      const { data, error } = await supabase
        .from('task_tags')
        .select('task_id')
        .in('tag_id', tagIds)

      if (error) throw error

      // Deduplicate task IDs
      const uniqueTaskIds = [...new Set((data || []).map(item => item.task_id))]
      return uniqueTaskIds
    }
  } catch (error) {
    console.error('Error fetching tasks for tag:', error)
    throw error
  }
}

/**
 * Delete a tag and all its associations
 * Does NOT delete descendant tags
 *
 * @param {string} tagId - Tag UUID
 * @returns {Promise<void>}
 */
export async function deleteTag(tagId) {
  try {
    // Delete tag (cascade will handle task_tags)
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting tag:', error)
    throw error
  }
}

// ============================================================================
// Note tagging functions (for future use)
// ============================================================================

/**
 * Tag a note with a tag path
 *
 * @param {string} noteId - Note UUID
 * @param {string} tagPath - Tag path
 * @returns {Promise<Array>} - Array of created tag associations
 */
export async function tagNote(noteId, tagPath) {
  try {
    const tags = await createTagsFromPath(tagPath)

    const associations = []

    for (const tag of tags) {
      const { data: existing, error: fetchError } = await supabase
        .from('note_tags')
        .select('*')
        .eq('note_id', noteId)
        .eq('tag_id', tag.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (!existing) {
        const { data: association, error: createError } = await supabase
          .from('note_tags')
          .insert({
            note_id: noteId,
            tag_id: tag.id
          })
          .select()
          .single()

        if (createError) throw createError
        associations.push(association)
      } else {
        associations.push(existing)
      }
    }

    return associations
  } catch (error) {
    console.error('Error tagging note:', error)
    throw error
  }
}

/**
 * Get all tags for a note
 *
 * @param {string} noteId - Note UUID
 * @returns {Promise<Array>} - Array of tag objects
 */
export async function getNoteTags(noteId) {
  try {
    const { data, error } = await supabase
      .from('note_tags')
      .select(`
        tag_id,
        tags (
          id,
          name,
          full_path,
          level,
          created_at
        )
      `)
      .eq('note_id', noteId)

    if (error) throw error

    const tags = (data || []).map(item => item.tags).filter(Boolean)
    return tags.sort((a, b) => a.level - b.level)
  } catch (error) {
    console.error('Error fetching note tags:', error)
    throw error
  }
}

/**
 * Filter tasks by selected tag IDs
 * A task matches if it has ANY of the selected tags or their descendants
 *
 * @param {Array} tasks - Array of task objects
 * @param {Array<string>} selectedTagIds - Array of tag UUIDs to filter by
 * @param {Array} allTags - Array of all available tags (for hierarchy lookup)
 * @returns {Promise<Array>} - Filtered tasks
 */
export async function filterTasksByTags(tasks, selectedTagIds, allTags = null) {
  if (!selectedTagIds || selectedTagIds.length === 0) {
    return tasks
  }

  try {
    // If allTags not provided, fetch them
    if (!allTags) {
      allTags = await fetchAllTags()
    }

    // Get the full paths of selected tags
    const selectedTags = allTags.filter(tag => selectedTagIds.includes(tag.id))
    const selectedPaths = selectedTags.map(tag => tag.full_path)

    // For each task, check if it has any of the selected tags or their descendants
    const matchingTaskIds = new Set()

    for (const task of tasks) {
      // Get task's tags
      const taskTags = await getTaskTags(task.id)

      // Check if any task tag matches or is a descendant of selected tags
      const hasMatch = taskTags.some(taskTag => {
        // Check if this task tag matches any selected tag or is a descendant
        return selectedPaths.some(selectedPath => {
          return (
            taskTag.full_path === selectedPath ||
            taskTag.full_path.startsWith(selectedPath + '/')
          )
        })
      })

      if (hasMatch) {
        matchingTaskIds.add(task.id)
      }
    }

    // Filter tasks to only those that matched
    return tasks.filter(task => matchingTaskIds.has(task.id))
  } catch (error) {
    console.error('Error filtering tasks by tags:', error)
    return tasks // Return unfiltered on error
  }
}
