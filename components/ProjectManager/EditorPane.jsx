import { useState, useRef, useEffect } from 'react'
import { ChatMessage } from './shared/ChatMessage'
import { LoadingSpinner } from './shared/LoadingSpinner'
import { useOpenAI } from '../../useOpenAI'
import { Tooltip } from './shared/Tooltip'

export const EditorPane = ({
  activeSection,
  onSaveContent,
  onExport
}) => {
  const [editorText, setEditorText] = useState(activeSection?.content || "")
  const { ask, history, loading, regenerate } = useOpenAI()
  const chatEndRef = useRef(null)
  const [isChatMinimized, setIsChatMinimized] = useState(false)

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [history])

  const handleSave = () => {
    onSaveContent(editorText)
  }

  const handleExport = (format) => {
    onExport(activeSection.name, editorText, format)
  }

  if (!activeSection) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a section to start editing
      </div>
    )
  }

  return (
    <div className="flex flex-row h-full w-full overflow-hidden relative">
      {/* Toggle Button - always visible in top-right */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setIsChatMinimized(!isChatMinimized)}
          className="text-gray-500 hover:text-gray-700 bg-white border rounded-full shadow p-2"
          title={isChatMinimized ? 'Show AI Assistant' : 'Hide AI Assistant'}
        >
          {isChatMinimized ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* Content Editor */}
      <div className={`flex flex-col transition-all duration-300 ${isChatMinimized ? 'w-full' : 'w-2/3'} p-6`}> 
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Editing: {activeSection.name}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save Changes
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
        <textarea
          className="w-full h-full min-h-[300px] border rounded-lg p-4 font-mono resize-none"
          value={editorText}
          onChange={(e) => setEditorText(e.target.value)}
          placeholder="Write your content here..."
        />
      </div>

      {/* AI Assistant */}
      <div className={`relative flex flex-col bg-white/80 border-l transition-all duration-300 ${isChatMinimized ? 'hidden' : 'w-1/3'} h-full overflow-hidden`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">AI Assistant</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {history.map((message, index) => (
              <ChatMessage
                key={index}
                message={message}
                onRegenerate={message.role === 'assistant' ? regenerate : undefined}
              />
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask AI about your content..."
              className="flex-1 border rounded-lg px-4 py-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const userQuestion = e.target.value;
                  ask(`Regarding this content:\n\n${editorText}\n\nQuestion: ${userQuestion}`, {
                    displayMessage: userQuestion
                  });
                  e.target.value = '';
                }
              }}
            />
            <Tooltip text="Ask AI about this section's content">
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Ask AI about your content..."]');
                  const userQuestion = input.value.trim();
                  if (userQuestion) {
                    ask(`Regarding this content:\n\n${editorText}\n\nQuestion: ${userQuestion}`, {
                      displayMessage: userQuestion
                    });
                    input.value = '';
                  }
                }}
                disabled={loading}
                className={`px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center space-x-2 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <span>Thinking</span>
                    <LoadingSpinner />
                  </>
                ) : (
                  'Ask AI'
                )}
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  )
} 