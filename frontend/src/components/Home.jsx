import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from './Layout'
import './Home.css'
import api from '../api'

function Home({ onLogout }) {
  const navigate = useNavigate()
  const [playlists, setPlaylists] = useState([])
  const [recentPlaylists, setRecentPlaylists] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [recentLoading, setRecentLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)

  useEffect(() => {
    fetchUserPlaylists()
    fetchRecentPlaylists()
    fetchRecentUsers()
  }, [])

  const fetchUserPlaylists = async () => {
    try {
      const response = await api.get('/users/me')
      const currentUsername = response.data.username
      
      // Fetch user's playlists
      const playlistsResponse = await api.get(`/users/${currentUsername}/playlists`)
      setPlaylists(playlistsResponse.data.playlists || [])
    } catch (err) {
      console.error('Error fetching playlists:', err)
      setPlaylists([])
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentPlaylists = async () => {
    try {
      const response = await api.get('/playlists/recent?limit=10')
      setRecentPlaylists(response.data.playlists || [])
    } catch (err) {
      console.error('Error fetching recent playlists:', err)
      setRecentPlaylists([])
    } finally {
      setRecentLoading(false)
    }
  }

  const fetchRecentUsers = async () => {
    try {
      const response = await api.get('/users/recent?limit=6')
      setRecentUsers(response.data.users || [])
    } catch (err) {
      console.error('Error fetching recent users:', err)
      setRecentUsers([])
    } finally {
      setUsersLoading(false)
    }
  }

  const handleLike = async (e, playlistId, isLiked) => {
    e.stopPropagation() // Prevent navigation to playlist
    
    try {
      if (isLiked) {
        await api.delete(`/playlists/${playlistId}/like`)
      } else {
        await api.post(`/playlists/${playlistId}/like`)
      }
      
      // Refresh both playlists lists
      await fetchUserPlaylists()
      await fetchRecentPlaylists()
    } catch (err) {
      console.error('Error toggling like:', err)
    }
  }

  return (
    <Layout activePage="home" onLogout={onLogout}>
      {/* Your Playlists Section */}
      <div className="home-section">
        <h2 className="section-title">Your Playlists</h2>
        
        <div className="playlists-container">
          {loading ? (
            <p className="loading-text">Loading playlists...</p>
          ) : (
            <>
              {playlists.map((playlist) => (
                <div 
                  key={playlist.id} 
                  className="playlist-card"
                  onClick={() => navigate(`/playlist/${playlist.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="playlist-image-container">
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
                    <button 
                      className={`like-btn ${playlist.is_liked ? 'liked' : ''}`}
                      onClick={(e) => handleLike(e, playlist.id, playlist.is_liked)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={playlist.is_liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                      <span className="likes-count">{playlist.likes_count || 0}</span>
                    </button>
                  </div>
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
            </>
          )}
        </div>
      </div>

      {/* Recently Created Playlists Section */}
      <div className="home-section">
        <h2 className="section-title">Recently Created Playlists</h2>
        
        <div className="playlists-container">
          {recentLoading ? (
            <p className="loading-text">Loading recent playlists...</p>
          ) : recentPlaylists.length > 0 ? (
            <>
              {recentPlaylists.map((playlist) => (
                <div 
                  key={playlist.id} 
                  className="playlist-card"
                  onClick={() => navigate(`/playlist/${playlist.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="playlist-image-container">
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
                    <button 
                      className={`like-btn ${playlist.is_liked ? 'liked' : ''}`}
                      onClick={(e) => handleLike(e, playlist.id, playlist.is_liked)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={playlist.is_liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                      <span className="likes-count">{playlist.likes_count || 0}</span>
                    </button>
                  </div>
                  <p className="playlist-name">{playlist.name}</p>
                  <p className="playlist-owner">by {playlist.owner}</p>
                </div>
              ))}
            </>
          ) : (
            <p className="empty-message">No recent playlists yet</p>
          )}
        </div>
      </div>

      {/* New Users Section */}
      <div className="home-section">
        <h2 className="section-title">New Users</h2>
        
        <div className="users-container">
          {usersLoading ? (
            <p className="loading-text">Loading new users...</p>
          ) : recentUsers.length > 0 ? (
            <>
              {recentUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="user-card"
                  onClick={() => navigate(`/user/${user.username}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {user.avatar ? (
                    <div 
                      className="user-avatar" 
                      style={{ backgroundImage: `url(${user.avatar})` }}
                    ></div>
                  ) : (
                    <div className="user-avatar default-avatar">
                      <span className="avatar-initial">{user.username.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <p className="user-name">{user.username}</p>
                  <p className="user-playlist-count">{user.playlist_count} playlists</p>
                </div>
              ))}
            </>
          ) : (
            <p className="empty-message">No new users yet</p>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Home

