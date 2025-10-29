/**
 * Filter Preview Page
 *
 * Demo page to preview the CollapsibleFilterBar component
 */

import { useState } from 'react'
import CollapsibleFilterBar from '../components/CollapsibleFilterBar'

export default function FilterPreview() {
  const [selectedTaskType, setSelectedTaskType] = useState(null)
  const [selectedStatuses, setSelectedStatuses] = useState([])

  // Mock task data
  const mockTasks = [
    { id: 1, text: 'Implement authentication system', type: 'DEEP_WORK', status: 'DOING' },
    { id: 2, text: 'Fix typo in README', type: 'QUICK_WINS', status: 'DONE' },
    { id: 3, text: 'Review pull requests', type: 'PEOPLE_TIME', status: 'PLANNED' },
    { id: 4, text: 'Update dependencies', type: 'GRUNT_WORK', status: 'BACKLOG' },
    { id: 5, text: 'Plan Q1 roadmap', type: 'STRATEGIC', status: 'PLANNED' },
    { id: 6, text: 'Debug production issue', type: 'DEEP_WORK', status: 'BLOCKED' },
    { id: 7, text: 'Archive old projects', type: 'GRUNT_WORK', status: 'CANCELLED' }
  ]

  // Filter tasks based on selections
  const filteredTasks = mockTasks.filter(task => {
    const matchesType = !selectedTaskType || task.type === selectedTaskType
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(task.status)
    return matchesType && matchesStatus
  })

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'DOING':
        return 'bg-syntax-blue/20 text-syntax-blue border-syntax-blue/50'
      case 'DONE':
        return 'bg-syntax-green/20 text-syntax-green border-syntax-green/50'
      case 'BLOCKED':
        return 'bg-syntax-yellow/20 text-syntax-yellow border-syntax-yellow/50'
      case 'PLANNED':
        return 'bg-syntax-purple/20 text-syntax-purple border-syntax-purple/50'
      case 'BACKLOG':
        return 'bg-fg-tertiary/20 text-fg-tertiary border-fg-tertiary/50'
      case 'CANCELLED':
        return 'bg-syntax-red/20 text-syntax-red border-syntax-red/50'
      default:
        return 'bg-fg-tertiary/20 text-fg-tertiary border-fg-tertiary/50'
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-6">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Task Filter Preview</h1>
        <p className="text-sm text-slate-400">
          Interactive demo of the collapsible filter bar component
        </p>
      </div>

      {/* Filter Bar */}
      <CollapsibleFilterBar
        selectedTaskType={selectedTaskType}
        selectedStatuses={selectedStatuses}
        onTaskTypeChange={setSelectedTaskType}
        onStatusChange={setSelectedStatuses}
      />

      {/* Content Area */}
      <div className="p-6">
        {/* Active Filters Summary */}
        <div className="mb-4 flex items-center gap-2 text-sm">
          <span className="text-slate-400">Active filters:</span>
          {selectedTaskType && (
            <span className="px-3 py-1 bg-accent-primary/20 text-accent-primary border border-accent-primary/50 rounded text-xs">
              {selectedTaskType.replace(/_/g, ' ')}
            </span>
          )}
          {selectedStatuses.map(status => (
            <span
              key={status}
              className={`px-3 py-1 border rounded text-xs ${getStatusBadgeColor(status)}`}
            >
              {status}
            </span>
          ))}
          {!selectedTaskType && selectedStatuses.length === 0 && (
            <span className="text-slate-500 italic">None</span>
          )}
        </div>

        {/* Task List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-slate-200">
              Tasks ({filteredTasks.length})
            </h2>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 rounded-lg border border-slate-800">
              <p className="text-slate-400">No tasks match the selected filters</p>
              <p className="text-sm text-slate-500 mt-2">Try adjusting your filter selections</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-slate-200 mb-2">{task.text}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded">
                          {task.type.replace(/_/g, ' ')}
                        </span>
                        <span className={`text-xs px-2 py-1 border rounded ${getStatusBadgeColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Debug Info</h3>
          <div className="space-y-1 text-xs font-mono text-fg-secondary">
            <div>Selected Task Type: <span className="text-accent-primary">{selectedTaskType || 'null'}</span></div>
            <div>Selected Statuses: <span className="text-syntax-green">[{selectedStatuses.join(', ')}]</span></div>
            <div>Visible Tasks: <span className="text-syntax-yellow">{filteredTasks.length}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
