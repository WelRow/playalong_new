from fastapi import FastAPI, Request, Depends, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from dotenv import load_dotenv
import os

# Import database and models
from database import engine, get_db
import models

# Load environment variables
load_dotenv()

origins = ["http://localhost:5173", 
    "https://playalong-api.onrender.com",
    "https://playalong-frontend.vercel.app",
    "https://www.naturalsharp.net"
]

app = FastAPI(
    title="Music Playlist API",
    description="API for a music playlist",
    version="1.0.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Use SECRET_KEY from .env
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY", "YOUR_32_BYTE_RANDOM_SECRET_KEY_GOES_HERE")
)


# Create database tables on startup
@app.on_event("startup")
def startup_event():
    models.Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")


# --- Pydantic Models (The "Data Structure") ---
class UserLogin(BaseModel):
    username: str
    password: str

class Song(BaseModel):
    id: int | None = None
    title: str
    artist: str
    duration: str | None = None  # e.g., "3:45" - OPTIONAL
    album: str | None = None
    url: str  # Link to the song (YouTube, Spotify, etc.) - REQUIRED

class PlaylistCreate(BaseModel):
    name: str
    image: str | None = None
    description: str | None = None

class PlaylistUpdate(BaseModel):
    name: str | None = None
    image: str | None = None
    description: str | None = None

class UserUpdate(BaseModel):
    email: str | None = None
    password: str | None = None
    avatar: str | None = None


# ============================================
# AUTHENTICATION ROUTES
# ============================================

@app.post("/auth/login")
async def login(request: Request, user_login: UserLogin, db: Session = Depends(get_db)):
    """
    Login - Check credentials and create session
    """
    # Find user by username
    user = db.query(models.User).filter(models.User.username == user_login.username).first()
    
    # Check if user exists and password is correct (prototype check)
    if not user or user.hashed_password != user_login.password:
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    # Create session
    request.session["user_id"] = user.id
    request.session["username"] = user.username
    
    return {"message": f"Welcome {user.username}", "user_id": user.id}


@app.post("/auth/logout")
async def logout(request: Request):
    """
    Logout - Destroy session
    """
    request.session.clear()
    return {"message": "Logged out successfully"}


@app.post("/auth/register")
async def register(request: Request, user_register: UserLogin, db: Session = Depends(get_db)):
    """
    Register new user
    """
    # Check if user already exists
    existing_user = db.query(models.User).filter(
        models.User.username == user_register.username
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken")

    # Create new user
    new_user = models.User(
        username=user_register.username,
        hashed_password=user_register.password,  # In real app, use bcrypt
        email=f"{user_register.username}@example.com"
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Log them in immediately by creating a session
    request.session["user_id"] = new_user.id
    request.session["username"] = new_user.username

    print(f"✅ NEW USER CREATED: {new_user.username} (ID: {new_user.id})")

    return {
        "message": f"User {new_user.username} created and logged in",
        "user_id": new_user.id
    }


@app.get("/users/me")
async def get_current_user(request: Request):
    """
    Get current authenticated user
    """
    user_id = request.session.get("user_id")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    return {
        "user_id": user_id,
        "username": request.session.get("username")
    }  


# ============================================
# USERS ROUTES
# ============================================

@app.get("/users")
async def get_all_users(db: Session = Depends(get_db)):
    """
    Get all users (for admin/social features) - sorted by signup order
    """
    users = db.query(models.User).order_by(models.User.id.asc()).all()
    users_list = [user.to_dict() for user in users]
    return {"users": users_list}


# IMPORTANT: Specific routes must come BEFORE parameterized routes
@app.get("/users/recent")
async def get_recent_users(limit: int = 6, db: Session = Depends(get_db)):
    """
    Get recently registered users
    limit: maximum number of results (default 6)
    """
    # Get users ordered by ID descending (newest first)
    users = db.query(models.User).order_by(models.User.id.desc()).limit(limit).all()
    
    # Return users with their data
    results = [user.to_dict() for user in users]
    return {"users": results}


@app.get("/users/{username}")
async def get_user_profile(username: str, db: Session = Depends(get_db)):
    """
    Get a specific user's profile
    """
    user = db.query(models.User).filter(models.User.username == username).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user.to_dict()


@app.put("/users/{username}")
async def update_user_profile(username: str, user_update: UserUpdate, request: Request, db: Session = Depends(get_db)):
    """
    Update a user's profile (authentication required)
    """
    # Check if user is authenticated
    session_username = request.session.get("username")
    if not session_username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if user is updating their own profile
    if session_username != username:
        raise HTTPException(status_code=403, detail="Cannot update another user's profile")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields
    if user_update.email is not None:
        user.email = user_update.email
    if user_update.password is not None:
        user.hashed_password = user_update.password  # In real app, hash this
    if user_update.avatar is not None:
        user.avatar = user_update.avatar
    
    db.commit()
    db.refresh(user)
    
    return {"message": f"User {username} updated successfully", "user": user.to_dict()}


@app.delete("/users/{username}")
async def delete_user_account(username: str, request: Request, db: Session = Depends(get_db)):
    """
    Delete a user's account (authentication required)
    """
    # Check if user is authenticated
    session_username = request.session.get("username")
    if not session_username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if user is deleting their own account
    if session_username != username:
        raise HTTPException(status_code=403, detail="Cannot delete another user's account")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete user (playlists will be deleted automatically due to cascade)
    db.delete(user)
    db.commit()
    
    # Clear session
    request.session.clear()
    
    return {"message": f"User {username} deleted successfully"}


# ============================================
# PLAYLISTS ROUTES
# ============================================

@app.get("/users/{username}/playlists")
async def get_user_playlists(username: str, request: Request, db: Session = Depends(get_db)):
    """
    Get all playlists for a specific user
    """
    # Get current user if authenticated
    current_user_id = None
    session_username = request.session.get("username")
    if session_username:
        current_user = db.query(models.User).filter(models.User.username == session_username).first()
        if current_user:
            current_user_id = current_user.id
    
    user = db.query(models.User).filter(models.User.username == username).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    playlists = []
    for playlist in user.playlists:
        playlist_dict = playlist.to_dict()
        playlist_dict["likes_count"] = len(playlist.likes)
        
        # Check if current user has liked this playlist
        if current_user_id:
            is_liked = any(like.user_id == current_user_id for like in playlist.likes)
            playlist_dict["is_liked"] = is_liked
        else:
            playlist_dict["is_liked"] = False
        
        playlists.append(playlist_dict)
    
    return {"playlists": playlists}


@app.post("/users/{username}/playlists")
async def create_playlist(username: str, playlist_data: PlaylistCreate, request: Request, db: Session = Depends(get_db)):
    """
    Create a new playlist for a user (authentication required)
    """
    try:
        # Check if user is authenticated
        session_username = request.session.get("username")
        if not session_username:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # Check if user is creating playlist for themselves
        if session_username != username:
            raise HTTPException(status_code=403, detail="Cannot create playlist for another user")
        
        user = db.query(models.User).filter(models.User.username == username).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create new playlist
        new_playlist = models.Playlist(
            name=playlist_data.name,
            image=playlist_data.image,
            description=playlist_data.description,
            user_id=user.id,
            songs=[]
        )
        
        db.add(new_playlist)
        db.commit()
        db.refresh(new_playlist)
        
        print(f"✅ PLAYLIST CREATED: '{new_playlist.name}' (ID: {new_playlist.id}) for user {username}")
        
        return {"message": "Playlist created successfully", "playlist": new_playlist.to_dict()}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ ERROR CREATING PLAYLIST: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# IMPORTANT: Specific routes must come BEFORE parameterized routes
@app.get("/playlists/recent")
async def get_recent_playlists(limit: int = 10, request: Request = None, db: Session = Depends(get_db)):
    """
    Get recently created playlists from all users
    limit: maximum number of results (default 10)
    """
    # Get current user if authenticated
    current_user_id = None
    if request:
        session_username = request.session.get("username")
        if session_username:
            user = db.query(models.User).filter(models.User.username == session_username).first()
            if user:
                current_user_id = user.id
    
    # Get playlists ordered by ID descending (newest first)
    playlists = db.query(models.Playlist).order_by(models.Playlist.id.desc()).limit(limit).all()
    
    # Return playlists with owner info and likes
    results = []
    for playlist in playlists:
        playlist_dict = playlist.to_dict()
        playlist_dict["owner"] = playlist.owner.username
        playlist_dict["likes_count"] = len(playlist.likes)
        
        # Check if current user has liked this playlist
        if current_user_id:
            is_liked = any(like.user_id == current_user_id for like in playlist.likes)
            playlist_dict["is_liked"] = is_liked
        else:
            playlist_dict["is_liked"] = False
        
        results.append(playlist_dict)
    
    return {"playlists": results}


@app.get("/playlists/{playlist_id}")
async def get_playlist(playlist_id: int, request: Request, db: Session = Depends(get_db)):
    """
    Get a specific playlist by ID
    """
    # Get current user if authenticated
    current_user_id = None
    session_username = request.session.get("username")
    if session_username:
        user = db.query(models.User).filter(models.User.username == session_username).first()
        if user:
            current_user_id = user.id
    
    playlist = db.query(models.Playlist).filter(models.Playlist.id == playlist_id).first()
    
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    playlist_dict = playlist.to_dict()
    playlist_dict["likes_count"] = len(playlist.likes)
    
    # Check if current user has liked this playlist
    if current_user_id:
        is_liked = any(like.user_id == current_user_id for like in playlist.likes)
        playlist_dict["is_liked"] = is_liked
    else:
        playlist_dict["is_liked"] = False
    
    return {"playlist": playlist_dict, "owner": playlist.owner.username}


@app.put("/playlists/{playlist_id}")
async def update_playlist(playlist_id: int, playlist_update: PlaylistUpdate, request: Request, db: Session = Depends(get_db)):
    """
    Update a playlist (name, image, description)
    """
    # Check if user is authenticated
    session_username = request.session.get("username")
    if not session_username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find the playlist
    playlist = db.query(models.Playlist).filter(models.Playlist.id == playlist_id).first()
    
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    # Check if user owns this playlist
    if playlist.owner.username != session_username:
        raise HTTPException(status_code=403, detail="You don't have permission to update this playlist")
    
    # Update fields
    if playlist_update.name is not None:
        playlist.name = playlist_update.name
    if playlist_update.image is not None:
        playlist.image = playlist_update.image
    if playlist_update.description is not None:
        playlist.description = playlist_update.description
    
    db.commit()
    db.refresh(playlist)
    
    return {"message": "Playlist updated successfully", "playlist": playlist.to_dict()}


@app.delete("/playlists/{playlist_id}")
async def delete_playlist(playlist_id: int, request: Request, db: Session = Depends(get_db)):
    """
    Delete a playlist
    """
    # Check if user is authenticated
    session_username = request.session.get("username")
    if not session_username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    playlist = db.query(models.Playlist).filter(models.Playlist.id == playlist_id).first()
    
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    # Check if user owns this playlist
    if playlist.owner.username != session_username:
        raise HTTPException(status_code=403, detail="You don't have permission to delete this playlist")
    
    db.delete(playlist)
    db.commit()
    
    return {"message": "Playlist deleted successfully"}


# ============================================
# SONGS/TRACKS ROUTES
# ============================================

@app.get("/playlists/{playlist_id}/songs")
async def get_playlist_songs(playlist_id: int, db: Session = Depends(get_db)):
    """
    Get all songs in a playlist
    """
    playlist = db.query(models.Playlist).filter(models.Playlist.id == playlist_id).first()
    
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    return {"songs": playlist.songs if playlist.songs else []}


@app.post("/playlists/{playlist_id}/songs")
async def add_song_to_playlist(playlist_id: int, song: Song, request: Request, db: Session = Depends(get_db)):
    """
    Add a song to a playlist
    """
    # Check if user is authenticated
    session_username = request.session.get("username")
    if not session_username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    playlist = db.query(models.Playlist).filter(models.Playlist.id == playlist_id).first()
    
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    # Check if user owns this playlist
    if playlist.owner.username != session_username:
        raise HTTPException(status_code=403, detail="You don't have permission to modify this playlist")
    
    # Get current songs or initialize empty list
    songs = playlist.songs if playlist.songs else []
    
    # Generate new song ID
    new_song_id = max([s.get("id", 0) for s in songs], default=0) + 1
    
    # Add song
    song_dict = song.model_dump()
    song_dict["id"] = new_song_id
    songs.append(song_dict)
    
    # Update playlist
    playlist.songs = songs
    # IMPORTANT: Tell SQLAlchemy that the JSON column has been modified
    flag_modified(playlist, "songs")
    db.commit()
    db.refresh(playlist)
    
    print(f"✅ SONG ADDED: '{song_dict['title']}' to playlist '{playlist.name}' (ID: {playlist.id}). Total songs: {len(playlist.songs)}")
    
    return {"message": "Song added successfully", "song": song_dict}


@app.delete("/playlists/{playlist_id}/songs/{song_id}")
async def remove_song_from_playlist(playlist_id: int, song_id: int, request: Request, db: Session = Depends(get_db)):
    """
    Remove a song from a playlist
    """
    # Check if user is authenticated
    session_username = request.session.get("username")
    if not session_username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    playlist = db.query(models.Playlist).filter(models.Playlist.id == playlist_id).first()
    
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    # Check if user owns this playlist
    if playlist.owner.username != session_username:
        raise HTTPException(status_code=403, detail="You don't have permission to modify this playlist")
    
    # Remove song
    songs = playlist.songs if playlist.songs else []
    updated_songs = [s for s in songs if s.get("id") != song_id]
    
    if len(updated_songs) == len(songs):
        raise HTTPException(status_code=404, detail="Song not found in playlist")
    
    playlist.songs = updated_songs
    flag_modified(playlist, "songs")
    db.commit()
    
    return {"message": "Song removed successfully"}


@app.put("/playlists/{playlist_id}/songs/reorder")
async def reorder_playlist_songs(playlist_id: int, song_ids: list[int], request: Request, db: Session = Depends(get_db)):
    """
    Reorder songs in a playlist (provide list of song IDs in desired order)
    """
    # Check if user is authenticated
    session_username = request.session.get("username")
    if not session_username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    playlist = db.query(models.Playlist).filter(models.Playlist.id == playlist_id).first()
    
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    # Check if user owns this playlist
    if playlist.owner.username != session_username:
        raise HTTPException(status_code=403, detail="You don't have permission to modify this playlist")
    
    # Create a mapping of song_id to song object
    songs = playlist.songs if playlist.songs else []
    song_map = {song.get("id"): song for song in songs}
    
    # Reorder based on provided IDs
    reordered_songs = []
    for song_id in song_ids:
        if song_id in song_map:
            reordered_songs.append(song_map[song_id])
    
    playlist.songs = reordered_songs
    flag_modified(playlist, "songs")
    db.commit()
    db.refresh(playlist)
    
    return {"message": "Songs reordered successfully", "songs": reordered_songs}


# ============================================
# LIKES ROUTES
# ============================================

@app.post("/playlists/{playlist_id}/like")
async def like_playlist(playlist_id: int, request: Request, db: Session = Depends(get_db)):
    """
    Like a playlist
    """
    # Check if user is authenticated
    session_username = request.session.get("username")
    if not session_username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get user
    user = db.query(models.User).filter(models.User.username == session_username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if playlist exists
    playlist = db.query(models.Playlist).filter(models.Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    # Check if already liked
    existing_like = db.query(models.PlaylistLike).filter(
        models.PlaylistLike.user_id == user.id,
        models.PlaylistLike.playlist_id == playlist_id
    ).first()
    
    if existing_like:
        return {"message": "Already liked", "liked": True}
    
    # Create like
    new_like = models.PlaylistLike(
        user_id=user.id,
        playlist_id=playlist_id
    )
    
    db.add(new_like)
    db.commit()
    
    return {"message": "Playlist liked", "liked": True}


@app.delete("/playlists/{playlist_id}/like")
async def unlike_playlist(playlist_id: int, request: Request, db: Session = Depends(get_db)):
    """
    Unlike a playlist
    """
    # Check if user is authenticated
    session_username = request.session.get("username")
    if not session_username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get user
    user = db.query(models.User).filter(models.User.username == session_username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find and delete the like
    like = db.query(models.PlaylistLike).filter(
        models.PlaylistLike.user_id == user.id,
        models.PlaylistLike.playlist_id == playlist_id
    ).first()
    
    if not like:
        return {"message": "Not liked", "liked": False}
    
    db.delete(like)
    db.commit()
    
    return {"message": "Playlist unliked", "liked": False}


@app.get("/users/{username}/liked-playlists")
async def get_liked_playlists(username: str, db: Session = Depends(get_db)):
    """
    Get all playlists liked by a user
    """
    user = db.query(models.User).filter(models.User.username == username).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all liked playlists
    liked_playlists = db.query(models.Playlist).join(
        models.PlaylistLike, models.Playlist.id == models.PlaylistLike.playlist_id
    ).filter(models.PlaylistLike.user_id == user.id).all()
    
    results = []
    for playlist in liked_playlists:
        playlist_dict = playlist.to_dict()
        playlist_dict["owner"] = playlist.owner.username
        playlist_dict["likes_count"] = len(playlist.likes)
        results.append(playlist_dict)
    
    return {"playlists": results}


# ============================================
# SEARCH ROUTES
# ============================================

@app.get("/search/playlists")
async def search_playlists(q: str, limit: int = 10, request: Request = None, db: Session = Depends(get_db)):
    """
    Search for playlists by name
    q: search query
    limit: maximum number of results (default 10)
    """
    if not q:
        return {"playlists": []}
    
    # Get current user if authenticated
    current_user_id = None
    if request:
        session_username = request.session.get("username")
        if session_username:
            user = db.query(models.User).filter(models.User.username == session_username).first()
            if user:
                current_user_id = user.id
    
    # Search for playlists containing the query (case-insensitive)
    playlists = db.query(models.Playlist).filter(
        models.Playlist.name.ilike(f"%{q}%")
    ).limit(limit).all()
    
    # Return playlists with owner info and likes
    results = []
    for playlist in playlists:
        playlist_dict = playlist.to_dict()
        playlist_dict["owner"] = playlist.owner.username
        playlist_dict["likes_count"] = len(playlist.likes)
        
        # Check if current user has liked this playlist
        if current_user_id:
            is_liked = any(like.user_id == current_user_id for like in playlist.likes)
            playlist_dict["is_liked"] = is_liked
        else:
            playlist_dict["is_liked"] = False
        
        results.append(playlist_dict)
    
    return {"playlists": results, "count": len(results)}
