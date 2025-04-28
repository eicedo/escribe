import { useEffect, useState, useRef } from 'react'
import { useOpenAI } from '../useOpenAI'
import { supabase } from '../supabaseClient'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Activity, Users, FileText, Plus } from 'lucide-react'

// Add Tooltip component at the top level
const Tooltip = ({ children, text }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        {text}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  )
}

// Enhanced loading spinner with pulse effect
const LoadingSpinner = () => (
  <div className="flex items-center space-x-2">
    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
    <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-75"></div>
    <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-150"></div>
  </div>
)

// Add ChatMessage component for better message display
const ChatMessage = ({ message, onRegenerate }) => {
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
          <Tooltip text="Regenerate response">
            <button
              onClick={onRegenerate}
              className="text-purple-600 hover:text-purple-700 p-1 rounded-full hover:bg-purple-100 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </Tooltip>
        )}
      </div>
      <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
    </div>
  )
}

// Add Modal component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-[80%] max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex justify-end p-4">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function ProjectManager({ user }) {
  console.log('[ProjectManager] user:', user);
  console.log('[ProjectManager] Component mounted with user:', user)

  const [projects, setProjects] = useState([])
  const [projectName, setProjectName] = useState("")
  const [sectionName, setSectionName] = useState("")
  const [editingProjectName, setEditingProjectName] = useState(null)
  const [editingSectionName, setEditingSectionName] = useState(null)
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [activeSectionId, setActiveSectionId] = useState(null)
  const [editorText, setEditorText] = useState("")
  const textareaRef = useRef(null);
  const [loadingStates, setLoadingStates] = useState({
    create: false,
    addSection: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({
    projectName: '',
    sectionName: ''
  })
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [projectAIHistory, setProjectAIHistory] = useState([]);
  const [isAIChatMinimized, setIsAIChatMinimized] = useState(false)

  const { ask, response, loading, history, regenerate } = useOpenAI()

  useEffect(() => {
    const handleResize = () => {
      if (textareaRef.current) {
        const textareaWidth = textareaRef.current.offsetWidth;
        const windowWidth = window.innerWidth;
        if (textareaWidth > windowWidth * 0.7 && !isAIChatMinimized) {
          setIsAIChatMinimized(true);
        }
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (textareaRef.current) {
      resizeObserver.observe(textareaRef.current);
    }

    return () => {
      if (textareaRef.current) {
        resizeObserver.unobserve(textareaRef.current);
      }
    };
  }, [isAIChatMinimized]);

  useEffect(() => {
    console.log('[ProjectManager] useEffect triggered with user:', user?.id)
    let mounted = true

    const fetchProjects = async () => {
      if (!user?.id) {
        console.log('[ProjectManager] No user ID, skipping fetch')
        setIsLoading(false)
        return
      }
      
      console.log('[ProjectManager] Starting to fetch projects')
      setIsLoading(true)
      setError(null)

      try {
        console.log('[ProjectManager] Making Supabase request')
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)

        console.log('[ProjectManager] Supabase response:', { data, error })

        if (error) throw error

        if (mounted) {
          console.log('[ProjectManager] Setting projects:', data)
          setProjects(data || [])
          setIsLoading(false)
          console.log('[ProjectManager] Loading complete')
        }
      } catch (err) {
        console.error('[ProjectManager] Error loading projects:', err)
        if (mounted) {
          setError(err.message)
          setIsLoading(false)
        }
      }
    }

    fetchProjects()

    return () => {
      console.log('[ProjectManager] Cleanup - unmounting component')
      mounted = false
    }
  }, [user?.id])

  console.log('[ProjectManager] Current state:', { 
    isLoading, 
    error, 
    projectsCount: projects.length,
    user: user?.id 
  })

  const handleCreateProject = async () => {
    // Reset validation error
    setValidationErrors(prev => ({ ...prev, projectName: '' }))

    if (!projectName.trim()) {
      setValidationErrors(prev => ({ ...prev, projectName: 'Project name is required' }))
      return
    }

    setLoadingStates(prev => ({ ...prev, create: true }))
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            name: projectName,
            user_id: user.id,
            sections: [],
          },
        ])
        .select()

      if (error) {
        console.error('Error creating project:', error)
        setValidationErrors(prev => ({ ...prev, projectName: error.message }))
        return
      }

      setProjects(prev => [...prev, ...data])
      setProjectName("")
    } finally {
      setLoadingStates(prev => ({ ...prev, create: false }))
    }
  }

  const handleDeleteProject = async (id) => {
    if (!confirm("Delete this project?")) return

    setLoadingStates(prev => ({ ...prev, [id]: true }))
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting project:', error)
        return
      }

      setProjects(projects.filter((p) => p.id !== id))

      if (activeProjectId === id) {
        setActiveProjectId(null)
        setActiveSectionId(null)
        setEditorText("")
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleRenameProject = async (id, newName) => {
    if (!newName.trim()) return

    setLoadingStates(prev => ({ ...prev, [id]: true }))
    try {
      const { error } = await supabase
        .from('projects')
        .update({ name: newName })
        .eq('id', id)

      if (error) {
        console.error('Error renaming project:', error)
        return
      }

      setProjects(projects.map(p => 
        p.id === id ? { ...p, name: newName } : p
      ))
    } finally {
      setLoadingStates(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleAddSection = async () => {
    // Reset validation error
    setValidationErrors(prev => ({ ...prev, sectionName: '' }))

    if (!sectionName.trim()) {
      setValidationErrors(prev => ({ ...prev, sectionName: 'Section name is required' }))
      return
    }

    if (!activeProjectId) {
      setValidationErrors(prev => ({ ...prev, sectionName: 'Please select a project first' }))
      return
    }
    
    setLoadingStates(prev => ({ ...prev, addSection: true }))
    try {
      const newSection = { id: Date.now(), name: sectionName, content: "" }
      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProjectId
            ? { ...p, sections: [...(p.sections || []), newSection] }
            : p
        )
      )
      setSectionName("")
    } finally {
      setLoadingStates(prev => ({ ...prev, addSection: false }))
    }
  }

  const handleSaveContent = async () => {
    const updatedProjects = projects.map((p) =>
      p.id === activeProjectId
        ? {
            ...p,
            sections: p.sections.map((s) =>
              s.id === activeSectionId ? { ...s, content: editorText } : s
            ),
          }
        : p
    )

    setProjects(updatedProjects)

    const updatedProject = updatedProjects.find((p) => p.id === activeProjectId)

    const { error } = await supabase
      .from('projects')
      .update({ sections: updatedProject.sections })
      .eq('id', activeProjectId)

    if (error) {
      console.error('Failed to save to Supabase:', error)
    }
  }

  const handleSelectSection = (section) => {
    setActiveSectionId(section.id)
    setEditorText(section.content || "")
  }

  const exportSection = (name, content, format) => {
    const blob = new Blob([content], {
      type: format === 'md' ? 'text/markdown' : 'text/plain',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${name || 'untitled'}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Function to get all sections content
  const getAllSectionsContent = () => {
    const activeProject = projects.find(p => p.id === activeProjectId);
    if (!activeProject?.sections) return '';
    
    return activeProject.sections.map(section => (
      `Chapter: ${section.name}\n\n${section.content || ''}\n\n---\n\n`
    )).join('');
  };

  // Function to ask AI about the entire project
  const askProjectAI = async (question) => {
    const allContent = getAllSectionsContent();
    const context = `This is a project named "${projects.find(p => p.id === activeProjectId)?.name}". Here are all its sections:\n\n${allContent}\n\nQuestion: ${question}`;
    
    try {
      const response = await ask(context, { displayMessage: question });
      if (response.startsWith('⚠️')) {
        // Handle error response
        setProjectAIHistory(prev => [...prev, 
          { role: 'user', content: question },
          { role: 'assistant', content: response }
        ]);
      } else {
        // Handle successful response
        setProjectAIHistory(prev => [...prev, 
          { role: 'user', content: question },
          { role: 'assistant', content: response }
        ]);
      }
    } catch (error) {
      console.error('Error asking project AI:', error);
      setProjectAIHistory(prev => [...prev, 
        { role: 'user', content: question },
        { role: 'assistant', content: '⚠️ Error: Could not get response from AI' }
      ]);
    }
  };

  const handleHomeClick = () => {
    setActiveProjectId(null);
    setActiveSectionId(null);
    setEditorText("");
  };

  // Update the project list view
  const renderProjectList = () => (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">My Projects</h2>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Create New Project</h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Project name"
                      value={projectName}
                      onChange={(e) => {
                        setProjectName(e.target.value)
                        if (validationErrors.projectName) {
                          setValidationErrors(prev => ({ ...prev, projectName: '' }))
                        }
                      }}
                      className={`border rounded p-2 w-full ${
                        validationErrors.projectName ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                      }`}
                    />
                    {validationErrors.projectName && (
                      <p className="text-red-500 text-sm">{validationErrors.projectName}</p>
                    )}
                    <button
                      onClick={handleCreateProject}
                      disabled={loadingStates.create}
                      className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium rounded-lg group bg-gradient-to-r from-emerald-300 via-teal-200 to-orange-200 group-hover:from-emerald-300 group-hover:via-teal-200 group-hover:to-orange-200 focus:ring-4 focus:outline-none focus:ring-emerald-200"
                    >
                      <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent text-gray-900 group-hover:text-gray-900">
                        {loadingStates.create ? (
                          <>
                            Adding... <LoadingSpinner />
                          </>
                        ) : (
                          'Add Project'
                        )}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Projects:</h3>
                  <div className="grid gap-4">
                    {projects.map((p) => (
                      <div
                        key={p.id}
                        className={`border rounded-lg p-4 ${
                          p.id === activeProjectId ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
                        } transition-all duration-200`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            {editingProjectName === p.id ? (
                              <input
                                type="text"
                                value={p.name}
                                onChange={(e) => {
                                  setProjects(projects.map(proj =>
                                    proj.id === p.id ? { ...proj, name: e.target.value } : proj
                                  ))
                                }}
                                onBlur={() => {
                                  handleRenameProject(p.id, p.name)
                                  setEditingProjectName(null)
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleRenameProject(p.id, p.name)
                                    setEditingProjectName(null)
                                  }
                                }}
                                className="border rounded p-2 w-full"
                                autoFocus
                              />
                            ) : (
                              <div className="flex items-center justify-between">
                                <h4 className="text-xl font-semibold">{p.name}</h4>
                                <span className="text-sm text-gray-500">
                                  {p.sections?.length || 0} sections
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <button
                            onClick={() => {
                              setActiveProjectId(p.id)
                              setActiveSectionId(null)
                              setEditorText("")
                            }}
                            className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium rounded-lg group bg-gradient-to-r from-emerald-300 via-teal-200 to-orange-200 group-hover:from-emerald-300 group-hover:via-teal-200 group-hover:to-orange-200 focus:ring-4 focus:outline-none focus:ring-emerald-200"
                          >
                            <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent text-gray-900 group-hover:text-gray-900">
                              Open Project
                            </span>
                          </button>
                          <div className="flex gap-2">
                            <Tooltip text="Rename this project">
                              <button
                                onClick={() => setEditingProjectName(p.id)}
                                className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium rounded-lg group bg-gradient-to-r from-emerald-300 via-teal-200 to-orange-200 group-hover:from-emerald-300 group-hover:via-teal-200 group-hover:to-orange-200 focus:ring-4 focus:outline-none focus:ring-emerald-200"
                              >
                                <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent text-gray-900 group-hover:text-gray-900">
                                  Edit
                                </span>
                              </button>
                            </Tooltip>
                            <Tooltip text="Delete this project and all its sections">
                              <button
                                onClick={() => handleDeleteProject(p.id)}
                                className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium rounded-lg group bg-gradient-to-r from-emerald-300 via-teal-200 to-orange-200 group-hover:from-emerald-300 group-hover:via-teal-200 group-hover:to-orange-200 focus:ring-4 focus:outline-none focus:ring-emerald-200"
                              >
                                <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent text-gray-900 group-hover:text-gray-900">
                                  Delete
                                </span>
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // Update the section detail view
  const renderSectionDetail = () => {
    const activeProject = projects.find(p => p.id === activeProjectId)
    const activeSection = activeProject?.sections.find(s => s.id === activeSectionId)
    
    if (!activeSection) return null;

    return (
      <div className="h-screen flex flex-col">
        {/* Section Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setActiveSectionId(null)
                  setEditorText("")
                }}
                className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium rounded-lg group bg-gradient-to-r from-emerald-300 via-teal-200 to-orange-200 group-hover:from-emerald-300 group-hover:via-teal-200 group-hover:to-orange-200 focus:ring-4 focus:outline-none focus:ring-emerald-200"
              >
                <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent text-gray-900 group-hover:text-gray-900">
                  ← Back to Project
                </span>
              </button>
              <h1 className="text-2xl font-bold">{activeSection.name}</h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  Editing: {activeSection.name}
                </h2>
                <button
                  onClick={handleSaveContent}
                  className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium rounded-lg group bg-gradient-to-r from-emerald-300 via-teal-200 to-orange-200 group-hover:from-emerald-300 group-hover:via-teal-200 group-hover:to-orange-200 focus:ring-4 focus:outline-none focus:ring-emerald-200"
                >
                  <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent text-gray-900 group-hover:text-gray-900">
                    Save Changes
                  </span>
                </button>
              </div>
              <textarea
                ref={textareaRef}
                className="w-full h-[calc(100vh-250px)] border rounded-lg p-4 font-mono resize-both overflow-auto min-w-[300px] min-h-[200px]"
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
                placeholder="Write your content here..."
              />
            </div>
          </div>

          {/* AI Assistant Sidebar */}
          <div className={`border-l bg-white flex flex-col transition-all duration-300 ${isAIChatMinimized ? 'w-10' : 'w-96'}`}>
            <div className="p-2 border-b flex justify-between items-center">
              {!isAIChatMinimized && (
                <h2 className="text-lg font-semibold">Project AI Assistant</h2>
              )}
              <button
                onClick={() => setIsAIChatMinimized(!isAIChatMinimized)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                {isAIChatMinimized ? (
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
            {!isAIChatMinimized && (
              <>
                <div className="p-4 border-b">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ask AI about this project..."
                      className="flex-1 border rounded-lg px-4 py-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          const question = e.target.value.trim();
                          if (question) {
                            askProjectAI(question);
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Ask AI about this project..."]');
                        const question = input.value.trim();
                        if (question) {
                          askProjectAI(question);
                          input.value = '';
                        }
                      }}
                      disabled={loading}
                      className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium rounded-lg group bg-gradient-to-r from-emerald-300 via-teal-200 to-orange-200 group-hover:from-emerald-300 group-hover:via-teal-200 group-hover:to-orange-200 focus:ring-4 focus:outline-none focus:ring-emerald-200 whitespace-nowrap min-w-[90px]"
                    >
                      <span className="relative w-full px-3 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent text-gray-900 group-hover:text-gray-900">
                        {loading ? (
                          <>
                            <span>Thinking</span>
                            <LoadingSpinner />
                          </>
                        ) : (
                          'Ask AI'
                        )}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {[...projectAIHistory].reverse().map((message, index) => (
                      <ChatMessage
                        key={index}
                        message={message}
                        onRegenerate={message.role === 'assistant' ? () => askProjectAI(projectAIHistory[projectAIHistory.length - index - 2].content) : undefined}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Update the project detail view
  const renderProjectDetail = () => {
    const activeProject = projects.find(p => p.id === activeProjectId)
    if (!activeProject) return null

    return (
      <div className="h-screen flex flex-col">
        {/* Project Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setActiveProjectId(null)
                  setActiveSectionId(null)
                }}
                className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium rounded-lg group bg-gradient-to-r from-emerald-300 via-teal-200 to-orange-200 group-hover:from-emerald-300 group-hover:via-teal-200 group-hover:to-orange-200 focus:ring-4 focus:outline-none focus:ring-emerald-200"
              >
                <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent text-gray-900 group-hover:text-gray-900">
                  ← Back to Projects
                </span>
              </button>
              <h1 className="text-2xl font-bold">{activeProject.name}</h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sections Sidebar */}
          <div className="w-64 border-r bg-gray-50 flex flex-col">
            <div className="p-4 border-b bg-white">
              <h2 className="text-lg font-semibold mb-2">Sections</h2>
              <div className="space-y-2">
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
                  className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium rounded-lg group bg-gradient-to-r from-emerald-300 via-teal-200 to-orange-200 group-hover:from-emerald-300 group-hover:via-teal-200 group-hover:to-orange-200 focus:ring-4 focus:outline-none focus:ring-emerald-200"
                >
                  <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent text-gray-900 group-hover:text-gray-900">
                    {loadingStates.addSection ? (
                      <>
                        Adding... <LoadingSpinner />
                      </>
                    ) : (
                      'Add Section'
                    )}
                  </span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {activeProject.sections?.map((section) => (
                <div
                  key={section.id}
                  onClick={() => {
                    setActiveSectionId(section.id)
                    setEditorText(section.content || "")
                  }}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 ${
                    section.id === activeSectionId
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{section.name}</span>
                    <div className="flex gap-1">
                      <Tooltip text="Delete section">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const confirmDelete = window.confirm("Delete this section?")
                            if (confirmDelete) {
                              setProjects(projects.map(p =>
                                p.id === activeProjectId
                                  ? {
                                      ...p,
                                      sections: p.sections.filter(s => s.id !== section.id)
                                    }
                                  : p
                              ))
                            }
                          }}
                          className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-[10px] font-medium rounded group bg-gradient-to-r from-emerald-300 via-teal-200 to-orange-200 group-hover:from-emerald-300 group-hover:via-teal-200 group-hover:to-orange-200 focus:ring-2 focus:outline-none focus:ring-emerald-200"
                        >
                          <span className="relative px-2 py-1 transition-all ease-in duration-75 bg-white rounded group-hover:bg-transparent text-gray-900 group-hover:text-gray-900">
                            Delete
                          </span>
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a section to start editing
            </div>
          </div>

          {/* AI Assistant Sidebar */}
          <div className={`border-l bg-white flex flex-col transition-all duration-300 ${isAIChatMinimized ? 'w-10' : 'w-96'}`}>
            <div className="p-2 border-b flex justify-between items-center">
              {!isAIChatMinimized && (
                <h2 className="text-lg font-semibold">Project AI Assistant</h2>
              )}
              <button
                onClick={() => setIsAIChatMinimized(!isAIChatMinimized)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                {isAIChatMinimized ? (
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
            {!isAIChatMinimized && (
              <>
                <div className="p-4 border-b">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ask AI about this project..."
                      className="flex-1 border rounded-lg px-4 py-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          const question = e.target.value.trim();
                          if (question) {
                            askProjectAI(question);
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Ask AI about this project..."]');
                        const question = input.value.trim();
                        if (question) {
                          askProjectAI(question);
                          input.value = '';
                        }
                      }}
                      disabled={loading}
                      className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium rounded-lg group bg-gradient-to-r from-emerald-300 via-teal-200 to-orange-200 group-hover:from-emerald-300 group-hover:via-teal-200 group-hover:to-orange-200 focus:ring-4 focus:outline-none focus:ring-emerald-200 whitespace-nowrap min-w-[90px]"
                    >
                      <span className="relative w-full px-3 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent text-gray-900 group-hover:text-gray-900">
                        {loading ? (
                          <>
                            <span>Thinking</span>
                            <LoadingSpinner />
                          </>
                        ) : (
                          'Ask AI'
                        )}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {[...projectAIHistory].reverse().map((message, index) => (
                      <ChatMessage
                        key={index}
                        message={message}
                        onRegenerate={message.role === 'assistant' ? () => askProjectAI(projectAIHistory[projectAIHistory.length - index - 2].content) : undefined}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Update the main return statement to include the section detail view
  return activeSectionId ? renderSectionDetail() : activeProjectId ? renderProjectDetail() : renderProjectList()
}
