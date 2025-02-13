from bs4 import BeautifulSoup
import requests
import asyncio
import aiohttp
from elasticsearch import Elasticsearch
from datetime import datetime
import hashlib
import redis
from urllib.parse import urljoin, urlparse
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Set
import logging
import os
from celery import Celery
from PIL import Image
from io import BytesIO
import numpy as np
from transformers import pipeline

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize services
es = Elasticsearch([os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")])
redis_client = redis.Redis(host=os.getenv("REDIS_HOST", "localhost"), port=6379, db=0)
celery_app = Celery('crawler', broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"))
sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
image_classifier = pipeline("image-classification", model="google/vit-base-patch16-224")

class Crawler:
    def __init__(self):
        self.visited_urls: Set[str] = set()
        self.session = None
        self.headers = {
            'User-Agent': 'CG4F-Bot/1.0 (+http://cg4f.site/bot)'
        }

    async def init_session(self):
        if not self.session:
            self.session = aiohttp.ClientSession(headers=self.headers)

    async def close_session(self):
        if self.session:
            await self.session.close()
            self.session = None

    def get_url_hash(self, url: str) -> str:
        return hashlib.sha256(url.encode()).hexdigest()

    async def process_page(self, url: str, depth: int = 0, max_depth: int = 3):
        if depth > max_depth or url in self.visited_urls:
            return

        self.visited_urls.add(url)
        try:
            await self.init_session()
            async with self.session.get(url) as response:
                if response.status != 200:
                    logger.warning(f"Failed to fetch {url}: {response.status}")
                    return

                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')

                # Extract content
                title = soup.title.string if soup.title else ""
                description = ""
                meta_desc = soup.find("meta", {"name": "description"})
                if meta_desc:
                    description = meta_desc.get("content", "")

                # Extract main content
                main_content = self.extract_main_content(soup)
                
                # Generate embeddings
                text_embedding = sentence_model.encode(main_content).tolist()

                # Process images
                images = await self.process_images(soup, url)

                # Prepare document
                doc = {
                    "url": url,
                    "title": title,
                    "description": description,
                    "content": main_content,
                    "embedding": text_embedding,
                    "images": images,
                    "timestamp": datetime.utcnow().isoformat(),
                    "type": "web",
                    "domain": urlparse(url).netloc
                }

                # Index document
                es.index(index="web_content", id=self.get_url_hash(url), body=doc)

                # Extract and queue new URLs
                if depth < max_depth:
                    await self.extract_and_queue_urls(soup, url, depth)

        except Exception as e:
            logger.error(f"Error processing {url}: {str(e)}")

    def extract_main_content(self, soup: BeautifulSoup) -> str:
        # Remove unwanted elements
        for element in soup.find_all(['script', 'style', 'nav', 'footer', 'header']):
            element.decompose()

        # Extract text from remaining elements
        paragraphs = soup.find_all(['p', 'article', 'section', 'main'])
        content = ' '.join(p.get_text().strip() for p in paragraphs)
        return content

    async def process_images(self, soup: BeautifulSoup, base_url: str) -> List[Dict]:
        images = []
        for img in soup.find_all('img'):
            try:
                src = img.get('src')
                if not src:
                    continue

                img_url = urljoin(base_url, src)
                
                # Download and process image
                async with self.session.get(img_url) as response:
                    if response.status != 200:
                        continue

                    img_data = await response.read()
                    img_hash = hashlib.sha256(img_data).hexdigest()

                    # Process with image classifier
                    image = Image.open(BytesIO(img_data))
                    predictions = image_classifier(image)

                    images.append({
                        "url": img_url,
                        "hash": img_hash,
                        "alt": img.get('alt', ''),
                        "labels": [p["label"] for p in predictions[:3]],
                        "confidence_scores": [p["score"] for p in predictions[:3]]
                    })

            except Exception as e:
                logger.error(f"Error processing image {img_url}: {str(e)}")

        return images

    async def extract_and_queue_urls(self, soup: BeautifulSoup, base_url: str, depth: int):
        for link in soup.find_all('a'):
            href = link.get('href')
            if not href:
                continue

            url = urljoin(base_url, href)
            if url not in self.visited_urls:
                # Queue URL for processing
                crawl_page.delay(url, depth + 1)

@celery_app.task(name='crawler.crawl_page')
def crawl_page(url: str, depth: int = 0):
    crawler = Crawler()
    asyncio.run(crawler.process_page(url, depth))

if __name__ == "__main__":
    # Create Elasticsearch index with embedding field
    if not es.indices.exists(index="web_content"):
        es.indices.create(
            index="web_content",
            body={
                "mappings": {
                    "properties": {
                        "url": {"type": "keyword"},
                        "title": {"type": "text"},
                        "description": {"type": "text"},
                        "content": {"type": "text"},
                        "embedding": {
                            "type": "dense_vector",
                            "dims": 384,
                            "index": True,
                            "similarity": "cosine"
                        },
                        "images": {
                            "type": "nested",
                            "properties": {
                                "url": {"type": "keyword"},
                                "hash": {"type": "keyword"},
                                "alt": {"type": "text"},
                                "labels": {"type": "keyword"},
                                "confidence_scores": {"type": "float"}
                            }
                        },
                        "timestamp": {"type": "date"},
                        "type": {"type": "keyword"},
                        "domain": {"type": "keyword"}
                    }
                }
            }
        )
