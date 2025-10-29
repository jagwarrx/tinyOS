import { useState, useEffect } from 'react'
import { Music, X, Youtube, ChevronDown } from 'lucide-react'
import { fetchAllMusicLinks, extractSpotifyId, extractYoutubeId } from '../services/musicLinksService'

// Spotify logo SVG component
const SpotifyIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
)

export default function FloatingAudioPlayer() {
  const [isOpen, setIsOpen] = useState(false)
  const [activePlayer, setActivePlayer] = useState(null) // 'spotify' or 'youtube'
  const [musicLinks, setMusicLinks] = useState({ spotify: [], youtube: [] })
  const [selectedSpotify, setSelectedSpotify] = useState(null)
  const [selectedYoutube, setSelectedYoutube] = useState(null)

  // Load music links from database on mount
  useEffect(() => {
    loadMusicLinks()
  }, [])

  const loadMusicLinks = async () => {
    try {
      const links = await fetchAllMusicLinks()
      setMusicLinks(links)

      // Set default or first link for each type
      const defaultSpotify = links.spotify?.find(l => l.is_default) || links.spotify?.[0]
      const defaultYoutube = links.youtube?.find(l => l.is_default) || links.youtube?.[0]

      if (defaultSpotify) setSelectedSpotify(defaultSpotify)
      if (defaultYoutube) setSelectedYoutube(defaultYoutube)
    } catch (error) {
      console.error('Failed to load music links:', error)
    }
  }

  const spotifyPlaylistId = selectedSpotify ? extractSpotifyId(selectedSpotify.url) : null
  const youtubeVideoId = selectedYoutube ? extractYoutubeId(selectedYoutube.url) : null

  const handleStop = () => {
    setActivePlayer(null)
    setIsOpen(false)
  }

  const handleMinimize = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 ${
          activePlayer
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 animate-pulse'
            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
        } text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50 primary-action border-0`}
        title={activePlayer ? "Audio playing - Click to show controls" : "Background Audio"}
      >
        <Music size={24} />
      </button>

      {/* Audio Player Panel - Always render when activePlayer exists */}
      {(isOpen || activePlayer) && (
        <div
          className={`fixed bottom-24 right-6 w-80 bg-bg-elevated border border-border-primary rounded-lg shadow-2xl overflow-hidden transition-all ${
            isOpen ? 'z-50 opacity-100 scale-100' : '-z-10 opacity-0 scale-95 pointer-events-none'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary bg-gradient-to-r from-purple-500 to-pink-500">
            <h3 className="text-sm font-semibold text-white">Background Audio</h3>
            <button
              onClick={handleMinimize}
              className="text-white hover:bg-white/20 rounded p-1 transition-colors"
              title="Minimize (audio keeps playing)"
            >
              <X size={16} />
            </button>
          </div>

          {/* Player Selection or Active Player */}
          {!activePlayer ? (
            <div className="p-4 space-y-3">
              <p className="text-xs text-fg-tertiary mb-3">Choose your focus audio:</p>

              {/* Spotify Option */}
              {musicLinks.spotify?.length > 0 && (
                <div className="space-y-2">
                  {musicLinks.spotify.length > 1 && (
                    <select
                      value={selectedSpotify?.id || ''}
                      onChange={(e) => {
                        const link = musicLinks.spotify.find(l => l.id === e.target.value)
                        setSelectedSpotify(link)
                      }}
                      className="w-full px-3 py-1.5 bg-bg-secondary border border-border-primary rounded text-xs text-fg-primary"
                    >
                      {musicLinks.spotify.map(link => (
                        <option key={link.id} value={link.id}>{link.title}</option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={() => setActivePlayer('spotify')}
                    disabled={!selectedSpotify}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed primary-action border-0"
                  >
                    <SpotifyIcon size={24} />
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">{selectedSpotify?.title || 'Spotify'}</div>
                      <div className="text-xs opacity-90">Click to play</div>
                    </div>
                  </button>
                </div>
              )}

              {/* YouTube Option */}
              {musicLinks.youtube?.length > 0 && (
                <div className="space-y-2">
                  {musicLinks.youtube.length > 1 && (
                    <select
                      value={selectedYoutube?.id || ''}
                      onChange={(e) => {
                        const link = musicLinks.youtube.find(l => l.id === e.target.value)
                        setSelectedYoutube(link)
                      }}
                      className="w-full px-3 py-1.5 bg-bg-secondary border border-border-primary rounded text-xs text-fg-primary"
                    >
                      {musicLinks.youtube.map(link => (
                        <option key={link.id} value={link.id}>{link.title}</option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={() => setActivePlayer('youtube')}
                    disabled={!selectedYoutube}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed primary-action border-0"
                  >
                    <Youtube size={24} />
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">{selectedYoutube?.title || 'YouTube'}</div>
                      <div className="text-xs opacity-90">Click to play</div>
                    </div>
                  </button>
                </div>
              )}

              {/* No links message */}
              {musicLinks.spotify?.length === 0 && musicLinks.youtube?.length === 0 && (
                <p className="text-sm text-fg-tertiary text-center py-4">
                  No music links configured. Add some in Settings → Music.
                </p>
              )}
            </div>
          ) : (
            <div className="p-4">
              {/* Back button */}
              <button
                onClick={handleStop}
                className="text-xs text-fg-tertiary hover:text-fg-primary mb-3 flex items-center gap-1"
              >
                <X size={12} />
                Stop & change audio source
              </button>

              {/* Spotify Embed */}
              {activePlayer === 'spotify' && (
                <div className="rounded-lg overflow-hidden">
                  <iframe
                    src={`https://open.spotify.com/embed/playlist/${spotifyPlaylistId}?utm_source=generator&theme=0`}
                    width="100%"
                    height="352"
                    frameBorder="0"
                    allowFullScreen=""
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="rounded-lg"
                  />
                </div>
              )}

              {/* YouTube Embed */}
              {activePlayer === 'youtube' && (
                <div className="rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="200"
                    src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=0`}
                    title="YouTube audio player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-lg"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
