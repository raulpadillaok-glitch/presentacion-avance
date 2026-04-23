from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MotorcycleViewSet, RepairOrderViewSet, QuoteViewSet, ServiceMethodViewSet

router = DefaultRouter()
router.register(r'motorcycles', MotorcycleViewSet)
router.register(r'orders', RepairOrderViewSet)
router.register(r'quotes', QuoteViewSet)
router.register(r'services', ServiceMethodViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
