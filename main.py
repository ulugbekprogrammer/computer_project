import os
from datetime import timedelta
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse, RedirectResponse
from starlette.staticfiles import StaticFiles
from database import Base, engine, SessionLocal
from models import *
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from schemas import *
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


load_dotenv()

app = FastAPI()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("SECRET_KEY", "795bdbbcc29ceb958cdb7f6abd77cca7da18263345742fefd2fbc7cf221a9acc")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

Base.metadata.create_all(bind=engine)

@app.get("/")
async def index():
    return FileResponse("static/templates/index.html")

@app.get("/service")
async def service():
    return FileResponse("static/templates/services.html")

@app.get("/repair-options")
async def repair_options():
    return FileResponse("static/templates/repair-options.html")

@app.get("/login")
async def login():
    return FileResponse("static/templates/login.html")

@app.get("/signup")
async def signup():
    return FileResponse("static/templates/signup.html")

@app.get("/admin_login")
async def admin_login():
    return FileResponse("static/templates/admin-login.html")


@app.get("/admin_signup")
async def admin_signup():
    return FileResponse("static/templates/admin-signup.html")

@app.get("/profile")
async def profile():
    return FileResponse("static/templates/profile.html")

# Password hashing and verification
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    try:
        return pwd_context.hash(password)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Password hashing failed: {str(e)}")

# User retrieval
def get_user_by_name(db: Session, name: str):
    return db.query(User).filter(User.name == name).first()

# Calculate repair priority
def calculate_priority(submission_date: datetime) -> Priority:
    days_passed = (datetime.utcnow() - submission_date).days
    if days_passed <= 3:
        return Priority.LOW
    elif days_passed <= 5:
        return Priority.MEDIUM
    else:
        return Priority.HIGH

# JWT creation
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    logger.debug(f"Created JWT with payload: {to_encode}")
    return encoded_jwt


# Authenticate user
def authenticate_user(db: Session, name: str, password: str):
    user = get_user_by_name(db, name)
    if not user:
        logger.warning(f"Authentication failed: User {name} not found")
        return False
    if not verify_password(password, user.hashed_password):
        logger.warning(f"Authentication failed: Incorrect password for {name}")
        return False
    return user


# Get current user from token
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        logger.debug(f"Decoding token: {token}")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logger.debug(f"Token payload: {payload}")
        name: str = payload.get("sub")
        if name is None:
            logger.error("Token missing 'sub' claim")
            raise credentials_exception
    except JWTError as e:
        logger.error(f"JWT decoding failed: {str(e)}")
        raise credentials_exception
    user = get_user_by_name(db, name)
    if user is None:
        logger.error(f"User not found for name: {name}")
        raise credentials_exception
    return user

# Check if user is admin
async def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Endpoints

# Endpoints
@app.get("/order-repair")
async def order_repair(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        user = await get_current_user(token, db)
        return FileResponse("static/templates/order-repair.html")
    except HTTPException:
        return RedirectResponse(url="/login", status_code=status.HTTP_303_SEE_OTHER)

@app.post("/signup", response_model=UserOut)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    if not user.name or not user.surname:
        raise HTTPException(status_code=400, detail="Name and surname are required")
    db_user = get_user_by_name(db, user.name)
    if db_user:
        raise HTTPException(status_code=400, detail="Name already registered")
    hashed_password = get_password_hash(user.password)
    db_user = User(
        name=user.name,
        surname=user.surname,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect name or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.name}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logout successful. Please remove the token client-side."}

@app.get("/users/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/user/repairs", response_model=List[RepairOut])
async def get_user_repairs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    repairs = db.query(Repair).filter(Repair.user_id == current_user.id).all()
    for repair in repairs:
        repair.user_name = current_user.name
        repair.user_surname = current_user.surname
        repair.priority = calculate_priority(repair.submission_date)
        db.add(repair)
    db.commit()
    return repairs

# Repair submission
@app.post("/repairs", response_model=RepairOut)
async def submit_repair(repair: RepairCreate, current_user: User = Depends(get_current_user),
                        db: Session = Depends(get_db)):
    if repair.quantity < 1:
        raise HTTPException(status_code=400, detail="Quantity must be at least 1")
    user_repairs = db.query(Repair).filter(Repair.user_id == current_user.id).count()
    if current_user.role == "user" and repair.quantity > 1:  # Changed: allow existing repairs, limit quantity to 1
        raise HTTPException(status_code=400, detail="Users can submit only one computer at a time")

    submission_date = datetime.utcnow()
    priority = calculate_priority(submission_date)
    db_repair = Repair(
        user_id=current_user.id,
        submission_date=submission_date,
        repair_description=repair.repair_description,
        quantity=repair.quantity,
        priority=priority,
        delivery_method=DeliveryMethod(repair.delivery_method)
    )
    db.add(db_repair)
    db.commit()
    db.refresh(db_repair)
    db_repair.user_name = current_user.name
    db_repair.user_surname = current_user.surname
    return db_repair

# Check user repairs
# @app.get("/user/repairs", response_model=List[RepairOut])
# async def get_user_repairs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
#     repairs = db.query(Repair).filter(Repair.user_id == current_user.id).all()
#     for repair in repairs:
#         repair.user_name = current_user.name
#         repair.user_surname = current_user.surname
#     return repairs

# Admin panel UI
@app.get("/admin")
async def admin_panel():
    return FileResponse("static/templates/admin.html")

# Admin endpoints
@app.get("/admin/users", response_model=List[UserOut])
async def list_users(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    users = db.query(User).filter(User.name.isnot(None), User.surname.isnot(None)).all()
    if not users:
        return []
    for user in users:
        for repair in user.repairs:
            repair.user_name = user.name
            repair.user_surname = user.surname
            db.add(repair)
    db.commit()
    return users

@app.put("/admin/users/{user_id}", response_model=UserOut)
async def update_user(user_id: int, user_update: UserUpdate, current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if user_update.name:
        existing_user = get_user_by_name(db, user_update.name)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(status_code=400, detail="Name already registered")
        db_user.name = user_update.name
    if user_update.surname:
        db_user.surname = user_update.surname
    if user_update.email:
        db_user.email = user_update.email
    if user_update.password:
        db_user.hashed_password = get_password_hash(user_update.password)
    if user_update.role:
        db_user.role = user_update.role
    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/admin/users/{user_id}")
async def delete_user(user_id: int, current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted"}

@app.get("/admin/repairs", response_model=List[RepairOut])
async def list_repairs(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    repairs = db.query(Repair).join(User).all()
    for repair in repairs:
        repair.priority = calculate_priority(repair.submission_date)
        repair.user_name = repair.user.name
        repair.user_surname = repair.user.surname
        db.add(repair)
    db.commit()
    return repairs