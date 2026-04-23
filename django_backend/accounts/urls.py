from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, ClientViewSet, TechnicianViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'technicians', TechnicianViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
