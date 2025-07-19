import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { ChatMessage } from './shared/ChatMessage'
import { LoadingSpinner } from './shared/LoadingSpinner'
import { useOpenAI } from '../../useOpenAI'
import { Tooltip } from './shared/Tooltip'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextStyle from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import { Extension, Mark } from '@tiptap/core'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'

const fonts = [
  { label: 'Default', value: '' },
  { label: 'Serif', value: 'serif' },
  { label: 'Sans Serif', value: 'sans-serif' },
  { label: 'Monospace', value: 'monospace' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Garamond', value: 'Garamond, serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Courier New', value: 'Courier New, monospace' },
  { label: 'Times New Roman', value: 'Times New Roman, serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
  { label: 'Palatino', value: 'Palatino, serif' },
  { label: 'Bookman', value: 'Bookman, serif' },
  { label: 'Century Gothic', value: 'Century Gothic, sans-serif' },
  { label: 'Calibri', value: 'Calibri, sans-serif' },
  { label: 'Cambria', value: 'Cambria, serif' },
  { label: 'Consolas', value: 'Consolas, monospace' },
  { label: 'Lucida Console', value: 'Lucida Console, monospace' },
  { label: 'Lucida Sans Unicode', value: 'Lucida Sans Unicode, sans-serif' }
]

const fontSizes = [
  { label: 'Small', value: '0.875em' },
  { label: 'Normal', value: '1em' },
  { label: 'Large', value: '1.25em' },
  { label: 'X-Large', value: '1.5em' },
  { label: 'XX-Large', value: '2em' },
]

// Custom FontSize extension for TipTap v2
const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {}
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize:
        size =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize: size }).run()
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize: null }).run()
        },
    }
  },
})

// Custom Comment mark extension
const CommentMark = Mark.create({
  name: 'comment',
  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },
  addAttributes() {
    return {
      comment: {
        default: null,
        parseHTML: element => element.getAttribute('data-comment'),
        renderHTML: attributes => {
          if (!attributes.comment) return {}
          return { 'data-comment': attributes.comment }
        },
      },
    }
  },
  parseHTML() {
    return [{ tag: 'span[data-comment]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, style: 'background: #fffbe6; border-bottom: 1px dotted #eab308; cursor: pointer;' }, 0]
  },
})

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="border-b p-2 flex flex-wrap gap-1 items-center">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
        title="Bold"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 12h8a4 4 0 100-8H6v8zm0 0h8a4 4 0 110 8H6v-8z" />
        </svg>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
        title="Italic"
      >
        <span style={{ fontStyle: 'italic', fontWeight: 600, fontSize: '1.25em', fontFamily: 'serif', transform: 'skew(-12deg)' }}>I</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('strike') ? 'bg-gray-200' : ''}`}
        title="Strike"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
        title="Heading 1"
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
        title="Heading 2"
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}`}
        title="Heading 3"
      >
        H3
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
        title="Bullet List"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
        title="Ordered List"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20h14M7 12h14M7 4h14M3 20h.01M3 12h.01M3 4h.01" />
        </svg>
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('highlight') ? 'bg-yellow-200' : ''}`}
        title="Highlight"
      >
        <span className="relative flex flex-col items-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M16.5 3.5l4 4-12 12-4 1 1-4 12-12z" fill="#fbbf24" stroke="#444" strokeWidth="1.5" />
            <rect x="4" y="19" width="16" height="3" rx="1.5" fill="#fde68a" stroke="none" />
          </svg>
        </span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('underline') ? 'bg-blue-200' : ''}`}
        title="Underline"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 4v6a6 6 0 0012 0V4" />
          <line x1="4" y1="20" x2="20" y2="20" stroke="#2563eb" strokeWidth="2" />
        </svg>
      </button>
      <button
        onClick={() => {
          const selection = editor.state.selection;
          if (selection.empty) return;
          const hasComment = editor.isActive('comment');
          if (hasComment) {
            editor.chain().focus().unsetMark('comment').run();
            return;
          }
          const comment = window.prompt('Enter your comment:');
          if (comment) {
            editor.chain().focus().setMark('comment', { comment }).run();
          }
        }}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('comment') ? 'bg-yellow-100' : ''}`}
        title={editor.isActive('comment') ? 'Remove Comment' : 'Add Comment'}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V10a2 2 0 012-2h2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 3H9a2 2 0 00-2 2v4a2 2 0 002 2h6a2 2 0 002-2V5a2 2 0 00-2-2z" />
        </svg>
      </button>
      <select
        className="border rounded p-1"
        onChange={e => editor.chain().focus().setFontSize(e.target.value).run()}
        value={editor.getAttributes('textStyle').fontSize || '1em'}
        title="Font Size"
      >
        {fontSizes.map(size => (
          <option key={size.value} value={size.value}>{size.label}</option>
        ))}
      </select>
      <select
        className="border rounded p-1"
        onChange={e => editor.chain().focus().setFontFamily(e.target.value).run()}
        value={editor.getAttributes('textStyle').fontFamily || ''}
        title="Font Family"
      >
        {fonts.map(font => (
          <option key={font.value} value={font.value}>
            {font.value ? font.label : (editor.getAttributes('textStyle').fontFamily || 'Default')}
          </option>
        ))}
      </select>
    </div>
  )
}

export const EditorPane = forwardRef(({ activeSection, onSaveContent, onExport }, ref) => {
  const [editorText, setEditorText] = useState(activeSection?.content || "")
  const { ask, history, loading, regenerate } = useOpenAI()
  const chatEndRef = useRef(null)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [pendingComment, setPendingComment] = useState('')
  const [commentSelection, setCommentSelection] = useState(null)

  // TipTap editor instance
  const getInitialContent = () => {
    if (activeSection?.jsonContent) {
      if (typeof activeSection.jsonContent === 'object') return activeSection.jsonContent;
      try {
        return JSON.parse(activeSection.jsonContent);
      } catch {
        return activeSection.content || '';
      }
    }
    return activeSection?.content || '';
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
        horizontalRule: false,
        blockquote: false,
        bulletList: true,
        orderedList: true
      }),
      TextStyle,
      FontFamily,
      FontSize,
      Highlight,
      Underline,
      CommentMark
    ],
    content: getInitialContent(),
    onUpdate: ({ editor }) => {
      setEditorText(editor.getHTML());
    },
  })

  // Add styles for the editor
  useEffect(() => {
    if (editor) {
      editor.view.dom.style.cssText = `
        .ProseMirror {
          min-height: 200px;
          font-size: 1.1em;
          line-height: 1.6;
        }
      `
    }
  }, [editor])

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [history])

  // Add cleanup effect to save on unmount
  useEffect(() => {
    return () => {
      // Auto-save without showing confirmation
      if (editor) {
        onSaveContent({ html: editor.getHTML(), json: editor.getJSON() }, false)
      }
    }
  }, []) // Empty dependency array to run only on unmount

  const handleSave = () => {
    // Manual save with confirmation
    if (editor) {
      onSaveContent({ html: editor.getHTML(), json: editor.getJSON() }, true)
    }
  }

  const handleExport = (format) => {
    onExport(activeSection.name, editorText, format)
  }

  // Tooltip for comments
  useEffect(() => {
    let hideTimeout = null;
    const handler = (e) => {
      const target = e.target.closest('span[data-comment]');
      let tooltip = document.getElementById('comment-tooltip');
      if (target && target.getAttribute('data-comment')) {
        if (!tooltip) {
          tooltip = document.createElement('div');
          tooltip.id = 'comment-tooltip';
          tooltip.style.position = 'fixed';
          tooltip.style.background = '#fffbe6';
          tooltip.style.color = '#222';
          tooltip.style.padding = '10px 18px';
          tooltip.style.borderRadius = '8px';
          tooltip.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)';
          tooltip.style.fontWeight = '500';
          tooltip.style.fontSize = '1em';
          tooltip.style.zIndex = 1000;
          tooltip.style.border = '1.5px solid #eab308';
          tooltip.style.textShadow = 'none';
          document.body.appendChild(tooltip);
        }
        tooltip.textContent = target.getAttribute('data-comment');
        const rect = target.getBoundingClientRect();
        tooltip.style.top = `${rect.bottom + 6}px`;
        tooltip.style.left = `${rect.left}px`;
        tooltip.style.display = 'block';
        // Add click-to-edit
        tooltip.onclick = () => {
          const currentComment = target.getAttribute('data-comment') || '';
          const newComment = window.prompt('Edit comment:', currentComment);
          if (newComment !== null && newComment !== currentComment) {
            const view = editor.view;
            const pos = view.posAtDOM(target, 0);
            editor.chain().focus().setTextSelection({ from: pos, to: pos + target.textContent.length }).setMark('comment', { comment: newComment }).run();
          }
        };
        // Prevent hiding when mouse is over tooltip
        tooltip.onmouseenter = () => {
          if (hideTimeout) clearTimeout(hideTimeout);
        };
        tooltip.onmouseleave = () => {
          tooltip.style.display = 'none';
        };
      } else if (tooltip) {
        if (hideTimeout) clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
          tooltip.style.display = 'none';
          tooltip.onclick = null;
          tooltip.onmouseenter = null;
          tooltip.onmouseleave = null;
        }, 250);
      }
    };
    document.addEventListener('mousemove', handler);
    return () => {
      document.removeEventListener('mousemove', handler);
      const tooltip = document.getElementById('comment-tooltip');
      if (tooltip) tooltip.remove();
    };
  }, [editor]);

  useImperativeHandle(ref, () => ({
    getContent: () => editor?.getHTML() || '',
    setContent: (newContent) => {
      if (editor) editor.commands.setContent(newContent)
    }
  }), [editor]);

  if (!activeSection) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a section to start editing
      </div>
    )
  }

  return (
    <div className="flex flex-row h-full w-full overflow-hidden relative">
      {/* Content Editor */}
      <div className="flex flex-col flex-1 transition-all duration-300 p-6"> 
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Editing: {activeSection.name}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium rounded-lg group bg-gradient-to-r from-emerald-300 via-teal-200 to-orange-200 group-hover:from-emerald-300 group-hover:via-teal-200 group-hover:to-orange-200 focus:ring-4 focus:outline-none focus:ring-emerald-200"
            >
              <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent text-gray-900 group-hover:text-gray-900">
                Save Changes
              </span>
            </button>
            <div className="relative group">
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                Export
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
                <button
                  onClick={() => handleExport('md')}
                  className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                >
                  Export as Markdown
                </button>
                <button
                  onClick={() => handleExport('txt')}
                  className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                >
                  Export as Text
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* TipTap Editor */}
        <div className="w-full min-h-[300px] border rounded-lg bg-white group">
          <div className="sticky top-0 z-10 bg-white border-b">
            <MenuBar editor={editor} />
          </div>
          <div className="p-4">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      {false && showCommentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-gradient-to-r from-orange-200 via-emerald-100 to-teal-100 rounded-xl shadow-xl p-6 min-w-[320px] max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Add Comment</h3>
            <textarea
              className="w-full border rounded-lg p-2 mb-4 focus:ring-2 focus:ring-emerald-300"
              rows={3}
              value={pendingComment}
              onChange={e => setPendingComment(e.target.value)}
              placeholder="Type your comment here..."
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                onClick={() => setShowCommentModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-gradient-to-r from-orange-400 via-emerald-300 to-teal-200 text-white font-semibold shadow hover:scale-105 transition-transform"
                onClick={() => {
                  if (pendingComment.trim()) {
                    editor.chain().focus().setMark('comment', { comment: pendingComment }).run();
                  }
                  setShowCommentModal(false);
                }}
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}) 