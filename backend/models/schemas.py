from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────
class UserRegister(BaseModel):
    email: str
    password: str = Field(min_length=6)
    full_name: str = ""


class UserLogin(BaseModel):
    email: str
    password: str


class UserProfile(BaseModel):
    id: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    role: Optional[str] = "customer"


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None


# ── Products ──────────────────────────────────────────────
class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float = Field(ge=0)
    compare_price: Optional[float] = Field(default=None, ge=0)
    image_url: Optional[str] = None
    images: Optional[List[str]] = []
    category_id: Optional[int] = None
    stock: int = Field(default=0, ge=0)
    is_featured: bool = False
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0)
    compare_price: Optional[float] = Field(default=None, ge=0)
    image_url: Optional[str] = None
    images: Optional[List[str]] = None
    category_id: Optional[int] = None
    stock: Optional[int] = Field(default=None, ge=0)
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    price: float
    compare_price: Optional[float] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = []
    category_id: Optional[int] = None
    stock: int = 0
    is_featured: bool = False
    is_active: bool = True
    rating_avg: float = 0
    rating_count: int = 0
    created_at: Optional[str] = None


# ── Categories ────────────────────────────────────────────
class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None


# ── Cart ──────────────────────────────────────────────────
class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1)


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: Optional[dict] = None


# ── Orders ────────────────────────────────────────────────
class OrderCreate(BaseModel):
    shipping_name: str
    shipping_address: str
    shipping_city: str
    shipping_postal: Optional[str] = None
    shipping_phone: Optional[str] = None
    notes: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str = Field(pattern="^(pending|processing|shipped|delivered|cancelled)$")


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_image: Optional[str] = None
    price: float
    quantity: int
    subtotal: float


class OrderResponse(BaseModel):
    id: int
    order_uid: str
    user_id: str
    status: str
    total: float
    shipping_name: str
    shipping_address: str
    shipping_city: str
    shipping_postal: Optional[str] = None
    shipping_phone: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None
    order_items: Optional[List[OrderItemResponse]] = []


# ── Reviews ───────────────────────────────────────────────
class ReviewCreate(BaseModel):
    product_id: int
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    id: int
    user_id: str
    product_id: int
    rating: int
    comment: Optional[str] = None
    created_at: Optional[str] = None
    user_name: Optional[str] = None


# ── Admin ─────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_products: int = 0
    total_orders: int = 0
    total_revenue: float = 0
    total_customers: int = 0
    recent_orders: List[dict] = []
