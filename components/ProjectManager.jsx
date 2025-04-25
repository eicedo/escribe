import { useEffect, useState } from 'react'
import { useOpenAI } from '../useOpenAI'
import { supabase } from '../supabaseClient'

export default function ProjectManager({ user }) {
  console.log('[ProjectManager] Component mounted with user:', user)

  const [projects, setProjects] = useState([])
  const [projectName, setProjectName] = useState("")
  const [sectionName, setSectionName] = useState("")
  const [editingProjectName, setEditingProjectName] = useState(null)
  const [editingSectionName, setEditingSectionName] = useState(null)
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [activeSectionId, setActiveSectionId] = useState(null)
  const [editorText, setEditorText] = useState("")
  const [loadingStates, setLoadingStates] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const { ask, response, loading } = useOpenAI()

  useEffect(() => {
    console.log('[ProjectManager] useEffect triggered with user:', user?.id)
    let mounted = true

    const fetchProjects = async () => {
      if (!user?.id) {
        console.log('[ProjectManager] No user ID, skipping fetch')
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

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-red-600">Error loading projects: {error}</div>
      </div>
    )
  }

  if (isLoading) {
    console.log('[ProjectManager] Rendering loading spinner')
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  console.log('[ProjectManager] Rendering main component')

  const handleCreateProject = async () => {
    if (!projectName.trim()) return

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

  const handleAddSection = () => {
    if (!sectionName.trim() || !activeProjectId) return
    const newSection = { id: Date.now(), name: sectionName, content: "" }
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? { ...p, sections: [...(p.sections || []), newSection] }
          : p
      )
    )
    setSectionName("")
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

  const activeProject = projects.find((p) => p.id === activeProjectId)
  const activeSection = activeProject?.sections.find((s) => s.id === activeSectionId)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 border-r p-4 overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Sections</h3>
        {activeProject?.sections.map((section) => (
          <div
            key={section.id}
            onClick={() => handleSelectSection(section)}
            className={`p-2 rounded cursor-pointer mb-1 ${
              section.id === activeSectionId
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-200'
            }`}
          >
            {section.name}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!activeSection && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Create New Project</h2>
              <input
                type="text"
                placeholder="Project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="border rounded p-2 w-full"
              />
              <button
                onClick={handleCreateProject}
                disabled={loadingStates.create}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingStates.create ? 'Adding...' : 'Add Project'}
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Projects:</h3>
              <div className="space-y-2">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className={`border rounded p-2 ${
                      p.id === activeProjectId ? 'bg-blue-50' : ''
                    } hover:bg-gray-50`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="cursor-move text-gray-400 hover:text-gray-600 px-1">
                          ⋮⋮
                        </div>
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
                            className="border rounded p-1 flex-1"
                            autoFocus
                          />
                        ) : (
                          <div
                            className="font-semibold cursor-pointer"
                            onDoubleClick={() => setEditingProjectName(p.id)}
                            onClick={() => {
                              setActiveProjectId(p.id)
                              setActiveSectionId(null)
                              setEditorText("")
                            }}
                          >
                            {p.name}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 text-sm items-center">
                        {loadingStates[p.id] && (
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        )}
                        <button
                          onClick={() => setEditingProjectName(p.id)}
                          className="text-yellow-600 hover:text-yellow-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProject(p.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {activeProject && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-medium">Add Section</h3>
                <input
                  type="text"
                  placeholder="Section name"
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  className="border rounded p-2 w-full"
                />
                <button
                  onClick={handleAddSection}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Add Section
                </button>
              </div>
            )}
          </>
        )}

        {activeSection && (
          <>
            <button
              onClick={() => setActiveSectionId(null)}
              className="mb-4 px-3 py-2 bg-gray-200 text-sm text-gray-800 rounded hover:bg-gray-300"
            >
              ← Back to Projects
            </button>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Editing: {activeSection.name}</h3>
              <textarea
                className="w-full h-40 border rounded p-2"
                placeholder="Write your content here..."
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
              />
              <div className="space-x-2">
                <button
                  onClick={handleSaveContent}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Save Section
                </button>
                <button
                  onClick={() => ask(editorText)}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Ask AI for Help
                </button>
                <button
                  onClick={() =>
                    exportSection(activeSection.name, editorText, 'txt')
                  }
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
                >
                  Export as .txt
                </button>
                <button
                  onClick={() =>
                    exportSection(activeSection.name, editorText, 'md')
                  }
                  className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-black"
                >
                  Export as .md
                </button>
              </div>

              {loading && <p className="text-gray-500">Thinking...</p>}

              {response && (
                <div className="p-4 mt-4 border rounded bg-gray-50">
                  <h4 className="font-medium mb-2">AI Suggestion:</h4>
                  <p>{response}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
