from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminUser(BasePermission):
    """
    Permite el acceso solo a usuarios administradores (staff).
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)

class IsAdminOrReadOnly(BasePermission):
    """
    Permiso personalizado para permitir que solo los administradores editen un objeto,
    pero cualquiera puede verlo.
    """
    def has_permission(self, request, view):
        # Los métodos seguros (GET, HEAD, OPTIONS) son permitidos para cualquier solicitud.
        if request.method in SAFE_METHODS:
            return True

        # Los permisos de escritura solo se otorgan si el usuario es un administrador.
        return bool(request.user and request.user.is_staff)