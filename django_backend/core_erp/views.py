from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from inventory.models import Product, Category, Supplier, InventoryPrediction
from workshop.models import RepairOrder, Motorcycle, ServiceMethod, Quote
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from django.db.models import F
from django.db import transaction

# --- Importar Serializers ---
from inventory.serializers import ProductSerializer, CategorySerializer, SupplierSerializer, InventoryPredictionSerializer
from workshop.serializers import RepairOrderSerializer, MotorcycleSerializer, ServiceMethodSerializer, QuoteSerializer, InvoiceSerializer
from accounts.permissions import IsAdminOrReadOnly, IsAdminUser

import re

# --- VISTAS DE API EXISTENTES ---

import google.generativeai as genai
from django.conf import settings

class ChatbotAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        user_message = request.data.get('message', '').strip()
        history_data = request.data.get('history', [])

        if not user_message:
            return Response({"reply": "¿En qué puedo ayudarte hoy?"})

        api_key = getattr(settings, 'GEMINI_API_KEY', '')
        if not api_key:
            return Response({"reply": "⚠️ La API Key de Gemini no está configurada en el servidor. Por favor añádela en el archivo `.env` como `GEMINI_API_KEY` o habla con el administrador."})

        genai.configure(api_key=api_key)

        def consultar_stock_inventario(nombre_o_sku: str) -> str:
            """Busca el inventario de un repuesto o producto por nombre o SKU."""
            products = Product.objects.filter(name__icontains=nombre_o_sku) | Product.objects.filter(sku__icontains=nombre_o_sku)
            if products.exists():
                p = products.first()
                return f"Producto: {p.name}, Stock actual: {p.stock}, Stock mínimo: {p.min_stock}"
            return f"No se encontró el producto {nombre_o_sku}."

        def consultar_estado_orden(codigo: str) -> str:
            """Busca el estado de una orden de reparación usando el código (ej. ORD-001) o la placa de la moto."""
            order = RepairOrder.objects.filter(code__icontains=codigo).first()
            if not order and not codigo.upper().startswith("ORD"):
                order = RepairOrder.objects.filter(code__icontains=f"ORD-{codigo.upper()}").first()
            if not order:
                order = RepairOrder.objects.filter(motorcycle__plate__icontains=codigo).first()

            if order:
                return f"Orden {order.code} (Placa: {order.motorcycle.plate}). Estado: {order.get_status_display()}. Problema: {order.problem_description}."
            return f"No se encontró la orden {codigo}."

        def listar_servicios() -> str:
            """Devuelve la lista de servicios que ofrece el taller y sus precios base."""
            services = ServiceMethod.objects.all()
            if not services.exists():
                return "No hay servicios registrados."
            return ", ".join([f"{s.name} (${s.base_price})" for s in services])

        try:
            model = genai.GenerativeModel(
                model_name='gemini-2.5-flash',
                tools=[consultar_stock_inventario, consultar_estado_orden, listar_servicios],
                system_instruction=(
                    "Eres un asistente virtual experto para el ERP de Chicken Moto. "
                    "Tu trabajo es ayudar a administradores, mecánicos y clientes a obtener información rápida. "
                    "Utiliza siempre que sea necesario las funciones (tools) disponibles para consultar el sistema. "
                    "Habla de forma profesional, amigable y usa emojis. "
                    "Siempre responde utilizando Markdown (negritas, listas) para que sea fácil de leer en la pantalla."
                )
            )
            
            formatted_history = []
            for msg in history_data:
                role = 'model' if msg.get('sender') == 'bot' else 'user'
                text_content = msg.get('text', '')
                if text_content:
                    formatted_history.append({'role': role, 'parts': [text_content]})
                
            chat = model.start_chat(history=formatted_history, enable_automatic_function_calling=True)
            response = chat.send_message(user_message)
            
            return Response({"reply": response.text})
        except Exception as e:
            print(f"Gemini API Error: {str(e)}")
            return Response({"reply": f"❌ Ha ocurrido un error al consultar con la IA:\n\n`{str(e)}`"}, status=500)

from accounts.models import Client
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, F, Count

class DashboardStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now()
        thirty_days_ago = today - timedelta(days=30)
        from workshop.models import Quote, Invoice # Evitar dependencia circular
        
        # Cotizaciones cerradas o Facturas generadas este mes (simulación de ingresos)
        monthly_revenue = Quote.objects.filter(status='approved', updated_at__gte=thirty_days_ago).aggregate(total=Sum('total'))['total'] or 0
        
        # Órdenes activas
        active_orders = RepairOrder.objects.exclude(status='delivered').count()
        
        # Alertas de stock crítico
        low_stock_count = Product.objects.filter(stock__lte=F('min_stock')).count()
        
        # Total Clientes
        total_clients = Client.objects.count()

        # Últimas órdenes
        recent_orders = RepairOrder.objects.all().order_by('-entry_at')[:5]
        recent_orders_data = [{
            "id": r.id,
            "code": r.code,
            "motorcycle": r.motorcycle.plate,
            "status": r.status,
            "date": r.entry_at.strftime('%Y-%m-%d')
        } for r in recent_orders]

        # Stock Crítico listado
        critical_stock = Product.objects.filter(stock__lte=F('min_stock'))[:5]
        critical_stock_data = [{
            "id": p.id,
            "name": p.name,
            "stock": p.stock,
            "min_stock": p.min_stock
        } for p in critical_stock]

        # Datos para gráficas (Últimos 7 días)
        revenue_data = []
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            # Simulated history data formatting
            day_total = Quote.objects.filter(status='approved', updated_at__date=d.date()).aggregate(total=Sum('total'))['total'] or 0
            # If 0, we add a random base to show something in the empty database
            if day_total == 0: day_total = (i*15) + 50
            revenue_data.append({"name": d.strftime('%d %b'), "Ingresos": float(day_total)})

        return Response({
            "monthly_revenue": monthly_revenue,
            "active_orders": active_orders,
            "low_stock_count": low_stock_count,
            "total_clients": total_clients,
            "recent_orders": recent_orders_data,
            "critical_stock": critical_stock_data,
            "revenue_chart": revenue_data
        })

import os
import joblib
from django.conf import settings

class PredictDiagnosisAPIView(APIView):
    """
    Recibe un texto descriptivo del problema de la motocicleta y utiliza 
    Machine Learning (Random Forest) para sugerir el servicio requerido.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        description = request.data.get('description', '').strip()
        if not description:
            return Response({"error": "No se proporcionó descripción del problema."}, status=status.HTTP_400_BAD_REQUEST)
        
        model_path = os.path.join(settings.BASE_DIR, 'workshop', 'ml_models', 'fault_classifier.pkl')
        if not os.path.exists(model_path):
            return Response({"error": "El modelo de ML no está entrenado o no se encuentra."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        try:
            # Cargar pipeline
            pipeline = joblib.load(model_path)
            
            # Predicción: id del servicio
            predicted_id = pipeline.predict([description])[0]
            
            # (Opcional) Obtener probabilidades if available
            probabilities = pipeline.predict_proba([description])[0]
            confidence = max(probabilities) * 100
            
            service = ServiceMethod.objects.filter(id=predicted_id).first()
            if not service:
                return Response({"error": "Servicio inferido no existe en BD."}, status=status.HTTP_404_NOT_FOUND)
                
            return Response({
                "suggested_service_id": service.id,
                "suggested_service_name": service.name,
                "confidence": round(confidence, 2)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LowStockPDFReportView(APIView):
    """
    Genera un reporte en PDF de los productos con stock bajo o crítico. (RF5)
    Accesible solo para administradores.
    """
    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_stock_bajo.pdf"'

        p = canvas.Canvas(response, pagesize=letter)
        width, height = letter

        # Título
        p.setFont("Helvetica-Bold", 16)
        p.drawString(inch, height - inch, "Reporte de Productos con Stock Bajo")

        # Cabecera de la tabla
        p.setFont("Helvetica-Bold", 10)
        y = height - 1.5 * inch
        p.drawString(inch, y, "SKU")
        p.drawString(2.5 * inch, y, "Nombre del Producto")
        p.drawString(5.5 * inch, y, "Stock Actual")
        p.drawString(6.5 * inch, y, "Stock Mínimo")
        p.line(inch, y - 0.1 * inch, width - inch, y - 0.1 * inch)

        # Contenido de la tabla
        p.setFont("Helvetica", 10)
        y -= 0.3 * inch
        low_stock_products = Product.objects.filter(stock__lte=F('min_stock')).order_by('name')

        for product in low_stock_products:
            p.drawString(inch, y, product.sku)
            p.drawString(2.5 * inch, y, product.name[:50])
            p.drawString(5.75 * inch, y, str(product.stock))
            p.drawString(6.75 * inch, y, str(product.min_stock))
            y -= 0.3 * inch

        p.showPage()
        p.save()
        return response


# --- VISTAS DE API SUGERIDAS (NUEVAS) ---
# Para implementar estas vistas, necesitarás crear un archivo `serializers.py`
# en tus apps `inventory` y `workshop` y definir los serializadores correspondientes.
# Ejemplo: class ProductSerializer(serializers.ModelSerializer): class Meta: model = Product; fields = '__all__'
#
# También deberás registrarlas en tu archivo `urls.py` usando un router.
# Ejemplo:
# from rest_framework.routers import DefaultRouter
# router = DefaultRouter()
# router.register(r'products', views.ProductViewSet)
# urlpatterns += router.urls

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    filter_backends = [SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'sku', 'description']
    filterset_fields = ['category', 'supplier']
    # permission_classes = [IsAdminOrReadOnly]
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        product = self.get_object()
        history = product.history.all()
        # manual serialization of history for quick frontend use
        data = []
        for h in history:
            user = h.history_user.username if h.history_user else "Sistema"
            data.append({
                "date": h.history_date,
                "action": h.get_history_type_display(),
                "user": user,
                "stock": h.stock,
                "price": h.sale_price
            })
        return Response(data)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['name']

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['business_name', 'nit']

class MotorcycleViewSet(viewsets.ModelViewSet):
    serializer_class = MotorcycleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['brand', 'client']
    search_fields = ['plate', 'model_name']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or hasattr(user, 'technician_profile'):
            return Motorcycle.objects.all()
        if hasattr(user, 'client_profile'):
            return Motorcycle.objects.filter(client=user.client_profile)
        return Motorcycle.objects.none()

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """
        Devuelve el historial clínico (órdenes de reparación) para una motocicleta específica. (RF4)
        """
        motorcycle = self.get_object()
        orders = RepairOrder.objects.filter(motorcycle=motorcycle).order_by('-entry_at')
        
        page = self.paginate_queryset(orders)
        if page is not None:
            serializer = RepairOrderSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = RepairOrderSerializer(orders, many=True)
        return Response(serializer.data)

class ServiceMethodViewSet(viewsets.ModelViewSet):
    queryset = ServiceMethod.objects.all()
    serializer_class = ServiceMethodSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name']

class RepairOrderViewSet(viewsets.ModelViewSet):
    """
    API endpoint para crear, ver y actualizar órdenes de reparación. (Cumple con RF2)
    También maneja la asignación de repuestos y la deducción de stock (RF Asignación de Repuestos).
    """
    serializer_class = RepairOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['status', 'technician', 'motorcycle__client']
    search_fields = ['code', 'problem_description', 'motorcycle__plate']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or hasattr(user, 'technician_profile'):
            return RepairOrder.objects.all().order_by('-entry_at')
        if hasattr(user, 'client_profile'):
            return RepairOrder.objects.filter(motorcycle__client=user.client_profile).order_by('-entry_at')
        return RepairOrder.objects.none()

    def perform_create(self, serializer):
        # La lógica de stock está en el serializer, aquí solo manejamos la subida de archivos.
        evidence_file = self.request.data.get('evidence_video')
        serializer.save(evidence_video=evidence_file)

    def perform_update(self, serializer):
        evidence_file = self.request.data.get('evidence_video')
        try:
            serializer.save(evidence_video=evidence_file)
        except TypeError: # Si el archivo no cambia, puede dar un error.
            serializer.save()

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        order = self.get_object()
        history = order.history.all()
        data = []
        for h in history:
            user = h.history_user.username if h.history_user else "Sistema"
            data.append({
                "date": h.history_date,
                "action": h.get_history_type_display(),
                "user": user,
                "status": h.status,
                "problem": h.problem_description
            })
        return Response(data)

class QuoteViewSet(viewsets.ModelViewSet):
    """
    API endpoint para gestionar Cotizaciones.
    """
    serializer_class = QuoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['status', 'client', 'motorcycle']
    search_fields = ['description', 'notes']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or hasattr(user, 'technician_profile'):
            return Quote.objects.all().order_by('-issue_date')
        if hasattr(user, 'client_profile'):
            return Quote.objects.filter(client=user.client_profile).order_by('-issue_date')
        return Quote.objects.none()

class InvoiceViewSet(viewsets.ModelViewSet):
    from workshop.models import Invoice
    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['client', 'is_paid']
    search_fields = ['code']

class InventoryPredictionViewSet(viewsets.ModelViewSet):
    queryset = InventoryPrediction.objects.all().order_by('-prediction_date')
    serializer_class = InventoryPredictionSerializer
    permission_classes = [IsAdminUser] # Solo los administradores pueden ver/gestionar predicciones
    filterset_fields = ['product']

class AdvancedReportsAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        from workshop.models import RepairOrder, Quote
        from inventory.models import Product
        
        # 1. Monthly Revenue (Last 6 months simulated)
        today = timezone.now()
        monthly_revenue = []
        for i in range(5, -1, -1):
            d = today - timedelta(days=i*30)
            month_name = d.strftime('%b')
            # Mock or get real if existing
            total = Quote.objects.filter(status='approved', updated_at__month=d.month).aggregate(total=Sum('total'))['total'] or 0
            if total == 0: total = (i * 100) + 500 # Simulated data for empty db
            monthly_revenue.append({"name": month_name, "ingresos": float(total)})

        # 2. Top Technicians (Pie Chart)
        tech_stats = RepairOrder.objects.filter(status__in=['finished', 'delivered']).values('technician__person__first_name').annotate(count=Count('id')).order_by('-count')[:5]
        top_techs = []
        if tech_stats:
            for stat in tech_stats:
                top_techs.append({"name": stat['technician__person__first_name'], "value": stat['count']})
        else:
            top_techs = [{"name": "Demo Tech 1", "value": 10}, {"name": "Demo Tech 2", "value": 6}, {"name": "Demo Tech 3", "value": 3}]

        # 3. Inventory Valuation
        valuation = Product.objects.aggregate(total_value=Sum(F('stock') * F('sale_price')))['total_value'] or 0
        
        # 4. Order Status Distribution (Pie Chart)
        status_counts = RepairOrder.objects.values('status').annotate(count=Count('id'))
        order_distribution = []
        status_map = {
            'pending': 'Pendiente', 'diagnosing': 'Diagnóstico', 'waiting_parts': 'Repuestos',
            'in_process': 'En Proceso', 'finished': 'Terminado', 'delivered': 'Entregado'
        }
        for sc in status_counts:
            order_distribution.append({"name": status_map.get(sc['status'], sc['status']), "value": sc['count']})
        if not order_distribution:
            order_distribution = [{"name": "Pendiente", "value": 5}, {"name": "Proceso", "value": 3}]

        return Response({
            "monthly_revenue": monthly_revenue,
            "top_techs": top_techs,
            "inventory_valuation": float(valuation),
            "order_distribution": order_distribution
        })

class PublicOrderTrackingView(APIView):
    """
    Endpoint público para que los clientes rastreen su reparación sin contraseña.
    """
    permission_classes = [AllowAny]
    
    def get(self, request, *args, **kwargs):
        code = request.query_params.get('code', None)
        if not code:
            return Response({"error": "Debe proporcionar un código de orden para rastrear."}, status=status.HTTP_400_BAD_REQUEST)
        
        cleaned_code = code.strip().upper()
        order = RepairOrder.objects.filter(code__icontains=cleaned_code).first()
        if not order and not cleaned_code.startswith("ORD"):
            order = RepairOrder.objects.filter(code__icontains=f"ORD-{cleaned_code}").first()
            
        if not order:
            return Response({"error": "No se encontró ninguna orden actíva con ese código."}, status=status.HTTP_404_NOT_FOUND)
            
        evidence_url = None
        if order.evidence_video:
            evidence_url = order.evidence_video.url if hasattr(order.evidence_video, 'url') else order.evidence_video
            if evidence_url and not str(evidence_url).startswith('http'):
                evidence_url = request.build_absolute_uri(evidence_url)
                
        # Solo retornamos campos no sensibles (ocultamos costos, cliente id, técnico preciso, etc.)
        data = {
            "code": order.code,
            "status": order.status,
            "motorcycle_plate": order.motorcycle.plate if order.motorcycle else "---",
            "motorcycle_brand": order.motorcycle.brand if order.motorcycle else "",
            "problem_description": order.problem_description,
            "entry_at": order.entry_at,
            "evidence_video": evidence_url
        }
        return Response(data, status=status.HTTP_200_OK)
