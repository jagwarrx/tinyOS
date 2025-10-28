/**
 * ProjectsList Component
 *
 * Displays a grid of project cards showing all projects in the system.
 *
 * Features:
 * - Grid layout of project cards
 * - Shows project title, status, context, dates
 * - Click to navigate to individual project
 * - Shows task count for each project
 *
 * @param {Array} projects - Array of project notes (note_type='project')
 * @param {Array} allTasks - All tasks from tasks table
 * @param {function} onProjectClick - Callback when project card is clicked (project)
 */

import { Calendar, CheckCircle2, Circle } from 'lucide-react'

export default function ProjectsList({
  projects,
  allTasks,
  onProjectClick
}) {
  /**
   * Get task count for a specific project
   */
  const getProjectTaskCount = (projectId) => {
    if (!allTasks) return { total: 0, completed: 0 }

    const projectTasks = allTasks.filter(t => t.project_id === projectId)
    const completed = projectTasks.filter(t => t.status === 'DONE').length

    return {
      total: projectTasks.length,
      completed
    }
  }

  /**
   * Get color class for project status
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
      case 'COMPLETED':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      case 'ON_HOLD':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
      case 'ARCHIVED':
        return 'text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/20'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  // Empty state
  if (!projects || projects.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400 dark:text-gray-600">
        <Circle size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">No projects yet</p>
        <p className="text-xs mt-2">Use terminal to create a project: /project "Project Name"</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Grid of project cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => {
          const taskCount = getProjectTaskCount(project.id)
          const completionPercent = taskCount.total > 0
            ? Math.round((taskCount.completed / taskCount.total) * 100)
            : 0

          return (
            <div
              key={project.id}
              onClick={() => onProjectClick(project)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer group"
            >
              {/* Project title */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {project.title || 'Untitled Project'}
              </h3>

              {/* Project context (goals/purpose) */}
              {project.project_context && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {project.project_context}
                </p>
              )}

              {/* Status badge */}
              {project.project_status && (
                <div className="mb-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(project.project_status)}`}>
                    {project.project_status.replace(/_/g, ' ')}
                  </span>
                </div>
              )}

              {/* Dates row */}
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500 mb-3">
                {project.project_start_date && (
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Start: {project.project_start_date}</span>
                  </div>
                )}
                {project.project_due_date && (
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Due: {project.project_due_date}</span>
                  </div>
                )}
              </div>

              {/* Task progress */}
              <div className="border-t border-gray-100 dark:border-gray-750 pt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {taskCount.completed} / {taskCount.total} tasks
                  </span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {completionPercent}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-750 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 dark:bg-blue-600 transition-all duration-300"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
