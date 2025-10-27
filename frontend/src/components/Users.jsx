import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from './Layout'
import './Users.css'
import api from '../api'

function Users({ onLogout }) {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllUsers()
  }, [])

  const fetchAllUsers = async () => {
    try {
      const response = await api.get('/users')
      setUsers(response.data.users || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout activePage="users" onLogout={onLogout}>
      {/* Users List Section */}
      {loading ? (
        <div className="loading-text">Loading users...</div>
      ) : (
        <div className="users-content">
          <h2 className="page-title">All Users</h2>
          
          {users.length > 0 ? (
            <div className="users-grid">
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className="user-card"
                  onClick={() => navigate(`/user/${user.username}`)}
                >
                  <div 
                    className="user-avatar"
                    style={user.avatar ? { backgroundImage: `url(${user.avatar})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  >
                    {!user.avatar && (
                      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    )}
                  </div>
                  <div className="user-info">
                    <p className="user-name">{user.username}</p>
                    <p className="user-stats">
                      {user.playlist_count} {user.playlist_count === 1 ? 'Playlist' : 'Playlists'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-users">
              <p>No users found</p>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}

export default Users

