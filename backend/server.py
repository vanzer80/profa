from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import openai
import re
from io import BytesIO
import base64
from PIL import Image
import asyncio
import tempfile
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Initialize OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create the main app
app = FastAPI(title="ProfAI - Educational AI Assistant")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    username: str
    password_hash: str
    full_name: str
    grade: str  # "1º EF" to "9º EF"
    school: str = ""
    avatar: str = ""  # Base64 encoded image
    ai_style: str = "paciente"  # Teaching style preference
    xp: int = 0
    coins: int = 0
    level: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str
    grade: str
    school: str = ""
    ai_style: str = "paciente"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    grade: str
    school: str
    avatar: str
    ai_style: str
    xp: int
    coins: int
    level: int

class Conversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    subject: str
    summary: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    content: str
    role: str  # "user" or "assistant"
    message_type: str = "text"  # "text", "help", "hint", "answer"
    ai_response: Optional[Dict[str, Any]] = None
    xp_earned: int = 0
    coins_earned: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    request_type: str = "help"  # "help", "hint", "answer"
    subject: Optional[str] = "Geral"

class ConversationCreate(BaseModel):
    title: str
    subject: str

class Achievement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    icon: str
    xp_required: int
    condition_type: str  # "xp_total", "conversations_count", "streak_days"
    condition_value: int

# Authentication functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=int(os.getenv('JWT_EXPIRES_IN', 900)) // 60)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, os.getenv('JWT_SECRET'), algorithm="HS256")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, os.getenv('JWT_SECRET'), algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

# AI Service
async def generate_ai_response(message: str, request_type: str, subject: str, user_style: str, conversation_history: List[Dict] = None):
    try:
        # Prepare the system message based on user's AI style and grade
        style_prompts = {
            "paciente": "Seja muito paciente e detalhado. Explique passo a passo com calma.",
            "direto": "Seja direto e objetivo nas explicações, sem rodeios.",
            "poético": "Use uma linguagem mais poética e criativa nas explicações.",
            "motivacional": "Seja encorajador e motivacional em suas respostas."
        }
        
        system_prompt = f"""
        Você é o ProfAI, um assistente educacional especializado em {subject}. 
        Estilo de ensino: {style_prompts.get(user_style, 'Seja paciente e detalhado')}.
        
        Sua resposta DEVE SEMPRE ser um JSON válido no seguinte formato:
        {{
            "type": "{request_type}",
            "intro": "mensagem motivacional curta",
            "steps": ["passo 1", "passo 2", "passo 3"],
            "explanation": "explicação detalhada do conceito",
            "final_answer": "resposta final completa (apenas quando type=answer)",
            "examples": ["exemplo 1", "exemplo 2"],
            "follow_up_questions": ["pergunta 1", "pergunta 2"],
            "xp": {{"10" if request_type == "help" else "5" if request_type == "hint" else "2"}},
            "coins": {{"2" if request_type == "help" else "1" if request_type == "hint" else "1"}}
        }}
        
        Regras importantes:
        - type deve ser exatamente: "{request_type}"
        - Para type="help": dê orientações e dicas sem dar a resposta final
        - Para type="hint": dê uma dica específica sem revelar a resposta completa  
        - Para type="answer": forneça a resposta completa no campo "final_answer"
        - Sempre inclua XP e coins conforme as regras: help=10 XP/2 coins, hint=5 XP/1 coin, answer=2 XP/1 coin
        """
        
        # Build conversation context
        messages = [{"role": "system", "content": system_prompt}]
        
        if conversation_history:
            for msg in conversation_history[-10:]:  # Last 10 messages for context
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
        
        messages.append({"role": "user", "content": message})
        
        # Call OpenAI
        client_openai = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        response = client_openai.chat.completions.create(
            model=os.getenv('MODEL_NAME', 'gpt-4o-mini'),
            messages=messages,
            max_tokens=1500,
            temperature=0.7
        )
        
        ai_text = response.choices[0].message.content
        
        # Try to parse as JSON
        try:
            ai_response = json.loads(ai_text)
            
            # Validate required fields
            required_fields = ["type", "intro", "steps", "explanation", "examples", "follow_up_questions", "xp", "coins"]
            for field in required_fields:
                if field not in ai_response:
                    raise ValueError(f"Missing required field: {field}")
            
            return ai_response
            
        except json.JSONDecodeError:
            # If JSON parsing fails, try to extract with regex
            try:
                json_match = re.search(r'\{.*\}', ai_text, re.DOTALL)
                if json_match:
                    ai_response = json.loads(json_match.group())
                    return ai_response
            except:
                pass
            
            # Fallback response
            return {
                "type": request_type,
                "intro": "Vou te ajudar com essa questão!",
                "steps": ["Analisando sua pergunta", "Preparando explicação"],
                "explanation": ai_text,
                "final_answer": ai_text if request_type == "answer" else "",
                "examples": ["Consulte materiais complementares"],
                "follow_up_questions": ["Ficou alguma dúvida?"],
                "xp": 10 if request_type == "help" else 5 if request_type == "hint" else 2,
                "coins": 2 if request_type == "help" else 1
            }
            
    except Exception as e:
        logging.error(f"AI generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

# Routes
@api_router.post("/auth/register", response_model=Dict[str, str])
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_username = await db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create user
    user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        grade=user_data.grade,
        school=user_data.school,
        ai_style=user_data.ai_style
    )
    
    await db.users.insert_one(user.dict())
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id
    }

@api_router.post("/auth/login", response_model=Dict[str, str])
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user["id"]
    }

@api_router.get("/auth/me", response_model=UserProfile)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        grade=current_user.grade,
        school=current_user.school,
        avatar=current_user.avatar,
        ai_style=current_user.ai_style,
        xp=current_user.xp,
        coins=current_user.coins,
        level=current_user.level
    )

@api_router.put("/auth/profile")
async def update_profile(
    full_name: Optional[str] = Form(None),
    grade: Optional[str] = Form(None),
    school: Optional[str] = Form(None),
    ai_style: Optional[str] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user)
):
    update_data = {}
    
    if full_name:
        update_data["full_name"] = full_name
    if grade:
        update_data["grade"] = grade
    if school:
        update_data["school"] = school
    if ai_style:
        update_data["ai_style"] = ai_style
    
    if avatar:
        # Convert image to base64
        contents = await avatar.read()
        image = Image.open(BytesIO(contents))
        image.thumbnail((200, 200))  # Resize for efficiency
        buffer = BytesIO()
        image.save(buffer, format='PNG')
        avatar_base64 = base64.b64encode(buffer.getvalue()).decode()
        update_data["avatar"] = avatar_base64
    
    if update_data:
        await db.users.update_one({"id": current_user.id}, {"$set": update_data})
    
    return {"message": "Profile updated successfully"}

@api_router.post("/conversations", response_model=Conversation)
async def create_conversation(
    conversation_data: ConversationCreate,
    current_user: User = Depends(get_current_user)
):
    conversation = Conversation(
        user_id=current_user.id,
        title=conversation_data.title,
        subject=conversation_data.subject
    )
    
    await db.conversations.insert_one(conversation.dict())
    return conversation

@api_router.get("/conversations", response_model=List[Conversation])
async def get_conversations(current_user: User = Depends(get_current_user)):
    conversations = await db.conversations.find(
        {"user_id": current_user.id, "is_active": True}
    ).sort("updated_at", -1).to_list(100)
    
    return [Conversation(**conv) for conv in conversations]

@api_router.get("/conversations/{conversation_id}/messages", response_model=List[Message])
async def get_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    # Verify conversation belongs to user
    conversation = await db.conversations.find_one({"id": conversation_id, "user_id": current_user.id})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = await db.messages.find(
        {"conversation_id": conversation_id}
    ).sort("created_at", 1).to_list(1000)
    
    return [Message(**msg) for msg in messages]

@api_router.post("/chat", response_model=Message)
async def chat(
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    # Verify conversation belongs to user
    conversation = await db.conversations.find_one({
        "id": chat_request.conversation_id, 
        "user_id": current_user.id
    })
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get conversation history
    history_messages = await db.messages.find(
        {"conversation_id": chat_request.conversation_id}
    ).sort("created_at", 1).limit(int(os.getenv('MAX_HISTORY_MESSAGES', 30))).to_list(None)
    
    history = [{"role": msg["role"], "content": msg["content"]} for msg in history_messages]
    
    # Save user message
    user_message = Message(
        conversation_id=chat_request.conversation_id,
        content=chat_request.message,
        role="user",
        message_type=chat_request.request_type
    )
    await db.messages.insert_one(user_message.dict())
    
    try:
        # Generate AI response
        ai_response = await generate_ai_response(
            chat_request.message,
            chat_request.request_type,
            chat_request.subject or conversation["subject"],
            current_user.ai_style,
            history
        )
        
        # Create assistant message
        assistant_message = Message(
            conversation_id=chat_request.conversation_id,
            content=ai_response.get("explanation", ""),
            role="assistant",
            message_type=chat_request.request_type,
            ai_response=ai_response,
            xp_earned=int(ai_response.get("xp", 0)),
            coins_earned=int(ai_response.get("coins", 0))
        )
        
        await db.messages.insert_one(assistant_message.dict())
        
        # Update user XP and coins (ensure numeric values)
        xp_earned = int(ai_response.get("xp", 0))
        coins_earned = int(ai_response.get("coins", 0))
        
        await db.users.update_one(
            {"id": current_user.id},
            {
                "$inc": {
                    "xp": xp_earned,
                    "coins": coins_earned
                }
            }
        )
        
        # Update conversation timestamp
        await db.conversations.update_one(
            {"id": chat_request.conversation_id},
            {"$set": {"updated_at": datetime.utcnow()}}
        )
        
        return assistant_message
        
    except Exception as e:
        logging.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail="Chat generation failed")

@api_router.get("/dashboard")
async def get_dashboard(current_user: User = Depends(get_current_user)):
    # Get recent conversations
    recent_conversations = await db.conversations.find(
        {"user_id": current_user.id, "is_active": True}
    ).sort("updated_at", -1).limit(5).to_list(None)
    
    # Get total conversations count
    total_conversations = await db.conversations.count_documents(
        {"user_id": current_user.id, "is_active": True}
    )
    
    # Calculate level (every 100 XP = 1 level)
    level = max(1, current_user.xp // 100 + 1)
    next_level_xp = level * 100
    
    return {
        "user": {
            "full_name": current_user.full_name,
            "grade": current_user.grade,
            "xp": current_user.xp,
            "coins": current_user.coins,
            "level": level,
            "next_level_xp": next_level_xp,
            "avatar": current_user.avatar
        },
        "stats": {
            "total_conversations": total_conversations,
            "total_messages": await db.messages.count_documents({"conversation_id": {"$in": [conv["id"] for conv in recent_conversations]}}),
            "subjects_studied": len(set([conv["subject"] for conv in recent_conversations]))
        },
        "recent_conversations": [
            {
                "id": conv["id"],
                "title": conv["title"],
                "subject": conv["subject"],
                "updated_at": conv["updated_at"].isoformat()
            } for conv in recent_conversations
        ],
        "achievements": [
            {"name": "Primeiro Chat", "description": "Completou sua primeira conversa", "unlocked": total_conversations > 0},
            {"name": "Estudante Dedicado", "description": "Alcançou 100 XP", "unlocked": current_user.xp >= 100},
            {"name": "Explorador", "description": "Estudou 3 matérias diferentes", "unlocked": len(set([conv["subject"] for conv in recent_conversations])) >= 3}
        ]
    }

# Grade options endpoint
@api_router.get("/grades")
async def get_grades():
    return {
        "grades": [
            "1º EF", "2º EF", "3º EF", "4º EF", "5º EF", 
            "6º EF", "7º EF", "8º EF", "9º EF"
        ]
    }

# Subject options endpoint  
@api_router.get("/subjects")
async def get_subjects():
    return {
        "subjects": [
            "Matemática", "Português", "Ciências", "História", "Geografia",
            "Inglês", "Física", "Química", "Biologia", "Redação", "Artes",
            "Educação Física", "Filosofia", "Sociologia", "Tema Livre"
        ]
    }

# AI styles endpoint
@api_router.get("/ai-styles") 
async def get_ai_styles():
    return {
        "styles": [
            {"key": "paciente", "name": "Paciente", "description": "Explicações detalhadas e passo a passo"},
            {"key": "direto", "name": "Direto", "description": "Respostas objetivas e concisas"},
            {"key": "poético", "name": "Poético", "description": "Linguagem criativa e inspiradora"},
            {"key": "motivacional", "name": "Motivacional", "description": "Encorajador e positivo"}
        ]
    }

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()