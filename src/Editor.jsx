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
import { ListNode, ListItemNode } from '@lexical/list'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { CodeNode, CodeHighlightNode } from '@lexical/code'
import { LinkNode } from '@lexical/link'
import { TRANSFORMERS } from '@lexical/markdown'

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