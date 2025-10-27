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
      onClick(refId, type)
    }
  }

  const bgColor = type === 'task'
    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'

  const textColor = type === 'task'
    ? 'text-blue-700 dark:text-blue-300'
    : 'text-purple-700 dark:text-purple-300'

  const labelColor = type === 'task'
    ? 'text-blue-500 dark:text-blue-400'
    : 'text-purple-500 dark:text-purple-400'

  const displayStyle = inline
    ? 'inline-flex'
    : 'flex'

  return (
    <span
      onClick={handleClick}
      className={`${displayStyle} items-center gap-1.5 px-2 py-0.5 rounded border ${bgColor} cursor-pointer hover:shadow-sm transition-all font-mono text-xs whitespace-nowrap max-w-md`}
      title={`Click to open ${type}: ${title}`}
      contentEditable={false}
      suppressContentEditableWarning
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
