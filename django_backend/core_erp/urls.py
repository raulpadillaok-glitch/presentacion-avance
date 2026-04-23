from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
# Para servir archivos de media en desarrollo
from django.conf import settings
from django.conf.urls.static import static
from .views import (
    ChatbotAPIView,
    DashboardStatsAPIView,
    ProductViewSet,
    CategoryViewSet,
    SupplierViewSet,
    RepairOrderViewSet,
    MotorcycleViewSet,
    ServiceMethodViewSet,
    QuoteViewSet,
    LowStockPDFReportView,
    InventoryPredictionViewSet,
    PublicOrderTrackingView,
    PredictDiagnosisAPIView,
    InvoiceViewSet,
    AdvancedReportsAPIView,
)
# 1. Importar vistas de Cuentas y JWT
from accounts.views import ClientViewSet, TechnicianViewSet, UserViewSet, CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

# 2. Configurar el router para las vistas de API
router = DefaultRouter()
# Vistas de Inventario
router.register(r'inventory/products', ProductViewSet, basename='product')
router.register(r'inventory/categories', CategoryViewSet, basename='category')
router.register(r'inventory/suppliers', SupplierViewSet, basename='supplier')
router.register(r'inventory/predictions', InventoryPredictionViewSet, basename='prediction')
# Vistas de Taller
router.register(r'workshop/orders', RepairOrderViewSet, basename='order')
router.register(r'workshop/motorcycles', MotorcycleViewSet, basename='motorcycle')
router.register(r'workshop/services', ServiceMethodViewSet, basename='service')
router.register(r'workshop/quotes', QuoteViewSet, basename='quote')
router.register(r'workshop/invoices', InvoiceViewSet, basename='invoice')
# Vistas de Cuentas
router.register(r'accounts/clients', ClientViewSet, basename='client')
router.register(r'accounts/technicians', TechnicianViewSet, basename='technician')
router.register(r'accounts/users', UserViewSet, basename='user')

# 3. Definir los patrones de URL de la API
api_urlpatterns = [
    # Endpoints de Autenticación JWT
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Endpoints que no son del router
    path('chatbot/', ChatbotAPIView.as_view(), name='chatbot'),
    path('dashboard-stats/', DashboardStatsAPIView.as_view(), name='dashboard-stats'),
    path('reports/advanced/', AdvancedReportsAPIView.as_view(), name='reports-advanced'),
    path('reports/low-stock/', LowStockPDFReportView.as_view(), name='report-low-stock'),
    path('public/track-order/', PublicOrderTrackingView.as_view(), name='public-track-order'),
    path('workshop/predict-diagnosis/', PredictDiagnosisAPIView.as_view(), name='predict-diagnosis'),

    # Endpoints del router (products, orders, etc.)
    path('', include(router.urls)),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    # Prefijo para toda la API, como lo espera el frontend
    path('api/v1/', include(api_urlpatterns)),
]

# Añadir URLs de media solo en modo DEBUG
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)