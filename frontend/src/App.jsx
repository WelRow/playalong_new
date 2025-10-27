import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Auth from './components/Auth'
import Home from './components/Home'
import Playlist from './components/Playlist'
import CreatePlaylist from './components/CreatePlaylist'
import Settings from './components/Settings'
import Profile from './components/Profile'
import Users from './components/Users'
import UserProfile from './components/UserProfile'
import SearchResults from './components/SearchResults'
import api from './api'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      await api.get('/users/me')
      setIsAuthenticated(true)
    } catch (error) {
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      backgroundColor: '#2a2a2a',
      color: 'white',
      fontSize: '1.5rem'
    }}>Loading...</div>
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/auth" 
          element={isAuthenticated ? <Navigate to="/home" /> : <Auth onLogin={() => setIsAuthenticated(true)} />} 
        />
        <Route 
          path="/home" 
          element={isAuthenticated ? <Home onLogout={() => setIsAuthenticated(false)} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/search" 
          element={isAuthenticated ? <SearchResults onLogout={() => setIsAuthenticated(false)} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/users" 
          element={isAuthenticated ? <Users onLogout={() => setIsAuthenticated(false)} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/user/:username" 
          element={isAuthenticated ? <UserProfile onLogout={() => setIsAuthenticated(false)} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/profile" 
          element={isAuthenticated ? <Profile onLogout={() => setIsAuthenticated(false)} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/settings" 
          element={isAuthenticated ? <Settings onLogout={() => setIsAuthenticated(false)} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/create-playlist" 
          element={isAuthenticated ? <CreatePlaylist onLogout={() => setIsAuthenticated(false)} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/playlist/:playlistId" 
          element={isAuthenticated ? <Playlist onLogout={() => setIsAuthenticated(false)} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/home" : "/auth"} />} 
        />
      </Routes>
    </Router>
  )
}

export default App
