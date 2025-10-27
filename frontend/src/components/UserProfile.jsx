import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from './Layout'
import './Profile.css'  // Reuse Profile.css
import api from '../api'

function UserProfile({ onLogout }) {
  const navigate = useNavigate()
  const { username: viewingUsername } = useParams()  // Username from URL
  const [userInfo, setUserInfo] = useState({
    username: '',
    avatar: null,
    email: '',
    playlistCount: 0
  })
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserProfile()
  }, [viewingUsername])

  const fetchUserProfile = async () => {
    try {
      // Fetch the user we're viewing
      const userResponse = await api.get(`/users/${viewingUsername}`)
      setUserInfo({
        username: viewingUsername,
        avatar: userResponse.data.avatar,
        email: userResponse.data.email || '',
        playlistCount: userResponse.data.playlist_count || 0
      })
      
      // Fetch their playlists
      await fetchUserPlaylists(viewingUsername)
    } catch (err) {
      console.error('Error fetching user profile:', err)
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

  return (
    <Layout activePage="users" onLogout={onLogout}>
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
            <h2 className="section-title">{userInfo.username}'s Playlists</h2>
            
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
              </div>
            ) : (
              <div className="no-playlists">
                <p>{userInfo.username} hasn't created any playlists yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}

export default UserProfile

