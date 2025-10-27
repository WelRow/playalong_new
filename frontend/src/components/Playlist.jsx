import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from './Layout'
import AddSongModal from './AddSongModal'
import './Playlist.css'
import api from '../api'

function Playlist({ onLogout }) {
  const navigate = useNavigate()
  const { playlistId } = useParams()
  const [playlist, setPlaylist] = useState(null)
  const [playlistOwner, setPlaylistOwner] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [draggedSong, setDraggedSong] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)

  useEffect(() => {
    fetchCurrentUser()
    fetchPlaylist()
  }, [playlistId])

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.song-menu-container')) {
        setOpenMenuId(null)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openMenuId])

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/users/me')
      setCurrentUser(response.data.username)
    } catch (err) {
      console.error('Error fetching current user:', err)
    }
  }

  const fetchPlaylist = async () => {
    try {
      const response = await api.get(`/playlists/${playlistId}`)
      setPlaylist(response.data.playlist)
      setPlaylistOwner(response.data.owner)
    } catch (err) {
      console.error('Error fetching playlist:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (duration) => {
    // Assuming duration is in format "3:45"
    return duration || '-'
  }

  const handleAddSong = async (songData) => {
    try {
      await api.post(`/playlists/${playlistId}/songs`, songData)
      
      // Refresh playlist to show new song
      await fetchPlaylist()
    } catch (err) {
      console.error('Error adding song:', err)
      throw new Error(err.response?.data?.detail || 'Failed to add song')
    }
  }

  const handleDeleteSong = async (songId) => {
    if (!window.confirm('Are you sure you want to delete this song?')) {
      return
    }

    try {
      await api.delete(`/playlists/${playlistId}/songs/${songId}`)
      
      // Refresh playlist to show updated list
      await fetchPlaylist()
      setOpenMenuId(null)
    } catch (err) {
      console.error('Error deleting song:', err)
      alert(err.response?.data?.detail || 'Failed to delete song')
    }
  }

  const toggleMenu = (songId) => {
    setOpenMenuId(openMenuId === songId ? null : songId)
  }

  const handleLike = async () => {
    if (!playlist) return
    
    try {
      if (playlist.is_liked) {
        await api.delete(`/playlists/${playlistId}/like`)
      } else {
        await api.post(`/playlists/${playlistId}/like`)
      }
      
      // Refresh playlist
      await fetchPlaylist()
    } catch (err) {
      console.error('Error toggling like:', err)
    }
  }

  // Drag and Drop Handlers
  const handleDragStart = (e, song, index) => {
    if (!isOwner) return
    setDraggedSong({ song, index })
    e.dataTransfer.effectAllowed = 'move'
    // Add a slight delay to show drag state
    setTimeout(() => {
      e.target.style.opacity = '0.5'
    }, 0)
  }

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1'
    setDraggedSong(null)
    setDropTarget(null)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (!draggedSong || draggedSong.index === index) return
    setDropTarget(index)
  }

  const handleDragLeave = () => {
    setDropTarget(null)
  }

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault()
    if (!draggedSong || draggedSong.index === dropIndex) {
      setDraggedSong(null)
      setDropTarget(null)
      return
    }

    const songs = [...playlist.songs]
    const [movedSong] = songs.splice(draggedSong.index, 1)
    songs.splice(dropIndex, 0, movedSong)

    // Update UI optimistically
    setPlaylist({ ...playlist, songs })
    setDraggedSong(null)
    setDropTarget(null)

    // Send new order to backend
    try {
      const songIds = songs.map(s => s.id)
      await api.put(`/playlists/${playlistId}/songs/reorder`, songIds)
    } catch (err) {
      console.error('Error reordering songs:', err)
      // Revert on error
      await fetchPlaylist()
      alert('Failed to reorder songs')
    }
  }

  // Check if current user is the playlist owner
  const isOwner = currentUser && playlistOwner && currentUser === playlistOwner

  return (
    <Layout activePage="home" onLogout={onLogout}>
      {/* Playlist Content Section */}
      {loading ? (
        <div className="loading-text">Loading playlist...</div>
      ) : playlist ? (
        <div className="playlist-content">
          {/* Playlist Header with Cover and Info */}
          <div className="playlist-header">
            <div className="playlist-cover-large">
              {playlist.image === 'gradient' ? (
                <div className="cover-image gradient-bg"></div>
              ) : playlist.image ? (
                <div 
                  className="cover-image" 
                  style={{ backgroundImage: `url(${playlist.image})` }}
                ></div>
              ) : (
                <div className="cover-image" style={{ backgroundColor: '#3a3a3a' }}></div>
              )}
            </div>
            <div className="playlist-info">
              <p className="playlist-label">Playlist</p>
              <h1 className="playlist-title">{playlist.name}</h1>
              {playlist.description && (
                <p className="playlist-description">{playlist.description}</p>
              )}
              <p className="playlist-meta">
                {playlistOwner && (
                  <span 
                    className="playlist-owner-link" 
                    onClick={() => navigate(`/user/${playlistOwner}`)}
                    style={{ cursor: 'pointer', marginRight: '0.5rem' }}
                  >
                    by {playlistOwner}
                  </span>
                )}
                · {playlist.songs?.length || 0} {playlist.songs?.length === 1 ? 'song' : 'songs'} ·
                <button 
                  className={`like-heart-btn ${playlist.is_liked ? 'liked' : ''}`}
                  onClick={handleLike}
                  title={playlist.is_liked ? 'Unlike' : 'Like'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={playlist.is_liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  {playlist.likes_count || 0}
                </button>
              </p>
            </div>
          </div>

          {/* Songs List */}
          <div className="songs-section">
            <div className="songs-header-row">
              <h3 className="songs-title">Songs</h3>
              {isOwner && (
                <button className="add-song-header-btn" onClick={() => setIsModalOpen(true)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Song
                </button>
              )}
            </div>
            
            <div className="songs-header">
              <div className="song-number">#</div>
              <div className="song-title-header">Title</div>
              <div className="song-artist-header">Artist</div>
              <div className="song-album-header">Album</div>
              <div className="song-duration-header">Duration</div>
              <div className="song-link-header">Link</div>
              {isOwner && <div className="song-actions-header"></div>}
            </div>

            {playlist.songs && playlist.songs.length > 0 ? (
              <div className="songs-list">
                {playlist.songs.map((song, index) => (
                  <div 
                    key={song.id} 
                    className={`song-row ${draggedSong?.index === index ? 'dragging' : ''}`}
                    draggable={isOwner}
                    onDragStart={(e) => handleDragStart(e, song, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    {dropTarget === index && draggedSong?.index !== index && (
                      <div className="drop-indicator" />
                    )}
                    <div className="song-number">
                      {isOwner ? (
                        <span className="drag-handle">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="9" cy="5" r="2"></circle>
                            <circle cx="9" cy="12" r="2"></circle>
                            <circle cx="9" cy="19" r="2"></circle>
                            <circle cx="15" cy="5" r="2"></circle>
                            <circle cx="15" cy="12" r="2"></circle>
                            <circle cx="15" cy="19" r="2"></circle>
                          </svg>
                          <span className="song-number-text">{index + 1}</span>
                        </span>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="song-title">{song.title}</div>
                    <div className="song-artist">{song.artist}</div>
                    <div className="song-album">{song.album || '-'}</div>
                    <div className="song-duration">{formatDuration(song.duration)}</div>
                    <div className="song-link">
                      {song.url ? (
                        <a 
                          href={song.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="song-url-link"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                          Play
                        </a>
                      ) : (
                        <span className="no-link">-</span>
                      )}
                    </div>
                    {isOwner && (
                      <div className="song-actions">
                        <div className="song-menu-container">
                          <button 
                            className="song-menu-btn"
                            onClick={() => toggleMenu(song.id)}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="5" r="2"></circle>
                              <circle cx="12" cy="12" r="2"></circle>
                              <circle cx="12" cy="19" r="2"></circle>
                            </svg>
                          </button>
                          {openMenuId === song.id && (
                            <div className="song-menu-dropdown">
                              <button 
                                className="song-menu-item delete"
                                onClick={() => handleDeleteSong(song.id)}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  <line x1="10" y1="11" x2="10" y2="17"></line>
                                  <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-songs">
                <p>No songs in this playlist yet</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="error-text">Playlist not found</div>
      )}
      
      {/* Add Song Modal */}
      <AddSongModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddSong={handleAddSong}
      />
    </Layout>
  )
}

export default Playlist

