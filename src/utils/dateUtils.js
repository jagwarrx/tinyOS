/**
 * Date Utilities
 *
 * Helper functions for formatting and displaying dates in natural language
 */

/**
 * Format a date string to natural language
 * @param {string} dateString - ISO date string (YYYY-MM-DD)
 * @returns {string} - Natural language date (e.g., "Today", "Tomorrow", "Mon, Dec 25")
 */
export function formatDateNatural(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString + 'T00:00:00') // Parse as local date
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)

  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  // Today
  if (diffDays === 0) {
    return 'Today'
  }

  // Tomorrow
  if (diffDays === 1) {
    return 'Tomorrow'
  }

  // Yesterday
  if (diffDays === -1) {
    return 'Yesterday'
  }

  // This week (next 6 days)
  if (diffDays > 1 && diffDays <= 6) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return dayNames[date.getDay()]
  }

  // Last week (past 6 days)
  if (diffDays < -1 && diffDays >= -6) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return `Last ${dayNames[date.getDay()]}`
  }

  // Further dates: show month and day
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`
}

/**
 * Get today's date as YYYY-MM-DD
 * @returns {string} - Today's date in ISO format
 */
export function getTodayISO() {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

/**
 * Get tomorrow's date as YYYY-MM-DD
 * @returns {string} - Tomorrow's date in ISO format
 */
export function getTomorrowISO() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

/**
 * Check if a date is today
 * @param {string} dateString - ISO date string
 * @returns {boolean}
 */
export function isToday(dateString) {
  if (!dateString) return false
  return dateString === getTodayISO()
}

/**
 * Check if a date is in the past
 * @param {string} dateString - ISO date string
 * @returns {boolean}
 */
export function isPast(dateString) {
  if (!dateString) return false
  const date = new Date(dateString + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, 4th, etc.)
 * @param {number} day - Day of the month
 * @returns {string} - Ordinal suffix (st, nd, rd, th)
 */
function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return 'th'
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

/**
 * Format today's date as "MONTH DATEth, DAY"
 * Example: "January 15th, Monday"
 * @returns {string} - Formatted date string
 */
export function formatTodayLong() {
  const today = new Date()
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const month = monthNames[today.getMonth()]
  const date = today.getDate()
  const day = dayNames[today.getDay()]
  const suffix = getOrdinalSuffix(date)

  return `${month} ${date}${suffix}, ${day}`
}
