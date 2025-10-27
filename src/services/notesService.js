import { supabase } from '../supabaseClient'

export class NotesService {
  static async fetchAll() {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false })
    
    if (error) throw new Error(`Failed to fetch notes: ${error.message}`)
    return data || []
  }

  static async fetchById(id) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(`Failed to fetch note: ${error.message}`)
    return data
  }

  static async fetchByRefId(refId) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('ref_id', refId)
      .single()

    if (error) throw new Error(`Failed to fetch note by ref_id: ${error.message}`)
    return data
  }

  static async create(noteData) {
    const { data, error } = await supabase
      .from('notes')
      .insert([noteData])
      .select()
      .single()
    
    if (error) throw new Error(`Failed to create note: ${error.message}`)
    return data
  }

  static async update(id, updates) {
    const { data, error } = await supabase
      .from('notes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw new Error(`Failed to update note: ${error.message}`)
    return data
  }

  static async delete(id) {
    // Clean up all references first
    await this.cleanupReferences(id)
    
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
    
    if (error) throw new Error(`Failed to delete note: ${error.message}`)
  }

  static async cleanupReferences(id) {
    // Remove all links pointing to this note
    const updates = [
      supabase.from('notes').update({ up_id: null }).eq('up_id', id),
      supabase.from('notes').update({ down_id: null }).eq('down_id', id),
      supabase.from('notes').update({ left_id: null }).eq('left_id', id),
      supabase.from('notes').update({ right_id: null }).eq('right_id', id)
    ]
    
    await Promise.all(updates)
  }

  static async setLink(sourceId, targetId, direction) {
    const updates = { [`${direction}_id`]: targetId }
    
    // Handle bidirectional links for all directions
    if (direction === 'up') {
      await this.update(targetId, { down_id: sourceId })
    } else if (direction === 'down') {
      await this.update(targetId, { up_id: sourceId })
    } else if (direction === 'left') {
      // NEW: Make left/right bidirectional
      await this.update(targetId, { right_id: sourceId })
    } else if (direction === 'right') {
      // NEW: Make left/right bidirectional
      await this.update(targetId, { left_id: sourceId })
    }
    
    return await this.update(sourceId, updates)
  }

  static async removeLink(sourceId, direction) {
    // Get the current link before removing
    const sourceNote = await this.fetchById(sourceId)
    const linkIdKey = `${direction}_id`
    const targetId = sourceNote[linkIdKey]

    if (targetId) {
      // Remove bidirectional link for all directions
      if (direction === 'up') {
        await this.update(targetId, { down_id: null })
      } else if (direction === 'down') {
        await this.update(targetId, { up_id: null })
      } else if (direction === 'left') {
        // NEW: Remove bidirectional left/right link
        await this.update(targetId, { right_id: null })
      } else if (direction === 'right') {
        // NEW: Remove bidirectional left/right link
        await this.update(targetId, { left_id: null })
      }
    }

    // Remove source's link
    return await this.update(sourceId, { [linkIdKey]: null })
  }

  static async toggleStar(id) {
    const note = await this.fetchById(id)
    return await this.update(id, { is_starred: !note.is_starred })
  }

  static async setAsHome(id) {
    // First, unset any existing home note
    const { data: currentHome } = await supabase
      .from('notes')
      .select('id')
      .eq('is_home', true)
      .single()

    if (currentHome) {
      await this.update(currentHome.id, { is_home: false })
    }

    // Set the new home note
    return await this.update(id, { is_home: true })
  }

  static async createHomeNote() {
    const homeNoteData = {
      title: 'HOME',
      content: JSON.stringify({
        root: {
          children: [
            {
              children: [
                {
                  text: 'Welcome to your knowledge base!',
                  type: 'text',
                }
              ],
              direction: null,
              format: '',
              indent: 0,
              type: 'paragraph',
              version: 1,
            },
          ],
          direction: null,
          format: '',
          indent: 0,
          type: 'root',
          version: 1,
        },
      }),
      up_id: null,
      down_id: null,
      left_id: null,
      right_id: null,
      is_home: true,
      is_starred: true,
      updated_at: new Date().toISOString(),
    }

    return await this.create(homeNoteData)
  }

  static getEmptyContent() {
    return JSON.stringify({
      root: {
        children: [
          {
            children: [],
            direction: null,
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    })
  }

  static isContentEmpty(content) {
    try {
      const parsed = JSON.parse(content)
      const firstChild = parsed?.root?.children?.[0]
      
      if (!firstChild || !firstChild.children || firstChild.children.length === 0) {
        return true
      }
      
      const hasText = firstChild.children.some(child => 
        child.text && child.text.trim().length > 0
      )
      
      return !hasText
    } catch {
      return true
    }
  }
}