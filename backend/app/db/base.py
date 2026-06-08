from app.core.database import Base  # noqa: F401 - imported so models register with Base

# Import all models here so Alembic can detect them
from app.modules.users.models import User  # noqa
from app.modules.products.models import Brand, Category, Product, ProductImage  # noqa
from app.modules.tryon.models import UserImage, TryOnSession  # noqa
from app.modules.orders.models import Cart, CartItem, Order, OrderItem, Favorite  # noqa
