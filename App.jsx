import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import ProjectManager from './components/ProjectManager'
import Settings from './components/Settings'
import { Container, Navbar, Nav, Dropdown } from 'react-bootstrap'
import logo from './assets/escribe-logo.svg'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'

export default function App() {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false)

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data?.session?.user || null)
      
      if (data?.session?.user) {
        // Fetch the user's profile to get their username
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', data.session.user.id)
          .single()
        
        if (!profile?.username) {
          // If no username exists, show the prompt
          setShowUsernamePrompt(true)
        }
        
        setUsername(profile?.username || data.session.user.email)
      }
    }

    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null)
      
      if (session?.user) {
        // Fetch the user's profile to get their username
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single()
        
        if (!profile?.username) {
          // If no username exists, show the prompt
          setShowUsernamePrompt(true)
        }
        
        setUsername(profile?.username || session.user.email)
      } else {
        setUsername(null)
        setShowUsernamePrompt(false)
      }
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  const handleLogoClick = () => {
    window.location.href = '/'
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const handleUsernameSubmit = async (newUsername) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: newUsername,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      setUsername(newUsername)
      setShowUsernamePrompt(false)
    } catch (error) {
      console.error('Error updating username:', error)
    }
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Navbar expand="lg" className="bg-white shadow-sm">
          <Container>
            <Navbar.Brand 
              as={Link}
              to="/"
              className="cursor-pointer flex items-center hover:opacity-80 transition-opacity"
            >
              <img 
                src={logo} 
                alt="escribe logo" 
                className="h-8 md:h-10"
              />
            </Navbar.Brand>
            {user && (
              <Nav className="ms-auto flex items-center">
                <Nav.Item className="flex items-center text-gray-600">
                  <span className="username-gradient-stroke font-bold text-lg mx-2">{username}</span>
                  <Dropdown align="end">
                    <Dropdown.Toggle 
                      variant="link" 
                      id="settings-dropdown"
                      className="p-0 flex items-center gap-1 focus:shadow-none focus:outline-none border-0 bg-transparent dropdown-toggle-no-caret"
                      style={{ boxShadow: 'none' }}
                    >
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500 ml-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.24 4.4a.75.75 0 01-1.08 0l-4.24-4.4a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => setShowSettings(true)}>
                        Settings
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={handleLogout} className="text-red-600">
                        Logout
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Nav.Item>
              </Nav>
            )}
          </Container>
        </Navbar>

        <Routes>
          <Route path="/" element={
            <Container className="py-8">
              <div className="w-full max-w-4xl mx-auto">
                {!user ? (
                  <Auth onLogin={() => window.location.reload()} />
                ) : (
                  <ProjectManager user={user} />
                )}
              </div>
            </Container>
          } />
        </Routes>

        <Settings 
          show={showSettings} 
          onHide={() => setShowSettings(false)}
          onUsernameSubmit={handleUsernameSubmit}
          currentUsername={username}
        />

        {showUsernamePrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Choose a Username</h2>
              <p className="text-gray-600 mb-4">
                Please choose a username to display instead of your email address.
              </p>
              <form onSubmit={(e) => {
                e.preventDefault()
                const newUsername = e.target.username.value
                handleUsernameSubmit(newUsername)
              }}>
                <input
                  type="text"
                  name="username"
                  placeholder="Choose a username"
                  required
                  minLength={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                />
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Set Username
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </BrowserRouter>
  )
}
