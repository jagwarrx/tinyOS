import { useEffect } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { $getRoot, $getSelection, $isRangeSelection } from 'lexical'
import { $isTextNode } from 'lexical'
import { Bold, Underline, Highlighter } from 'lucide-react'
import {
  FORMAT_TEXT_COMMAND,
  $getSelection as getSelection,
} from 'lexical'

// Plugin to handle formatting
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()

  const formatText = (format) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
  }

  return (
    <div className="flex gap-1 p-2 border-b border-gray-200 bg-gray-50">
      <button
        onClick={() => formatText('bold')}
        className="p-2 hover:bg-gray-200 rounded transition-colors"
        title="Bold (Ctrl+B)"
      >
        <Bold size={18} />
      </button>
      <button
        onClick={() => formatText('underline')}
        className="p-2 hover:bg-gray-200 rounded transition-colors"
        title="Underline (Ctrl+U)"
      >
        <Underline size={18} />
      </button>
      <button
        onClick={() => formatText('highlight')}
        className="p-2 hover:bg-gray-200 rounded transition-colors"
        title="Highlight"
      >
        <Highlighter size={18} />
      </button>
    </div>
  )
}

// Plugin to sync editor content with parent component
function OnChangePlugin({ onChange }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot()
        const content = JSON.stringify(editorState.toJSON())
        onChange(content)
      })
    })
  }, [editor, onChange])

  return null
}

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

export default function Editor({ initialContent, onChange }) {
  const initialConfig = {
    namespace: 'NotesEditor',
    theme: {
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
        underlineStrikethrough: 'underline line-through',
      },
      paragraph: 'mb-2',
    },
    onError: (error) => {
      console.error(error)
    },
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
        <ToolbarPlugin />
        <div className="relative p-4">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="editor-input focus:outline-none" />
            }
            placeholder={
              <div className="editor-placeholder">Start typing your note...</div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin onChange={onChange} />
          {initialContent && <InitialContentPlugin initialContent={initialContent} />}
          <HistoryPlugin />
        </div>
      </div>
    </LexicalComposer>
  )
}
