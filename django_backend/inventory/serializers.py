from rest_framework import serializers
from .models import Product, Category, Supplier, InventoryPrediction

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.business_name', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'sku', 'name', 'description', 'product_image',
            'category', 'category_name', 'supplier', 'supplier_name',
            'purchase_price', 'sale_price', 'stock', 'min_stock'
        ]

class InventoryPredictionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = InventoryPrediction
        fields = '__all__'
        permission_classes = [serializers.CurrentUserDefault] # Idealmente, solo admins