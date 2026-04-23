from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet, CategoryViewSet, ProductViewSet, InventoryPredictionViewSet

router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'predictions', InventoryPredictionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
