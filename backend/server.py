from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import uuid
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import List, Optional

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"

def get_jwt_secret():
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id, "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

# Pydantic Models
class RegisterInput(BaseModel):
    name: str
    email: str
    password: str

class LoginInput(BaseModel):
    email: str
    password: str

class CustomerInput(BaseModel):
    name: str
    phone: str = ""
    notes: str = ""
    tags: List[str] = []

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

class OrderInput(BaseModel):
    customer_id: str
    product_name: str
    amount: float
    status: str = "New"

class OrderUpdate(BaseModel):
    product_name: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None

class ReminderInput(BaseModel):
    customer_id: str
    date_time: str
    note: str

class ReminderUpdate(BaseModel):
    date_time: Optional[str] = None
    note: Optional[str] = None

# App setup
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ---- AUTH ROUTES ----
@api_router.post("/auth/register")
async def register(input: RegisterInput, response: Response):
    email = input.email.strip().lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(input.password)
    user_doc = {
        "email": email,
        "name": input.name.strip(),
        "password_hash": hashed,
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)
    return {"id": user_id, "email": email, "name": input.name.strip(), "role": "user"}

@api_router.post("/auth/login")
async def login(input: LoginInput, response: Response):
    email = input.email.strip().lower()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(input.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)
    return {"id": user_id, "email": email, "name": user.get("name", ""), "role": user.get("role", "user")}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return {"id": user["_id"], "email": user["email"], "name": user.get("name", ""), "role": user.get("role", "user")}

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user_id = str(user["_id"])
        new_access = create_access_token(user_id, user["email"])
        response.set_cookie(key="access_token", value=new_access, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        return {"message": "Token refreshed"}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ---- CUSTOMER ROUTES ----
@api_router.get("/customers")
async def list_customers(request: Request):
    user = await get_current_user(request)
    customers = await db.customers.find({"user_id": user["_id"]}, {"_id": 0}).to_list(1000)
    return customers

@api_router.post("/customers")
async def create_customer(input: CustomerInput, request: Request):
    user = await get_current_user(request)
    customer_id = str(uuid.uuid4())
    doc = {
        "id": customer_id,
        "user_id": user["_id"],
        "name": input.name,
        "phone": input.phone,
        "notes": input.notes,
        "tags": input.tags,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.customers.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/customers/{customer_id}")
async def update_customer(customer_id: str, input: CustomerUpdate, request: Request):
    user = await get_current_user(request)
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.customers.update_one(
        {"id": customer_id, "user_id": user["_id"]},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    updated = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    return updated

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.customers.delete_one({"id": customer_id, "user_id": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    await db.orders.delete_many({"customer_id": customer_id, "user_id": user["_id"]})
    await db.reminders.delete_many({"customer_id": customer_id, "user_id": user["_id"]})
    return {"message": "Customer deleted"}

# ---- ORDER ROUTES ----
@api_router.get("/orders")
async def list_orders(request: Request, customer_id: Optional[str] = None):
    user = await get_current_user(request)
    query = {"user_id": user["_id"]}
    if customer_id:
        query["customer_id"] = customer_id
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.post("/orders")
async def create_order(input: OrderInput, request: Request):
    user = await get_current_user(request)
    customer = await db.customers.find_one({"id": input.customer_id, "user_id": user["_id"]})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    order_id = str(uuid.uuid4())
    doc = {
        "id": order_id,
        "user_id": user["_id"],
        "customer_id": input.customer_id,
        "customer_name": customer["name"],
        "product_name": input.product_name,
        "amount": input.amount,
        "status": input.status,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/orders/{order_id}")
async def update_order(order_id: str, input: OrderUpdate, request: Request):
    user = await get_current_user(request)
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.orders.update_one(
        {"id": order_id, "user_id": user["_id"]},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    updated = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return updated

@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.orders.delete_one({"id": order_id, "user_id": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order deleted"}

# ---- REMINDER ROUTES ----
@api_router.get("/reminders")
async def list_reminders(request: Request, due_today: Optional[bool] = None):
    user = await get_current_user(request)
    query = {"user_id": user["_id"]}
    if due_today:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        query["date_time"] = {"$regex": f"^{today}"}
    reminders = await db.reminders.find(query, {"_id": 0}).sort("date_time", 1).to_list(1000)
    return reminders

@api_router.post("/reminders")
async def create_reminder(input: ReminderInput, request: Request):
    user = await get_current_user(request)
    customer = await db.customers.find_one({"id": input.customer_id, "user_id": user["_id"]})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    reminder_id = str(uuid.uuid4())
    doc = {
        "id": reminder_id,
        "user_id": user["_id"],
        "customer_id": input.customer_id,
        "customer_name": customer["name"],
        "date_time": input.date_time,
        "note": input.note,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reminders.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/reminders/{reminder_id}")
async def update_reminder(reminder_id: str, input: ReminderUpdate, request: Request):
    user = await get_current_user(request)
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.reminders.update_one(
        {"id": reminder_id, "user_id": user["_id"]},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")
    updated = await db.reminders.find_one({"id": reminder_id}, {"_id": 0})
    return updated

@api_router.delete("/reminders/{reminder_id}")
async def delete_reminder(reminder_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.reminders.delete_one({"id": reminder_id, "user_id": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"message": "Reminder deleted"}

# ---- DASHBOARD ----
@api_router.get("/dashboard")
async def get_dashboard(request: Request):
    user = await get_current_user(request)
    uid = user["_id"]
    total_customers = await db.customers.count_documents({"user_id": uid})
    total_orders = await db.orders.count_documents({"user_id": uid})
    new_orders = await db.orders.count_documents({"user_id": uid, "status": "New"})
    paid_orders = await db.orders.count_documents({"user_id": uid, "status": "Paid"})
    shipped_orders = await db.orders.count_documents({"user_id": uid, "status": "Shipped"})

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    reminders_today = await db.reminders.count_documents({"user_id": uid, "date_time": {"$regex": f"^{today}"}})

    recent_orders = await db.orders.find({"user_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(5)
    today_reminders = await db.reminders.find({"user_id": uid, "date_time": {"$regex": f"^{today}"}}, {"_id": 0}).to_list(10)

    total_revenue = 0
    paid_docs = await db.orders.find({"user_id": uid, "status": {"$in": ["Paid", "Shipped"]}}, {"amount": 1, "_id": 0}).to_list(10000)
    for doc in paid_docs:
        total_revenue += doc.get("amount", 0)

    return {
        "total_customers": total_customers,
        "total_orders": total_orders,
        "new_orders": new_orders,
        "paid_orders": paid_orders,
        "shipped_orders": shipped_orders,
        "reminders_today": reminders_today,
        "total_revenue": total_revenue,
        "recent_orders": recent_orders,
        "today_reminders": today_reminders
    }

# ---- SEED DATA ----
async def seed_data():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@orderly.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")

    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        result = await db.users.insert_one({
            "email": admin_email,
            "name": "Admin",
            "password_hash": hashed,
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        admin_id = str(result.inserted_id)
        logger.info(f"Admin user created: {admin_email}")

        # Seed sample customers
        customers = [
            {"id": str(uuid.uuid4()), "user_id": admin_id, "name": "Priya Sharma", "phone": "+91 98765 43210", "notes": "Regular buyer, prefers WhatsApp", "tags": ["VIP", "Instagram"], "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "user_id": admin_id, "name": "Rahul Verma", "phone": "+91 87654 32109", "notes": "Bulk orders for events", "tags": ["Wholesale", "WhatsApp"], "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "user_id": admin_id, "name": "Anita Desai", "phone": "+91 76543 21098", "notes": "First time buyer, interested in accessories", "tags": ["New", "Instagram"], "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "user_id": admin_id, "name": "Vikram Patel", "phone": "+91 65432 10987", "notes": "Repeat customer, always pays on time", "tags": ["Loyal", "WhatsApp"], "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "user_id": admin_id, "name": "Sneha Iyer", "phone": "+91 54321 09876", "notes": "Referred by Priya, likes handmade items", "tags": ["Referral", "Instagram"], "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.customers.insert_many(customers)

        # Seed orders
        now = datetime.now(timezone.utc)
        orders = [
            {"id": str(uuid.uuid4()), "user_id": admin_id, "customer_id": customers[0]["id"], "customer_name": "Priya Sharma", "product_name": "Silk Saree - Blue", "amount": 4500, "status": "Shipped", "created_at": (now - timedelta(days=5)).isoformat()},
            {"id": str(uuid.uuid4()), "user_id": admin_id, "customer_id": customers[0]["id"], "customer_name": "Priya Sharma", "product_name": "Cotton Kurti Set", "amount": 1200, "status": "Paid", "created_at": (now - timedelta(days=2)).isoformat()},
            {"id": str(uuid.uuid4()), "user_id": admin_id, "customer_id": customers[1]["id"], "customer_name": "Rahul Verma", "product_name": "Bulk Scarves (20 pcs)", "amount": 8000, "status": "New", "created_at": (now - timedelta(days=1)).isoformat()},
            {"id": str(uuid.uuid4()), "user_id": admin_id, "customer_id": customers[2]["id"], "customer_name": "Anita Desai", "product_name": "Beaded Necklace", "amount": 750, "status": "Paid", "created_at": now.isoformat()},
            {"id": str(uuid.uuid4()), "user_id": admin_id, "customer_id": customers[3]["id"], "customer_name": "Vikram Patel", "product_name": "Leather Wallet - Brown", "amount": 1800, "status": "Shipped", "created_at": (now - timedelta(days=3)).isoformat()},
            {"id": str(uuid.uuid4()), "user_id": admin_id, "customer_id": customers[4]["id"], "customer_name": "Sneha Iyer", "product_name": "Handmade Earrings", "amount": 450, "status": "New", "created_at": now.isoformat()},
        ]
        await db.orders.insert_many(orders)

        # Seed reminders
        today_str = now.strftime("%Y-%m-%d")
        tomorrow_str = (now + timedelta(days=1)).strftime("%Y-%m-%d")
        reminders = [
            {"id": str(uuid.uuid4()), "user_id": admin_id, "customer_id": customers[0]["id"], "customer_name": "Priya Sharma", "date_time": f"{today_str}T10:00:00", "note": "Follow up on new collection interest", "created_at": now.isoformat()},
            {"id": str(uuid.uuid4()), "user_id": admin_id, "customer_id": customers[1]["id"], "customer_name": "Rahul Verma", "date_time": f"{today_str}T14:00:00", "note": "Confirm bulk order payment", "created_at": now.isoformat()},
            {"id": str(uuid.uuid4()), "user_id": admin_id, "customer_id": customers[2]["id"], "customer_name": "Anita Desai", "date_time": f"{tomorrow_str}T11:00:00", "note": "Send product photos on Instagram", "created_at": now.isoformat()},
            {"id": str(uuid.uuid4()), "user_id": admin_id, "customer_id": customers[4]["id"], "customer_name": "Sneha Iyer", "date_time": f"{today_str}T16:00:00", "note": "Share tracking details for earrings order", "created_at": now.isoformat()},
        ]
        await db.reminders.insert_many(reminders)
        logger.info("Seed data created successfully")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

    # Write test credentials to a portable path for local/dev runs.
    # Falls back to backend/.memory when APP_MEMORY_DIR is not provided.
    memory_dir = os.environ.get("APP_MEMORY_DIR", os.path.join(os.path.dirname(__file__), ".memory"))
    os.makedirs(memory_dir, exist_ok=True)
    credentials_path = os.path.join(memory_dir, "test_credentials.md")
    with open(credentials_path, "w", encoding="utf-8") as f:
        f.write(f"# Test Credentials\n\n")
        f.write(f"## Admin Account\n")
        f.write(f"- Email: {admin_email}\n")
        f.write(f"- Password: {admin_password}\n")
        f.write(f"- Role: admin\n\n")
        f.write(f"## Auth Endpoints\n")
        f.write(f"- POST /api/auth/register\n")
        f.write(f"- POST /api/auth/login\n")
        f.write(f"- POST /api/auth/logout\n")
        f.write(f"- GET /api/auth/me\n")
        f.write(f"- POST /api/auth/refresh\n\n")
        f.write(f"## API Endpoints\n")
        f.write(f"- GET/POST /api/customers\n")
        f.write(f"- PUT/DELETE /api/customers/{{id}}\n")
        f.write(f"- GET/POST /api/orders\n")
        f.write(f"- PUT/DELETE /api/orders/{{id}}\n")
        f.write(f"- GET/POST /api/reminders\n")
        f.write(f"- PUT/DELETE /api/reminders/{{id}}\n")
        f.write(f"- GET /api/dashboard\n")

    # Create indexes
    await db.users.create_index("email", unique=True)

app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    try:
        await client.admin.command("ping")
        logger.info("MongoDB connection successful")
    except Exception as exc:
        logger.exception("MongoDB connection failed")
        raise RuntimeError("MongoDB is not reachable. Check MONGO_URL and ensure MongoDB is running.") from exc
    await seed_data()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
