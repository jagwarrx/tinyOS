/**
 * Tag Utilities
 * Handles parsing and generation of hierarchical tags
 */

/**
 * Parse a tag path and generate all hierarchical levels
 * Example: "work/qbotica/projects/calvetti" generates:
 *   - { name: "work", full_path: "work", level: 0 }
 *   - { name: "qbotica", full_path: "work/qbotica", level: 1 }
 *   - { name: "projects", full_path: "work/qbotica/projects", level: 2 }
 *   - { name: "calvetti", full_path: "work/qbotica/projects/calvetti", level: 3 }
 *
 * @param {string} tagPath - Tag path (e.g., "work/qbotica/projects/calvetti")
 * @returns {Array<{name: string, full_path: string, level: number}>} - Array of tag objects
 */
export function parseTagPath(tagPath) {
  if (!tagPath || typeof tagPath !== 'string') {
    return []
  }

  // Remove leading/trailing slashes and normalize
  const normalized = tagPath.trim().replace(/^\/+|\/+$/g, '')

  if (!normalized) {
    return []
  }

  // Split by slash
  const parts = normalized.split('/').filter(part => part.trim().length > 0)

  if (parts.length === 0) {
    return []
  }

  // Generate hierarchical tags
  const tags = []
  let currentPath = ''

  parts.forEach((part, index) => {
    currentPath = index === 0 ? part : `${currentPath}/${part}`

    tags.push({
      name: part.trim(),
      full_path: currentPath,
      level: index
    })
  })

  return tags
}

/**
 * Validate tag path format
 * Rules:
 * - Can only contain alphanumeric, hyphens, underscores, and slashes
 * - Cannot have consecutive slashes
 * - Cannot start or end with slash
 *
 * @param {string} tagPath - Tag path to validate
 * @returns {{valid: boolean, error?: string}} - Validation result
 */
export function validateTagPath(tagPath) {
  if (!tagPath || typeof tagPath !== 'string') {
    return { valid: false, error: 'Tag path must be a non-empty string' }
  }

  const trimmed = tagPath.trim()

  if (trimmed.length === 0) {
    return { valid: false, error: 'Tag path cannot be empty' }
  }

  // Check for leading/trailing slashes
  if (trimmed.startsWith('/') || trimmed.endsWith('/')) {
    return { valid: false, error: 'Tag path cannot start or end with "/"' }
  }

  // Check for consecutive slashes
  if (trimmed.includes('//')) {
    return { valid: false, error: 'Tag path cannot contain consecutive slashes' }
  }

  // Check for invalid characters (allow alphanumeric, hyphens, underscores, slashes, spaces)
  const validPattern = /^[a-zA-Z0-9\s_\-/]+$/
  if (!validPattern.test(trimmed)) {
    return { valid: false, error: 'Tag path can only contain letters, numbers, spaces, hyphens, underscores, and slashes' }
  }

  return { valid: true }
}

/**
 * Format tag for display
 * Shows the full hierarchical path
 *
 * @param {string} fullPath - Full tag path
 * @returns {string} - Formatted tag
 */
export function formatTagDisplay(fullPath) {
  return fullPath
}

/**
 * Get tag name from full path
 * Example: "work/qbotica/projects/calvetti" → "calvetti"
 *
 * @param {string} fullPath - Full tag path
 * @returns {string} - Tag name
 */
export function getTagName(fullPath) {
  if (!fullPath) return ''
  const parts = fullPath.split('/')
  return parts[parts.length - 1] || ''
}

/**
 * Get parent path from full path
 * Example: "work/qbotica/projects/calvetti" → "work/qbotica/projects"
 *
 * @param {string} fullPath - Full tag path
 * @returns {string|null} - Parent path or null if no parent
 */
export function getParentPath(fullPath) {
  if (!fullPath) return null
  const parts = fullPath.split('/')
  if (parts.length <= 1) return null
  return parts.slice(0, -1).join('/')
}

/**
 * Check if a tag is a descendant of another tag
 * Example: "work/qbotica/projects" is descendant of "work"
 *
 * @param {string} tagPath - Tag path to check
 * @param {string} ancestorPath - Potential ancestor path
 * @returns {boolean} - True if descendant
 */
export function isDescendantOf(tagPath, ancestorPath) {
  if (!tagPath || !ancestorPath) return false
  return tagPath.startsWith(ancestorPath + '/') || tagPath === ancestorPath
}

/**
 * Get all ancestor paths for a tag
 * Example: "work/qbotica/projects/calvetti" → ["work", "work/qbotica", "work/qbotica/projects"]
 *
 * @param {string} fullPath - Full tag path
 * @returns {Array<string>} - Array of ancestor paths
 */
export function getAncestorPaths(fullPath) {
  if (!fullPath) return []

  const parts = fullPath.split('/')
  const ancestors = []

  for (let i = 0; i < parts.length - 1; i++) {
    ancestors.push(parts.slice(0, i + 1).join('/'))
  }

  return ancestors
}

/**
 * Sort tags by hierarchy (parents before children)
 *
 * @param {Array<{full_path: string}>} tags - Array of tag objects
 * @returns {Array<{full_path: string}>} - Sorted tags
 */
export function sortTagsByHierarchy(tags) {
  return [...tags].sort((a, b) => {
    const aDepth = (a.full_path.match(/\//g) || []).length
    const bDepth = (b.full_path.match(/\//g) || []).length

    if (aDepth !== bDepth) {
      return aDepth - bDepth
    }

    return a.full_path.localeCompare(b.full_path)
  })
}
