export const ChatMessage = ({ message, onRegenerate }) => {
  const isAI = message.role === 'assistant'
  return (
    <div className={`p-4 rounded-lg mb-4 ${isAI ? 'bg-purple-50 border border-purple-100' : 'bg-blue-50 border border-blue-100'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center mb-2">
          <span className={`text-sm font-medium ${isAI ? 'text-purple-700' : 'text-blue-700'}`}>
            {isAI ? 'AI Assistant' : 'You'}
          </span>
        </div>
        {isAI && onRegenerate && (
          <button
            onClick={onRegenerate}
            className="text-purple-600 hover:text-purple-700 p-1 rounded-full hover:bg-purple-100 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>
      <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
    </div>
  )
} 