import { Modal } from 'react-bootstrap'
import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Settings({ show, onHide, onUsernameSubmit, currentUsername }) {
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
      // Get the current user's email
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('User not found')
        setLoading(false)
        return
      }

      // First verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword.value
      })

      if (signInError) {
        setError('Current password is incorrect')
        setLoading(false)
        return
      }

      // If current password is correct, update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password.value
      })

      if (updateError) throw updateError

      setSuccess('Password updated successfully')
      currentPassword.value = ''
      password.value = ''
      confirmPassword.value = ''
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
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="space-y-8">
          {/* Username Section */}
          <div>
            <h3 className="text-lg font-medium mb-4">Change Username</h3>
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !newUsername}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Username'}
                </button>
              </div>
            </form>
          </div>

          <div className="border-t pt-8">
            <h3 className="text-lg font-medium mb-4">Change Password</h3>
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          {success && (
            <div className="text-green-600 text-sm">{success}</div>
          )}
        </div>
      </Modal.Body>
    </Modal>
  )
} 