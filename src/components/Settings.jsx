import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Settings({ show, onHide, onUsernameSubmit, currentUsername, tab }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [newUsername, setNewUsername] = useState('')

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const { currentPassword, password, confirmPassword } = e.target.elements

    if (password.value !== confirmPassword.value) {
      setError('New passwords do not match')
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('User not found')
        setLoading(false)
        return
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword.value
      })
      if (signInError) {
        setError('Current password is incorrect')
        setLoading(false)
        return
      }
      const { error: updateError } = await supabase.auth.updateUser({
        password: password.value
      })
      if (updateError) throw updateError
      setSuccess('Password updated successfully')
      currentPassword.value = ''
      password.value = ''
      confirmPassword.value = ''
      setTimeout(() => {
        setSuccess(null)
        onHide()
      }, 1000)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUsernameChange = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      if (newUsername.length < 3) {
        setError('Username must be at least 3 characters long')
        setLoading(false)
        return
      }
      await onUsernameSubmit(newUsername)
      setSuccess('Username updated successfully')
      setNewUsername('')
      setTimeout(() => {
        setSuccess(null)
        onHide()
      }, 1000)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-auto animate-fade-in">
        <div className="rounded-t-xl px-6 py-4 bg-gradient-to-r from-[#FF6B6B] via-[#D4DBA7] to-[#A8E6CE] flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Settings</h2>
          <button onClick={onHide} className="text-gray-600 hover:text-gray-900 text-2xl font-bold">×</button>
        </div>
        <div className="px-6 py-6">
          <div className="flex space-x-4 mb-6">
            <button
              className={`px-3 py-1 rounded font-medium ${tab === 'username' ? 'bg-[#A8E6CE] text-gray-900' : 'bg-gray-100 text-gray-500'}`}
              onClick={() => setSuccess(null) || setError(null) || setNewUsername('') || onHide() || setTimeout(() => onHide() || null, 0)}
              disabled={tab === 'username'}
            >
              Change Username
            </button>
            <button
              className={`px-3 py-1 rounded font-medium ${tab === 'password' ? 'bg-[#A8E6CE] text-gray-900' : 'bg-gray-100 text-gray-500'}`}
              onClick={() => setSuccess(null) || setError(null) || onHide() || setTimeout(() => onHide() || null, 0)}
              disabled={tab === 'password'}
            >
              Change Password
            </button>
          </div>
          {tab === 'username' && (
            <form onSubmit={handleUsernameChange} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Current Username
                </label>
                <input
                  type="text"
                  value={currentUsername}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                />
              </div>
              <div>
                <label htmlFor="newUsername" className="block text-sm font-medium text-gray-700">
                  New Username
                </label>
                <input
                  type="text"
                  id="newUsername"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  minLength={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#A8E6CE] focus:ring-[#A8E6CE]"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !newUsername}
                  className="px-4 py-2 bg-[#A8E6CE] text-gray-900 rounded hover:bg-[#D4DBA7] disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Username'}
                </button>
              </div>
            </form>
          )}
          {tab === 'password' && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#A8E6CE] focus:ring-[#A8E6CE]"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#A8E6CE] focus:ring-[#A8E6CE]"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#A8E6CE] focus:ring-[#A8E6CE]"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#A8E6CE] text-gray-900 rounded hover:bg-[#D4DBA7] disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
          {error && (
            <div className="mt-4 p-2 rounded bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
          )}
          {success && (
            <div className="mt-4 p-2 rounded bg-green-50 border border-green-200 text-green-600 text-sm">{success}</div>
          )}
        </div>
      </div>
    </div>
  )
} 