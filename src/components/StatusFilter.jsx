/**
 * StatusFilter Component
 *
 * Displays checkboxes to filter tasks by status
 *
 * @param {Array} selectedStatuses - Array of currently selected status values
 * @param {function} onChange - Callback when status selection changes (newSelectedStatuses)
 */

import { Circle, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

export default function StatusFilter({ selectedStatuses = [], onChange }) {
  const statusOptions = [
    { value: 'BACKLOG', label: 'Backlog', icon: Circle, color: 'text-gray-500' },
    { value: 'PLANNED', label: 'Planned', icon: Circle, color: 'text-purple-500' },
    { value: 'DOING', label: 'Doing', icon: Clock, color: 'text-blue-500' },
    { value: 'BLOCKED', label: 'Blocked', icon: AlertCircle, color: 'text-yellow-500' },
    { value: 'DONE', label: 'Done', icon: CheckCircle2, color: 'text-green-500' },
    { value: 'CANCELLED', label: 'Cancelled', icon: XCircle, color: 'text-red-500' }
  ]

  const handleToggle = (statusValue) => {
    const newSelected = selectedStatuses.includes(statusValue)
      ? selectedStatuses.filter(s => s !== statusValue)
      : [...selectedStatuses, statusValue]
    onChange(newSelected)
  }

  const handleClearAll = () => {
    onChange([])
  }

  return (
    <div className="flex items-center gap-2 py-2 px-3 border-b border-gray-200 dark:border-gray-800">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Filter:</span>

      <div className="flex items-center gap-2 flex-wrap">
        {statusOptions.map(({ value, label, icon: Icon, color }) => {
          const isSelected = selectedStatuses.includes(value)
          return (
            <button
              key={value}
              onClick={() => handleToggle(value)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                isSelected
                  ? `${color} bg-gray-100 dark:bg-gray-800`
                  : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'
              }`}
              title={`Filter by ${label}`}
            >
              <Icon size={12} strokeWidth={isSelected ? 2.5 : 2} />
              <span className="font-medium">{label}</span>
            </button>
          )
        })}
      </div>

      {selectedStatuses.length > 0 && (
        <button
          onClick={handleClearAll}
          className="ml-auto text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
