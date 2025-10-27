import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from './Layout'
import './Profile.css'
import api from '../api'

function Profile({ onLogout }) {
  const navigate = useNavigate()
  const [userInfo, setUserInfo] = useState({
    username: '',
    avatar: null,
    email: '',
    playlistCount: 0
  })
  const [playlists, setPlaylists] = useState([])
  const [likedPlaylists, setLikedPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [likedLoading, setLikedLoading] = useState(true)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/users/me')
      const currentUsername = response.data.username
      
      // Fetch full user data
      const userResponse = await api.get(`/users/${currentUsername}`)
      setUserInfo({
        username: currentUsername,
        avatar: userResponse.data.avatar,
        email: userResponse.data.email || '',
        playlistCount: userResponse.data.playlist_count || 0
      })
      
      // Fetch user's playlists
      await fetchUserPlaylists(currentUsername)
      await fetchLikedPlaylists(currentUsername)
    } catch (err) {
      console.error('Error fetching user:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPlaylists = async (username) => {
    try {
      const response = await api.get(`/users/${username}/playlists`)
      setPlaylists(response.data.playlists || [])
    } catch (err) {
      console.error('Error fetching playlists:', err)
      setPlaylists([])
    }
  }

  const fetchLikedPlaylists = async (username) => {
    try {
      const response = await api.get(`/users/${username}/liked-playlists`)
      setLikedPlaylists(response.data.playlists || [])
    } catch (err) {
      console.error('Error fetching liked playlists:', err)
      setLikedPlaylists([])
    } finally {
      setLikedLoading(false)
    }
  }

  return (
    <Layout activePage="profile" onLogout={onLogout}>
      {/* Profile Content Section */}
      {loading ? (
        <div className="loading-text">Loading profile...</div>
      ) : (
        <div className="profile-content">
          {/* Profile Header */}
          <div className="profile-header">
            <div className="profile-avatar-large">
              {userInfo.avatar ? (
                <div 
                  className="avatar-image" 
                  style={{ backgroundImage: `url(${userInfo.avatar})` }}
                ></div>
              ) : (
                <div className="avatar-placeholder">
                  <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              )}
            </div>
            
            <div className="profile-info">
              <p className="profile-label">Profile</p>
              <h1 className="profile-username">{userInfo.username}</h1>
              <div className="profile-stats">
                <span className="stat-item">{userInfo.playlistCount} {userInfo.playlistCount === 1 ? 'Playlist' : 'Playlists'}</span>
              </div>
            </div>
          </div>

          {/* User's Playlists Section */}
          <div className="user-playlists-section">
            <h2 className="section-title">My Playlists</h2>
            
             {playlists.length > 0 ? (
              <div className="playlists-grid">
                {playlists.map((playlist) => (
                  <div 
                    key={playlist.id} 
                    className="playlist-card"
                    onClick={() => navigate(`/playlist/${playlist.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {playlist.image === 'gradient' ? (
                      <div className="playlist-image gradient-bg"></div>
                    ) : playlist.image ? (
                      <div 
                        className="playlist-image" 
                        style={{ backgroundImage: `url(${playlist.image})` }}
                      ></div>
                    ) : (
                      <div className="playlist-image" style={{ backgroundColor: '#3a3a3a' }}></div>
                    )}
                    <p className="playlist-name">{playlist.name}</p>
                  </div>
                ))}
                
                {/* New Playlist Card */}
                <div 
                  className="playlist-card new-playlist"
                  onClick={() => navigate('/create-playlist')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="playlist-image new-playlist-icon">
                    <span className="plus-icon">+</span>
                  </div>
                  <p className="playlist-name">New Playlist</p>
                </div>
              </div>
            ) : (
              <div className="no-playlists">
                <p>You haven't created any playlists yet</p>
                <button 
                  className="create-first-btn"
                  onClick={() => navigate('/create-playlist')}
                >
                  Create Your First Playlist
                </button>
              </div>
            )}
          </div>

          {/* Liked Playlists Section */}
          <div className="user-playlists-section">
            <h2 className="section-title">Liked Playlists</h2>
            
            {likedLoading ? (
              <p className="loading-text">Loading liked playlists...</p>
            ) : likedPlaylists.length > 0 ? (
              <div className="playlists-grid">
                {likedPlaylists.map((playlist) => (
                  <div 
                    key={playlist.id} 
                    className="playlist-card"
                    onClick={() => navigate(`/playlist/${playlist.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {playlist.image === 'gradient' ? (
                      <div className="playlist-image gradient-bg"></div>
                    ) : playlist.image ? (
                      <div 
                        className="playlist-image" 
                        style={{ backgroundImage: `url(${playlist.image})` }}
                      ></div>
                    ) : (
                      <div className="playlist-image" style={{ backgroundColor: '#3a3a3a' }}></div>
                    )}
                    <p className="playlist-name">{playlist.name}</p>
                    <p className="playlist-owner-text">by {playlist.owner}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-playlists">
                <p>You haven't liked any playlists yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Profile

