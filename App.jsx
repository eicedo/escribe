import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import ProjectManager from './components/ProjectManager'

export default function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data?.session?.user || null)
    }

    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  return (
    <main className="min-h-screen bg-gray-100 relative">
      {!user ? (
        <Auth onLogin={() => window.location.reload()} />
      ) : (
        <>
          {/* Display logged in user */}
          <div className="absolute top-4 left-4 text-sm text-gray-700">
            Logged in as: <strong>{user.email}</strong>
          </div>

          <ProjectManager user={user} />
        </>
      )}
    </main>
  )
}
