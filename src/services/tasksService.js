import { supabase } from '../supabaseClient'

export class TasksService {
  static async fetchAll() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('priority', { ascending: true })

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
}
