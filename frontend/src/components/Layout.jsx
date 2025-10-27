import { useState, useEffect } from 'react'
import Header from './Header'
import api from '../api'
import './Layout.css'

function Layout({ children, activePage, onLogout }) {
  const [username, setUsername] = useState('User')
  const [avatar, setAvatar] = useState(null)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/users/me')
      const currentUsername = response.data.username
      setUsername(currentUsername)
      
      // Fetch avatar
      const userResponse = await api.get(`/users/${currentUsername}`)
      setAvatar(userResponse.data.avatar)
    } catch (err) {
      console.error('Error fetching user:', err)
    }
  }

  return (
    <div className="layout-container">
      <Header 
        username={username} 
        avatar={avatar} 
        onLogout={onLogout}
        activePage={activePage}
      />
      <div className="page-content">
        {children}
      </div>
    </div>
  )
}

export default Layout

