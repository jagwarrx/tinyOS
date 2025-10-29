/**
 * Tag Order Utilities
 * Manages custom tag ordering in localStorage
 */

const TAG_ORDER_KEY = 'tag_custom_order'

/**
 * Save tag order to localStorage
 * @param {Array<string>} tagIds - Ordered array of tag IDs
 */
export function saveTagOrder(tagIds) {
  try {
    localStorage.setItem(TAG_ORDER_KEY, JSON.stringify(tagIds))
  } catch (error) {
    console.error('Error saving tag order:', error)
  }
}

/**
 * Load tag order from localStorage
 * @returns {Array<string>} - Ordered array of tag IDs
 */
export function loadTagOrder() {
  try {
    const stored = localStorage.getItem(TAG_ORDER_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading tag order:', error)
    return []
  }
}

/**
 * Apply custom order to tags array
 * Tags not in custom order will be appended in their original order
 * @param {Array} tags - Array of tag objects
 * @param {Array<string>} customOrder - Array of tag IDs in custom order
 * @returns {Array} - Reordered tags array
 */
export function applyCustomOrder(tags, customOrder) {
  if (!customOrder || customOrder.length === 0) {
    return tags
  }

  const ordered = []
  const remaining = [...tags]

  // Add tags in custom order
  customOrder.forEach(tagId => {
    const index = remaining.findIndex(t => t.id === tagId)
    if (index !== -1) {
      ordered.push(remaining[index])
      remaining.splice(index, 1)
    }
  })

  // Add remaining tags that aren't in custom order
  return [...ordered, ...remaining]
}

/**
 * Reorder an item in array
 * @param {Array} array - Array to reorder
 * @param {number} fromIndex - Source index
 * @param {number} toIndex - Destination index
 * @returns {Array} - New array with item moved
 */
export function reorderArray(array, fromIndex, toIndex) {
  const result = Array.from(array)
  const [removed] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, removed)
  return result
}
