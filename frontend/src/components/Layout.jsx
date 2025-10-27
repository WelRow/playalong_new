import { useState, useEffect } from 'react'
import Header from './Header'
import api from '../api'
import './Layout.css'

function Layout({ children, activePage, onLogout }) {
  const [username, setUsername] = useState('User')
  const [avatar, setAvatar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  // Listen for authentication changes (when user logs in)
  useEffect(() => {
    // Refetch user data when activePage changes (indicates navigation after login)
    if (activePage) {
      fetchCurrentUser()
    }
  }, [activePage])

  // Listen for manual refresh triggers
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchCurrentUser()
    }
  }, [refreshTrigger])

  const fetchCurrentUser = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching current user...')
      
      const response = await api.get('/users/me')
      console.log('✅ User data received:', response.data)
      
      const currentUsername = response.data.username
      setUsername(currentUsername)
      
      // Fetch avatar
      const userResponse = await api.get(`/users/${currentUsername}`)
      setAvatar(userResponse.data.avatar)
      
      console.log('✅ Username set to:', currentUsername)
    } catch (err) {
      console.error('❌ Error fetching user:', err)
      console.error('❌ Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      })
      
      // On mobile, if session fails, try to get username from localStorage as fallback
      const storedUsername = localStorage.getItem('username')
      if (storedUsername) {
        console.log('🔄 Using stored username as fallback:', storedUsername)
        setUsername(storedUsername)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    // Clear localStorage fallback
    localStorage.removeItem('username')
    console.log('🗑️ Cleared username from localStorage')
    
    // Call parent logout handler
    if (onLogout) {
      onLogout()
    }
  }

  const refreshUserData = () => {
    console.log('🔄 Manual refresh triggered')
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="layout-container">
      <Header 
        username={username} 
        avatar={avatar} 
        onLogout={handleLogout}
        activePage={activePage}
        onRefresh={refreshUserData}
      />
      <div className="page-content">
        {children}
      </div>
    </div>
  )
}

export default Layout

