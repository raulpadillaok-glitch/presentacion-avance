from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import RepairOrder

@receiver(pre_save, sender=RepairOrder)
def store_original_status(sender, instance, **kwargs):
    """
    Antes de guardar, si el objeto ya existe, almacenamos su estado original
    en un atributo temporal para poder compararlo después.
    """
    if instance.pk:
        try:
            instance._original_status = RepairOrder.objects.get(pk=instance.pk).status
        except RepairOrder.DoesNotExist:
            instance._original_status = None

@receiver(post_save, sender=RepairOrder)
def notify_status_change(sender, instance, created, **kwargs):
    """
    Después de guardar una orden de reparación, comprueba si el estado ha cambiado
    y si es así, dispara la notificación.
    """
    # No notificar en la creación, solo en actualizaciones.
    # Y solo si el estado original fue almacenado y es diferente al nuevo.
    if not created and hasattr(instance, '_original_status') and instance._original_status != instance.status:
        client_name = instance.motorcycle.client.person.get_full_name()
        new_status_display = instance.get_status_display() # Obtiene el texto legible del estado
        print(f"--- 📣 NOTIFICACIÓN AUTOMÁTICA ---")
        print(f"INFO: El estado de la orden {instance.code} ha cambiado a: '{new_status_display}'.")
        print(f"ACCIÓN: Enviar notificación al cliente {client_name} (Tel: {instance.motorcycle.client.person.phone}).")
        print(f"---------------------------------")