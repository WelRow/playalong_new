# 🎵 Playalong: Social Playlist Platform

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-Fast_Build-646CFF?style=for-the-badge&logo=vite)
![Python](https://img.shields.io/badge/Python-Backend-3776AB?style=for-the-badge&logo=python)
![Spotify API](https://img.shields.io/badge/Spotify-API-1DB954?style=for-the-badge&logo=spotify)
![Render](https://img.shields.io/badge/Deployment-Render-46E3B7?style=for-the-badge&logo=render)

## 📖 Overview

**Playalong** is a full-stack web application designed to bridge the gap between music discovery and social sharing. It allows users to search the Spotify library, curate custom playlists, and manage their music profile in a collaborative environment.

Unlike static playlist tools, Playalong is built as a **dynamic web platform**, leveraging a decoupled architecture with a React frontend and a Python backend to handle OAuth authentication, data persistence, and real-time API interactions.

## 🏗️ Architecture & Tech Stack

The application follows a modern **Client-Server** architecture, deployed via **Render** for seamless cloud hosting.

### ⚡ Frontend (The "View")
* **Framework:** React.js (via Vite) for a high-performance, component-based UI.
* **Styling:** Custom CSS with responsive design principles.
* **State Management:** React Hooks (`useState`, `useEffect`) for managing playlist state and user sessions.
* **Build Tool:** Vite for optimized bundling and hot module replacement (HMR).

### 🧠 Backend (The "Logic")
* **Language:** Python (FastAPI).
* **Database:** SQL-based persistence (via `database.py` and `models.py`) for user profiles and playlist storage.
* **API Integration:** Direct integration with **Spotify Web API** for track metadata, search results, and playback control.
* **Authentication:** OAuth 2.0 flow for secure user login and token management.

## 📂 Project Structure

```text
├── backend/
│   ├── main.py             # Entry point for the Python API
│   ├── models.py           # Database Schema (SQLAlchemy Models)
│   ├── database.py         # Database Connection Logic
│   ├── requirements.txt    # Backend Dependencies
│   └── render.yaml         # Infrastructure as Code (IaC) for Render Deployment
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable React Components
│   │   │   ├── SearchResults.jsx  # Spotify Search UI
│   │   │   ├── Playlist.jsx       # Playlist Management
│   │   │   ├── Auth.jsx           # Login/OAuth Handlers
│   │   │   └── ...
│   │   ├── App.jsx         # Main Router & Layout
│   │   └── api.js          # Axios/Fetch wrappers for Backend calls
│   └── vite.config.js      # Frontend Build Configuration
└── README.md               # Documentation
