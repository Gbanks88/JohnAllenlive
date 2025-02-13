from pydantic import BaseModel, EmailStr, Field, HttpUrl
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    BUSINESS = "business"
    ADMIN = "admin"

class PrivacyLevel(str, Enum):
    PUBLIC = "public"
    FRIENDS = "friends"
    PRIVATE = "private"

class ContentType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    LINK = "link"
    STORY = "story"
    LIVE = "live"

class ReactionType(str, Enum):
    LIKE = "like"
    LOVE = "love"
    HAHA = "haha"
    WOW = "wow"
    SAD = "sad"
    ANGRY = "angry"

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.USER
    bio: Optional[str] = None
    profile_image: Optional[HttpUrl] = None
    cover_image: Optional[HttpUrl] = None
    location: Optional[str] = None
    website: Optional[HttpUrl] = None
    privacy_level: PrivacyLevel = PrivacyLevel.PUBLIC

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str
    created_at: datetime
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    verified: bool = False

class PostBase(BaseModel):
    content: str
    content_type: ContentType
    privacy_level: PrivacyLevel = PrivacyLevel.PUBLIC
    media_urls: Optional[List[HttpUrl]] = None
    hashtags: Optional[List[str]] = None
    mentioned_users: Optional[List[str]] = None
    location: Optional[str] = None

class Post(PostBase):
    id: str
    author_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    reactions: Dict[ReactionType, int] = Field(default_factory=dict)

class CommentBase(BaseModel):
    content: str
    media_url: Optional[HttpUrl] = None

class Comment(CommentBase):
    id: str
    post_id: str
    author_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    likes_count: int = 0
    replies_count: int = 0

class StoryBase(BaseModel):
    content_type: ContentType
    media_url: HttpUrl
    caption: Optional[str] = None
    location: Optional[str] = None
    mentioned_users: Optional[List[str]] = None

class Story(StoryBase):
    id: str
    author_id: str
    created_at: datetime
    expires_at: datetime
    views_count: int = 0

class MessageBase(BaseModel):
    content: str
    media_url: Optional[HttpUrl] = None

class Message(MessageBase):
    id: str
    sender_id: str
    receiver_id: str
    created_at: datetime
    read_at: Optional[datetime] = None

class BusinessProfileBase(BaseModel):
    name: str
    category: str
    description: str
    website: Optional[HttpUrl] = None
    contact_email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None

class BusinessProfile(BusinessProfileBase):
    id: str
    owner_id: str
    created_at: datetime
    followers_count: int = 0
    rating: float = 0.0
    verified: bool = False

class Analytics(BaseModel):
    profile_views: int = 0
    post_impressions: Dict[str, int] = Field(default_factory=dict)
    engagement_rate: float = 0.0
    follower_growth: Dict[str, int] = Field(default_factory=dict)
    top_posts: List[str] = Field(default_factory=list)
    audience_demographics: Dict[str, Dict[str, int]] = Field(default_factory=dict)
