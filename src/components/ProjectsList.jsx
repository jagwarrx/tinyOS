/**
 * ProjectsList Component
 *
 * Displays a grid of project cards showing all projects in the system.
 *
 * Features:
 * - Grid layout of project cards
 * - Category tabs (All, Personal, Work, Admin)
 * - Inline category editing on project cards
 * - Shows project title, status, context, dates
 * - Click to navigate to individual project
 * - Shows task count for each project
 *
 * @param {Array} projects - Array of project notes (note_type='project')
 * @param {Array} allTasks - All tasks from tasks table
 * @param {function} onProjectClick - Callback when project card is clicked (project)
 * @param {function} onUpdateProject - Callback to update project fields
 */

import { useState } from 'react'
import { Calendar, CheckCircle2, Circle, Briefcase, User, Shield, Folder, Tag, Pause, Archive, Play } from 'lucide-react'

export default function ProjectsList({
  projects,
  allTasks,
  onProjectClick,
  onUpdateProject
}) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [editingStatusId, setEditingStatusId] = useState(null)
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
        return 'text-syntax-blue bg-syntax-blue/10'
      case 'COMPLETED':
        return 'text-syntax-green bg-syntax-green/10'
      case 'ON_HOLD':
        return 'text-syntax-yellow bg-syntax-yellow/10'
      case 'ARCHIVED':
        return 'text-fg-tertiary bg-bg-tertiary'
      default:
        return 'text-fg-secondary bg-bg-tertiary'
    }
  }

  /**
   * Filter projects by selected category
   */
  const filteredProjects = projects ? projects.filter(project => {
    if (activeCategory === 'all') return true
    if (activeCategory === 'done') return project.project_status === 'DONE'
    return project.project_category === activeCategory
  }) : []

  /**
   * Get count for each category
   */
  const getCategoryCounts = () => {
    if (!projects) return { all: 0, personal: 0, work: 0, admin: 0, done: 0 }

    return {
      all: projects.length,
      personal: projects.filter(p => p.project_category === 'personal').length,
      work: projects.filter(p => p.project_category === 'work').length,
      admin: projects.filter(p => p.project_category === 'admin').length,
      done: projects.filter(p => p.project_status === 'DONE').length
    }
  }

  const counts = getCategoryCounts()

  /**
   * Category tab configuration
   */
  const categories = [
    { id: 'all', label: 'All', icon: Folder, count: counts.all },
    { id: 'admin', label: 'Admin', icon: Shield, count: counts.admin },
    { id: 'work', label: 'Work', icon: Briefcase, count: counts.work },
    { id: 'personal', label: 'Personal', icon: User, count: counts.personal },
    { id: 'done', label: 'Done', icon: CheckCircle2, count: counts.done }
  ]

  /**
   * Handle category change for a project
   */
  const handleCategoryChange = async (project, newCategory) => {
    if (onUpdateProject) {
      await onUpdateProject(project.id, { project_category: newCategory })
    }
    setEditingCategoryId(null)
  }

  /**
   * Get category icon and label
   */
  const getCategoryInfo = (category) => {
    switch (category) {
      case 'personal':
        return { icon: User, label: 'Personal', color: 'text-syntax-blue' }
      case 'work':
        return { icon: Briefcase, label: 'Work', color: 'text-syntax-purple' }
      case 'admin':
        return { icon: Shield, label: 'Admin', color: 'text-syntax-green' }
      default:
        return { icon: Tag, label: 'Uncategorized', color: 'text-fg-tertiary' }
    }
  }

  /**
   * Get status icon and info
   */
  const getStatusInfo = (status) => {
    switch (status) {
      case 'ACTIVE':
        return { icon: Play, label: 'Active', colorClass: 'text-syntax-blue bg-syntax-blue/10' }
      case 'COMPLETED':
        return { icon: CheckCircle2, label: 'Completed', colorClass: 'text-syntax-green bg-syntax-green/10' }
      case 'ON_HOLD':
        return { icon: Pause, label: 'On Hold', colorClass: 'text-syntax-yellow bg-syntax-yellow/10' }
      case 'ARCHIVED':
        return { icon: Archive, label: 'Archived', colorClass: 'text-fg-tertiary bg-bg-tertiary' }
      case 'DONE':
        return { icon: CheckCircle2, label: 'Done', colorClass: 'text-syntax-green bg-syntax-green/10' }
      default:
        return { icon: Circle, label: 'Not Set', colorClass: 'text-fg-secondary bg-bg-tertiary' }
    }
  }

  /**
   * Handle status change for a project
   */
  const handleStatusChange = async (project, newStatus) => {
    if (onUpdateProject) {
      await onUpdateProject(project.id, { project_status: newStatus })
    }
    setEditingStatusId(null)
  }

  // Empty state
  if (!projects || projects.length === 0) {
    return (
      <div className="p-8 text-center text-fg-tertiary">
        <Circle size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">No projects yet</p>
        <p className="text-xs mt-2">Use terminal to create a project: /project "Project Name"</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Category Tabs */}
      <div className="flex-shrink-0 border-b border-border-primary bg-bg-secondary px-6 py-3">
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => {
            const Icon = category.icon
            const isActive = activeCategory === category.id

            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-accent-primary text-white shadow-md'
                    : 'bg-bg-primary text-fg-secondary hover:bg-bg-tertiary hover:text-fg-primary'
                }`}
              >
                <Icon size={16} />
                <span>{category.label}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-bg-tertiary text-fg-tertiary'
                }`}>
                  {category.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Empty state for filtered category */}
        {filteredProjects.length === 0 ? (
          <div className="text-center text-fg-tertiary py-12">
            <Circle size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">
              {activeCategory === 'done'
                ? 'No completed projects yet'
                : `No projects in ${activeCategory === 'all' ? 'this view' : activeCategory}`}
            </p>
            <p className="text-xs mt-2">Create a project with: /project "Project Name"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => {
          const taskCount = getProjectTaskCount(project.id)
          const completionPercent = taskCount.total > 0
            ? Math.round((taskCount.completed / taskCount.total) * 100)
            : 0

          const categoryInfo = getCategoryInfo(project.project_category)
          const CategoryIcon = categoryInfo.icon

          return (
            <div
              key={project.id}
              className="bg-bg-primary border border-border-primary rounded-lg p-4 hover:shadow-md hover:border-border-focus transition-all group"
            >
              {/* Project title */}
              <div onClick={() => onProjectClick(project)} className="cursor-pointer">
                <h3 className="text-lg font-semibold text-fg-primary mb-2 group-hover:text-accent-primary transition-colors">
                  {project.title || 'Untitled Project'}
                </h3>

                {/* Project context (goals/purpose) */}
                {project.project_context && (
                  <p className="text-sm text-fg-secondary mb-3 line-clamp-2">
                    {project.project_context}
                  </p>
                )}
              </div>

              {/* Metadata row: Status and Category */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {/* Status selector */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  {editingStatusId === project.id ? (
                    <select
                      value={project.project_status || ''}
                      onChange={(e) => handleStatusChange(project, e.target.value || null)}
                      onBlur={() => setEditingStatusId(null)}
                      autoFocus
                      className="text-xs px-2 py-0.5 rounded bg-bg-secondary border border-border-focus text-fg-primary focus:outline-none cursor-pointer"
                    >
                      <option value="">Not Set</option>
                      <option value="ACTIVE">Active</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="DONE">Done</option>
                      <option value="ON_HOLD">On Hold</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  ) : (
                    (() => {
                      const statusInfo = getStatusInfo(project.project_status)
                      const StatusIcon = statusInfo.icon
                      return (
                        <button
                          onClick={() => setEditingStatusId(project.id)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${statusInfo.colorClass} hover:opacity-80`}
                        >
                          <StatusIcon size={12} />
                          <span>{statusInfo.label}</span>
                        </button>
                      )
                    })()
                  )}
                </div>

                {/* Category selector */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  {editingCategoryId === project.id ? (
                    <select
                      value={project.project_category || ''}
                      onChange={(e) => handleCategoryChange(project, e.target.value || null)}
                      onBlur={() => setEditingCategoryId(null)}
                      autoFocus
                      className="text-xs px-2 py-0.5 rounded bg-bg-secondary border border-border-focus text-fg-primary focus:outline-none cursor-pointer"
                    >
                      <option value="">Uncategorized</option>
                      <option value="personal">Personal</option>
                      <option value="work">Work</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <button
                      onClick={() => setEditingCategoryId(project.id)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${categoryInfo.color} bg-bg-secondary hover:bg-bg-tertiary`}
                    >
                      <CategoryIcon size={12} />
                      <span>{categoryInfo.label}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Dates row */}
              <div className="flex items-center gap-3 text-xs text-fg-tertiary mb-3">
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
              <div className="border-t border-border-primary pt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-fg-secondary">
                    {taskCount.completed} / {taskCount.total} tasks
                  </span>
                  <span className="text-xs font-medium text-fg-primary">
                    {completionPercent}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-primary transition-all duration-300"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
          </div>
        )}
      </div>
    </div>
  )
}
