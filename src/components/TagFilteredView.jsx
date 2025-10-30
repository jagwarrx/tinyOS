/**
 * TagFilteredView Component
 * Shows notes, tasks, and projects filtered by a selected tag
 */

import { useState, useEffect } from 'react'
import { ArrowLeft, FileText, CheckSquare, Folder, Tag as TagIcon } from 'lucide-react'
import TaskList from './TaskList'

export default function TagFilteredView({
  selectedTag,
  filteredNotes,
  filteredTasks,
  filteredProjects,
  onBack,
  onSelectNote,
  onSelectTask,
  onUpdateTask,
  onScheduleTask,
  onDeleteTask,
  onToggleComplete,
  onToggleStar,
  onToggleHighlight,
  allNotes,
  selectedTask
}) {
  const [activeTab, setActiveTab] = useState('tasks') // 'tasks', 'notes', 'projects'

  if (!selectedTag) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary">
        <p className="text-fg-secondary">No tag selected</p>
      </div>
    )
  }

  const getPreview = (content) => {
    try {
      const parsed = JSON.parse(content)
      const firstParagraph = parsed?.root?.children?.[0]?.children?.[0]?.text || ''
      return firstParagraph.slice(0, 80) + (firstParagraph.length > 80 ? '...' : '')
    } catch {
      return 'Empty note'
    }
  }

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border-primary bg-bg-elevated">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-fg-primary hover:bg-bg-tertiary rounded transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="h-6 w-px bg-border-primary" />

          <div className="flex items-center gap-2">
            <TagIcon size={16} className="text-fg-tertiary" />
            <h1 className="text-lg font-semibold text-fg-primary font-mono">
              {selectedTag.full_path}
            </h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              activeTab === 'tasks'
                ? 'bg-accent-primary text-white'
                : 'text-fg-secondary hover:bg-bg-tertiary'
            }`}
          >
            <CheckSquare size={14} />
            Tasks ({filteredTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              activeTab === 'notes'
                ? 'bg-accent-primary text-white'
                : 'text-fg-secondary hover:bg-bg-tertiary'
            }`}
          >
            <FileText size={14} />
            Notes ({filteredNotes.length})
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              activeTab === 'projects'
                ? 'bg-accent-primary text-white'
                : 'text-fg-secondary hover:bg-bg-tertiary'
            }`}
          >
            <Folder size={14} />
            Projects ({filteredProjects.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'tasks' && (
          <div className="h-full">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-fg-tertiary">
                <CheckSquare size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No tasks with this tag</p>
              </div>
            ) : (
              <TaskList
                tasks={filteredTasks}
                onSelectTask={onSelectTask}
                selectedTask={selectedTask}
                onUpdateTask={onUpdateTask}
                onScheduleTask={onScheduleTask}
                onDeleteTask={onDeleteTask}
                onToggleComplete={onToggleComplete}
                onToggleStar={onToggleStar}
                onToggleHighlight={onToggleHighlight}
                allNotes={allNotes}
              />
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="h-full overflow-y-auto">
            {filteredNotes.length === 0 ? (
              <div className="p-8 text-center text-fg-tertiary">
                <FileText size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No notes with this tag</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => onSelectNote(note)}
                    className="p-3 border border-border-primary rounded bg-bg-secondary hover:bg-bg-tertiary cursor-pointer transition-colors"
                  >
                    <h3 className="text-sm font-medium text-fg-primary mb-1">
                      {note.title || 'Untitled'}
                    </h3>
                    <p className="text-xs text-fg-secondary line-clamp-2">
                      {getPreview(note.content)}
                    </p>
                    <p className="text-xs text-fg-tertiary mt-2">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="h-full overflow-y-auto">
            {filteredProjects.length === 0 ? (
              <div className="p-8 text-center text-fg-tertiary">
                <Folder size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No projects with this tag</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => onSelectNote(project)}
                    className="p-3 border border-border-primary rounded bg-bg-secondary hover:bg-bg-tertiary cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Folder size={14} className="text-fg-tertiary" />
                      <h3 className="text-sm font-medium text-fg-primary">
                        {project.title || 'Untitled Project'}
                      </h3>
                    </div>
                    {project.project_status && (
                      <span className="inline-block px-2 py-0.5 text-xs rounded bg-bg-tertiary text-fg-secondary">
                        {project.project_status}
                      </span>
                    )}
                    <p className="text-xs text-fg-tertiary mt-2">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
