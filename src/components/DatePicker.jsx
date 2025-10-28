/**
 * DatePicker Component
 *
 * Simplified date picker with natural language input
 *
 * @param {string} value - Current date value (YYYY-MM-DD)
 * @param {function} onChange - Callback when date changes (dateString)
 * @param {function} onClose - Callback to close the picker
 */

import { useState } from 'react'
import { Calendar, X } from 'lucide-react'
import { getTodayISO, getTomorrowISO } from '../utils/dateUtils'

export default function DatePicker({ value, onChange, onClose }) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')

  const handleQuickSelect = (dateString) => {
    onChange(dateString)
    onClose()
  }

  const handleSpecialSelect = (value) => {
    onChange(value)
    onClose()
  }

  const handleClear = () => {
    onChange(null)
    onClose()
  }

  // Natural language date parser
  const parseNaturalDate = (input) => {
    const text = input.toLowerCase().trim()
    const today = new Date()

    // Clear/remove
    if (text === 'clear' || text === 'none' || text === '') {
      return null
    }

    // Today
    if (text === 'today' || text === 'tod') {
      return getTodayISO()
    }

    // Tomorrow
    if (text === 'tomorrow' || text === 'tmr' || text === 'tom') {
      return getTomorrowISO()
    }

    // This week
    if (text === 'this week' || text === 'week') {
      return 'THIS_WEEK'
    }

    // Someday
    if (text === 'someday' || text === 'later' || text === 'maybe') {
      return 'SOMEDAY'
    }

    // Days of the week (next occurrence)
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const shortDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

    for (let i = 0; i < daysOfWeek.length; i++) {
      if (text === daysOfWeek[i] || text === shortDays[i] || text === `next ${daysOfWeek[i]}` || text === `next ${shortDays[i]}`) {
        const targetDay = i
        const currentDay = today.getDay()
        let daysToAdd = targetDay - currentDay
        if (daysToAdd <= 0) daysToAdd += 7 // Next week if today or past
        const targetDate = new Date(today)
        targetDate.setDate(today.getDate() + daysToAdd)
        return targetDate.toISOString().split('T')[0]
      }
    }

    // "in X days"
    const inDaysMatch = text.match(/^in (\d+) days?$/)
    if (inDaysMatch) {
      const days = parseInt(inDaysMatch[1])
      const targetDate = new Date(today)
      targetDate.setDate(today.getDate() + days)
      return targetDate.toISOString().split('T')[0]
    }

    // "X days" (same as "in X days")
    const daysMatch = text.match(/^(\d+) days?$/)
    if (daysMatch) {
      const days = parseInt(daysMatch[1])
      const targetDate = new Date(today)
      targetDate.setDate(today.getDate() + days)
      return targetDate.toISOString().split('T')[0]
    }

    // Try parsing as date (YYYY-MM-DD, MM/DD, MM-DD, etc.)
    // ISO format: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return text
    }

    // MM/DD or MM-DD format (current year)
    const shortDateMatch = text.match(/^(\d{1,2})[/-](\d{1,2})$/)
    if (shortDateMatch) {
      const month = parseInt(shortDateMatch[1]) - 1
      const day = parseInt(shortDateMatch[2])
      const date = new Date(today.getFullYear(), month, day)
      return date.toISOString().split('T')[0]
    }

    // MM/DD/YYYY or MM-DD-YYYY format
    const fullDateMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
    if (fullDateMatch) {
      const month = parseInt(fullDateMatch[1]) - 1
      const day = parseInt(fullDateMatch[2])
      const year = parseInt(fullDateMatch[3])
      const date = new Date(year, month, day)
      return date.toISOString().split('T')[0]
    }

    return false // Invalid input
  }

  const handleNaturalInput = (e) => {
    e.preventDefault()
    setError('')

    const result = parseNaturalDate(inputValue)

    if (result === false) {
      setError('Could not understand date. Try: "tomorrow", "monday", "3 days", "10/27"')
      return
    }

    onChange(result)
    onClose()
  }

  return (
    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50 min-w-[240px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-500" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Schedule</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={14} />
        </button>
      </div>

      {/* Natural language input */}
      <form onSubmit={handleNaturalInput} className="mb-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setError('')
          }}
          placeholder='Try "tomorrow", "monday", "3 days"...'
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
          autoFocus
        />
        {error && (
          <p className="text-[10px] text-red-500 dark:text-red-400 mt-1">{error}</p>
        )}
      </form>

      {/* Quick select buttons - simplified */}
      <div className="space-y-1">
        <button
          onClick={() => handleQuickSelect(getTodayISO())}
          className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
        >
          Today
        </button>
        <button
          onClick={() => handleQuickSelect(getTomorrowISO())}
          className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
        >
          Tomorrow
        </button>
        <button
          onClick={() => handleSpecialSelect('THIS_WEEK')}
          className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-purple-600 dark:text-purple-400"
        >
          This Week
        </button>
        <button
          onClick={() => handleSpecialSelect('SOMEDAY')}
          className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-blue-600 dark:text-blue-400"
        >
          Someday
        </button>
      </div>

      {/* Clear button */}
      {value && (
        <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClear}
            className="w-full text-center px-2 py-1.5 text-xs rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
