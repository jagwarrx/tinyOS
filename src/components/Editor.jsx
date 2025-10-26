import { useEffect, forwardRef, useImperativeHandle } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { ListNode, ListItemNode, $isListNode, $isListItemNode } from '@lexical/list'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { CodeNode, CodeHighlightNode } from '@lexical/code'
import { LinkNode } from '@lexical/link'
import { TRANSFORMERS } from '@lexical/markdown'
import { $getNodeByKey, $getSelection, $isRangeSelection } from 'lexical'

// Plugin to load initial content
function InitialContentPlugin({ initialContent }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (initialContent) {
      const editorState = editor.parseEditorState(initialContent)
      editor.setEditorState(editorState)
    }
  }, [editor, initialContent])

  return null
}

// Plugin to enable drag-and-drop reordering of list items
function ListReorderPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    let draggedNode = null
    let draggedElement = null
    let dropIndicator = null

    const handleDragStart = (e) => {
      const listItem = e.target.closest('li')
      if (!listItem) return

      draggedElement = listItem
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/html', listItem.innerHTML)
      
      // Add visual feedback
      setTimeout(() => {
        listItem.style.opacity = '0.5'
      }, 0)

      // Store the node key
      const key = listItem.getAttribute('data-lexical-list-item')
      if (key) {
        editor.getEditorState().read(() => {
          const node = $getNodeByKey(key)
          if ($isListItemNode(node)) {
            draggedNode = node
          }
        })
      }
    }

    const handleDragEnd = (e) => {
      const listItem = e.target.closest('li')
      if (listItem) {
        listItem.style.opacity = '1'
      }
      if (dropIndicator) {
        dropIndicator.remove()
        dropIndicator = null
      }
      draggedNode = null
      draggedElement = null
    }

    const handleDragOver = (e) => {
      e.preventDefault()
      const listItem = e.target.closest('li')
      if (!listItem || listItem === draggedElement) return

      const rect = listItem.getBoundingClientRect()
      const midpoint = rect.top + rect.height / 2
      const insertBefore = e.clientY < midpoint

      // Create or update drop indicator
      if (!dropIndicator) {
        dropIndicator = document.createElement('div')
        dropIndicator.style.cssText = 'position: absolute; left: 0; right: 0; height: 2px; background: #3b82f6; pointer-events: none; z-index: 1000;'
      }

      if (insertBefore) {
        listItem.style.position = 'relative'
        dropIndicator.style.top = '-1px'
        listItem.insertBefore(dropIndicator, listItem.firstChild)
      } else {
        listItem.style.position = 'relative'
        dropIndicator.style.bottom = '-1px'
        dropIndicator.style.top = 'auto'
        listItem.appendChild(dropIndicator)
      }

      e.dataTransfer.dropEffect = 'move'
    }

    const handleDragLeave = (e) => {
      const listItem = e.target.closest('li')
      if (!listItem) return

      // Only remove indicator if we're leaving the list item entirely
      const relatedTarget = e.relatedTarget
      if (relatedTarget && !listItem.contains(relatedTarget)) {
        if (dropIndicator && dropIndicator.parentNode === listItem) {
          dropIndicator.remove()
        }
      }
    }

    const handleDrop = (e) => {
      e.preventDefault()
      e.stopPropagation()

      if (dropIndicator) {
        dropIndicator.remove()
        dropIndicator = null
      }

      const targetListItem = e.target.closest('li')
      if (!targetListItem || !draggedElement || targetListItem === draggedElement) {
        if (draggedElement) draggedElement.style.opacity = '1'
        return
      }

      const rect = targetListItem.getBoundingClientRect()
      const midpoint = rect.top + rect.height / 2
      const insertBefore = e.clientY < midpoint

      const targetKey = targetListItem.getAttribute('data-lexical-list-item')
      const draggedKey = draggedElement.getAttribute('data-lexical-list-item')

      if (!targetKey || !draggedKey) {
        if (draggedElement) draggedElement.style.opacity = '1'
        return
      }

      editor.update(() => {
        const draggedNode = $getNodeByKey(draggedKey)
        const targetNode = $getNodeByKey(targetKey)

        if ($isListItemNode(draggedNode) && $isListItemNode(targetNode)) {
          const draggedParent = draggedNode.getParent()
          const targetParent = targetNode.getParent()

          // Only allow reordering within the same list
          if (draggedParent === targetParent && $isListNode(draggedParent)) {
            draggedNode.remove()
            
            if (insertBefore) {
              targetNode.insertBefore(draggedNode)
            } else {
              targetNode.insertAfter(draggedNode)
            }
          }
        }
      })

      if (draggedElement) draggedElement.style.opacity = '1'
      draggedNode = null
      draggedElement = null
    }

    // Set up draggable attributes and event listeners
    const updateDraggableAttributes = () => {
      const editorElement = editor.getRootElement()
      if (!editorElement) return

      const listItems = editorElement.querySelectorAll('li')
      listItems.forEach((li) => {
        if (!li.hasAttribute('draggable')) {
          li.setAttribute('draggable', 'true')
          li.style.cursor = 'move'
          
          li.addEventListener('dragstart', handleDragStart)
          li.addEventListener('dragend', handleDragEnd)
          li.addEventListener('dragover', handleDragOver)
          li.addEventListener('dragleave', handleDragLeave)
          li.addEventListener('drop', handleDrop)
        }
      })
    }

    // Initial setup
    updateDraggableAttributes()

    // Update on editor changes
    const removeUpdateListener = editor.registerUpdateListener(() => {
      updateDraggableAttributes()
    })

    // Cleanup
    return () => {
      removeUpdateListener()
      
      const editorElement = editor.getRootElement()
      if (editorElement) {
        const listItems = editorElement.querySelectorAll('li')
        listItems.forEach((li) => {
          li.removeEventListener('dragstart', handleDragStart)
          li.removeEventListener('dragend', handleDragEnd)
          li.removeEventListener('dragover', handleDragOver)
          li.removeEventListener('dragleave', handleDragLeave)
          li.removeEventListener('drop', handleDrop)
        })
      }

      if (dropIndicator) {
        dropIndicator.remove()
      }
    }
  }, [editor])

  return null
}

// Plugin to expose getContent method and trigger auto-save
function EditorRefPlugin({ editorRef, onContentChange }) {
  const [editor] = useLexicalComposerContext()

  useImperativeHandle(editorRef, () => ({
    getContent: () => {
      let content = ''
      editor.getEditorState().read(() => {
        content = JSON.stringify(editor.getEditorState().toJSON())
      })
      return content
    }
  }))

  // Listen for content changes
  useEffect(() => {
    if (!onContentChange) return

    const removeUpdateListener = editor.registerUpdateListener(() => {
      onContentChange()
    })

    return () => {
      removeUpdateListener()
    }
  }, [editor, onContentChange])

  return null
}

const Editor = forwardRef(({ initialContent, onContentChange }, ref) => {
  const initialConfig = {
    namespace: 'NotesEditor',
    nodes: [ListNode, ListItemNode, HeadingNode, QuoteNode, CodeNode, CodeHighlightNode, LinkNode],
    theme: {
      text: {
        bold: 'font-bold',
        underline: 'underline',
        italic: 'italic',
        code: 'bg-gray-100 dark:bg-gray-800 px-1 rounded font-mono text-sm',
      },
      paragraph: 'mb-2',
    },
    onError: (error) => {
      console.error(error)
    },
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="h-full">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="editor-input focus:outline-none text-gray-900 dark:text-gray-100 leading-relaxed h-full" />
          }
          placeholder={
            <div className="editor-placeholder text-gray-400 dark:text-gray-600">Start typing...</div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        {initialContent && <InitialContentPlugin initialContent={initialContent} />}
        <EditorRefPlugin editorRef={ref} onContentChange={onContentChange} />
        <ListReorderPlugin />
        <HistoryPlugin />
        <ListPlugin />
        <TabIndentationPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      </div>
    </LexicalComposer>
  )
})

Editor.displayName = 'Editor'

export default Editor