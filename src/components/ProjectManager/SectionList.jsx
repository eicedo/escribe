import { useState } from 'react'
import { LoadingSpinner } from './shared/LoadingSpinner'

export const SectionList = ({
  sections,
  activeSectionId,
  onSectionSelect,
  onSectionDelete,
  onSectionRename,
  loadingStates,
  validationErrors,
  setValidationErrors
}) => {
  const [isMinimized, setIsMinimized] = useState(false)
  const [sectionName, setSectionName] = useState("")
  const [editingSectionName, setEditingSectionName] = useState(null)

  const handleAddSection = async () => {
    if (!sectionName.trim()) {
      setValidationErrors(prev => ({ ...prev, sectionName: 'Section name is required' }))
      return
    }

    // Add section logic here
    setSectionName("")
  }

  return (
    <div className={`${isMinimized ? 'w-12' : 'w-64'} transition-all duration-300 border-r bg-gray-50 flex flex-col`}>
      <div className="p-4 border-b bg-white flex items-center justify-between">
        {!isMinimized && <h2 className="text-lg font-semibold">Sections</h2>}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-gray-500 hover:text-gray-700"
        >
          {isMinimized ? (
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

      {!isMinimized && (
        <>
          <div className="p-4 space-y-2">
            <input
              type="text"
              placeholder="New section name"
              value={sectionName}
              onChange={(e) => {
                setSectionName(e.target.value)
                if (validationErrors.sectionName) {
                  setValidationErrors(prev => ({ ...prev, sectionName: '' }))
                }
              }}
              className={`border rounded p-2 w-full ${
                validationErrors.sectionName ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
              }`}
            />
            {validationErrors.sectionName && (
              <p className="text-red-500 text-sm">{validationErrors.sectionName}</p>
            )}
            <button
              onClick={handleAddSection}
              disabled={loadingStates.addSection}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loadingStates.addSection ? (
                <>
                  Adding... <LoadingSpinner />
                </>
              ) : (
                'Add Section'
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {sections?.map((section) => (
                <div
                  key={section.id}
                  className={`p-2 rounded cursor-pointer ${
                    section.id === activeSectionId
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => onSectionSelect(section)}
                >
                  {editingSectionName === section.id ? (
                    <input
                      type="text"
                      value={section.name}
                      onChange={(e) => onSectionRename(section.id, e.target.value)}
                      onBlur={() => setEditingSectionName(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setEditingSectionName(null)
                        }
                      }}
                      className="w-full p-1 border rounded"
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <span>{section.name}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingSectionName(section.id)
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onSectionDelete(section.id)
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
} 