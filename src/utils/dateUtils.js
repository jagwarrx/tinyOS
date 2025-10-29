/**
 * Date Utilities
 *
 * Helper functions for formatting and displaying dates in natural language
 */

/**
 * Format a date string to natural language
 * @param {string} dateString - ISO date string (YYYY-MM-DD) or special values ('THIS_WEEK', 'SOMEDAY')
 * @returns {string} - Natural language date (e.g., "Today", "Tomorrow", "Mon, Dec 25")
 */
export function formatDateNatural(dateString) {
  if (!dateString) return ''

  // Handle special values
  if (dateString === 'THIS_WEEK') return 'This Week'
  if (dateString === 'SOMEDAY') return 'Someday'

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
 * Get today's date as YYYY-MM-DD (in local timezone)
 * @returns {string} - Today's date in ISO format
 */
export function getTodayISO() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get tomorrow's date as YYYY-MM-DD (in local timezone)
 * @returns {string} - Tomorrow's date in ISO format
 */
export function getTomorrowISO() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const year = tomorrow.getFullYear()
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const day = String(tomorrow.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

/**
 * Parse natural language time string to Date object
 * Supports: "2pm", "14:30", "tomorrow 2pm", "next monday 3pm", "in 2 hours", "30m"
 * @param {string} input - Natural language time string
 * @returns {Date|null} - Parsed Date object or null if invalid
 */
export function parseNaturalTime(input) {
  const trimmed = input.trim().toLowerCase()
  const now = new Date()

  // "in X minutes" or "X minutes" or "Xm"
  const minutesMatch = trimmed.match(/^(?:in\s+)?(\d+)\s*(?:min|minutes?|m)(?:\s+|$)/i)
  if (minutesMatch) {
    const minutes = parseInt(minutesMatch[1])
    const result = new Date(now.getTime() + minutes * 60000)
    // Extract remaining text after time
    const remainingText = trimmed.replace(minutesMatch[0], '').trim()
    return { date: result, remainingText }
  }

  // "in X hours" or "X hours" or "Xh"
  const hoursMatch = trimmed.match(/^(?:in\s+)?(\d+)\s*(?:hour|hours|h)(?:\s+|$)/i)
  if (hoursMatch) {
    const hours = parseInt(hoursMatch[1])
    const result = new Date(now.getTime() + hours * 3600000)
    const remainingText = trimmed.replace(hoursMatch[0], '').trim()
    return { date: result, remainingText }
  }

  // Extract time component (e.g., "2pm", "14:30", "2:30pm")
  const timeMatch = trimmed.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
  let hour = null
  let minute = 0

  if (timeMatch) {
    hour = parseInt(timeMatch[1])
    minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0
    const period = timeMatch[3]

    if (period === 'pm' && hour < 12) hour += 12
    if (period === 'am' && hour === 12) hour = 0
    // If no am/pm specified and hour < 12 and it's past that hour, assume PM
    if (!period && hour < 12 && now.getHours() >= hour) {
      hour += 12
    }
  }

  // Extract date component
  let targetDate = new Date(now)
  targetDate.setHours(hour !== null ? hour : now.getHours())
  targetDate.setMinutes(minute)
  targetDate.setSeconds(0)
  targetDate.setMilliseconds(0)

  // Check for day keywords
  if (trimmed.includes('tomorrow')) {
    targetDate.setDate(targetDate.getDate() + 1)
  } else if (trimmed.includes('next monday') || trimmed.includes('monday')) {
    const currentDay = targetDate.getDay()
    const targetDay = 1 // Monday
    let daysToAdd = targetDay - currentDay
    if (daysToAdd <= 0 || trimmed.includes('next')) daysToAdd += 7
    targetDate.setDate(targetDate.getDate() + daysToAdd)
  } else if (trimmed.includes('next tuesday') || trimmed.includes('tuesday')) {
    const currentDay = targetDate.getDay()
    const targetDay = 2
    let daysToAdd = targetDay - currentDay
    if (daysToAdd <= 0 || trimmed.includes('next')) daysToAdd += 7
    targetDate.setDate(targetDate.getDate() + daysToAdd)
  } else if (trimmed.includes('next wednesday') || trimmed.includes('wednesday')) {
    const currentDay = targetDate.getDay()
    const targetDay = 3
    let daysToAdd = targetDay - currentDay
    if (daysToAdd <= 0 || trimmed.includes('next')) daysToAdd += 7
    targetDate.setDate(targetDate.getDate() + daysToAdd)
  } else if (trimmed.includes('next thursday') || trimmed.includes('thursday')) {
    const currentDay = targetDate.getDay()
    const targetDay = 4
    let daysToAdd = targetDay - currentDay
    if (daysToAdd <= 0 || trimmed.includes('next')) daysToAdd += 7
    targetDate.setDate(targetDate.getDate() + daysToAdd)
  } else if (trimmed.includes('next friday') || trimmed.includes('friday')) {
    const currentDay = targetDate.getDay()
    const targetDay = 5
    let daysToAdd = targetDay - currentDay
    if (daysToAdd <= 0 || trimmed.includes('next')) daysToAdd += 7
    targetDate.setDate(targetDate.getDate() + daysToAdd)
  } else if (trimmed.includes('next saturday') || trimmed.includes('saturday')) {
    const currentDay = targetDate.getDay()
    const targetDay = 6
    let daysToAdd = targetDay - currentDay
    if (daysToAdd <= 0 || trimmed.includes('next')) daysToAdd += 7
    targetDate.setDate(targetDate.getDate() + daysToAdd)
  } else if (trimmed.includes('next sunday') || trimmed.includes('sunday')) {
    const currentDay = targetDate.getDay()
    const targetDay = 0
    let daysToAdd = targetDay - currentDay
    if (daysToAdd <= 0 || trimmed.includes('next')) daysToAdd += 7
    targetDate.setDate(targetDate.getDate() + daysToAdd)
  }

  // If the time has already passed today and no day specified, assume tomorrow
  if (!trimmed.includes('tomorrow') && !trimmed.match(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/) && targetDate <= now) {
    targetDate.setDate(targetDate.getDate() + 1)
  }

  // Extract reminder text (everything that's not a time/date keyword)
  let remainingText = input
  const timeKeywords = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?|tomorrow|next\s+\w+|monday|tuesday|wednesday|thursday|friday|saturday|sunday|in\s+\d+\s*(?:min|minutes?|hours?|m|h)/gi
  remainingText = remainingText.replace(timeKeywords, '').trim()

  return { date: targetDate, remainingText }
}

/**
 * Format datetime in "MMM DDth HH:MM" format
 * Example: "Jan 25th 14:30"
 * @param {Date} date - Date object to format
 * @returns {string} - Formatted datetime string
 */
export function formatReminderTime(date) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = monthNames[date.getMonth()]
  const day = date.getDate()
  const suffix = getOrdinalSuffix(day)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${month} ${day}${suffix} ${hours}:${minutes}`
}
