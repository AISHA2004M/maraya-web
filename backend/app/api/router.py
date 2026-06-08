from fastapi import APIRouter
from app.modules.auth.router import router as auth_router
from app.modules.products.router import router as products_router
from app.modules.tryon.router import router as tryon_router, ai_router
from app.modules.users.router import router as users_router
from app.modules.orders.router import router as orders_router
from app.modules.upload.router import router as upload_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["Auth"])
api_router.include_router(products_router, prefix="/products", tags=["Products"])
api_router.include_router(tryon_router, prefix="/tryon", tags=["TryOn"])
api_router.include_router(ai_router, prefix="/ai", tags=["AI"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(orders_router, prefix="/orders", tags=["Orders"])
api_router.include_router(upload_router, prefix="/upload", tags=["Upload"])

