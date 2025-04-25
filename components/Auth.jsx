import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    let result

    if (isLogin) {
      result = await supabase.auth.signInWithPassword({
        email,
        password,
      })
    } else {
      result = await supabase.auth.signUp({
        email,
        password,
      })
    }

    const { data, error } = result

    if (error) {
      setError(error.message)
    } else if (data.session || data.user) {
      onLogin()
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 bg-white border rounded shadow">
      <h2 className="text-xl font-bold mb-4">
        {isLogin ? 'Login to Escribe' : 'Create Your Account'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {isLogin ? 'Login' : 'Sign Up'}
        </button>
      </form>
      <p className="text-sm mt-4 text-center">
        {isLogin ? 'New here?' : 'Already have an account?'}{' '}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-blue-600 hover:underline"
        >
          {isLogin ? 'Create an account' : 'Log in'}
        </button>
      </p>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  )
}
