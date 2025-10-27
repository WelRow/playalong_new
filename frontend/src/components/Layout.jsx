import { useState, useEffect } from 'react'
import Header from './Header'
import api from '../api'
import './Layout.css'

function Layout({ children, activePage, onLogout }) {
  // Initialize with cached data from localStorage
  const [username, setUsername] = useState(() => {
    const cached = localStorage.getItem('username')
    return cached || 'User'
  })
  const [avatar, setAvatar] = useState(() => {
    const cached = localStorage.getItem('userAvatar')
    return cached || null
  })
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    // Load cached data first for immediate display
    loadCachedUserData()
    // Then fetch fresh data from server
    fetchCurrentUser()
  }, [])

  const loadCachedUserData = () => {
    const cachedUserData = localStorage.getItem('userData')
    if (cachedUserData) {
      try {
        const userData = JSON.parse(cachedUserData)
        console.log('🔄 [Layout] Loading cached user data:', userData)
        if (userData.username) setUsername(userData.username)
        if (userData.avatar) setAvatar(userData.avatar)
      } catch (err) {
        console.error('❌ Failed to parse cached user data:', err)
      }
    }
  }

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

  // Additional mobile refresh: try to refresh when component mounts and no avatar
  useEffect(() => {
    if (!avatar && username && username !== 'User') {
      console.log('🔄 [Layout] No avatar found, attempting refresh for:', username)
      // Try to get avatar from localStorage first
      const storedAvatar = localStorage.getItem('userAvatar')
      if (storedAvatar) {
        console.log('🔄 [Layout] Found stored avatar, setting it')
        setAvatar(storedAvatar)
      } else {
        // If no stored avatar, try to refresh
        fetchCurrentUser()
      }
    }
  }, [avatar, username])

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
      const userAvatar = userResponse.data.avatar
      setAvatar(userAvatar)
      
      // Cache complete user data in localStorage for mobile fallback
      const userData = {
        username: currentUsername,
        email: userResponse.data.email,
        avatar: userAvatar
      }
      localStorage.setItem('userAvatar', userAvatar || '')
      localStorage.setItem('userData', JSON.stringify(userData))
      console.log('💾 Complete user data cached in localStorage')
      
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
      const storedAvatar = localStorage.getItem('userAvatar')
      
      if (storedUsername) {
        console.log('🔄 Using stored username as fallback:', storedUsername)
        setUsername(storedUsername)
      }
      
      if (storedAvatar) {
        console.log('🔄 Using stored avatar as fallback')
        setAvatar(storedAvatar)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    // Clear all localStorage data
    localStorage.removeItem('username')
    localStorage.removeItem('userAvatar')
    localStorage.removeItem('userData')
    console.log('🗑️ Cleared all user data from localStorage')
    
    // Call parent logout handler
    if (onLogout) {
      onLogout()
    }
  }

  const refreshUserData = () => {
    console.log('🔄 Manual refresh triggered')
    setRefreshTrigger(prev => prev + 1)
  }

  // Debug logging for mobile avatar issues
  useEffect(() => {
    console.log('🔍 [Layout] State values:', { username, avatar, activePage })
    console.log('🔍 [Layout] Avatar type:', typeof avatar, 'Value:', avatar)
  }, [username, avatar, activePage])

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

