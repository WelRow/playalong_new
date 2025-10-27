import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from './Layout'
import './CreatePlaylist.css'
import api from '../api'

function CreatePlaylist({ onLogout }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('User')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: ''
  })
  const [previewImage, setPreviewImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/users/me')
      setUsername(response.data.username)
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
    
    // Update preview if image URL changes
    if (name === 'image') {
      setPreviewImage(value)
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result)
        setFormData({
          ...formData,
          image: reader.result
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.name.trim()) {
      setError('Playlist name is required')
      setLoading(false)
      return
    }

    try {
      const response = await api.post(`/users/${username}/playlists`, {
        name: formData.name,
        image: formData.image || null,
        description: formData.description || null
      })

      console.log('Playlist created:', response.data)
      // Navigate back to home
      navigate('/home')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create playlist')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout activePage="home" onLogout={onLogout}>
      {/* Create Playlist Form Section */}
      <div className="create-playlist-content">
        <h2 className="page-title">Create New Playlist</h2>
        
        <form onSubmit={handleSubmit} className="playlist-form">
          <div className="form-layout">
            {/* Left Side - Playlist Cover */}
            <div className="cover-section">
              <div className="cover-preview">
                {previewImage ? (
                  <div 
                    className="cover-image-preview" 
                    style={{ backgroundImage: `url(${previewImage})` }}
                  ></div>
                ) : (
                  <div className="cover-placeholder">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <p>Playlist Cover</p>
                  </div>
                )}
              </div>
              
              <div className="cover-buttons">
                <label htmlFor="image-upload" className="upload-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  Upload Image
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                
                {previewImage && (
                  <button 
                    type="button" 
                    className="remove-btn"
                    onClick={() => {
                      setPreviewImage(null)
                      setFormData({ ...formData, image: '' })
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="url-option">
                <label htmlFor="image-url">Or enter image URL:</label>
                <input
                  id="image-url"
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  className="url-input"
                />
              </div>
            </div>

            {/* Right Side - Form Fields */}
            <div className="form-fields">
              <div className="form-group">
                <label htmlFor="name">Playlist Name *</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="My Awesome Playlist"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your playlist..."
                  rows="5"
                  className="form-textarea"
                />
              </div>

              {error && <div className="error-message">{error}</div>}

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
                  className="create-btn"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Playlist'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default CreatePlaylist

