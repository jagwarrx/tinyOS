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
import { CodeNode, CodeHighlightNode, $createCodeNode, $isCodeNode, getDefaultCodeLanguage, getCodeLanguages } from '@lexical/code'
import { registerCodeHighlighting } from '@lexical/code'
import { LinkNode } from '@lexical/link'
import { TRANSFORMERS } from '@lexical/markdown'
import { $getNodeByKey, $getSelection, $isRangeSelection, $getNearestNodeFromDOMNode, FORMAT_TEXT_COMMAND, COMMAND_PRIORITY_HIGH, KEY_MODIFIER_COMMAND, $isTextNode, $createTextNode, $createParagraphNode, $getRoot, PASTE_COMMAND, TextNode as LexicalTextNode } from 'lexical'
import { RefIdNode } from '../lexical/RefIdNode.jsx'
import { RefIdTransformPlugin, RefIdNavigationContext } from '../lexical/RefIdTransformPlugin.jsx'

// Plugin to enable code highlighting
function CustomCodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return registerCodeHighlighting(editor)
  }, [editor])

  return null
}

// Plugin to handle paste inside code blocks
function CodeBlockPastePlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) {
          return false
        }

        // Check if we're inside a code block
        const nodes = selection.getNodes()
        const isInCodeBlock = nodes.some(node => {
          const parent = node.getParent()
          return $isCodeNode(parent) || $isCodeNode(node)
        })

        if (isInCodeBlock) {
          event.preventDefault()

          // Get the pasted text
          const text = event.clipboardData?.getData('text/plain')
          if (text) {
            editor.update(() => {
              const sel = $getSelection()
              if ($isRangeSelection(sel)) {
                // Insert as plain text, preserving newlines
                sel.insertText(text)
              }
            })
            return true
          }
        }

        return false
      },
      COMMAND_PRIORITY_HIGH
    )
  }, [editor])

  return null
}

// Plugin to apply format classes to text nodes
function TextFormatClassPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      // This runs after the DOM has been updated by Lexical
      // We use queueMicrotask to ensure DOM changes are complete
      queueMicrotask(() => {
        const editorElement = editor.getRootElement()
        if (!editorElement) return

        // Query both span and code elements
        const textSpans = editorElement.querySelectorAll('span[data-lexical-text="true"], code')

        // We need to map spans to their formats
        // We'll do this by reading the editor state and building a map of text content to format
        const contentToFormat = new Map()

        editorState.read(() => {
          const nodeMap = editorState._nodeMap
          nodeMap.forEach((node) => {
            if ($isTextNode(node)) {
              const text = node.getTextContent()
              const format = node.getFormat()
              // Store with a unique key based on content and position
              contentToFormat.set(text, format)
            }
          })
        })

        // Now apply classes based on text content matching
        textSpans.forEach((span) => {
          const text = span.textContent
          if (contentToFormat.has(text)) {
            const format = contentToFormat.get(text)
            const classes = []

            if (format & 1) classes.push('editor-text-bold')
            if (format & 2) classes.push('editor-text-italic')
            if (format & 4) classes.push('editor-text-strikethrough')
            if (format & 8) classes.push('editor-text-underline')
            if (format & 16) classes.push('editor-text-blue')
            if (format & 32) classes.push('editor-text-highlight')

            span.className = classes.join(' ')
          }
        })
      })
    })

    return () => {
      removeUpdateListener()
    }
  }, [editor])

  return null
}

// Plugin to load initial content
function InitialContentPlugin({ initialContent }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (initialContent && typeof initialContent === 'string') {
      // Use queueMicrotask to avoid flushSync warning
      queueMicrotask(() => {
        try {
          // Try to parse the JSON first to validate it
          const parsed = JSON.parse(initialContent)

          // Check if the parsed content has a root with children
          if (parsed && parsed.root && parsed.root.children && Array.isArray(parsed.root.children)) {
            // Ensure root has at least one child (even if it's an empty paragraph)
            if (parsed.root.children.length === 0) {
              // Don't try to set an empty state
              return
            }

            const editorState = editor.parseEditorState(initialContent)

            // Only set the editor state if it's valid and not empty
            if (editorState && editorState._nodeMap && editorState._nodeMap.size > 1) {
              editor.setEditorState(editorState)
            }
          }
        } catch (error) {
          // Silently ignore parsing errors - keep default empty state
          console.debug('Could not parse initial content, using empty state')
        }
      })
    }
  }, [editor, initialContent])

  return null
}

// Plugin to enable drag-and-drop reordering of list items
function ListReorderPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    let draggedNodeKey = null
    let draggedElement = null
    let dropIndicator = null

    const handleDragStart = (e) => {
      // console.log('Drag start triggered')
      const listItem = e.target.closest('li')
      if (!listItem) {
        // console.log('No list item found')
        return
      }

      draggedElement = listItem
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', 'lexical-list-item') // Just a marker

      // console.log('Dragging item:', listItem.textContent.substring(0, 50))

      // Prevent text selection during drag on the entire editor
      const editorElement = editor.getRootElement()
      if (editorElement) {
        editorElement.style.userSelect = 'none'
        editorElement.style.webkitUserSelect = 'none'
      }

      // Add visual feedback
      setTimeout(() => {
        listItem.style.opacity = '0.5'
      }, 0)

      // Store the node key - we'll look it up fresh in the drop handler
      // Just verify we can find it
      editor.getEditorState().read(() => {
        const node = $getNearestNodeFromDOMNode(listItem)
        // console.log('DragStart - Node found?', !!node, 'Is ListItem?', node ? $isListItemNode(node) : false)
        if (node) {
          // console.log('Node type:', node.getType(), 'Key:', node.getKey())
        }
      })
    }

    const handleDragEnd = (e) => {
      const listItem = e.target.closest('li')
      if (listItem) {
        listItem.style.opacity = '1'
      }

      // Re-enable text selection on the editor
      const editorElement = editor.getRootElement()
      if (editorElement) {
        editorElement.style.userSelect = ''
        editorElement.style.webkitUserSelect = ''
      }

      if (dropIndicator) {
        dropIndicator.remove()
        dropIndicator = null
      }
      draggedNodeKey = null
      draggedElement = null
    }

    const handleDragOver = (e) => {
      e.preventDefault()

      // Try to find the target list item
      let listItem = e.target.closest('li')
      if (!listItem) {
        const elements = document.elementsFromPoint(e.clientX, e.clientY)
        listItem = elements.find(el => el.tagName === 'LI')
        // console.log('🔍 DragOver: Using elementsFromPoint, found LI?', !!listItem)
      }

      if (!listItem || listItem === draggedElement) {
        // Remove indicator if hovering over dragged element or no target
        if (dropIndicator && dropIndicator.parentNode) {
          dropIndicator.remove()
          // console.log('🗑️ Removed indicator (no target or same element)')
        }
        return
      }

      // console.log('🎯 DragOver: Valid target found')

      // Get position info for the target list item
      const rect = listItem.getBoundingClientRect()
      const midpoint = rect.top + rect.height / 2
      const insertBefore = e.clientY < midpoint

      // Create drop indicator if it doesn't exist
      if (!dropIndicator) {
        dropIndicator = document.createElement('div')
        dropIndicator.className = 'drop-indicator'
        dropIndicator.style.cssText = 'position: fixed; height: 4px; background: #3b82f6; pointer-events: none; z-index: 9999; box-shadow: 0 0 8px rgba(59, 130, 246, 0.8);'
        // console.log('✨ Created drop indicator')
      }

      // Remove indicator from previous location if it exists
      if (dropIndicator.parentNode && dropIndicator.parentNode !== listItem) {
        dropIndicator.remove()
        // console.log('🗑️ Removed indicator from previous location')
      }

      // Position the indicator - use fixed positioning relative to viewport

      if (insertBefore) {
        // Position above the target item
        dropIndicator.style.position = 'fixed'
        dropIndicator.style.top = `${rect.top - 2}px`
        dropIndicator.style.left = `${rect.left}px`
        dropIndicator.style.width = `${rect.width}px`
        dropIndicator.style.bottom = 'auto'

        if (!dropIndicator.parentNode) {
          document.body.appendChild(dropIndicator)
          // console.log('📍 Indicator inserted ABOVE (fixed positioning)')
        }
      } else {
        // Position below the target item
        dropIndicator.style.position = 'fixed'
        dropIndicator.style.top = `${rect.bottom - 2}px`
        dropIndicator.style.left = `${rect.left}px`
        dropIndicator.style.width = `${rect.width}px`
        dropIndicator.style.bottom = 'auto'

        if (!dropIndicator.parentNode) {
          document.body.appendChild(dropIndicator)
          // console.log('📍 Indicator inserted BELOW (fixed positioning)')
        }
      }

      // console.log('Indicator in DOM?', document.body.contains(dropIndicator), 'Visible?', dropIndicator.offsetWidth > 0)

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

      // console.log('Drop triggered!')

      if (dropIndicator) {
        dropIndicator.remove()
        dropIndicator = null
      }

      // Try to find the target list item, checking both e.target and the drop coordinates
      let targetListItem = e.target.closest('li')

      // If we didn't find a list item from e.target, try to find it from the drop position
      if (!targetListItem) {
        const elements = document.elementsFromPoint(e.clientX, e.clientY)
        targetListItem = elements.find(el => el.tagName === 'LI')
        // console.log('Using elementsFromPoint for drop, found:', !!targetListItem)
      }

      if (!targetListItem || !draggedElement || targetListItem === draggedElement) {
        // console.log('Drop aborted - no target or same element')
        if (draggedElement) {
          draggedElement.style.opacity = '1'
          draggedElement.style.userSelect = ''
        }
        draggedNodeKey = null
        draggedElement = null
        return
      }

      const rect = targetListItem.getBoundingClientRect()
      const midpoint = rect.top + rect.height / 2
      const insertBefore = e.clientY < midpoint

      // console.log('Performing reorder...')

      editor.update(() => {
        // Get both nodes from the DOM elements
        const targetNode = $getNearestNodeFromDOMNode(targetListItem)
        const draggedNode = $getNearestNodeFromDOMNode(draggedElement)

        // console.log('Drop - Dragged node found?', !!draggedNode, 'Target node found?', !!targetNode)

        if (draggedNode) {
          // console.log('Dragged type:', draggedNode.getType(), 'Key:', draggedNode.getKey())
        }
        if (targetNode) {
          // console.log('Target type:', targetNode.getType(), 'Key:', targetNode.getKey())
        }

        if (draggedNode && targetNode && $isListItemNode(draggedNode) && $isListItemNode(targetNode)) {
          const draggedParent = draggedNode.getParent()
          const targetParent = targetNode.getParent()

          // console.log('Same parent?', draggedParent === targetParent)

          // Only allow reordering within the same list
          if (draggedParent === targetParent && $isListNode(draggedParent)) {
            draggedNode.remove()

            if (insertBefore) {
              targetNode.insertBefore(draggedNode)
              // console.log('✅ Inserted BEFORE target')
            } else {
              targetNode.insertAfter(draggedNode)
              // console.log('✅ Inserted AFTER target')
            }
          } else {
            // console.log('❌ Not same parent or not a list')
          }
        } else {
          // console.log('❌ Invalid nodes - draggedNode:', !!draggedNode, 'Is ListItem?', draggedNode ? $isListItemNode(draggedNode) : false)
          // console.log('❌ targetNode:', !!targetNode, 'Is ListItem?', targetNode ? $isListItemNode(targetNode) : false)
        }
      })

      if (draggedElement) {
        draggedElement.style.opacity = '1'
      }

      // Re-enable text selection on the editor
      const editorElement = editor.getRootElement()
      if (editorElement) {
        editorElement.style.userSelect = ''
        editorElement.style.webkitUserSelect = ''
      }

      draggedNodeKey = null
      draggedElement = null
    }

    // Set up draggable attributes and event listeners
    const updateDraggableAttributes = () => {
      const editorElement = editor.getRootElement()
      if (!editorElement) return

      const listItems = editorElement.querySelectorAll('li')

      listItems.forEach((li) => {

        // Always update to ensure events are attached (even if draggable is set)
        li.setAttribute('draggable', 'true')
        li.style.cursor = 'move'

        // Remove old listeners to avoid duplicates
        li.removeEventListener('dragstart', handleDragStart)
        li.removeEventListener('dragend', handleDragEnd)
        li.removeEventListener('dragover', handleDragOver)
        li.removeEventListener('dragleave', handleDragLeave)
        li.removeEventListener('drop', handleDrop)

        // Add fresh listeners
        li.addEventListener('dragstart', handleDragStart)
        li.addEventListener('dragend', handleDragEnd)
        li.addEventListener('dragover', handleDragOver)
        li.addEventListener('dragleave', handleDragLeave)
        li.addEventListener('drop', handleDrop)
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

// Plugin to handle custom keyboard shortcuts for formatting
function FormattingShortcutsPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // Register command listeners for formatting
    const removeBoldCommand = editor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (payload) => {
        const event = payload
        const { code, ctrlKey, metaKey } = event

        // Cmd+B for bold (yellow text color)
        if ((ctrlKey || metaKey) && code === 'KeyB' && !event.shiftKey) {
          event.preventDefault()
          event.stopPropagation()
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              selection.formatText('bold')
            }
          })
          return true
        }

        // Cmd+H for highlight
        if ((ctrlKey || metaKey) && code === 'KeyH' && !event.shiftKey) {
          event.preventDefault()
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              selection.formatText('highlight')
            }
          })
          return true
        }

        // Cmd+S for strikethrough
        if ((ctrlKey || metaKey) && code === 'KeyS' && !event.shiftKey) {
          event.preventDefault()
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              selection.formatText('strikethrough')
            }
          })
          return true
        }

        // Cmd+Shift+C for electric blue (inline code format)
        if ((ctrlKey || metaKey) && code === 'KeyC' && event.shiftKey) {
          event.preventDefault()
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              selection.formatText('code')
            }
          })
          return true
        }

        // Cmd+Alt+C for code block
        if ((ctrlKey || metaKey) && event.altKey && code === 'KeyC') {
          event.preventDefault()
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              // Create a code node
              const codeNode = $createCodeNode()

              // Remove existing content and insert code block
              selection.removeText()
              selection.insertNodes([codeNode])

              // Focus inside the code block
              const textNode = $createTextNode('')
              codeNode.append(textNode)
              textNode.select()
            }
          })
          return true
        }

        return false
      },
      COMMAND_PRIORITY_HIGH
    )

    return () => {
      removeBoldCommand()
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

// Define initial config outside component to prevent re-registration
const initialConfig = {
  namespace: 'NotesEditor',
  nodes: [
    ListNode,
    ListItemNode,
    HeadingNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    LinkNode,
    RefIdNode
  ],
  theme: {
      text: {
        bold: 'editor-text-bold',
        underline: 'editor-text-underline',
        italic: 'editor-text-italic',
        strikethrough: 'editor-text-strikethrough',
        highlight: 'editor-text-highlight',
        code: 'editor-text-blue',
      },
      paragraph: 'mb-2',
      code: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-4 rounded-lg font-mono text-sm my-4 overflow-x-auto border border-gray-200 dark:border-gray-700',
      codeHighlight: {
        atrule: 'text-purple-600 dark:text-purple-400',
        attr: 'text-blue-600 dark:text-blue-400',
        boolean: 'text-orange-600 dark:text-orange-400',
        builtin: 'text-cyan-600 dark:text-cyan-400',
        cdata: 'text-gray-500 dark:text-gray-400',
        char: 'text-green-600 dark:text-green-400',
        class: 'text-yellow-600 dark:text-yellow-400',
        'class-name': 'text-yellow-600 dark:text-yellow-400',
        comment: 'text-gray-500 dark:text-gray-400 italic',
        constant: 'text-orange-600 dark:text-orange-400',
        deleted: 'text-red-600 dark:text-red-400',
        doctype: 'text-gray-500 dark:text-gray-400',
        entity: 'text-orange-600 dark:text-orange-400',
        function: 'text-blue-600 dark:text-blue-400',
        important: 'text-red-600 dark:text-red-400 font-bold',
        inserted: 'text-green-600 dark:text-green-400',
        keyword: 'text-purple-600 dark:text-purple-400',
        namespace: 'text-blue-600 dark:text-blue-400',
        number: 'text-orange-600 dark:text-orange-400',
        operator: 'text-gray-700 dark:text-gray-300',
        prolog: 'text-gray-500 dark:text-gray-400',
        property: 'text-blue-600 dark:text-blue-400',
        punctuation: 'text-gray-700 dark:text-gray-300',
        regex: 'text-green-600 dark:text-green-400',
        selector: 'text-green-600 dark:text-green-400',
        string: 'text-green-600 dark:text-green-400',
        symbol: 'text-orange-600 dark:text-orange-400',
        tag: 'text-red-600 dark:text-red-400',
        url: 'text-blue-600 dark:text-blue-400 underline',
        variable: 'text-orange-600 dark:text-orange-400',
      },
    },
  onError: (error) => {
    console.error(error)
  },
}

const Editor = forwardRef(({ initialContent, onContentChange, onRefIdNavigate }, ref) => {
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RefIdNavigationContext.Provider value={onRefIdNavigate}>
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
          <TextFormatClassPlugin />
          <FormattingShortcutsPlugin />
          <ListReorderPlugin />
          <CustomCodeHighlightPlugin />
          <CodeBlockPastePlugin />
          <HistoryPlugin />
          <ListPlugin />
          <TabIndentationPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <RefIdTransformPlugin onNavigate={onRefIdNavigate} />
        </div>
      </RefIdNavigationContext.Provider>
    </LexicalComposer>
  )
})

Editor.displayName = 'Editor'

export default Editor