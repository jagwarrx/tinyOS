/**
 * RefIdBadge Component
 *
 * Displays a clickable badge for referenced notes or tasks
 * Format: [TASK | Task Title] or [NOTE | Note Title]
 *
 * @param {string} refId - The reference ID (e.g., 'a3x7k9')
 * @param {string} type - 'note' or 'task'
 * @param {string} title - The title of the note or task text
 * @param {function} onClick - Click handler for navigation
 * @param {boolean} inline - Whether to render inline (default: true)
 */

export default function RefIdBadge({ refId, type, title, onClick, inline = true }) {
  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onClick) {
      onClick(e)
    }
  }

  const bgColor = type === 'task'
    ? 'bg-syntax-blue/10 border-syntax-blue/30'
    : 'bg-syntax-purple/10 border-syntax-purple/30'

  const textColor = type === 'task'
    ? 'text-syntax-blue'
    : 'text-syntax-purple'

  const labelColor = type === 'task'
    ? 'text-syntax-blue'
    : 'text-syntax-purple'

  const displayStyle = inline
    ? 'inline-flex'
    : 'flex'

  return (
    <span
      onClick={handleClick}
      className={`${displayStyle} items-center gap-1.5 px-2 py-0.5 rounded border ${bgColor} cursor-pointer hover:shadow-sm transition-all font-mono text-xs whitespace-nowrap max-w-md select-none`}
      title={`Click to open ${type}: ${title}`}
      contentEditable={false}
      suppressContentEditableWarning
    >
      {/* Type Label */}
      <span className={`font-bold uppercase ${labelColor}`}>
        {type === 'task' ? 'TASK' : 'NOTE'}
      </span>

      {/* Separator */}
      <span className="text-fg-tertiary">|</span>

      {/* Title */}
      <span className={`${textColor} truncate max-w-[200px]`}>
        {title || 'Untitled'}
      </span>

      {/* Ref ID */}
      <span className="text-fg-tertiary text-[10px]">
        {refId}
      </span>
    </span>
  )
}
