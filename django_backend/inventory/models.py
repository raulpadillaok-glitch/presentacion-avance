from django.db import models
from accounts.models import Person
from simple_history.models import HistoricalRecords

class Supplier(models.Model):
    business_name = models.CharField(max_length=150)
    nit = models.CharField(max_length=20, unique=True)
    business_phone = models.CharField(max_length=20, null=True, blank=True)
    business_address = models.CharField(max_length=255, null=True, blank=True)
    web_url = models.URLField(null=True, blank=True)
    contact_person = models.ForeignKey(Person, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.business_name

class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    sku = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    description = models.TextField(null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    min_stock = models.IntegerField(default=0)
    product_image = models.ImageField(upload_to='products/', null=True, blank=True) # Manejo de multimedia recomendado
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    history = HistoricalRecords()

    def __str__(self):
        return self.name

class InventoryPrediction(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    prediction_date = models.DateField()
    stockout_date = models.DateField()
    suggested_qty = models.IntegerField()
    confidence = models.DecimalField(max_digits=5, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
