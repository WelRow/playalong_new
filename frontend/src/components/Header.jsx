import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Header.css'
import api from '../api'

function Header({ username, avatar, onLogout, activePage }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef(null)
  const dropdownRef = useRef(null)

  // Close suggestions and dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length > 0) {
        try {
          const response = await api.get(`/search/playlists?q=${searchQuery}&limit=3`)
          setSuggestions(response.data.playlists || [])
          setShowSuggestions(true)
        } catch (err) {
          console.error('Error fetching suggestions:', err)
          setSuggestions([])
        }
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }

    // Debounce search
    const timer = setTimeout(() => {
      fetchSuggestions()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowSuggestions(false)
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleSuggestionClick = (playlistId) => {
    setSearchQuery('')
    setShowSuggestions(false)
    navigate(`/playlist/${playlistId}`)
  }

  const handleLogout = async () => {
    if (onLogout) {
      onLogout()
    }
  }

  return (
    <div className="header">
      {/* Left Side: Logo */}
      <div className="header-left">
        <img 
          src="/playalong logo (2).png" 
          alt="PlayAlong Logo" 
          className="header-logo"
          onClick={() => navigate('/home')}
        />
      </div>
      
      {/* Center: Search Bar */}
      <div className="header-center">
        <div className="search-bar" ref={searchRef}>
          <input
            type="text"
            placeholder="Search playlists..."
            className="search-input"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchSubmit}
          />
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          
          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((playlist) => (
                <div 
                  key={playlist.id} 
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(playlist.id)}
                >
                  <div 
                    className="suggestion-image"
                    style={playlist.image ? { backgroundImage: `url(${playlist.image})` } : {}}
                  >
                    {!playlist.image && (
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                      </svg>
                    )}
                  </div>
                  <div className="suggestion-info">
                    <p className="suggestion-name">{playlist.name}</p>
                    <p className="suggestion-owner">by {playlist.owner}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Right Side: Home | Users | Username | Avatar */}
      <div className="header-right">
        <nav className="nav-bar">
          <Link to="/home" className={`nav-link ${activePage === 'home' ? 'active' : ''}`}>Home</Link>
          <span className="nav-divider">|</span>
          <Link to="/users" className={`nav-link ${activePage === 'users' ? 'active' : ''}`}>Users</Link>
          <span className="nav-divider">|</span>
          <span className="nav-username">{username || 'User'}</span>
          <span className="nav-divider">|</span>
          
          {/* Avatar with Dropdown */}
          <div className="avatar-dropdown-container" ref={dropdownRef}>
            <div 
              className="header-avatar"
              onClick={() => setShowDropdown(!showDropdown)}
              style={avatar ? { backgroundImage: `url(${avatar})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
              {!avatar && <span className="avatar-placeholder">{username?.charAt(0).toUpperCase() || 'U'}</span>}
            </div>
            
            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="avatar-dropdown">
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    navigate('/profile')
                    setShowDropdown(false)
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Profile
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    navigate('/settings')
                    setShowDropdown(false)
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"></path>
                    <path d="M19.07 4.93l-4.24 4.24m0 5.66l4.24 4.24M4.93 4.93l4.24 4.24m0 5.66l-4.24 4.24"></path>
                  </svg>
                  Settings
                </button>
                <button 
                  className="dropdown-item logout"
                  onClick={() => {
                    handleLogout()
                    setShowDropdown(false)
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
  )
}

export default Header

