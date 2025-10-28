import { supabase } from '../supabaseClient';

/**
 * Activity Log Service
 * Handles CRUD operations for the activity_log table
 */

/**
 * Create a new activity log entry
 * @param {Object} logEntry - The log entry to create
 * @param {string} logEntry.action_type - Type of action (e.g., 'task_created', 'note_updated')
 * @param {string} logEntry.entity_type - Type of entity ('task', 'note', 'project', 'timer')
 * @param {string} logEntry.entity_id - UUID of the entity
 * @param {string} logEntry.entity_ref_id - Reference ID (e.g., 'a3x7k9')
 * @param {string} logEntry.entity_title - Title/text of the entity
 * @param {Object} logEntry.details - Additional details (JSONB)
 * @param {Date} logEntry.timestamp - When the action occurred (defaults to now)
 * @returns {Promise<Object>} The created log entry
 */
export async function create(logEntry) {
  const { data, error } = await supabase
    .from('activity_log')
    .insert({
      action_type: logEntry.action_type,
      entity_type: logEntry.entity_type,
      entity_id: logEntry.entity_id,
      entity_ref_id: logEntry.entity_ref_id,
      entity_title: logEntry.entity_title,
      details: logEntry.details || {},
      timestamp: logEntry.timestamp || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch all activity logs, ordered by timestamp descending
 * @param {number} limit - Maximum number of logs to fetch (default: 100)
 * @param {number} offset - Number of logs to skip (for pagination)
 * @returns {Promise<Array>} Array of log entries
 */
export async function fetchAll(limit = 100, offset = 0) {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('timestamp', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

/**
 * Fetch logs filtered by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Array of log entries
 */
export async function fetchByDateRange(startDate, endDate) {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString())
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch logs for a specific entity
 * @param {string} entityId - UUID of the entity
 * @returns {Promise<Array>} Array of log entries
 */
export async function fetchByEntity(entityId) {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('entity_id', entityId)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch logs filtered by action type
 * @param {string} actionType - Action type to filter by
 * @returns {Promise<Array>} Array of log entries
 */
export async function fetchByActionType(actionType) {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('action_type', actionType)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch logs filtered by entity type
 * @param {string} entityType - Entity type to filter by
 * @returns {Promise<Array>} Array of log entries
 */
export async function fetchByEntityType(entityType) {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('entity_type', entityType)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Update the most recent log entry for a specific entity
 * Used for collapsing multiple edits into one
 * @param {string} entityId - UUID of the entity
 * @param {string} actionType - Action type to match
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated log entry
 */
export async function updateRecentLog(entityId, actionType, updates) {
  const { data, error } = await supabase
    .from('activity_log')
    .update(updates)
    .eq('entity_id', entityId)
    .eq('action_type', actionType)
    .order('timestamp', { ascending: false })
    .limit(1)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get the most recent log entry for an entity and action type
 * @param {string} entityId - UUID of the entity
 * @param {string} actionType - Action type to match
 * @returns {Promise<Object|null>} Most recent log entry or null
 */
export async function getRecentLog(entityId, actionType) {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('entity_id', entityId)
    .eq('action_type', actionType)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Delete logs older than a specified date
 * @param {Date} beforeDate - Delete logs before this date
 * @returns {Promise<void>}
 */
export async function deleteOldLogs(beforeDate) {
  const { error } = await supabase
    .from('activity_log')
    .delete()
    .lt('timestamp', beforeDate.toISOString());

  if (error) throw error;
}

/**
 * Delete all logs for a specific entity
 * Useful when an entity is deleted
 * @param {string} entityId - UUID of the entity
 * @returns {Promise<void>}
 */
export async function deleteByEntity(entityId) {
  const { error } = await supabase
    .from('activity_log')
    .delete()
    .eq('entity_id', entityId);

  if (error) throw error;
}
