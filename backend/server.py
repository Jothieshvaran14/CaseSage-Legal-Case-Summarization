from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import io
import re
import json
from PIL import Image
import pytesseract
from PyPDF2 import PdfReader
from docx import Document
import numpy as np
import faiss
import pickle
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# FAISS setup
FAISS_INDEX_PATH = ROOT_DIR / 'faiss_index.pkl'
FAISS_METADATA_PATH = ROOT_DIR / 'faiss_metadata.pkl'

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== Models ====================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, str]

class DocumentUploadResponse(BaseModel):
    document_id: str
    extracted_text: str
    filename: str
    upload_date: str

class SummaryRequest(BaseModel):
    document_id: str
    summary_type: str = "detailed"  # executive, detailed, risk-focused

class SummaryResponse(BaseModel):
    document_id: str
    facts: str
    issues: str
    arguments: str
    verdict: str
    citations: List[Dict[str, str]]
    timeline: List[Dict[str, str]]
    confidence_scores: Dict[str, float]

class FeedbackRequest(BaseModel):
    document_id: str
    rating: int  # 1 (thumbs down) or 5 (thumbs up)
    comment: Optional[str] = None

class CaseSearchRequest(BaseModel):
    query: str
    top_k: int = 5

class CaseSearchResponse(BaseModel):
    cases: List[Dict[str, Any]]

# ==================== Helper Functions ====================

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return email
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

async def get_current_user(email: str = Depends(verify_token)) -> User:
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF using PyPDF2"""
    try:
        pdf_reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        return ""

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX"""
    try:
        doc = Document(io.BytesIO(file_bytes))
        text = "\n".join([para.text for para in doc.paragraphs])
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from DOCX: {e}")
        return ""

def extract_text_from_image(file_bytes: bytes) -> str:
    """Extract text from image using Tesseract OCR"""
    try:
        image = Image.open(io.BytesIO(file_bytes))
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from image: {e}")
        return ""

def detect_citations(text: str) -> List[Dict[str, str]]:
    """Detect legal citations in text"""
    citations = []
    
    # Pattern for AIR citations: AIR YYYY SC/HC NNNN
    air_pattern = r'AIR\s+(\d{4})\s+(SC|HC|[A-Z]{2,})\s+(\d+)'
    air_matches = re.finditer(air_pattern, text, re.IGNORECASE)
    for match in air_matches:
        citations.append({
            "type": "AIR",
            "citation": match.group(0),
            "year": match.group(1),
            "court": match.group(2),
            "number": match.group(3)
        })
    
    # Pattern for SCC citations: (YYYY) N SCC NNN
    scc_pattern = r'\((\d{4})\)\s+(\d+)\s+SCC\s+(\d+)'
    scc_matches = re.finditer(scc_pattern, text, re.IGNORECASE)
    for match in scc_matches:
        citations.append({
            "type": "SCC",
            "citation": match.group(0),
            "year": match.group(1),
            "volume": match.group(2),
            "page": match.group(3)
        })
    
    return citations

def extract_dates(text: str) -> List[Dict[str, str]]:
    """Extract dates from text for timeline"""
    timeline = []
    
    # Pattern for dates: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    date_pattern = r'(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})'
    date_matches = re.finditer(date_pattern, text)
    
    for match in date_matches:
        date_str = match.group(0)
        # Try to find context around the date
        start = max(0, match.start() - 50)
        end = min(len(text), match.end() + 50)
        context = text[start:end].strip()
        
        timeline.append({
            "date": date_str,
            "event": context[:100]  # First 100 chars of context
        })
    
    return timeline[:10]  # Return top 10 dates

async def get_embedding(text: str) -> List[float]:
    """Get OpenAI embedding for text"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id="embedding_session",
            system_message=""
        ).with_model("openai", "gpt-4o")
        
        # Use a simple approach: hash the text to create a pseudo-embedding
        # In production, use actual OpenAI embeddings API
        # For now, create a simple vector based on text features
        words = text.lower().split()
        vector = np.zeros(512)  # 512-dimensional vector
        for i, word in enumerate(words[:512]):
            vector[i] = hash(word) % 1000 / 1000.0
        
        return vector.tolist()
    except Exception as e:
        logger.error(f"Error getting embedding: {e}")
        # Return random vector as fallback
        return np.random.rand(512).tolist()

async def search_indian_kanoon(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Search Indian Kanoon API"""
    try:
        url = "https://api.indiankanoon.org/search/"
        params = {
            "formInput": query,
            "pagenum": 1
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            # Parse response and return structured data
            # Note: Indian Kanoon API may return HTML, so this is a simplified version
            results = []
            
            # For demo purposes, return mock data
            # In production, parse actual API response
            for i in range(min(top_k, 5)):
                results.append({
                    "title": f"Case Result {i+1} for: {query}",
                    "snippet": f"This is a summary of a relevant legal case related to {query}...",
                    "citation": f"AIR {2020-i} SC {1000+i*100}",
                    "url": f"https://indiankanoon.org/doc/{1000000+i}"
                })
            
            return results
        else:
            logger.warning(f"Indian Kanoon API returned status {response.status_code}")
            return []
    except Exception as e:
        logger.error(f"Error searching Indian Kanoon: {e}")
        return []

# ==================== Auth Endpoints ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = pwd_context.hash(user_data.password)
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user.email})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user={"email": user.email, "full_name": user.full_name}
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user or not pwd_context.verify(credentials.password, user['hashed_password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user['email']})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user={"email": user['email'], "full_name": user['full_name']}
    )

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {"email": current_user.email, "full_name": current_user.full_name}

# ==================== Document Upload ====================

@api_router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    try:
        file_bytes = await file.read()
        filename = file.filename
        file_ext = filename.split('.')[-1].lower()
        
        # Extract text based on file type
        extracted_text = ""
        
        if file_ext == 'pdf':
            extracted_text = extract_text_from_pdf(file_bytes)
        elif file_ext == 'docx':
            extracted_text = extract_text_from_docx(file_bytes)
        elif file_ext in ['txt']:
            extracted_text = file_bytes.decode('utf-8')
        elif file_ext in ['jpg', 'jpeg', 'png']:
            extracted_text = extract_text_from_image(file_bytes)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
        
        if not extracted_text:
            raise HTTPException(status_code=400, detail="Could not extract text from document")
        
        # Save document to database
        document_id = str(uuid.uuid4())
        document = {
            "id": document_id,
            "user_email": current_user.email,
            "filename": filename,
            "extracted_text": extracted_text,
            "upload_date": datetime.now(timezone.utc).isoformat(),
            "processed": False
        }
        
        await db.documents.insert_one(document)
        
        return DocumentUploadResponse(
            document_id=document_id,
            extracted_text=extracted_text[:1000],  # Return first 1000 chars
            filename=filename,
            upload_date=document['upload_date']
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail="Error processing document")

# ==================== Summarization ====================

@api_router.post("/summarize", response_model=SummaryResponse)
async def summarize_document(
    request: SummaryRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        # Get document
        document = await db.documents.find_one(
            {"id": request.document_id, "user_email": current_user.email},
            {"_id": 0}
        )
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        text = document['extracted_text']
        
        # Initialize LLM Chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"summary_{request.document_id}",
            system_message="You are a legal expert AI specialized in analyzing and summarizing legal documents, court cases, and judgments."
        ).with_model("openai", "gpt-4o")
        
        # Create prompt based on summary type
        if request.summary_type == "executive":
            prompt = f"""Analyze this legal document and provide a brief executive summary (max 150 words):

{text[:8000]}

Provide ONLY the summary, no additional commentary."""
        elif request.summary_type == "risk-focused":
            prompt = f"""Analyze this legal document and extract the following in a structured format:

{text[:8000]}

Identify and list:
1. FACTS: Key facts of the case (2-3 sentences)
2. ISSUES: Main legal issues raised (2-3 sentences)
3. ARGUMENTS: Arguments presented by parties (2-3 sentences)
4. VERDICT: Final decision and key risks/liabilities highlighted (2-3 sentences)

Focus on liability, termination, indemnity, and risk-related clauses.

Format your response exactly as:
FACTS: ...
ISSUES: ...
ARGUMENTS: ...
VERDICT: ..."""
        else:  # detailed
            prompt = f"""Analyze this legal document and extract the following in a structured format:

{text[:8000]}

Provide:
1. FACTS: Comprehensive facts of the case (4-5 sentences)
2. ISSUES: All legal issues raised (4-5 sentences)
3. ARGUMENTS: Detailed arguments presented by all parties (4-5 sentences)
4. VERDICT: Complete final decision, ratio decidendi, and legal principles established (4-5 sentences)

Format your response exactly as:
FACTS: ...
ISSUES: ...
ARGUMENTS: ...
VERDICT: ..."""
        
        # Get summary from LLM
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        # Parse response
        summary_text = response.strip()
        
        # Extract sections
        facts = ""
        issues = ""
        arguments = ""
        verdict = ""
        
        if "FACTS:" in summary_text:
            parts = summary_text.split("FACTS:")[1]
            if "ISSUES:" in parts:
                facts = parts.split("ISSUES:")[0].strip()
                parts = parts.split("ISSUES:")[1]
                if "ARGUMENTS:" in parts:
                    issues = parts.split("ARGUMENTS:")[0].strip()
                    parts = parts.split("ARGUMENTS:")[1]
                    if "VERDICT:" in parts:
                        arguments = parts.split("VERDICT:")[0].strip()
                        verdict = parts.split("VERDICT:")[1].strip()
        else:
            # If structured format not found, use the whole response
            facts = summary_text[:len(summary_text)//4]
            issues = summary_text[len(summary_text)//4:len(summary_text)//2]
            arguments = summary_text[len(summary_text)//2:3*len(summary_text)//4]
            verdict = summary_text[3*len(summary_text)//4:]
        
        # Detect citations
        citations = detect_citations(text)
        
        # Extract timeline
        timeline = extract_dates(text)
        
        # Calculate confidence scores (mock for now)
        confidence_scores = {
            "facts": 0.92,
            "issues": 0.88,
            "arguments": 0.85,
            "verdict": 0.95
        }
        
        # Save summary
        summary = {
            "id": str(uuid.uuid4()),
            "document_id": request.document_id,
            "user_email": current_user.email,
            "facts": facts,
            "issues": issues,
            "arguments": arguments,
            "verdict": verdict,
            "citations": citations,
            "timeline": timeline,
            "confidence_scores": confidence_scores,
            "summary_type": request.summary_type,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.summaries.insert_one(summary)
        
        # Update document as processed
        await db.documents.update_one(
            {"id": request.document_id},
            {"$set": {"processed": True}}
        )
        
        return SummaryResponse(
            document_id=request.document_id,
            facts=facts,
            issues=issues,
            arguments=arguments,
            verdict=verdict,
            citations=citations,
            timeline=timeline,
            confidence_scores=confidence_scores
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error summarizing document: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")

# ==================== Citation Detection ====================

@api_router.get("/citations/{document_id}")
async def get_citations(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    document = await db.documents.find_one(
        {"id": document_id, "user_email": current_user.email},
        {"_id": 0}
    )
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    citations = detect_citations(document['extracted_text'])
    return {"citations": citations}

# ==================== Semantic Search ====================

@api_router.post("/search", response_model=CaseSearchResponse)
async def search_cases(
    request: CaseSearchRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        # Search Indian Kanoon API
        api_results = await search_indian_kanoon(request.query, request.top_k)
        
        # Also search local FAISS index if available
        local_results = []
        if FAISS_INDEX_PATH.exists() and FAISS_METADATA_PATH.exists():
            try:
                with open(FAISS_INDEX_PATH, 'rb') as f:
                    index = pickle.load(f)
                with open(FAISS_METADATA_PATH, 'rb') as f:
                    metadata = pickle.load(f)
                
                # Get query embedding
                query_embedding = await get_embedding(request.query)
                query_vector = np.array([query_embedding]).astype('float32')
                
                # Search FAISS
                D, I = index.search(query_vector, request.top_k)
                
                for idx in I[0]:
                    if idx < len(metadata):
                        local_results.append(metadata[idx])
            except Exception as e:
                logger.error(f"Error searching FAISS: {e}")
        
        # Combine results
        all_results = api_results + local_results
        
        return CaseSearchResponse(cases=all_results[:request.top_k])
    except Exception as e:
        logger.error(f"Error searching cases: {e}")
        raise HTTPException(status_code=500, detail="Error searching cases")

# ==================== Feedback ====================

@api_router.post("/feedback")
async def submit_feedback(
    feedback: FeedbackRequest,
    current_user: User = Depends(get_current_user)
):
    feedback_doc = {
        "id": str(uuid.uuid4()),
        "document_id": feedback.document_id,
        "user_email": current_user.email,
        "rating": feedback.rating,
        "comment": feedback.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.feedback.insert_one(feedback_doc)
    
    return {"message": "Feedback submitted successfully"}

# ==================== User Documents ====================

@api_router.get("/documents")
async def get_user_documents(
    current_user: User = Depends(get_current_user)
):
    documents = await db.documents.find(
        {"user_email": current_user.email},
        {"_id": 0, "extracted_text": 0}
    ).to_list(100)
    
    return {"documents": documents}

# ==================== Health Check ====================

@api_router.get("/")
async def root():
    return {"message": "Legal Case Summarization Engine API", "status": "running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
