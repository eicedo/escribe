import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { Header } from './Header'
import { ProjectList } from './ProjectList'
import { SectionList } from './SectionList'
import { EditorPane } from './EditorPane'
import { Modal } from './shared/Modal'
import { ChatMessage } from './shared/ChatMessage'
import { LoadingSpinner } from './shared/LoadingSpinner'
import { useOpenAI } from '../../useOpenAI'

export default function ProjectManager({ user }) {
  const [projects, setProjects] = useState([])
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [activeSectionId, setActiveSectionId] = useState(null)
  const [loadingStates, setLoadingStates] = useState({
    create: false,
    addSection: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({
    projectName: '',
    sectionName: ''
  })
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  const [projectAIHistory, setProjectAIHistory] = useState([])

  const { ask } = useOpenAI()

  useEffect(() => {
    let mounted = true

    const fetchProjects = async () => {
      if (!user?.id) {
        console.log('[ProjectManager] No user ID, clearing projects')
        setProjects([])  // Clear projects when user is null
        setIsLoading(false)
        return
      }
      
      setIsLoading(true)
      setError(null)

      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)

        if (error) throw error

        if (mounted) {
          setProjects(data || [])
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Error loading projects:', err)
        if (mounted) {
          setError(err.message)
          setIsLoading(false)
        }
      }
    }

    fetchProjects()

    return () => {
      mounted = false
    }
  }, [user?.id])

  const handleProjectSelect = (id) => {
    setActiveProjectId(id)
    setActiveSectionId(null)
  }

  const handleProjectDelete = async (id) => {
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

  const handleProjectRename = async (id, newName) => {
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

  const handleSectionSelect = (section) => {
    setActiveSectionId(section.id)
  }

  const handleSectionDelete = async (sectionId) => {
    const confirmDelete = window.confirm("Delete this section?")
    if (!confirmDelete) return

    setProjects(projects.map(p =>
      p.id === activeProjectId
        ? {
            ...p,
            sections: p.sections.filter(s => s.id !== sectionId)
          }
        : p
    ))

    if (activeSectionId === sectionId) {
      setActiveSectionId(null)
    }
  }

  const handleSectionRename = async (sectionId, newName) => {
    if (!newName.trim()) return

    setProjects(projects.map(p =>
      p.id === activeProjectId
        ? {
            ...p,
            sections: p.sections.map(s =>
              s.id === sectionId ? { ...s, name: newName } : s
            )
          }
        : p
    ))
  }

  const handleSaveContent = async (content) => {
    const updatedProjects = projects.map((p) =>
      p.id === activeProjectId
        ? {
            ...p,
            sections: p.sections.map((s) =>
              s.id === activeSectionId ? { ...s, content } : s
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

  const handleExport = (name, content, format) => {
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

  const getAllSectionsContent = () => {
    const activeProject = projects.find(p => p.id === activeProjectId);
    if (!activeProject?.sections) return '';
    
    return activeProject.sections.map(section => (
      `Chapter: ${section.name}\n\n${section.content || ''}\n\n---\n\n`
    )).join('');
  };

  const askProjectAI = async (question) => {
    const allContent = getAllSectionsContent();
    const context = `This is a project named "${projects.find(p => p.id === activeProjectId)?.name}". Here are all its sections:\n\n${allContent}\n\nQuestion: ${question}`;
    
    try {
      const response = await ask(context, { displayMessage: question });
      setProjectAIHistory(prev => [...prev, 
        { role: 'user', content: question },
        { role: 'assistant', content: response }
      ]);
    } catch (error) {
      console.error('Error asking project AI:', error);
    }
  };

  const activeProject = projects.find((p) => p.id === activeProjectId)
  const activeSection = activeProject?.sections?.find((s) => s.id === activeSectionId)

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-red-600">Error loading projects: {error}</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return activeProjectId ? (
    <div className="bg-old-paper min-h-screen">
      <div className="h-screen flex flex-col">
        <Header
          user={user}
          onBack={() => {
            setActiveProjectId(null)
            setActiveSectionId(null)
          }}
          projectName={activeProject?.name}
          onAIAssistantClick={() => setIsAIModalOpen(true)}
        />

        <Modal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)}>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Project AI Assistant</h2>
            <p className="text-gray-600 mb-4">
              Ask questions about any part of your project. The AI has access to all sections.
            </p>
            
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Ask about any chapter or section..."
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
                  const input = document.querySelector('input[placeholder="Ask about any chapter or section..."]');
                  const question = input.value.trim();
                  if (question) {
                    askProjectAI(question);
                    input.value = '';
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-2"
              >
                Ask AI
              </button>
            </div>

            <div className="space-y-4">
              {projectAIHistory.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  onRegenerate={message.role === 'assistant' ? () => askProjectAI(projectAIHistory[index - 1].content) : undefined}
                />
              ))}
            </div>
          </div>
        </Modal>

        <div className="flex-1 flex overflow-hidden">
          <SectionList
            sections={activeProject?.sections}
            activeSectionId={activeSectionId}
            onSectionSelect={handleSectionSelect}
            onSectionDelete={handleSectionDelete}
            onSectionRename={handleSectionRename}
            loadingStates={loadingStates}
            validationErrors={validationErrors}
            setValidationErrors={setValidationErrors}
          />

          <EditorPane
            activeSection={activeSection}
            onSaveContent={handleSaveContent}
            onExport={handleExport}
          />
        </div>
      </div>
    </div>
  ) : (
    <ProjectList
      projects={projects}
      onProjectSelect={handleProjectSelect}
      onProjectDelete={handleProjectDelete}
      onProjectRename={handleProjectRename}
      loadingStates={loadingStates}
      validationErrors={validationErrors}
      setValidationErrors={setValidationErrors}
    />
  )
} 