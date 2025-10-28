/**
 * StatusFilter Component
 *
 * Displays checkboxes to filter tasks by status and task type
 *
 * @param {Array} selectedStatuses - Array of currently selected status values
 * @param {Array} selectedTaskTypes - Array of currently selected task type values
 * @param {function} onChange - Callback when status selection changes (newSelectedStatuses)
 * @param {function} onTaskTypeChange - Callback when task type selection changes (newSelectedTaskTypes)
 */

import { Circle, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

export default function StatusFilter({
  selectedStatuses = [],
  selectedTaskTypes = [],
  onChange,
  onTaskTypeChange
}) {
  const statusOptions = [
    { value: 'BACKLOG', label: 'Backlog', icon: Circle, color: 'text-fg-tertiary' },
    { value: 'PLANNED', label: 'Planned', icon: Circle, color: 'text-syntax-purple' },
    { value: 'DOING', label: 'Doing', icon: Clock, color: 'text-syntax-blue' },
    { value: 'BLOCKED', label: 'Blocked', icon: AlertCircle, color: 'text-syntax-yellow' },
    { value: 'DONE', label: 'Done', icon: CheckCircle2, color: 'text-syntax-green' },
    { value: 'CANCELLED', label: 'Cancelled', icon: XCircle, color: 'text-syntax-red' }
  ]

  const taskTypeOptions = [
    { value: 'DEEP_WORK', label: 'Deep Work' },
    { value: 'QUICK_WINS', label: 'Quick Wins' },
    { value: 'GRUNT_WORK', label: 'Grunt Work' },
    { value: 'PEOPLE_TIME', label: 'People Time' },
    { value: 'STRATEGIC', label: 'Planning' }
  ]

  const handleStatusToggle = (statusValue) => {
    const newSelected = selectedStatuses.includes(statusValue)
      ? selectedStatuses.filter(s => s !== statusValue)
      : [...selectedStatuses, statusValue]
    onChange(newSelected)
  }

  const handleTaskTypeToggle = (taskType) => {
    const newSelected = selectedTaskTypes.includes(taskType)
      ? selectedTaskTypes.filter(t => t !== taskType)
      : [...selectedTaskTypes, taskType]
    onTaskTypeChange(newSelected)
  }

  const handleClearAll = () => {
    onChange([])
    onTaskTypeChange([])
  }

  return (
    <div className="border-b border-border-primary">
      {/* Status Filters */}
      <div className="flex items-center gap-2 py-2 px-3">
        <span className="text-xs font-medium text-fg-secondary">Status:</span>

        <div className="flex items-center gap-2 flex-wrap">
          {statusOptions.map(({ value, label, icon: Icon, color }) => {
            const isSelected = selectedStatuses.includes(value)
            return (
              <button
                key={value}
                onClick={() => handleStatusToggle(value)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                  isSelected
                    ? `${color} bg-bg-tertiary`
                    : 'text-fg-tertiary hover:text-fg-secondary'
                }`}
                title={`Filter by ${label}`}
              >
                <Icon size={12} strokeWidth={isSelected ? 2.5 : 2} />
                <span className="font-medium">{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Task Type Filters */}
      <div className="flex items-center gap-2 py-2 px-3 border-t border-border-primary">
        <span className="text-xs font-medium text-fg-secondary">Type:</span>

        <div className="flex items-center gap-2 flex-wrap">
          {taskTypeOptions.map(({ value, label }) => {
            const isSelected = selectedTaskTypes.includes(value)
            return (
              <button
                key={value}
                onClick={() => handleTaskTypeToggle(value)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-accent-primary text-fg-inverse'
                    : 'text-fg-tertiary hover:text-fg-secondary'
                }`}
                title={`Filter by ${label}`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {(selectedStatuses.length > 0 || selectedTaskTypes.length > 0) && (
          <button
            onClick={handleClearAll}
            className="ml-auto text-xs text-fg-tertiary hover:text-fg-secondary transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}
