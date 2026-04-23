from rest_framework import viewsets, permissions
from django.contrib.auth import get_user_model
from .models import Client, Technician, Person
from .serializers import ClientSerializer, TechnicianSerializer, UserSerializer, CustomTokenObtainPairSerializer
from .permissions import IsAdminOrReadOnly, IsAdminUser # type: ignore
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    """Vista de Login personalizada para devolver el token y el rol."""
    serializer_class = CustomTokenObtainPairSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-id')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser] # Only superusers can list/retrieve/update/delete users

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def register_superuser(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(is_staff=True, is_superuser=True) # Force these fields to true
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ClientViewSet(viewsets.ModelViewSet):
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role == 'technician': # Technicians can also see all clients
            return Client.objects.filter(is_active=True).order_by('-id')
        if hasattr(user, 'client_profile'):
            return Client.objects.filter(pk=user.client_profile.pk, is_active=True)
        return Client.objects.none()

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()

    @action(detail=False, methods=['get'])
    def deleted(self, request):
        """Lista los clientes borrados (is_active=False)"""
        user = self.request.user
        if user.is_staff or user.role == 'technician':
            deleted_clients = Client.objects.filter(is_active=False).order_by('-id')
        else:
            return Response({"error": "No permission"}, status=status.HTTP_403_FORBIDDEN)
            
        page = self.paginate_queryset(deleted_clients)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(deleted_clients, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restaura un cliente previamente borrado lógicamente"""
        client = Client.objects.filter(pk=pk).first()
        if not client:
            return Response({"error": "Client not found"}, status=status.HTTP_404_NOT_FOUND)
            
        client.is_active = True
        client.save()
        return Response({"message": "Cliente restaurado exitosamente"})

class TechnicianViewSet(viewsets.ModelViewSet):
    queryset = Technician.objects.all().order_by('person__first_name')
    serializer_class = TechnicianSerializer
    permission_classes = [IsAdminOrReadOnly]