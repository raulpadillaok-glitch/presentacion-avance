from django.db import models
from accounts.models import Client, Technician
from inventory.models import Product
from simple_history.models import HistoricalRecords

class Motorcycle(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    plate = models.CharField(max_length=20, unique=True)
    brand = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100)
    color = models.CharField(max_length=50, null=True, blank=True)
    year = models.IntegerField(null=True, blank=True)
    photo = models.ImageField(upload_to='motorcycles/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.plate} - {self.brand}"

class ServiceMethod(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    labor_cost = models.DecimalField(max_digits=10, decimal_places=2)
    estimated_time_minutes = models.IntegerField()
    demonstration_video = models.FileField(upload_to='services/videos/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Quote(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Borrador'),
        ('sent', 'Enviado'),
        ('approved', 'Aprobado'),
        ('rejected', 'Rechazado'),
    )
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    motorcycle = models.ForeignKey(Motorcycle, on_delete=models.CASCADE)
    description = models.CharField(max_length=255, null=True, blank=True)
    issue_date = models.DateField()
    valid_until = models.DateField()
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    history = HistoricalRecords()

    def __str__(self):
        return f"Cotización #{self.id}"

class QuoteItem(models.Model):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='items')
    # Simplified polymorphism representation: we specify just the name of the service/product here
    # or link it explicitly 
    is_product = models.BooleanField(default=True)
    product_item = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    service_item = models.ForeignKey(ServiceMethod, on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.unit_price and self.quantity:
            self.subtotal = self.unit_price * self.quantity
        super().save(*args, **kwargs)

class RepairOrder(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pendiente'),
        ('diagnosing', 'Diagnosticando'),
        ('waiting_parts', 'Esperando Repuestos'),
        ('in_process', 'En Proceso'),
        ('finished', 'Finalizado'),
        ('delivered', 'Entregado'),
    )
    code = models.CharField(max_length=50, unique=True)
    quote = models.ForeignKey(Quote, on_delete=models.SET_NULL, null=True, blank=True)
    motorcycle = models.ForeignKey(Motorcycle, on_delete=models.CASCADE)
    technician = models.ForeignKey(Technician, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    problem_description = models.TextField()
    technical_report = models.TextField(null=True, blank=True)
    evidence_video = models.FileField(upload_to='repairs/videos/', null=True, blank=True)
    entry_at = models.DateTimeField()
    estimated_delivery = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    history = HistoricalRecords()

    def __str__(self):
        return self.code

class RepairOrderItem(models.Model):
    """
    Representa un item (producto o servicio) dentro de una orden de reparación.
    Esto reemplaza al modelo anterior 'RepairMaterial' para mantener consistencia.
    """
    repair_order = models.ForeignKey(RepairOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2) # Precio al momento de la venta
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        self.subtotal = self.unit_price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity} x {self.product.name} for {self.repair_order.code}"

class Invoice(models.Model):
    code = models.CharField(max_length=50, unique=True)
    quote = models.OneToOneField(Quote, on_delete=models.SET_NULL, null=True, blank=True)
    repair_order = models.OneToOneField(RepairOrder, on_delete=models.SET_NULL, null=True, blank=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    issue_date = models.DateField(auto_now_add=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=16.00) # 16% impuesto base
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if self.subtotal is not None and self.tax_rate is not None:
            import decimal
            # Convert values to floats or keep as decimals correctly
            tax = (self.subtotal * self.tax_rate) / decimal.Decimal('100.0')
            self.tax_amount = tax
            self.total = self.subtotal + self.tax_amount
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Factura {self.code}"
