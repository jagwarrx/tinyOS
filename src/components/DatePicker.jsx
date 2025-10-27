/**
 * DatePicker Component
 *
 * Simple date picker with quick shortcuts for Today, Tomorrow, and custom dates
 *
 * @param {string} value - Current date value (YYYY-MM-DD)
 * @param {function} onChange - Callback when date changes (dateString)
 * @param {function} onClose - Callback to close the picker
 */

import { useState } from 'react'
import { Calendar, X } from 'lucide-react'
import { getTodayISO, getTomorrowISO } from '../utils/dateUtils'

export default function DatePicker({ value, onChange, onClose }) {
  const [customDate, setCustomDate] = useState(value || getTodayISO())

  const handleQuickSelect = (dateString) => {
    onChange(dateString)
    onClose()
  }

  const handleSpecialSelect = (value) => {
    onChange(value)
    onClose()
  }

  const handleCustomDate = () => {
    onChange(customDate)
    onClose()
  }

  const handleClear = () => {
    onChange(null)
    onClose()
  }

  // Get next Monday
  const getNextMonday = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
    const nextMonday = new Date(today)
    nextMonday.setDate(today.getDate() + daysUntilMonday)
    return nextMonday.toISOString().split('T')[0]
  }

  // Get next weekend (Saturday)
  const getNextWeekend = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek
    const nextSaturday = new Date(today)
    nextSaturday.setDate(today.getDate() + daysUntilSaturday)
    return nextSaturday.toISOString().split('T')[0]
  }

  // Get start of this week (Monday)
  const getThisWeekStart = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(today)
    monday.setDate(today.getDate() + daysToMonday)
    return monday.toISOString().split('T')[0]
  }

  return (
    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50 min-w-[220px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-500" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Schedule for</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={14} />
        </button>
      </div>

      {/* Quick select buttons */}
      <div className="space-y-1 mb-3">
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
          onClick={() => handleQuickSelect(getNextMonday())}
          className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
        >
          Next Monday
        </button>
        <button
          onClick={() => handleQuickSelect(getNextWeekend())}
          className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
        >
          Next Weekend
        </button>
        <button
          onClick={() => handleSpecialSelect('SOMEDAY')}
          className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-blue-600 dark:text-blue-400"
        >
          Someday
        </button>
      </div>

      {/* Custom date input */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
          Custom date
        </label>
        <div className="flex gap-1">
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleCustomDate}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Set
          </button>
        </div>
      </div>

      {/* Clear button */}
      {value && (
        <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClear}
            className="w-full text-center px-2 py-1.5 text-xs rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
          >
            Clear date
          </button>
        </div>
      )}
    </div>
  )
}
