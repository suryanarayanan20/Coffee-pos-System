from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'surya-coffee-pos-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

app = FastAPI(title="Surya Coffee POS API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── Pydantic Models ───

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str = "staff"

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str

class ProductCreate(BaseModel):
    name: str
    price: float
    category: str
    description: str = ""
    available: bool = True

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    available: Optional[bool] = None

class ProductResponse(BaseModel):
    id: str
    name: str
    price: float
    category: str
    description: str
    available: bool

class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    qty: int

class OrderCreate(BaseModel):
    items: List[OrderItem]
    customer_phone: str = ""
    customer_name: str = ""
    payment_method: str = "cash"

class OrderResponse(BaseModel):
    id: str
    items: list
    customer_phone: str
    customer_name: str
    payment_method: str
    subtotal: float
    tax: float
    total: float
    status: str
    created_by: str
    created_at: str

class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: str = ""

class CustomerResponse(BaseModel):
    id: str
    name: str
    phone: str
    email: str
    total_orders: int
    total_spent: float

# ─── Auth Helpers ───

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ─── Auth Routes ───

@api_router.post("/auth/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "role": data.role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id, data.role)
    return {"token": token, "user": {"id": user_id, "name": data.name, "email": data.email, "role": data.role}}

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"], user["role"])
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}}

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}

# ─── Products Routes ───

@api_router.get("/products")
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    available: Optional[bool] = None,
    sort_by: str = "name",
    sort_order: str = "asc",
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    query = {}
    if category:
        query["category"] = category
    if available is not None:
        query["available"] = available
    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    sort_dir = 1 if sort_order == "asc" else -1
    skip = (page - 1) * limit
    total = await db.products.count_documents(query)
    products = await db.products.find(query, {"_id": 0}).sort(sort_by, sort_dir).skip(skip).limit(limit).to_list(limit)
    return {"products": products, "total": total, "page": page, "pages": (total + limit - 1) // limit if total > 0 else 1}

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.post("/products")
async def create_product(data: ProductCreate, user=Depends(require_admin)):
    product_id = str(uuid.uuid4())
    product_doc = {
        "id": product_id,
        "name": data.name,
        "price": data.price,
        "category": data.category,
        "description": data.description,
        "available": data.available,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one(product_doc)
    del product_doc["_id"]
    return product_doc

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, data: ProductUpdate, user=Depends(require_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    return product

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, user=Depends(require_admin)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ─── Orders Routes ───

@api_router.post("/orders")
async def create_order(data: OrderCreate, user=Depends(get_current_user)):
    if not data.items:
        raise HTTPException(status_code=400, detail="Order must have items")
    subtotal = sum(item.price * item.qty for item in data.items)
    tax = round(subtotal * 0.12, 2)
    total = round(subtotal + tax, 2)
    order_id = str(uuid.uuid4())
    order_doc = {
        "id": order_id,
        "items": [item.model_dump() for item in data.items],
        "customer_phone": data.customer_phone,
        "customer_name": data.customer_name,
        "payment_method": data.payment_method,
        "subtotal": round(subtotal, 2),
        "tax": tax,
        "total": total,
        "status": "completed",
        "created_by": user["id"],
        "created_by_name": user["name"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order_doc)

    # Update customer stats if phone provided
    if data.customer_phone:
        customer = await db.customers.find_one({"phone": data.customer_phone})
        if customer:
            await db.customers.update_one(
                {"phone": data.customer_phone},
                {"$inc": {"total_orders": 1, "total_spent": total},
                 "$set": {"name": data.customer_name or customer.get("name", "")}}
            )
        elif data.customer_name:
            await db.customers.insert_one({
                "id": str(uuid.uuid4()),
                "name": data.customer_name,
                "phone": data.customer_phone,
                "email": "",
                "total_orders": 1,
                "total_spent": total,
                "created_at": datetime.now(timezone.utc).isoformat()
            })

    del order_doc["_id"]
    return order_doc

@api_router.get("/orders")
async def get_orders(
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    query = {}
    if status:
        query["status"] = status
    if date_from:
        query.setdefault("created_at", {})["$gte"] = date_from
    if date_to:
        query.setdefault("created_at", {})["$lte"] = date_to
    if search:
        query["$or"] = [
            {"customer_name": {"$regex": search, "$options": "i"}},
            {"customer_phone": {"$regex": search, "$options": "i"}},
            {"id": {"$regex": search, "$options": "i"}}
        ]
    sort_dir = 1 if sort_order == "asc" else -1
    skip = (page - 1) * limit
    total = await db.orders.count_documents(query)
    orders = await db.orders.find(query, {"_id": 0}).sort(sort_by, sort_dir).skip(skip).limit(limit).to_list(limit)
    return {"orders": orders, "total": total, "page": page, "pages": (total + limit - 1) // limit if total > 0 else 1}

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# ─── Customers Routes ───

@api_router.get("/customers")
async def get_customers(
    search: Optional[str] = None,
    sort_by: str = "name",
    sort_order: str = "asc",
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    sort_dir = 1 if sort_order == "asc" else -1
    skip = (page - 1) * limit
    total = await db.customers.count_documents(query)
    customers = await db.customers.find(query, {"_id": 0}).sort(sort_by, sort_dir).skip(skip).limit(limit).to_list(limit)
    return {"customers": customers, "total": total, "page": page, "pages": (total + limit - 1) // limit if total > 0 else 1}

@api_router.post("/customers")
async def create_customer(data: CustomerCreate, user=Depends(get_current_user)):
    existing = await db.customers.find_one({"phone": data.phone})
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this phone already exists")
    customer_doc = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "phone": data.phone,
        "email": data.email,
        "total_orders": 0,
        "total_spent": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.customers.insert_one(customer_doc)
    del customer_doc["_id"]
    return customer_doc

@api_router.put("/customers/{customer_id}")
async def update_customer(customer_id: str, data: CustomerCreate, user=Depends(get_current_user)):
    result = await db.customers.update_one(
        {"id": customer_id},
        {"$set": {"name": data.name, "phone": data.phone, "email": data.email}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    return customer

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, user=Depends(require_admin)):
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted"}

# ─── Dashboard Routes ───

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user=Depends(get_current_user)):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()

    total_orders = await db.orders.count_documents({})
    today_orders = await db.orders.count_documents({"created_at": {"$gte": today_start}})
    total_products = await db.products.count_documents({})
    total_customers = await db.customers.count_documents({})

    # Today's revenue
    today_pipeline = [
        {"$match": {"created_at": {"$gte": today_start}}},
        {"$group": {"_id": None, "revenue": {"$sum": "$total"}}}
    ]
    today_result = await db.orders.aggregate(today_pipeline).to_list(1)
    today_revenue = today_result[0]["revenue"] if today_result else 0

    # Total revenue
    total_pipeline = [{"$group": {"_id": None, "revenue": {"$sum": "$total"}}}]
    total_result = await db.orders.aggregate(total_pipeline).to_list(1)
    total_revenue = total_result[0]["revenue"] if total_result else 0

    # Top products
    top_pipeline = [
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.name", "qty": {"$sum": "$items.qty"}, "revenue": {"$sum": {"$multiply": ["$items.price", "$items.qty"]}}}},
        {"$sort": {"qty": -1}},
        {"$limit": 5}
    ]
    top_products = await db.orders.aggregate(top_pipeline).to_list(5)

    # Recent orders
    recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)

    return {
        "total_orders": total_orders,
        "today_orders": today_orders,
        "total_products": total_products,
        "total_customers": total_customers,
        "today_revenue": round(today_revenue, 2),
        "total_revenue": round(total_revenue, 2),
        "top_products": [{"name": p["_id"], "qty": p["qty"], "revenue": round(p["revenue"], 2)} for p in top_products],
        "recent_orders": recent_orders
    }

# ─── Seed Data ───

@api_router.post("/seed")
async def seed_data():
    product_count = await db.products.count_documents({})
    if product_count > 0:
        return {"message": "Data already seeded", "products": product_count}

    products = [
        {"id": str(uuid.uuid4()), "name": "Espresso", "price": 130, "category": "coffee", "description": "Strong concentrated coffee shot", "available": True},
        {"id": str(uuid.uuid4()), "name": "Americano", "price": 150, "category": "coffee", "description": "Espresso diluted with hot water", "available": True},
        {"id": str(uuid.uuid4()), "name": "Cappuccino", "price": 180, "category": "coffee", "description": "Espresso with steamed milk foam", "available": True},
        {"id": str(uuid.uuid4()), "name": "Caffe Latte", "price": 200, "category": "coffee", "description": "Espresso with steamed milk", "available": True},
        {"id": str(uuid.uuid4()), "name": "Macchiato", "price": 220, "category": "coffee", "description": "Espresso with a dash of milk", "available": True},
        {"id": str(uuid.uuid4()), "name": "Caramel Latte", "price": 240, "category": "coffee", "description": "Latte with caramel syrup", "available": True},
        {"id": str(uuid.uuid4()), "name": "Frappuccino", "price": 250, "category": "coffee", "description": "Blended iced coffee drink", "available": True},
        {"id": str(uuid.uuid4()), "name": "Affogato Coffee", "price": 230, "category": "coffee", "description": "Espresso poured over gelato", "available": True},
        {"id": str(uuid.uuid4()), "name": "Mocha", "price": 220, "category": "coffee", "description": "Espresso with chocolate and milk", "available": True},
        {"id": str(uuid.uuid4()), "name": "Iced Coffee", "price": 170, "category": "coffee", "description": "Chilled coffee over ice", "available": True},
        {"id": str(uuid.uuid4()), "name": "Cinnamon Roll", "price": 120, "category": "food", "description": "Freshly baked cinnamon pastry", "available": True},
        {"id": str(uuid.uuid4()), "name": "Almond Roll", "price": 130, "category": "food", "description": "Sweet roll with almond filling", "available": True},
        {"id": str(uuid.uuid4()), "name": "Banana Bread", "price": 140, "category": "food", "description": "Moist homemade banana bread", "available": True},
        {"id": str(uuid.uuid4()), "name": "Choco Muffin", "price": 150, "category": "food", "description": "Rich chocolate chip muffin", "available": True},
        {"id": str(uuid.uuid4()), "name": "Glazed Donut", "price": 100, "category": "food", "description": "Classic glazed donut", "available": True},
        {"id": str(uuid.uuid4()), "name": "Grilled Cheese", "price": 160, "category": "food", "description": "Toasted cheese sandwich", "available": True},
        {"id": str(uuid.uuid4()), "name": "Chicken Bread", "price": 180, "category": "food", "description": "Stuffed chicken bread roll", "available": True},
        {"id": str(uuid.uuid4()), "name": "Tuna Puff", "price": 170, "category": "food", "description": "Flaky pastry with tuna filling", "available": True},
    ]
    for p in products:
        p["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.products.insert_many(products)

    # Create default admin
    admin_exists = await db.users.find_one({"email": "admin@surya.coffee"})
    if not admin_exists:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "name": "Admin",
            "email": "admin@surya.coffee",
            "password": hash_password("admin123"),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    # Create default staff
    staff_exists = await db.users.find_one({"email": "staff@surya.coffee"})
    if not staff_exists:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "name": "Staff",
            "email": "staff@surya.coffee",
            "password": hash_password("staff123"),
            "role": "staff",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    return {"message": "Seed data created", "products": len(products), "users": 2}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.products.create_index("id", unique=True)
    await db.products.create_index("category")
    await db.orders.create_index("id", unique=True)
    await db.orders.create_index("created_at")
    await db.customers.create_index("phone", unique=True)
    await db.customers.create_index("id", unique=True)
    logger.info("Database indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
