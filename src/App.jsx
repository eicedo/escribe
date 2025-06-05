import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import ProjectManager from './components/ProjectManager'
import logo from './assets/escribe-logo.svg'
import { FaCog } from 'react-icons/fa'
import Settings from './components/Settings'

export default function App() {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [settingsTab, setSettingsTab] = useState('username') // 'username' or 'password'

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data?.session?.user || null)
      if (data?.session?.user) {
        // Fetch username from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', data.session.user.id)
          .single()
        setUsername(profile?.username || null)
      } else {
        setUsername(null)
      }
    }

    getSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => setUsername(profile?.username || null))
      } else {
        setUsername(null)
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setUsername(null)
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleOpenSettings = (tab) => {
    setSettingsTab(tab)
    setShowSettingsModal(true)
    setSettingsOpen(false)
  }

  const handleUsernameSubmit = async (newUsername) => {
    // Update username in Supabase
    await supabase
      .from('profiles')
      .update({ username: newUsername, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    setUsername(newUsername)
  }

  if (!user) return <Auth />

  return (
    <div>
      <header
        className="w-full flex items-center justify-between px-8 py-4 shadow-md bg-gradient-to-r from-[#FF6B6B] via-[#D4DBA7] to-[#A8E6CE]"
        style={{ minHeight: '64px' }}
      >
        <div className="flex items-center gap-3">
          <img src={logo} alt="escribe logo" className="h-10 w-auto" />
        </div>
        <div className="flex items-center gap-4 relative">
          <span className="text-sm font-semibold text-gray-800 drop-shadow">
            {username || user.email}
          </span>
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className="p-2 rounded-full hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]"
            aria-label="Settings"
          >
            <FaCog size={22} />
          </button>
          {settingsOpen && (
            <div className="absolute right-0 top-12 mt-2 w-48 bg-white rounded shadow-lg z-50 border">
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => handleOpenSettings('username')}
              >
                Change Username
              </button>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => handleOpenSettings('password')}
              >
                Change Password
              </button>
              <button
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 border-t"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>
      <div className="p-4">
        <ProjectManager user={user} />
      </div>
      {/* Settings Modal */}
      {showSettingsModal && (
        <Settings
          show={showSettingsModal}
          onHide={() => setShowSettingsModal(false)}
          onUsernameSubmit={handleUsernameSubmit}
          currentUsername={username}
          tab={settingsTab}
        />
      )}
    </div>
  )
}

