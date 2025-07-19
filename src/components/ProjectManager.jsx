import { useEffect, useState, useRef } from 'react'
import { useOpenAI } from '../useOpenAI'
import { supabase } from '../supabaseClient'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Activity, Users, FileText, Plus } from 'lucide-react'
import { EditorPane } from './ProjectManager/EditorPane'
import { Chrono } from 'react-chrono'

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
const ChatMessage = ({ message, onRegenerate, onApply }) => {
  const isAI = message.role === 'assistant';
  const hasSuggestion = isAI && typeof message.content === 'object' && message.content.newContent;
  const content = hasSuggestion ? message.content.newContent : message.content;

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
      <p className="text-gray-800 whitespace-pre-wrap">{content}</p>
      {hasSuggestion && onApply && (
        <button
          onClick={() => onApply(message.content.newContent)}
          className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
        >
          Apply AI Suggestion
        </button>
      )}
    </div>
  );
};

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

// Add this helper function at the top level
const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

function AIAssistantSidebar({
  contextType, // 'project' or 'section'
  contextName,
  contextContent,
  ask,
  loading,
  history,
  setHistory,
  onApplySuggestion
}) {
  const [input, setInput] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  if (collapsed) {
    return (
      <div className="fixed right-0 top-24 z-40">
        <button
          onClick={() => setCollapsed(false)}
          className="bg-white border-l border-t border-b rounded-l-lg shadow p-2 hover:bg-gray-100"
          title="Show AI Assistant"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-96 max-w-full flex flex-col bg-white/90 border-l h-full overflow-hidden relative">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">AI Assistant</h3>
        <button
          onClick={() => setCollapsed(true)}
          className="ml-2 text-gray-500 hover:text-gray-700 bg-white border rounded-full shadow p-2"
          title="Hide AI Assistant"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      <div className="p-4 border-b">
        <label className="block text-sm font-medium mb-1">Guided Mode</label>
        <select
          className="w-full border rounded px-2 py-1 mb-2"
          value="assistant"
          onChange={e => {
            // This is a placeholder, as the mode selector is removed
          }}
        >
          <option value="assistant">Assistant</option>
        </select>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {history.map((message, index) => (
            <ChatMessage
              key={index}
              message={message}
              onRegenerate={message.role === 'assistant' ? () => ask(message.originalPrompt, { displayMessage: message.originalPrompt }) : undefined}
              onApply={onApplySuggestion}
            />
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={`Ask AI about this ${contextType}...`}
            className="flex-1 border rounded-lg px-4 py-2"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) {
                  ask(input, { displayMessage: input });
                  setInput('');
                }
              }
            }}
          />
          <button
            onClick={() => {
              if (input.trim()) {
                ask(input, { displayMessage: input });
                setInput('');
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
        </div>
      </div>
    </div>
  );
}

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
  const textareaRef = useRef(null);
  const [loadingStates, setLoadingStates] = useState({
    create: false,
    addSection: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saveConfirmation, setSaveConfirmation] = useState(false)
  const [validationErrors, setValidationErrors] = useState({
    projectName: '',
    sectionName: ''
  })
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [projectAIHistory, setProjectAIHistory] = useState([]);
  const [isAIChatMinimized, setIsAIChatMinimized] = useState(false)
  const [sectionHighlights, setSectionHighlights] = useState({});
  const [isGeneratingHighlights, setIsGeneratingHighlights] = useState(false);

  const { ask, response, loading, history, regenerate } = useOpenAI()

  const [sectionAIHistory, setSectionAIHistory] = useState([]);
  const editorPaneRef = useRef();

  const askSectionAI = async (question, { displayMessage } = {}) => {
    const editorContent = editorPaneRef.current?.getContent?.() || '';
    // Build the new prompt for the section AI assistant
    const prompt = `You are an expert writing assistant. The user is working on the following chapter/section of a larger project. Focus your suggestions, edits, and ideas on this section only. Here is the content:\n${editorContent}\n\nUser’s question: ${displayMessage || question}`;
    try {
      const response = await ask(prompt, { displayMessage, sectionContent: editorContent, mode: 'assistant' });
      setSectionAIHistory(prev => [
        ...prev,
        { role: 'user', content: displayMessage || question },
        { role: 'assistant', content: response, originalPrompt: question }
      ]);
      // Removed automatic content update to editor
      // if (typeof response === 'object' && response.newContent) {
      //   editorPaneRef.current?.setContent?.(response.newContent);
      // }
    } catch (error) {
      setSectionAIHistory(prev => [
        ...prev,
        { role: 'user', content: displayMessage || question },
        { role: 'assistant', content: '⚠️ Error: Could not get response from AI', originalPrompt: question }
      ]);
    }
  };

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

  const handleSaveContent = async (content, showConfirmation = false) => {
    // content: { html, json }
    const updatedProjects = projects.map((p) =>
      p.id === activeProjectId
        ? {
            ...p,
            sections: p.sections.map((s) =>
              s.id === activeSectionId ? { ...s, content: content.html, jsonContent: content.json } : s
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
      setError('Failed to save changes')
    } else if (showConfirmation) {
      setSaveConfirmation(true)
      setTimeout(() => {
        setSaveConfirmation(false)
      }, 2000)
    }
  }

  const handleSelectSection = (section) => {
    setActiveSectionId(section.id)
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
  };

  // Add this function to generate highlights
  const generateSectionHighlights = async (section) => {
    if (sectionHighlights[section.id]) return; // Skip if already generated

    try {
      const prompt = `Please provide 3-4 key highlights or main points from this chapter content. Format as a bullet point list. Content: ${section.content || ''}`;
      const response = await ask(prompt);
      
      // Force a state update by creating a new object
      setSectionHighlights(prev => {
        const newHighlights = {
          ...prev,
          [section.id]: response
        };
        return newHighlights;
      });
    } catch (error) {
      console.error('Error generating highlights:', error);
    }
  };

  // Add new function to generate all highlights
  const generateAllHighlights = async () => {
    const activeProject = projects.find(p => p.id === activeProjectId);
    if (!activeProject?.sections) return;

    setIsGeneratingHighlights(true);
    try {
      // Generate highlights for all sections in parallel
      const highlightPromises = activeProject.sections.map(section => generateSectionHighlights(section));
      await Promise.all(highlightPromises);
      
      // Force a re-render by updating the projects state
      setProjects(prev => [...prev]);
    } catch (error) {
      console.error('Error generating all highlights:', error);
    } finally {
      setIsGeneratingHighlights(false);
    }
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
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500">
                                    {p.sections?.length || 0} sections
                                  </span>
                                  <Tooltip text="Rename project">
                                    <button
                                      onClick={() => setEditingProjectName(p.id)}
                                      className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                                    </button>
                                  </Tooltip>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <button
                            onClick={() => {
                              setActiveProjectId(p.id)
                              setActiveSectionId(null)
                            }}
                            className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium rounded-lg group bg-gradient-to-r from-emerald-300 via-teal-200 to-orange-200 group-hover:from-emerald-300 group-hover:via-teal-200 group-hover:to-orange-200 focus:ring-4 focus:outline-none focus:ring-emerald-200"
                          >
                            <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent text-gray-900 group-hover:text-gray-900">
                              Open Project
                            </span>
                          </button>
                          <div className="flex gap-2">
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

  // Update the project detail view
  const renderProjectDetail = () => {
    const activeProject = projects.find(p => p.id === activeProjectId)
    if (!activeProject) return null

    // Prepare timeline items from sections with cleaned content and highlights
    const timelineItems = (activeProject.sections || []).map(section => {
      const cleanContent = stripHtml(section.content || '');
      const highlights = sectionHighlights[section.id];
      
      return {
        title: section.name,
        cardTitle: section.name,
        cardSubtitle: section.subtitle || '',
        cardDetailedText: highlights || cleanContent.substring(0, 100) + (cleanContent.length > 100 ? '...' : ''),
        id: section.id
      };
    });

    // Force re-render of timeline items when highlights change
    const timelineKey = JSON.stringify(timelineItems);

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
          {/* Left Sidebar */}
          <div className="w-64 bg-gray-50 border-r p-4 flex flex-col">
            <div className="mb-4">
              <input
                type="text"
                placeholder="New section name"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                className="border rounded p-2 w-full mb-2"
              />
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
            <div className="flex-1 overflow-y-auto">
              {activeProject.sections?.map((section) => (
                <div
                  key={section.id}
                  onClick={() => {
                    if (editingSectionName !== section.id) {
                      setActiveSectionId(section.id)
                    }
                  }}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 ${
                    section.id === activeSectionId
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {editingSectionName === section.id ? (
                      <input
                        type="text"
                        value={section.name}
                        onChange={(e) => {
                          setProjects(projects.map(p =>
                            p.id === activeProjectId
                              ? {
                                  ...p,
                                  sections: p.sections.map(s =>
                                    s.id === section.id ? { ...s, name: e.target.value } : s
                                  )
                                }
                              : p
                          ))
                        }}
                        onBlur={() => {
                          setEditingSectionName(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingSectionName(null)
                          }
                        }}
                        className="border rounded p-1 w-full"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <span className="font-medium">{section.name}</span>
                        <div className="flex gap-1">
                          <Tooltip text="Rename section">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingSectionName(section.id)
                              }}
                              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </Tooltip>
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
                              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </Tooltip>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Timeline Section */}
            <div className="flex-1 p-4 border-b min-h-[400px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Chapter Timeline</h3>
              </div>
              <div style={{ width: '100%', height: '100%' }}>
                {timelineItems.length > 0 ? (
                  <Chrono
                    key={timelineKey}
                    items={timelineItems}
                    mode="horizontal"
                    slideShow
                    cardHeight={200}
                    theme={{
                      primary: '#000000',
                      secondary: '#10b981',
                      cardBgColor: '#ffffff',
                      titleColor: '#222',
                      cardTitleColor: '#10b981',
                      cardSubtitleColor: '#666',
                      cardDetailsColor: '#444',
                      timelineContentColor: '#10b981',
                    }}
                    onItemSelected={item => {
                      const section = (activeProject.sections || []).find(s => s.id === item.id)
                      if (section) {
                        setActiveSectionId(section.id);
                        if (!sectionHighlights[section.id]) {
                          generateSectionHighlights(section);
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="text-center text-gray-500 h-full flex items-center justify-center">
                    No sections yet. Add a section to see the timeline.
                  </div>
                )}
              </div>
            </div>

            {/* Section Preview */}
            <div className="p-4 border-t">
              {activeSectionId ? (
                <div className="text-center text-gray-500">
                  Click on a section in the timeline or sidebar to edit it
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  Select a section to edit or create a new one
                </div>
              )}
            </div>
          </div>
          {/* AI Assistant Sidebar */}
          <AIAssistantSidebar
            contextType="project"
            contextName={activeProject.name}
            contextContent={getAllSectionsContent()}
            ask={askProjectAI}
            loading={loading}
            history={projectAIHistory}
            setHistory={setProjectAIHistory}
          />
        </div>
      </div>
    )
  }

  // Update the section detail view
  const renderSectionDetail = () => {
    const activeProject = projects.find(p => p.id === activeProjectId)
    const activeSection = activeProject?.sections.find(s => s.id === activeSectionId)
    
    if (!activeSection) return null;

    // Handler to apply AI suggestion to the editor
    const handleApplyAISuggestion = (newContent) => {
      if (editorPaneRef.current?.setContent) {
        editorPaneRef.current.setContent(newContent);
      }
    };

    return (
      <div className="h-screen flex flex-col">
        {/* Section Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setActiveSectionId(null)
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
              <div className="flex items-center justify-end">
                {saveConfirmation && (
                  <span className="text-green-600 font-medium">Changes saved!</span>
                )}
              </div>
              {/* Use EditorPane with TipTap */}
              <EditorPane
                ref={editorPaneRef}
                activeSection={activeSection}
                onSaveContent={handleSaveContent}
                onExport={exportSection}
              />
            </div>
          </div>
          {/* AI Assistant Sidebar */}
          <AIAssistantSidebar
            contextType="section"
            contextName={activeSection.name}
            contextContent={activeSection.content}
            ask={askSectionAI}
            loading={loading}
            history={sectionAIHistory}
            setHistory={setSectionAIHistory}
            onApplySuggestion={handleApplyAISuggestion}
          />
        </div>
      </div>
    )
  }

  // Update the main return statement to include the section detail view
  return activeSectionId ? renderSectionDetail() : activeProjectId ? renderProjectDetail() : renderProjectList()
}
