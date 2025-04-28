import { useState } from 'react'
import { Tooltip } from './shared/Tooltip'
import { LoadingSpinner } from './shared/LoadingSpinner'

export const ProjectList = ({ 
  projects, 
  onProjectSelect, 
  onProjectDelete, 
  onProjectRename,
  loadingStates,
  validationErrors,
  setValidationErrors
}) => {
  const [projectName, setProjectName] = useState("")
  const [editingProjectName, setEditingProjectName] = useState(null)

  const handleCreateProject = async () => {
    // Reset validation error
    setValidationErrors(prev => ({ ...prev, projectName: '' }))

    if (!projectName.trim()) {
      setValidationErrors(prev => ({ ...prev, projectName: 'Project name is required' }))
      return
    }

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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">My Projects</h2>
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
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loadingStates.create ? (
                <>
                  Adding... <LoadingSpinner />
                </>
              ) : (
                'Add Project'
              )}
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
                          onProjectRename(p.id, p.name)
                          setEditingProjectName(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onProjectRename(p.id, p.name)
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
                    onClick={() => onProjectSelect(p.id)}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors duration-200"
                  >
                    Open Project
                  </button>
                  <div className="flex gap-2">
                    <Tooltip text="Rename this project">
                      <button
                        onClick={() => setEditingProjectName(p.id)}
                        className="text-yellow-600 hover:text-yellow-700 p-2 rounded transition-colors duration-200"
                      >
                        <span className="sr-only">Edit</span>
                        Edit
                      </button>
                    </Tooltip>
                    <Tooltip text="Delete this project and all its sections">
                      <button
                        onClick={() => onProjectDelete(p.id)}
                        className="text-red-600 hover:text-red-700 p-2 rounded transition-colors duration-200"
                      >
                        <span className="sr-only">Delete</span>
                        Delete
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 