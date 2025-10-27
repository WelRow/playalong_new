import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from './Layout'
import './Settings.css'
import api from '../api'

function Settings({ onLogout }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('User')
  const [formData, setFormData] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    avatar: ''
  })
  const [previewAvatar, setPreviewAvatar] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/users/me')
      const currentUsername = response.data.username
      setUsername(currentUsername)
      
      // Fetch full user data
      const userResponse = await api.get(`/users/${currentUsername}`)
      setFormData({
        ...formData,
        email: userResponse.data.email || '',
        avatar: userResponse.data.avatar || ''
      })
      
      // Set avatar preview if exists
      if (userResponse.data.avatar) {
        setPreviewAvatar(userResponse.data.avatar)
      }
    } catch (err) {
      console.error('Error fetching user:', err)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    setError('')
    setSuccess('')
    
    // Update avatar preview if avatar URL changes
    if (name === 'avatar') {
      setPreviewAvatar(value)
    }
  }

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewAvatar(reader.result)
        setFormData({
          ...formData,
          avatar: reader.result
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validate passwords if changing
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match')
        setLoading(false)
        return
      }
      if (!formData.currentPassword) {
        setError('Current password is required to change password')
        setLoading(false)
        return
      }
    }

    try {
      const updateData = {}
      
      if (formData.email) {
        updateData.email = formData.email
      }
      
      if (formData.newPassword) {
        updateData.password = formData.newPassword
      }

      if (formData.avatar) {
        updateData.avatar = formData.avatar
      }

      // Update user profile
      await api.put(`/users/${username}`, updateData)

      setSuccess('Settings updated successfully!')
      
      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout activePage="settings" onLogout={onLogout}>
      {/* Settings Content Section */}
      <div className="settings-content">
        <h2 className="page-title">Account Settings</h2>
        
        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-layout">
            {/* Left Side - Avatar Section */}
            <div className="avatar-section">
              <div className="avatar-preview">
                {previewAvatar ? (
                  <div 
                    className="avatar-image-preview" 
                    style={{ backgroundImage: `url(${previewAvatar})` }}
                  ></div>
                ) : (
                  <div className="avatar-placeholder">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <p>Profile Avatar</p>
                  </div>
                )}
              </div>
              
              <div className="avatar-buttons">
                <label htmlFor="avatar-upload" className="upload-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  Upload Avatar
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                />
                
                {previewAvatar && (
                  <button 
                    type="button" 
                    className="remove-btn"
                    onClick={() => {
                      setPreviewAvatar(null)
                      setFormData({ ...formData, avatar: '' })
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="url-option">
                <label htmlFor="avatar-url">Or enter avatar URL:</label>
                <input
                  id="avatar-url"
                  type="text"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleInputChange}
                  placeholder="https://example.com/avatar.jpg"
                  className="url-input"
                />
              </div>
            </div>

            {/* Right Side - Settings Fields */}
            <div className="form-fields">
              <div className="settings-section">
                <h3 className="section-title">Profile Information</h3>
                
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    disabled
                    className="form-input disabled"
                  />
                  <p className="field-hint">Username cannot be changed</p>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="settings-section">
                <h3 className="section-title">Change Password</h3>
                
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    id="currentPassword"
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    placeholder="Enter current password"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Enter new password"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm new password"
                    className="form-input"
                  />
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => navigate('/home')}
                  className="cancel-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-btn"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default Settings

