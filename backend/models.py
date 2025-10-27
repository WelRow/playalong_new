from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Text, DateTime
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    avatar = Column(LONGTEXT, nullable=True)  # LONGTEXT for large base64 images or URLs
    
    # Relationship to playlists
    playlists = relationship("Playlist", back_populates="owner", cascade="all, delete-orphan")
    # Relationship to liked playlists
    liked_playlists = relationship("PlaylistLike", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "avatar": self.avatar,
            "playlist_count": len(self.playlists) if self.playlists else 0
        }


class Playlist(Base):
    __tablename__ = "playlists"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    image = Column(LONGTEXT, nullable=True)  # LONGTEXT for large base64 images
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    songs = Column(JSON, nullable=True, default=[])  # Store songs as JSON array
    
    # Relationship to user
    owner = relationship("User", back_populates="playlists")
    # Relationship to likes
    likes = relationship("PlaylistLike", back_populates="playlist", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "image": self.image,
            "description": self.description,
            "songs": self.songs if self.songs else []
        }


class PlaylistLike(Base):
    __tablename__ = "playlist_likes"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    playlist_id = Column(Integer, ForeignKey("playlists.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="liked_playlists")
    playlist = relationship("Playlist", back_populates="likes")

