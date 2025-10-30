import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

/**
 * DiagramEditor - Modal component for creating/editing Draw.io diagrams
 *
 * Uses embed.diagrams.net with postMessage API for two-way communication
 * Exports diagram as XML and SVG for storage and preview
 */
export default function DiagramEditor({ isOpen, onClose, initialXml, onSave, diagramTitle }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const iframeRef = useRef(null)
  const [diagramData, setDiagramData] = useState(null)


  useEffect(() => {
    if (!isOpen) return

    const handleMessage = (event) => {
      // Only accept messages from diagrams.net
      if (event.origin !== 'https://embed.diagrams.net') {
        return
      }

      try {
        const data = JSON.parse(event.data)

        // Ignore messages without an event property
        if (!data.event) {
          return
        }

      switch (data.event) {
        case 'init':
          // Editor is ready
          // Load existing diagram or start with blank canvas
          if (initialXml) {
            iframeRef.current?.contentWindow.postMessage(
              JSON.stringify({
                action: 'load',
                xml: initialXml,
                autosave: 1
              }),
              'https://embed.diagrams.net'
            )
          } else {
            // Send blank diagram XML to start fresh
            const blankDiagram = '<mxfile host="app.diagrams.net"><diagram name="Page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>'
            iframeRef.current?.contentWindow.postMessage(
              JSON.stringify({
                action: 'load',
                xml: blankDiagram,
                autosave: 1
              }),
              'https://embed.diagrams.net'
            )
          }

          // Hide loading after a brief delay to ensure editor is ready
          setTimeout(() => {
            setIsLoading(false)
          }, 1000)
          break

        case 'load':
          break

        case 'save':
          // User clicked Save - extract diagram data
          setDiagramData({
            xml: data.xml,
            svg: null // We'll request SVG separately
          })

          // Request SVG export for preview
          iframeRef.current?.contentWindow.postMessage(
            JSON.stringify({
              action: 'export',
              format: 'svg'
            }),
            'https://embed.diagrams.net'
          )
          break

        case 'export':
          // SVG export complete
          if (data.format === 'svg' && diagramData) {
            // Save both XML and SVG
            const completeData = {
              ...diagramData,
              svg: data.data
            }
            onSave(completeData)
            onClose()
          }
          break

        case 'exit':
          // User clicked exit without saving
          onClose()
          break

        case 'autosave':
          // Auto-save event (we can use this for real-time updates if needed)
          break

        default:
          break
      }
    } catch (error) {
      console.error('❌ Error handling Draw.io message:', error, event.data)
    }
  }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [isOpen, initialXml, onSave, onClose, diagramData])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-bg-primary border border-border-primary rounded-lg shadow-2xl w-[95vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-primary">
          <div>
            <h2 className="text-lg font-semibold text-fg-primary">
              {initialXml ? 'Edit Diagram' : 'Create Diagram'}
            </h2>
            {diagramTitle && (
              <p className="text-sm text-fg-secondary">{diagramTitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-fg-secondary" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-syntax-blue"></div>
              <p className="mt-4 text-fg-secondary">Loading Draw.io editor... (isLoading={String(isLoading)})</p>
            </div>
          </div>
        ) : null}

        {/* Error State */}
        {error && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-semantic-error">
              <p className="font-semibold">Failed to load editor</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          </div>
        )}

        {/* Draw.io Embed */}
        <iframe
          ref={iframeRef}
          src="https://embed.diagrams.net/?embed=1&ui=kennedy&spin=1&proto=json&saveAndExit=1&noSaveBtn=0"
          className={`flex-1 border-0 ${isLoading ? 'hidden' : ''}`}
          style={{ display: isLoading ? 'none' : 'block' }}
          onLoad={() => {
            // Fallback: Hide loading after 2 seconds if postMessage doesn't work
            setTimeout(() => {
              setIsLoading(false)
            }, 2000)
          }}
          onError={(e) => {
            console.error('❌ iframe error:', e)
            setError('Failed to load Draw.io editor')
            setIsLoading(false)
          }}
        />

        {/* Instructions */}
        <div className="p-3 border-t border-border-primary bg-bg-secondary text-sm text-fg-secondary">
          <p>
            💡 <strong>Tip:</strong> Click <strong>Save & Exit</strong> in the toolbar to save your diagram.
            Press <strong>Esc</strong> or click the × to cancel without saving.
          </p>
        </div>
      </div>
    </div>
  )
}
