import { supabase } from '../supabaseClient'

export class TasksService {
  static async fetchAll() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('priority', { ascending: true, nullsLast: true })
      .order('created_at', { ascending: true })

    if (error) throw new Error(`Failed to fetch tasks: ${error.message}`)
    return data || []
  }

  static async fetchById(id) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(`Failed to fetch task: ${error.message}`)
    return data
  }

  static async fetchByRefId(refId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('ref_id', refId)
      .single()

    if (error) throw new Error(`Failed to fetch task by ref_id: ${error.message}`)
    return data
  }

  static async create(taskData) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single()

    if (error) throw new Error(`Failed to create task: ${error.message}`)
    return data
  }

  static async update(id, updates) {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update task: ${error.message}`)
    return data
  }

  static async delete(id) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Failed to delete task: ${error.message}`)
  }

  static async toggleStar(id) {
    const task = await this.fetchById(id)
    return await this.update(id, { starred: !task.starred })
  }

  static async toggleHighlight(id, isHighlighted) {
    return await this.update(id, { is_highlighted: isHighlighted })
  }

  static async changeStatus(id, newStatus) {
    return await this.update(id, { status: newStatus })
  }

  static async scheduleTask(id, scheduledDate) {
    const updates = { scheduled_date: scheduledDate }

    // If scheduling a date and status is BACKLOG, auto-set to PLANNED
    const task = await this.fetchById(id)
    if (scheduledDate && task.status === 'BACKLOG') {
      updates.status = 'PLANNED'
    }

    return await this.update(id, updates)
  }

  static async reorderTasks(tasks) {
    // Filter out DONE tasks - they don't participate in global priority
    const activeTasks = tasks.filter(task => task.status !== 'DONE')

    // For project tasks, only the top task from each project gets global priority
    // Group tasks by project
    const projectGroups = {}
    const nonProjectTasks = []

    activeTasks.forEach(task => {
      if (task.project_id) {
        if (!projectGroups[task.project_id]) {
          projectGroups[task.project_id] = []
        }
        projectGroups[task.project_id].push(task)
      } else {
        nonProjectTasks.push(task)
      }
    })

    // Build the global priority list:
    // - All non-project tasks
    // - Only the first task from each project (respecting the order they appear in the tasks array)
    const globalPriorityTasks = []
    const seenProjects = new Set()

    activeTasks.forEach(task => {
      if (!task.project_id) {
        // Non-project task - always included in global priority
        globalPriorityTasks.push(task)
      } else if (!seenProjects.has(task.project_id)) {
        // First task from this project - include in global priority
        globalPriorityTasks.push(task)
        seenProjects.add(task.project_id)
      }
    })

    // Update priorities:
    // 1. Tasks in globalPriorityTasks get priority 0, 1, 2, etc.
    // 2. Other project tasks get null priority (will be ordered within their project view)
    // 3. DONE tasks get null priority (excluded from global ordering)
    const updates = []

    // Update global priority tasks
    globalPriorityTasks.forEach((task, index) => {
      updates.push(
        supabase
          .from('tasks')
          .update({ priority: index })
          .eq('id', task.id)
      )
    })

    // Update other project tasks (not in global priority) to null
    activeTasks.forEach(task => {
      if (task.project_id && !globalPriorityTasks.find(t => t.id === task.id)) {
        updates.push(
          supabase
            .from('tasks')
            .update({ priority: null })
            .eq('id', task.id)
        )
      }
    })

    // Update DONE tasks to null priority
    const doneTasks = tasks.filter(task => task.status === 'DONE')
    doneTasks.forEach(task => {
      updates.push(
        supabase
          .from('tasks')
          .update({ priority: null })
          .eq('id', task.id)
      )
    })

    const results = await Promise.all(updates)

    // Check for errors
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      throw new Error(`Failed to reorder tasks: ${errors[0].error.message}`)
    }
  }
}
