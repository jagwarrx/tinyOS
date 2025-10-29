/**
 * RefIdNode - Custom Lexical DecoratorNode for Reference ID Badges
 *
 * Renders reference IDs (e.g., a3x7k9) as clickable badges showing
 * [TASK | Task Title] or [NOTE | Note Title]
 */

import { DecoratorNode } from 'lexical'
import { Suspense, useContext } from 'react'
import { RefIdNavigationContext } from './RefIdTransformPlugin.jsx'

export class RefIdNode extends DecoratorNode {
  __refId
  __itemType
  __title
  __onClick
  __noteType
  __diagramSvg
  __mindmapSvg

  static getType() {
    console.log('🔧 RefIdNode.getType() called, returning: "refid"')
    return 'refid'
  }

  static clone(node) {
    console.log('🔧 RefIdNode.clone() called - itemType:', node.__itemType, 'refId:', node.__refId)
    return new RefIdNode(
      node.__refId,
      node.__itemType,
      node.__title,
      node.__onClick,
      node.__key,
      node.__noteType,
      node.__diagramSvg,
      node.__mindmapSvg
    )
  }

  constructor(refId, itemType, title, onClick, key, noteType = null, diagramSvg = null, mindmapSvg = null) {
    super(key)
    console.log('🔧 RefIdNode constructor - itemType param:', itemType, 'refId:', refId, 'noteType:', noteType)
    this.__refId = refId
    this.__itemType = itemType // 'note' or 'task'
    this.__title = title
    this.__onClick = onClick
    this.__noteType = noteType // e.g., 'diagram', 'mindmap', 'project', etc.
    this.__diagramSvg = diagramSvg // SVG data for diagram preview
    this.__mindmapSvg = mindmapSvg // SVG data for mindmap preview
  }

  createDOM() {
    const span = document.createElement('span')
    span.style.display = 'inline-block'
    span.style.verticalAlign = 'middle'
    return span
  }

  updateDOM() {
    return false
  }

  decorate() {
    return (
      <Suspense fallback={<span>...</span>}>
        <RefIdBadgeComponent
          refId={this.__refId}
          type={this.__itemType}
          title={this.__title}
          noteType={this.__noteType}
          diagramSvg={this.__diagramSvg}
          mindmapSvg={this.__mindmapSvg}
        />
      </Suspense>
    )
  }

  static importJSON(serializedNode) {
    console.log('🔧 RefIdNode.importJSON() called - serializedNode:', serializedNode)
    const node = $createRefIdNode(
      serializedNode.refId,
      serializedNode.itemType,
      serializedNode.title,
      null,
      serializedNode.noteType,
      serializedNode.diagramSvg,
      serializedNode.mindmapSvg
    )
    return node
  }

  exportJSON() {
    console.log('🔧 RefIdNode.exportJSON() - this.__itemType:', this.__itemType, 'this.__refId:', this.__refId)
    const json = {
      type: 'refid',
      refId: this.__refId,
      itemType: this.__itemType,
      title: this.__title,
      noteType: this.__noteType,
      diagramSvg: this.__diagramSvg,
      mindmapSvg: this.__mindmapSvg,
      version: 1
    }
    console.log('🔧 RefIdNode.exportJSON() called - returning:', json)
    return json
  }

  getTextContent() {
    return this.__refId
  }

  isInline() {
    return true
  }

  // Prevent Lexical from trying to transform this node
  static importDOM() {
    return null
  }
}

/**
 * React component that renders the badge
 */
function RefIdBadgeComponent({ refId, type, title, noteType, diagramSvg, mindmapSvg }) {
  // Get the navigation handler from context
  const onNavigate = useContext(RefIdNavigationContext)

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onNavigate) {
      // Pass shiftKey to enable side-by-side view
      onNavigate(refId, type, e.shiftKey)
    }
  }

  // Special rendering for diagram notes
  if (noteType === 'diagram' && diagramSvg) {
    return (
      <span
        onClick={handleClick}
        className="inline-block mx-1 my-2 cursor-pointer hover:shadow-lg transition-all border-2 border-purple-300 dark:border-purple-700 rounded-lg overflow-hidden bg-white"
        title={`Click to open diagram: ${title}\nShift+Click to open side-by-side`}
        contentEditable={false}
        suppressContentEditableWarning={true}
      >
        {/* Diagram Preview */}
        <div className="p-4 max-w-md flex flex-col items-center justify-center">
          <div
            className="diagram-preview flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: diagramSvg }}
            style={{ maxHeight: '300px', maxWidth: '100%', overflow: 'auto' }}
          />
          {/* Caption */}
          <div className="mt-3 text-xs text-center font-mono text-purple-700">
            <span className="font-bold">DIAGRAM</span> | {title} | {refId}
          </div>
        </div>
      </span>
    )
  }

  // Special rendering for mindmap notes
  if (noteType === 'mindmap' && mindmapSvg) {
    return (
      <span
        onClick={handleClick}
        className="inline-block mx-1 my-2 cursor-pointer hover:shadow-lg transition-all border-2 border-blue-300 dark:border-blue-700 rounded-lg overflow-hidden bg-white"
        title={`Click to open mindmap: ${title}\nShift+Click to open side-by-side`}
        contentEditable={false}
        suppressContentEditableWarning={true}
      >
        {/* Mindmap Preview */}
        <div className="p-4 max-w-md flex flex-col items-center justify-center">
          <div
            className="mindmap-preview flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: mindmapSvg }}
            style={{ maxHeight: '300px', maxWidth: '100%', overflow: 'auto' }}
          />
          {/* Caption */}
          <div className="mt-3 text-xs text-center font-mono text-blue-700">
            <span className="font-bold">MINDMAP</span> | {title} | {refId}
          </div>
        </div>
      </span>
    )
  }

  // Default rendering for notes and tasks
  const bgColor = type === 'task'
    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'

  const textColor = type === 'task'
    ? 'text-blue-700 dark:text-blue-300'
    : 'text-purple-700 dark:text-purple-300'

  const labelColor = type === 'task'
    ? 'text-blue-500 dark:text-blue-400'
    : 'text-purple-500 dark:text-purple-400'

  return (
    <span
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 mx-0.5 rounded border ${bgColor} cursor-pointer hover:shadow-sm transition-all font-mono text-xs whitespace-nowrap`}
      title={`Click to open ${type}: ${title}\nShift+Click to open side-by-side`}
      contentEditable={false}
      suppressContentEditableWarning={true}
    >
      {/* Type Label */}
      <span className={`font-bold uppercase ${labelColor}`}>
        {type === 'task' ? 'TASK' : 'NOTE'}
      </span>

      {/* Separator */}
      <span className="text-gray-400 dark:text-gray-600">|</span>

      {/* Title */}
      <span className={`${textColor} truncate max-w-[200px]`}>
        {title || 'Untitled'}
      </span>

      {/* Ref ID */}
      <span className="text-gray-400 dark:text-gray-600 text-[10px]">
        {refId}
      </span>
    </span>
  )
}

/**
 * Helper function to create a RefIdNode
 */
export function $createRefIdNode(refId, type, title, onClick, noteType = null, diagramSvg = null, mindmapSvg = null) {
  console.log('🔧 $createRefIdNode() called - refId:', refId, 'type:', type, 'title:', title, 'noteType:', noteType)
  return new RefIdNode(refId, type, title, onClick, null, noteType, diagramSvg, mindmapSvg)
}

/**
 * Type guard to check if a node is a RefIdNode
 */
export function $isRefIdNode(node) {
  return node instanceof RefIdNode
}
