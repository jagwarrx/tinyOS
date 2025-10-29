import * as activityLogService from '../services/activityLogService';

/**
 * Activity Logger Utility
 * Helper functions for creating activity log entries with intelligent collapsing
 */

// Time window for collapsing edits (5 minutes)
const EDIT_COLLAPSE_WINDOW_MS = 5 * 60 * 1000;

/**
 * Log a task creation
 */
export async function logTaskCreated(task) {
  try {
    await activityLogService.create({
      action_type: 'task_created',
      entity_type: 'task',
      entity_id: task.id,
      entity_ref_id: task.ref_id,
      entity_title: task.text,
      details: {
        status: task.status,
        project_id: task.project_id,
      },
    });
  } catch (error) {
    console.error('Error logging task creation:', error);
  }
}

/**
 * Log a task completion
 */
export async function logTaskCompleted(task) {
  try {
    await activityLogService.create({
      action_type: 'task_completed',
      entity_type: 'task',
      entity_id: task.id,
      entity_ref_id: task.ref_id,
      entity_title: task.text,
      details: {
        previous_status: task.status,
      },
    });
  } catch (error) {
    console.error('Error logging task completion:', error);
  }
}

/**
 * Log a task status change
 */
export async function logTaskStatusChanged(task, oldStatus, newStatus) {
  try {
    await activityLogService.create({
      action_type: 'task_status_changed',
      entity_type: 'task',
      entity_id: task.id,
      entity_ref_id: task.ref_id,
      entity_title: task.text,
      details: {
        old_status: oldStatus,
        new_status: newStatus,
      },
    });
  } catch (error) {
    console.error('Error logging task status change:', error);
  }
}

/**
 * Log a task being scheduled
 */
export async function logTaskScheduled(task, scheduledDate) {
  try {
    await activityLogService.create({
      action_type: 'task_scheduled',
      entity_type: 'task',
      entity_id: task.id,
      entity_ref_id: task.ref_id,
      entity_title: task.text,
      details: {
        scheduled_date: scheduledDate,
      },
    });
  } catch (error) {
    console.error('Error logging task scheduling:', error);
  }
}

/**
 * Log a task being starred/unstarred
 */
export async function logTaskStarred(task, isStarred) {
  try {
    await activityLogService.create({
      action_type: isStarred ? 'task_starred' : 'task_unstarred',
      entity_type: 'task',
      entity_id: task.id,
      entity_ref_id: task.ref_id,
      entity_title: task.text,
      details: {},
    });
  } catch (error) {
    console.error('Error logging task star:', error);
  }
}

/**
 * Log a task deletion
 */
export async function logTaskDeleted(task) {
  try {
    await activityLogService.create({
      action_type: 'task_deleted',
      entity_type: 'task',
      entity_id: task.id,
      entity_ref_id: task.ref_id,
      entity_title: task.text,
      details: {},
    });
  } catch (error) {
    console.error('Error logging task deletion:', error);
  }
}

/**
 * Log a note creation
 */
export async function logNoteCreated(note) {
  try {
    await activityLogService.create({
      action_type: 'note_created',
      entity_type: 'note',
      entity_id: note.id,
      entity_ref_id: note.ref_id,
      entity_title: note.title || 'Untitled',
      details: {
        note_type: note.note_type,
      },
    });
  } catch (error) {
    console.error('Error logging note creation:', error);
  }
}

/**
 * Log a note update with intelligent collapsing
 * If a note was updated within the collapse window, update the existing log instead of creating a new one
 */
export async function logNoteUpdated(note) {
  try {
    // Check if there's a recent update log for this note
    const recentLog = await activityLogService.getRecentLog(note.id, 'note_updated');

    if (recentLog) {
      const timeSinceLastEdit = Date.now() - new Date(recentLog.timestamp).getTime();

      // If within collapse window, update existing log timestamp
      if (timeSinceLastEdit < EDIT_COLLAPSE_WINDOW_MS) {
        await activityLogService.updateRecentLog(note.id, 'note_updated', {
          timestamp: new Date().toISOString(),
          entity_title: note.title || 'Untitled', // Update title in case it changed
          details: {
            ...recentLog.details,
            edit_count: (recentLog.details?.edit_count || 1) + 1,
          },
        });
        return;
      }
    }

    // Create new log entry
    await activityLogService.create({
      action_type: 'note_updated',
      entity_type: 'note',
      entity_id: note.id,
      entity_ref_id: note.ref_id,
      entity_title: note.title || 'Untitled',
      details: {
        note_type: note.note_type,
        edit_count: 1,
      },
    });
  } catch (error) {
    console.error('Error logging note update:', error);
  }
}

/**
 * Log a note deletion
 */
export async function logNoteDeleted(note) {
  try {
    await activityLogService.create({
      action_type: 'note_deleted',
      entity_type: 'note',
      entity_id: note.id,
      entity_ref_id: note.ref_id,
      entity_title: note.title || 'Untitled',
      details: {},
    });
  } catch (error) {
    console.error('Error logging note deletion:', error);
  }
}

/**
 * Log notes being linked
 */
export async function logNotesLinked(note1, note2, direction) {
  try {
    await activityLogService.create({
      action_type: 'notes_linked',
      entity_type: 'note',
      entity_id: note1.id,
      entity_ref_id: note1.ref_id,
      entity_title: note1.title || 'Untitled',
      details: {
        linked_to_id: note2.id,
        linked_to_ref_id: note2.ref_id,
        linked_to_title: note2.title || 'Untitled',
        direction: direction,
      },
    });
  } catch (error) {
    console.error('Error logging note linking:', error);
  }
}

/**
 * Log a project creation
 */
export async function logProjectCreated(project) {
  try {
    await activityLogService.create({
      action_type: 'project_created',
      entity_type: 'project',
      entity_id: project.id,
      entity_ref_id: project.ref_id,
      entity_title: project.title,
      details: {
        project_status: project.project_status,
      },
    });
  } catch (error) {
    console.error('Error logging project creation:', error);
  }
}

/**
 * Log a project status change
 */
export async function logProjectStatusChanged(project, oldStatus, newStatus) {
  try {
    await activityLogService.create({
      action_type: 'project_status_changed',
      entity_type: 'project',
      entity_id: project.id,
      entity_ref_id: project.ref_id,
      entity_title: project.title,
      details: {
        old_status: oldStatus,
        new_status: newStatus,
      },
    });
  } catch (error) {
    console.error('Error logging project status change:', error);
  }
}

/**
 * Log a project completion
 */
export async function logProjectCompleted(project) {
  try {
    await activityLogService.create({
      action_type: 'project_completed',
      entity_type: 'project',
      entity_id: project.id,
      entity_ref_id: project.ref_id,
      entity_title: project.title,
      details: {
        previous_status: project.project_status,
      },
    });
  } catch (error) {
    console.error('Error logging project completion:', error);
  }
}

/**
 * Log timer start
 */
export async function logTimerStarted(duration) {
  try {
    await activityLogService.create({
      action_type: 'timer_started',
      entity_type: 'timer',
      entity_id: null, // Timers don't have persistent IDs
      entity_ref_id: null,
      entity_title: `${duration} minute timer`,
      details: {
        duration_minutes: duration,
      },
    });
  } catch (error) {
    console.error('Error logging timer start:', error);
  }
}

/**
 * Log timer completion
 */
export async function logTimerCompleted(duration) {
  try {
    await activityLogService.create({
      action_type: 'timer_completed',
      entity_type: 'timer',
      entity_id: null,
      entity_ref_id: null,
      entity_title: `${duration} minute timer`,
      details: {
        duration_minutes: duration,
      },
    });
  } catch (error) {
    console.error('Error logging timer completion:', error);
  }
}

/**
 * Log timer cancellation
 */
export async function logTimerCancelled(duration, remainingTime) {
  try {
    await activityLogService.create({
      action_type: 'timer_cancelled',
      entity_type: 'timer',
      entity_id: null,
      entity_ref_id: null,
      entity_title: `${duration} minute timer`,
      details: {
        duration_minutes: duration,
        remaining_seconds: remainingTime,
      },
    });
  } catch (error) {
    console.error('Error logging timer cancellation:', error);
  }
}

/**
 * Log bulk task completion
 */
export async function logBulkTasksCompleted(taskCount, taskIds) {
  try {
    await activityLogService.create({
      action_type: 'bulk_tasks_completed',
      entity_type: 'task',
      entity_id: null,
      entity_ref_id: null,
      entity_title: `${taskCount} tasks`,
      details: {
        task_count: taskCount,
        task_ids: taskIds,
      },
    });
  } catch (error) {
    console.error('Error logging bulk task completion:', error);
  }
}

/**
 * Log a reminder creation
 * @param {string} text - Reminder text
 * @param {Date} reminderTime - When the reminder should trigger
 * @param {string} refId - Optional reference ID
 */
export async function logReminderCreated(text, reminderTime, refId = null) {
  try {
    const logEntry = await activityLogService.create({
      action_type: 'reminder',
      entity_type: 'reminder',
      entity_id: null, // Reminders don't have separate entity IDs
      entity_ref_id: refId,
      entity_title: text,
      timestamp: reminderTime.toISOString(), // Use reminder time as the timestamp
      details: {
        is_completed: false,
        created_at: new Date().toISOString(), // Store when it was created
      },
    });
    return logEntry;
  } catch (error) {
    console.error('Error logging reminder creation:', error);
    throw error;
  }
}

/**
 * Mark a reminder as completed
 * @param {string} logId - Activity log ID of the reminder
 */
export async function logReminderCompleted(logId) {
  try {
    await activityLogService.update(logId, {
      details: {
        is_completed: true,
        completed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error logging reminder completion:', error);
  }
}
