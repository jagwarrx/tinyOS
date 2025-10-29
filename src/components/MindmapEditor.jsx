import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, FileText, Plus, Minus } from 'lucide-react';
import { Transformer } from 'markmap-lib';
import { Markmap, loadCSS, loadJS } from 'markmap-view';
import { Toolbar } from 'markmap-toolbar';
import 'markmap-toolbar/dist/style.css';

const DEFAULT_MARKDOWN = `# My Mind Map

## Branch 1

## Branch 2

## Branch 3
`;

export default function MindmapEditor({ note, onSave, onClose }) {
  const [markdown, setMarkdown] = useState(note?.mindmap_markdown || DEFAULT_MARKDOWN);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(true); // Start collapsed
  const svgRef = useRef(null);
  const markmapRef = useRef(null);
  const toolbarRef = useRef(null);
  const activeControlsRef = useRef(null); // Track currently visible controls

  // Initialize Markmap and Toolbar (once)
  useEffect(() => {
    if (!svgRef.current) return;

    // Create Markmap instance
    markmapRef.current = Markmap.create(svgRef.current, {
      duration: 500,
      maxWidth: 300,
      initialExpandLevel: -1, // Expand all by default
    });

    // Create toolbar
    toolbarRef.current = Toolbar.create(markmapRef.current);
    toolbarRef.current.attach(svgRef.current.parentElement);

    // Style the toolbar
    const toolbarEl = toolbarRef.current.render();
    if (toolbarEl) {
      toolbarEl.style.position = 'absolute';
      toolbarEl.style.bottom = '10px';
      toolbarEl.style.right = '10px';
    }

    return () => {
      // Cleanup toolbar
      if (toolbarRef.current) {
        // markmap-toolbar uses dispose() for cleanup
        if (typeof toolbarRef.current.dispose === 'function') {
          toolbarRef.current.dispose();
        }
        toolbarRef.current = null;
      }
      // Cleanup markmap
      if (markmapRef.current) {
        if (typeof markmapRef.current.destroy === 'function') {
          markmapRef.current.destroy();
        }
        markmapRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Update mindmap when markdown changes
  useEffect(() => {
    if (!markmapRef.current) return;

    // Clean up any existing control containers from previous renders
    const existingControls = document.querySelectorAll('[data-mindmap-controls]');
    existingControls.forEach(el => el.remove());

    // Reset active controls ref
    activeControlsRef.current = null;

    // Remove click handler flags from all text nodes to allow re-initialization
    if (svgRef.current) {
      const allNodes = svgRef.current.querySelectorAll('[style*="cursor: pointer"]');
      allNodes.forEach(node => {
        delete node.__hasClickHandler;
      });
    }

    // Create transformer
    const transformer = new Transformer();

    // Transform markdown to markmap data
    const { root, features } = transformer.transform(markdown);

    // Load assets if needed
    const { styles, scripts } = transformer.getUsedAssets(features);
    if (styles) loadCSS(styles);
    if (scripts) loadJS(scripts, { getMarkmap: () => markmapRef.current });

    // Render the mindmap
    markmapRef.current.setData(root);
    markmapRef.current.fit();

    // Store all created control containers for cleanup
    const controlsContainers = [];

    // Add click handlers to nodes for inline editing
    // Use MutationObserver to wait for nodes to actually render
    const setupClickHandlers = () => {
      if (!svgRef.current) {
        console.warn('⚠️ svgRef.current is null');
        return false;
      }

      console.log('🔍 Setting up click handlers for mindmap nodes');

      // Try multiple selectors to find text nodes
      let textNodes;

      // First try: SVG text elements
      textNodes = svgRef.current.querySelectorAll('g.markmap-node text');
      if (textNodes.length > 0) {
        console.log('📝 Found', textNodes.length, 'SVG text elements (markmap-node selector)');
      }

      // Second try: any text elements
      if (!textNodes || textNodes.length === 0) {
        textNodes = svgRef.current.querySelectorAll('text');
        if (textNodes.length > 0) {
          console.log('📝 Found', textNodes.length, 'SVG text elements (fallback selector)');
        }
      }

      // Third try: foreignObject with div/span (HTML text)
      if (!textNodes || textNodes.length === 0) {
        textNodes = svgRef.current.querySelectorAll('foreignObject div, foreignObject span');
        if (textNodes.length > 0) {
          console.log('📝 Found', textNodes.length, 'HTML text elements (foreignObject)');
        }
      }

      // Fourth try: any div/span with text content
      if (!textNodes || textNodes.length === 0) {
        textNodes = svgRef.current.querySelectorAll('div, span');
        if (textNodes.length > 0) {
          console.log('📝 Found', textNodes.length, 'HTML elements');
        }
      }

      if (!textNodes || textNodes.length === 0) {
        console.warn('⚠️ No text nodes found yet, will retry...');
        return false;
      }

      textNodes.forEach((textNode, index) => {
        // Skip if already set up
        if (textNode.__hasClickHandler) return;

        textNode.style.cursor = 'pointer';

        // Create control buttons container
        const controlsContainer = document.createElement('div');
        controlsContainer.setAttribute('data-mindmap-controls', 'true'); // Mark for cleanup
        controlsContainer.style.position = 'absolute';
        controlsContainer.style.display = 'none';
        controlsContainer.style.zIndex = '1000';
        controlsContainer.style.gap = '4px';
        controlsContainer.style.pointerEvents = 'auto';
        controlsContainer.style.flexDirection = 'row';

        // Add button (+) with Lucide Plus icon
        const addBtn = document.createElement('button');
        addBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`;
        addBtn.style.cssText = `
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--color-semantic-success);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          margin-right: 4px;
        `;
        addBtn.title = 'Add child node';

        // Delete button (-) with Lucide Minus icon
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>`;
        deleteBtn.style.cssText = `
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--color-semantic-error);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        `;
        deleteBtn.title = 'Delete node';

        controlsContainer.appendChild(addBtn);
        controlsContainer.appendChild(deleteBtn);
        document.body.appendChild(controlsContainer);

        // Track for cleanup
        controlsContainers.push(controlsContainer);

        // Click to toggle controls visibility
        const toggleControls = (e) => {
          e.stopPropagation();

          // Hide any currently visible controls
          if (activeControlsRef.current && activeControlsRef.current !== controlsContainer) {
            activeControlsRef.current.style.display = 'none';
          }

          // Toggle this control
          if (controlsContainer.style.display === 'flex') {
            controlsContainer.style.display = 'none';
            activeControlsRef.current = null;
          } else {
            const rect = textNode.getBoundingClientRect();
            controlsContainer.style.display = 'flex';
            controlsContainer.style.left = `${rect.right + 8}px`;
            controlsContainer.style.top = `${rect.top + (rect.height / 2) - 12}px`;
            activeControlsRef.current = controlsContainer;
          }
        };

        const hideControls = () => {
          controlsContainer.style.display = 'none';
          if (activeControlsRef.current === controlsContainer) {
            activeControlsRef.current = null;
          }
        };

        textNode.addEventListener('click', toggleControls);

        // Add node handler
        addBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          hideControls();

          const nodeText = textNode.textContent?.trim();
          if (!nodeText) return;

          const lines = markdown.split('\n');
          let matchedLineIndex = -1;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const cleanedLine = line
              .replace(/^#+\s*/, '')
              .replace(/^\s*[-*]\s*/, '')
              .trim();

            if (cleanedLine === nodeText) {
              matchedLineIndex = i;
              break;
            }
          }

          if (matchedLineIndex >= 0) {
            const line = lines[matchedLineIndex];
            const indent = line.match(/^\s*/)[0].length;

            // Determine if it's a heading or bullet
            const isHeading = line.match(/^#+/);

            let newLine;
            if (isHeading) {
              // Add as sub-bullet
              newLine = ' '.repeat(indent) + '- New item';
            } else {
              // Add as child bullet (more indented)
              newLine = ' '.repeat(indent + 2) + '- New item';
            }

            lines.splice(matchedLineIndex + 1, 0, newLine);
            setMarkdown(lines.join('\n'));
          }
        });

        // Delete node handler
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          hideControls();

          const nodeText = textNode.textContent?.trim();
          if (!nodeText) return;

          const lines = markdown.split('\n');
          let matchedLineIndex = -1;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const cleanedLine = line
              .replace(/^#+\s*/, '')
              .replace(/^\s*[-*]\s*/, '')
              .trim();

            if (cleanedLine === nodeText) {
              matchedLineIndex = i;
              break;
            }
          }

          if (matchedLineIndex >= 0) {
            // Don't delete the root node
            if (matchedLineIndex === 0 && lines[0].match(/^#\s/)) {
              alert('Cannot delete the root node');
              return;
            }

            lines.splice(matchedLineIndex, 1);
            setMarkdown(lines.join('\n'));
          }
        });

        // Double-click for inline editing
        let clickTimer = null;
        const dblClickHandler = (e) => {
          e.preventDefault();
          e.stopPropagation();

          // Clear single click timer if double-click detected
          if (clickTimer) {
            clearTimeout(clickTimer);
            clickTimer = null;
          }

          hideControls();

          const nodeText = textNode.textContent?.trim();
          if (!nodeText) return;

          // Find the line in markdown
          const lines = markdown.split('\n');
          let matchedLineIndex = -1;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const cleanedLine = line
              .replace(/^#+\s*/, '')
              .replace(/^\s*[-*]\s*/, '')
              .trim();

            if (cleanedLine === nodeText) {
              matchedLineIndex = i;
              break;
            }
          }

          if (matchedLineIndex >= 0) {
            // Create inline input
            const input = document.createElement('input');
            input.type = 'text';
            input.value = nodeText;
            input.style.cssText = `
              font-family: inherit;
              font-size: inherit;
              color: var(--color-fg-primary);
              background: var(--color-bg-elevated);
              border: 2px solid var(--color-border-focus);
              border-radius: 4px;
              padding: 2px 6px;
              outline: none;
              width: ${Math.max(100, nodeText.length * 8)}px;
            `;

            const rect = textNode.getBoundingClientRect();
            input.style.position = 'absolute';
            input.style.left = `${rect.left}px`;
            input.style.top = `${rect.top}px`;
            input.style.zIndex = '1001';

            document.body.appendChild(input);
            input.focus();
            input.select();

            const saveEdit = () => {
              const newText = input.value.trim();
              if (newText && newText !== nodeText) {
                const line = lines[matchedLineIndex];
                const indent = line.match(/^\s*/)[0].length;

                let prefix = '';
                if (line.match(/^#+/)) {
                  prefix = line.match(/^#+/)[0] + ' ';
                } else if (line.match(/^\s*-/)) {
                  prefix = ' '.repeat(indent) + '- ';
                } else if (line.match(/^\s*\*/)) {
                  prefix = ' '.repeat(indent) + '* ';
                }

                lines[matchedLineIndex] = prefix + newText;
                setMarkdown(lines.join('\n'));
              }
              document.body.removeChild(input);
            };

            input.addEventListener('blur', saveEdit);
            input.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                saveEdit();
              } else if (e.key === 'Escape') {
                document.body.removeChild(input);
              }
            });
          }
        };

        textNode.addEventListener('dblclick', dblClickHandler, true);
        textNode.__hasClickHandler = true; // Mark as set up
      });

      console.log('✅ Click handlers attached to', textNodes.length, 'nodes');
      return true;
    };

    // Try multiple times with increasing delays to ensure nodes are rendered
    const retrySetup = (attempt = 0, maxAttempts = 8) => {
      const delay = attempt === 0 ? 300 : 200 * attempt; // 300ms, 200ms, 400ms, 600ms, 800ms, 1000ms, 1200ms, 1400ms

      setTimeout(() => {
        console.log(`🔄 Attempting to setup click handlers (attempt ${attempt + 1}/${maxAttempts})...`);
        const success = setupClickHandlers();

        if (!success && attempt < maxAttempts - 1) {
          console.log(`⏳ Retrying setup (attempt ${attempt + 2}/${maxAttempts})...`);
          retrySetup(attempt + 1, maxAttempts);
        } else if (success) {
          console.log(`✅ Click handlers setup successful on attempt ${attempt + 1}`);
        } else {
          console.warn(`❌ Failed to setup click handlers after ${maxAttempts} attempts`);
        }
      }, delay);
    };

    retrySetup();

    // Add global click listener to hide controls when clicking outside
    const handleGlobalClick = (e) => {
      // Hide controls if clicking outside of any node or control button
      if (activeControlsRef.current &&
          !e.target.closest('.markmap-node') &&
          !e.target.closest('button')) {
        activeControlsRef.current.style.display = 'none';
        activeControlsRef.current = null;
      }
    };

    document.addEventListener('click', handleGlobalClick);

    // Cleanup function
    return () => {
      document.removeEventListener('click', handleGlobalClick);

      // Remove all control containers from DOM
      controlsContainers.forEach(container => {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      });
    };
  }, [markdown]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Generate SVG for preview
      const svgElement = svgRef.current;
      const svgString = new XMLSerializer().serializeToString(svgElement);

      await onSave({
        mindmap_markdown: markdown,
        mindmap_svg: svgString,
      });
    } catch (error) {
      console.error('Error saving mindmap:', error);
      alert('Failed to save mindmap. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-primary border-2 border-syntax-blue rounded-lg w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-syntax-blue">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              {note?.title || 'New Mindmap'}
            </h2>
            <p className="text-sm text-text-secondary">
              Edit markdown on the left to update the mindmap
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-syntax-blue text-bg-primary rounded hover:bg-opacity-80 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save & Close'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-secondary rounded"
            >
              <X size={20} className="text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Markdown Editor (Collapsible) */}
          {!isEditorCollapsed && (
            <div className="w-1/2 flex flex-col border-r border-syntax-blue">
              <div className="p-3 bg-bg-secondary border-b border-syntax-blue flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    Markdown Editor
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Use # for levels, - for bullets, indent for hierarchy
                  </p>
                </div>
                <button
                  onClick={() => setIsEditorCollapsed(true)}
                  className="p-1.5 hover:bg-bg-tertiary rounded text-text-secondary"
                  title="Hide editor"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="flex-1 p-4 bg-bg-primary text-text-primary font-mono text-sm resize-none focus:outline-none"
                placeholder="# My Mind Map&#10;&#10;## Branch 1&#10;- Point 1&#10;- Point 2"
              />
            </div>
          )}

          {/* Right: Mindmap Preview */}
          <div className={`${isEditorCollapsed ? 'w-full' : 'w-1/2'} flex flex-col bg-white transition-all`}>
            <div className="p-3 bg-bg-secondary border-b border-syntax-blue flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  Mindmap Preview
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Click nodes to expand/collapse, use toolbar to zoom/pan
                </p>
              </div>
              {isEditorCollapsed && (
                <button
                  onClick={() => setIsEditorCollapsed(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-syntax-blue text-white rounded hover:bg-opacity-80 text-xs"
                  title="Show markdown editor"
                >
                  <FileText size={14} />
                  Edit Markdown
                </button>
              )}
            </div>
            <div className="flex-1 relative overflow-hidden" style={{ minHeight: '400px' }}>
              <svg
                ref={svgRef}
                className="w-full h-full"
                style={{ background: 'white', display: 'block' }}
                width="100%"
                height="100%"
              />
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="p-3 bg-bg-secondary border-t border-syntax-blue text-xs text-text-secondary">
          <strong>Tips:</strong> <span className="text-text-primary">Click</span> any node to show
          <span className="text-syntax-green font-bold"> +</span> (add child) and
          <span className="text-syntax-red font-bold"> −</span> (delete) controls.
          <span className="text-text-primary">Double-click</span> to edit inline.
          Use "Edit Markdown" for advanced editing.
        </div>
      </div>
    </div>
  );
}
