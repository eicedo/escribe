import { useState } from 'react'
import { supabase } from '../supabaseClient'
import logo from '../assets/escribe-logo.svg'

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      let result

      if (isLogin) {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        })
      } else {
        // Validate username before proceeding
        if (username.length < 3) {
          setError('Username must be at least 3 characters long')
          setLoading(false)
          return
        }

        // Check if username is already taken
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .single()

        if (existingUser) {
          setError('This username is already taken')
          setLoading(false)
          return
        }

        // For sign up, first create the user
        result = await supabase.auth.signUp({
          email,
          password,
        })

        if (result.data?.user) {
          // Then update their profile with the username
          const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
              id: result.data.user.id,
              username: username,
              updated_at: new Date().toISOString(),
            })

          if (updateError) {
            setError('Error creating profile: ' + updateError.message)
            setLoading(false)
            return
          }
        }
      }

      const { data, error } = result

      if (error) {
        setError(error.message)
      } else if (data.session || data.user) {
        onLogin()
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-8 py-6">
        <div className="flex justify-center mb-8">
          <img src={logo} alt="escribe logo" className="h-12" />
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
          {isLogin ? 'Welcome back' : 'Create your account'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
                focus:outline-none focus:ring-2 focus:ring-[#A8E6CE] focus:border-transparent"
            />
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                type="text"
                placeholder="Choose a username (min. 3 characters)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
                  focus:outline-none focus:ring-2 focus:ring-[#A8E6CE] focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                This will be your public display name
              </p>
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
                focus:outline-none focus:ring-2 focus:ring-[#A8E6CE] focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              bg-gradient-to-r from-[#FFB6A3] via-[#D4DBA7] to-[#A8E6CE] hover:opacity-90
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A8E6CE] disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Create account')}
          </button>

          <div className="text-center text-sm">
            <span className="text-gray-600">
              {isLogin ? 'New to escribe?' : 'Already have an account?'}
            </span>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 font-medium text-[#A8E6CE] hover:text-[#8ED4BC] focus:outline-none"
            >
              {isLogin ? 'Create an account' : 'Sign in'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
