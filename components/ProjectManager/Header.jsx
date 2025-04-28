import { Tooltip } from './shared/Tooltip'

export const Header = ({ 
  user, 
  onBack, 
  projectName, 
  onAIAssistantClick 
}) => {
  return (
    <div className="bg-white/80 border-b border-gray-200 px-6 py-4 rounded-t-lg">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Projects
          </button>
          <h1 className="text-2xl font-bold">{projectName}</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user?.email}
          </span>
          <Tooltip text="Ask AI about your entire project - it can see all sections and chapters">
            <button
              onClick={onAIAssistantClick}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Project AI Assistant
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  )
} 