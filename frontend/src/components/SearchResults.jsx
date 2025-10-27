import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from './Layout'
import './SearchResults.css'
import api from '../api'

function SearchResults({ onLogout }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (query) {
      searchPlaylists()
    }
  }, [query])

  const searchPlaylists = async () => {
    try {
      const response = await api.get(`/search/playlists?q=${query}`)
      setPlaylists(response.data.playlists || [])
    } catch (err) {
      console.error('Error searching playlists:', err)
      setPlaylists([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout activePage="home" onLogout={onLogout}>
      <div className="search-results-content">
        <h2 className="page-title">
          Search Results for "{query}"
        </h2>

        {loading ? (
          <div className="loading-text">Searching...</div>
        ) : playlists.length > 0 ? (
          <div className="results-grid">
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
                <div className="playlist-info">
                  <p className="playlist-name">{playlist.name}</p>
                  <p className="playlist-owner">by {playlist.owner}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
            <h3>No playlists found</h3>
            <p>Try searching with different keywords</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SearchResults

