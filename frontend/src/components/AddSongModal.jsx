import { useState } from 'react'
import './AddSongModal.css'

function AddSongModal({ isOpen, onClose, onAddSong }) {
  const [songData, setSongData] = useState({
    title: '',
    artist: '',
    duration: '',
    album: '',
    url: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSongData({
      ...songData,
      [name]: value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!songData.title.trim() || !songData.artist.trim() || !songData.url.trim()) {
      setError('Title, Artist, and Song Link are required')
      setLoading(false)
      return
    }

    try {
      await onAddSong({
        title: songData.title,
        artist: songData.artist,
        duration: songData.duration || null,
        album: songData.album || null,
        url: songData.url
      })

      // Clear form
      setSongData({
        title: '',
        artist: '',
        duration: '',
        album: '',
        url: ''
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to add song')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setSongData({
      title: '',
      artist: '',
      duration: '',
      album: '',
      url: ''
    })
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Song to Playlist</h2>
          <button className="close-btn" onClick={handleCancel}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="song-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Song Title *</label>
              <input
                id="title"
                type="text"
                name="title"
                value={songData.title}
                onChange={handleInputChange}
                placeholder="Enter song title"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="artist">Artist *</label>
              <input
                id="artist"
                type="text"
                name="artist"
                value={songData.artist}
                onChange={handleInputChange}
                placeholder="Enter artist name"
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="duration">Duration</label>
              <input
                id="duration"
                type="text"
                name="duration"
                value={songData.duration}
                onChange={handleInputChange}
                placeholder="3:45 (optional)"
                className="form-input"
              />
              <p className="field-hint">Optional: Format MM:SS (e.g., 3:45)</p>
            </div>

            <div className="form-group">
              <label htmlFor="album">Album</label>
              <input
                id="album"
                type="text"
                name="album"
                value={songData.album}
                onChange={handleInputChange}
                placeholder="Album name (optional)"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="url">Song Link *</label>
            <input
              id="url"
              type="url"
              name="url"
              value={songData.url}
              onChange={handleInputChange}
              placeholder="https://youtube.com/watch?v=... or Spotify link"
              required
              className="form-input"
            />
            <p className="field-hint">YouTube, Spotify, or any music platform link</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button 
              type="button" 
              onClick={handleCancel}
              className="cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="add-btn"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Song'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddSongModal

