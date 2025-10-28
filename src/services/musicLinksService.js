import { supabase } from '../supabaseClient'

/**
 * Music Links Service
 * CRUD operations for managing background audio sources stored in settings table
 */

/**
 * Fetch all music links from settings table
 * @returns {Promise<Object>} Object with spotify and youtube arrays
 */
export async function fetchAllMusicLinks() {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'music_links')
    .single()

  if (error) {
    console.error('Error fetching music links:', error)
    // Return default structure if not found
    if (error.code === 'PGRST116') {
      return { spotify: [], youtube: [] }
    }
    throw error
  }

  return data?.value || { spotify: [], youtube: [] }
}

/**
 * Fetch music links by type
 * @param {string} type - 'spotify' or 'youtube'
 * @returns {Promise<Array>} Array of music link objects
 */
export async function fetchMusicLinksByType(type) {
  const allLinks = await fetchAllMusicLinks()
  return allLinks[type] || []
}

/**
 * Create a new music link
 * @param {Object} musicLink - Music link object
 * @param {string} musicLink.title - User-friendly title
 * @param {string} musicLink.url - Full URL to Spotify playlist or YouTube video
 * @param {string} musicLink.type - 'spotify' or 'youtube'
 * @param {boolean} musicLink.is_default - Whether this is the default for its type
 * @returns {Promise<Object>} Created music link object
 */
export async function createMusicLink(musicLink) {
  const allLinks = await fetchAllMusicLinks()
  const type = musicLink.type

  // Generate ID for new link
  const newLink = {
    id: crypto.randomUUID(),
    title: musicLink.title,
    url: musicLink.url,
    is_default: musicLink.is_default || false
  }

  // If setting as default, unset other defaults
  if (newLink.is_default) {
    allLinks[type] = allLinks[type].map(link => ({ ...link, is_default: false }))
  }

  // Add new link
  allLinks[type] = [...(allLinks[type] || []), newLink]

  // Save back to database
  await saveMusicLinks(allLinks)

  return newLink
}

/**
 * Update an existing music link
 * @param {string} id - Music link ID
 * @param {string} type - 'spotify' or 'youtube'
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated music link object
 */
export async function updateMusicLink(id, type, updates) {
  const allLinks = await fetchAllMusicLinks()

  // Find and update the link
  const linkIndex = allLinks[type].findIndex(link => link.id === id)
  if (linkIndex === -1) {
    throw new Error('Music link not found')
  }

  // If setting as default, unset others
  if (updates.is_default) {
    allLinks[type] = allLinks[type].map(link => ({ ...link, is_default: false }))
  }

  allLinks[type][linkIndex] = { ...allLinks[type][linkIndex], ...updates }

  // Save back to database
  await saveMusicLinks(allLinks)

  return allLinks[type][linkIndex]
}

/**
 * Delete a music link
 * @param {string} id - Music link ID
 * @param {string} type - 'spotify' or 'youtube'
 * @returns {Promise<void>}
 */
export async function deleteMusicLink(id, type) {
  const allLinks = await fetchAllMusicLinks()

  // Filter out the link
  allLinks[type] = allLinks[type].filter(link => link.id !== id)

  // Save back to database
  await saveMusicLinks(allLinks)
}

/**
 * Set a music link as default for its type
 * @param {string} id - Music link ID
 * @param {string} type - 'spotify' or 'youtube'
 * @returns {Promise<Object>} Updated music link object
 */
export async function setAsDefault(id, type) {
  const allLinks = await fetchAllMusicLinks()

  // Unset all defaults and set this one
  allLinks[type] = allLinks[type].map(link => ({
    ...link,
    is_default: link.id === id
  }))

  // Save back to database
  await saveMusicLinks(allLinks)

  return allLinks[type].find(link => link.id === id)
}

/**
 * Save music links back to settings table (UPSERT)
 * @param {Object} musicLinks - Complete music links object
 * @returns {Promise<void>}
 */
async function saveMusicLinks(musicLinks) {
  const { error } = await supabase
    .from('settings')
    .upsert({
      key: 'music_links',
      value: musicLinks
    }, {
      onConflict: 'key'
    })

  if (error) {
    console.error('Error saving music links:', error)
    throw error
  }
}

/**
 * Extract Spotify playlist ID from URL
 * @param {string} url - Spotify URL
 * @returns {string|null} Playlist ID or null
 */
export function extractSpotifyId(url) {
  const match = url.match(/playlist\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

/**
 * Extract YouTube video ID from URL
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID or null
 */
export function extractYoutubeId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}
