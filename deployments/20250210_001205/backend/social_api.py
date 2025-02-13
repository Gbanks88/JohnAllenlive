from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import jwt
from typing import List, Optional
from models import *
import aioredis
import asyncio
from elasticsearch import AsyncElasticsearch
import os
from PIL import Image
import io
import hashlib

app = FastAPI(title="CG4F Social API")

# Initialize services
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
ES_URL = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")

mongodb = AsyncIOMotorClient(MONGODB_URL)
db = mongodb.social_db
redis = aioredis.from_url(REDIS_URL)
es = AsyncElasticsearch([ES_URL])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user = await db.users.find_one({"id": payload["sub"]})
        if user is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return User(**user)
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid credentials")

# Auth endpoints
@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(user["id"])
    return {"access_token": token, "token_type": "bearer"}

# User endpoints
@app.post("/users", response_model=User)
async def create_user(user: UserCreate):
    if await db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user.dict()
    user_dict["password"] = get_password_hash(user.password)
    user_dict["id"] = str(hashlib.sha256(user.email.encode()).hexdigest())
    user_dict["created_at"] = datetime.utcnow()
    
    await db.users.insert_one(user_dict)
    return User(**user_dict)

@app.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str, current_user: User = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

# Post endpoints
@app.post("/posts", response_model=Post)
async def create_post(post: PostBase, current_user: User = Depends(get_current_user)):
    post_dict = post.dict()
    post_dict["id"] = generate_id()
    post_dict["author_id"] = current_user.id
    post_dict["created_at"] = datetime.utcnow()
    
    # Index post in Elasticsearch for search
    await es.index(index="social_posts", id=post_dict["id"], body={
        "content": post_dict["content"],
        "author_id": post_dict["author_id"],
        "created_at": post_dict["created_at"],
        "hashtags": post_dict.get("hashtags", []),
        "content_type": post_dict["content_type"]
    })
    
    await db.posts.insert_one(post_dict)
    
    # Update user's post count
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"posts_count": 1}}
    )
    
    # Add to feed cache
    await add_to_feeds(post_dict)
    
    return Post(**post_dict)

@app.get("/posts/{post_id}", response_model=Post)
async def get_post(post_id: str, current_user: User = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return Post(**post)

# Feed endpoints
@app.get("/feed", response_model=List[Post])
async def get_feed(
    current_user: User = Depends(get_current_user),
    page: int = Query(1, gt=0),
    page_size: int = Query(20, gt=0, le=100)
):
    feed_key = f"feed:{current_user.id}"
    start = (page - 1) * page_size
    end = start + page_size - 1
    
    # Get post IDs from Redis
    post_ids = await redis.zrevrange(feed_key, start, end)
    
    # Fetch posts from MongoDB
    posts = []
    for post_id in post_ids:
        post = await db.posts.find_one({"id": post_id.decode()})
        if post:
            posts.append(Post(**post))
    
    return posts

# Story endpoints
@app.post("/stories", response_model=Story)
async def create_story(
    story: StoryBase,
    current_user: User = Depends(get_current_user)
):
    story_dict = story.dict()
    story_dict["id"] = generate_id()
    story_dict["author_id"] = current_user.id
    story_dict["created_at"] = datetime.utcnow()
    story_dict["expires_at"] = story_dict["created_at"] + timedelta(hours=24)
    
    await db.stories.insert_one(story_dict)
    return Story(**story_dict)

# Message endpoints
@app.post("/messages", response_model=Message)
async def send_message(
    message: MessageBase,
    receiver_id: str,
    current_user: User = Depends(get_current_user)
):
    message_dict = message.dict()
    message_dict["id"] = generate_id()
    message_dict["sender_id"] = current_user.id
    message_dict["receiver_id"] = receiver_id
    message_dict["created_at"] = datetime.utcnow()
    
    await db.messages.insert_one(message_dict)
    
    # Notify receiver
    await redis.publish(
        f"user_notifications:{receiver_id}",
        f"New message from {current_user.full_name}"
    )
    
    return Message(**message_dict)

# Analytics endpoints
@app.get("/analytics/profile", response_model=Analytics)
async def get_profile_analytics(
    current_user: User = Depends(get_current_user),
    days: int = Query(30, gt=0, le=365)
):
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get profile views
    profile_views = await db.profile_views.count_documents({
        "user_id": current_user.id,
        "viewed_at": {"$gte": start_date}
    })
    
    # Get post impressions
    post_impressions = {}
    async for post in db.posts.find({
        "author_id": current_user.id,
        "created_at": {"$gte": start_date}
    }):
        impressions = await db.post_views.count_documents({
            "post_id": post["id"],
            "viewed_at": {"$gte": start_date}
        })
        post_impressions[post["id"]] = impressions
    
    # Calculate engagement rate
    total_engagement = await db.interactions.count_documents({
        "author_id": current_user.id,
        "created_at": {"$gte": start_date}
    })
    total_followers = current_user.followers_count
    engagement_rate = total_engagement / total_followers if total_followers > 0 else 0
    
    return Analytics(
        profile_views=profile_views,
        post_impressions=post_impressions,
        engagement_rate=engagement_rate
    )

# Utility functions
def generate_id() -> str:
    return hashlib.sha256(str(datetime.utcnow().timestamp()).encode()).hexdigest()

def get_password_hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return get_password_hash(plain_password) == hashed_password

def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def add_to_feeds(post: dict):
    # Get author's followers
    followers = await db.followers.find({"followed_id": post["author_id"]}).to_list(None)
    
    # Add to each follower's feed
    for follower in followers:
        await redis.zadd(
            f"feed:{follower['follower_id']}",
            {post["id"]: datetime.utcnow().timestamp()}
        )
        
    # Add to author's feed
    await redis.zadd(
        f"feed:{post['author_id']}",
        {post["id"]: datetime.utcnow().timestamp()}
    )
