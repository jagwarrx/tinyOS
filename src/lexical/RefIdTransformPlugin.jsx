/**
 * RefIdTransformPlugin - Lexical Plugin
 *
 * Detects reference IDs in text (e.g., a3x7k9) and transforms them
 * into RefIdNode badges showing the linked note/task title.
 *
 * Flow:
 * 1. Listen for text changes in the editor
 * 2. Scan for valid ref_id patterns
 * 3. Look up the ref_id in the database
 * 4. Replace text with a RefIdNode badge
 */

import { useEffect, useState, useRef, createContext, useContext } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $createTextNode,
  $getRoot,
  TextNode,
  COMMAND_PRIORITY_LOW
} from 'lexical'
import { $createRefIdNode, $isRefIdNode, RefIdNode } from './RefIdNode.jsx'
import { lookupRefId, isValidRefId } from '../utils/refIdLookup.js'

// Create a context to store the navigation handler
export const RefIdNavigationContext = createContext(null)

export function RefIdTransformPlugin({ onNavigate }) {
  const [editor] = useLexicalComposerContext()
  const lookupCacheRef = useRef(new Map()) // Cache lookup results

  useEffect(() => {
    if (!editor.hasNodes([RefIdNode])) {
      throw new Error('RefIdTransformPlugin: RefIdNode not registered on editor')
    }

    const processedRefIds = new Set()
    const lookupCache = lookupCacheRef.current

    // Function to find and transform ref_ids in text nodes
    const transformRefIds = async () => {
      const textContent = editor.getEditorState().read(() => {
        const root = $getRoot()
        return root.getTextContent()
      })

      // Extract potential ref_ids from the content
      // Pattern: [refid] where refid is [a-z][0-9][a-z0-9]{4}
      const refIdPattern = /\[([a-z][0-9][a-z0-9]{4})\]/g
      const matches = [...textContent.matchAll(refIdPattern)]

      console.log('🔍 RefId Detection:', matches.length > 0 ? `Found ${matches.length} ref_ids` : 'No ref_ids found')
      if (matches.length > 0) {
        console.log('   Matched ref_ids:', matches.map(m => m[1]).join(', '))
      }

      if (matches.length === 0) return

      // Get unique ref_ids that need to be looked up
      const refIds = [...new Set(matches.map(m => m[1]))]
        .filter(id => !processedRefIds.has(id))

      if (refIds.length === 0) return

      // Look up all ref_ids (use cache if available)
      const lookupPromises = refIds.map(async (refId) => {
        if (lookupCache.has(refId)) {
          const cached = lookupCache.get(refId)
          if (cached.found) {
            processedRefIds.add(refId)
            return cached
          }
          return null
        }

        const result = await lookupRefId(refId)
        lookupCache.set(refId, result)

        if (result.found) {
          processedRefIds.add(refId)
          return { refId, ...result }
        }
        return null
      })

      const results = (await Promise.all(lookupPromises)).filter(Boolean)

      console.log('💾 Database Lookup Results:', results.length > 0 ? `${results.length} found` : 'None found')
      results.forEach(({ refId, type, data }) => {
        const title = type === 'note' ? data.title : data.text
        console.log(`   ✓ ${refId} → [${type.toUpperCase()}] ${title}`)
        console.log('      Full data:', { type, title: data.title, text: data.text, id: data.id })
      })

      if (results.length === 0) return

      // Transform text nodes to badges
      editor.update(() => {
        try {
          const root = $getRoot()
          const textNodes = root.getAllTextNodes()

          // Collect transformations first, then apply them
          const transformations = []

          textNodes.forEach(textNode => {
            const text = textNode.getTextContent()

            results.forEach(({ refId, type: itemType, data }) => {
              // Check if text contains [refId] with brackets
              const bracketedRefId = `[${refId}]`
              if (!text.includes(bracketedRefId)) return

              // Check if this text is already part of a RefIdNode
              const parent = textNode.getParent()
              if ($isRefIdNode(parent)) return

              // Match [refid] including the brackets
              const regex = new RegExp(`\\[${refId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`)
              const match = text.match(regex)

              if (match) {
                const matchStart = match.index
                const matchEnd = matchStart + match[0].length

                // Split the text node around [refid]
                const beforeText = text.substring(0, matchStart)
                const afterText = text.substring(matchEnd)

                const title = itemType === 'note' ? data.title : data.text
                const noteType = itemType === 'note' ? data.note_type : null
                const diagramSvg = itemType === 'note' && data.note_type === 'diagram' ? data.diagram_svg : null
                const mindmapSvg = itemType === 'note' && data.note_type === 'mindmap' ? data.mindmap_svg : null

                // Store the transformation
                transformations.push({
                  textNode,
                  refId,
                  itemType,
                  title,
                  noteType,
                  diagramSvg,
                  mindmapSvg,
                  beforeText,
                  afterText
                })
              }
            })
          })

          // Now apply all transformations
          transformations.forEach(({ textNode, refId, itemType, title, noteType, diagramSvg, mindmapSvg, beforeText, afterText }) => {
            // Skip if node was already replaced in a previous transformation
            try {
              if (!textNode.isAttached()) return

              // Create the RefIdNode badge
              const refIdNode = $createRefIdNode(refId, itemType, title, onNavigate, noteType, diagramSvg, mindmapSvg)

              // Insert nodes in order: before text, badge, after text
              if (beforeText && afterText) {
                // Split into: beforeText | badge | afterText
                const before = $createTextNode(beforeText)
                const after = $createTextNode(afterText)

                textNode.replace(before)
                before.insertAfter(refIdNode)
                refIdNode.insertAfter(after)
              } else if (beforeText) {
                // Split into: beforeText | badge
                const before = $createTextNode(beforeText)

                textNode.replace(before)
                before.insertAfter(refIdNode)
              } else if (afterText) {
                // Split into: badge | afterText
                const after = $createTextNode(afterText)

                textNode.replace(refIdNode)
                refIdNode.insertAfter(after)
              } else {
                // Just the badge
                textNode.replace(refIdNode)
              }

              console.log(`✨ Transformed [${refId}] → Badge`)
            } catch (err) {
              console.error(`Failed to transform ${refId}:`, err)
            }
          })
        } catch (error) {
          console.error('Error in editor.update:', error)
        }
      }, {
        onUpdate: () => {
          // Prevent recursive updates
        },
        skipTransforms: true
      })
    }

    // Debounce the transformation to avoid excessive lookups
    let timeoutId
    const debouncedTransform = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(transformRefIds, 500)
    }

    // Listen for editor updates
    const removeUpdateListener = editor.registerUpdateListener(() => {
      debouncedTransform()
    })

    return () => {
      removeUpdateListener()
      clearTimeout(timeoutId)
    }
  }, [editor, onNavigate])

  return null
}
