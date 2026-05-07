from rest_framework import serializers
from django.db import transaction
from .models import Motorcycle, RepairOrder, RepairOrderItem, ServiceMethod, Quote, QuoteItem, Invoice, RepairOrderGallery, RepairOrderService
from inventory.models import Product

class MotorcycleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Motorcycle
        fields = '__all__'

class ServiceMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceMethod
        fields = '__all__'

class RepairOrderGallerySerializer(serializers.ModelSerializer):
    class Meta:
        model = RepairOrderGallery
        fields = '__all__'

class RepairOrderServiceSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)
    
    class Meta:
        model = RepairOrderService
        fields = '__all__'

class RepairOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepairOrderItem
        fields = ['product', 'quantity', 'unit_price']

class QuoteItemSerializer(serializers.ModelSerializer):
    item_name = serializers.SerializerMethodField()
    item_sku = serializers.SerializerMethodField()

    class Meta:
        model = QuoteItem
        fields = ['id', 'is_product', 'product_item', 'service_item', 'item_name', 'item_sku', 'quantity', 'unit_price', 'subtotal']
        read_only_fields = ['item_name', 'item_sku', 'subtotal']

    def get_item_name(self, obj):
        if obj.is_product and obj.product_item:
            return obj.product_item.name
        if not obj.is_product and obj.service_item:
            return obj.service_item.name
        return "N/A"

    def get_item_sku(self, obj):
        if obj.is_product and obj.product_item:
            return obj.product_item.sku
        return "SERV"

class QuoteSerializer(serializers.ModelSerializer):
    items = QuoteItemSerializer(many=True, required=False)
    client_name = serializers.CharField(source='client.person.first_name', read_only=True)
    client_last_name = serializers.CharField(source='client.person.last_name', read_only=True)
    motorcycle_details = serializers.StringRelatedField(source='motorcycle', read_only=True)

    class Meta:
        model = Quote
        fields = '__all__'

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        quote = Quote.objects.create(**validated_data)
        for item_data in items_data:
            QuoteItem.objects.create(quote=quote, **item_data)
        return quote

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                QuoteItem.objects.create(quote=instance, **item_data)
        return instance

class RepairOrderSerializer(serializers.ModelSerializer):
    items = RepairOrderItemSerializer(many=True, required=False)
    gallery = RepairOrderGallerySerializer(many=True, read_only=True)
    services = RepairOrderServiceSerializer(many=True, read_only=True)
    motorcycle_plate = serializers.CharField(source='motorcycle.plate', read_only=True)
    technician_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = RepairOrder
        fields = '__all__'

    def get_technician_name(self, obj):
        if obj.technician and hasattr(obj.technician, 'person'):
            return f"{obj.technician.person.first_name} {obj.technician.person.last_name}"
        return ""

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        with transaction.atomic():
            # Primero, crea la orden de reparación
            repair_order = RepairOrder.objects.create(**validated_data)
            
            # Luego, crea los items y descuenta el stock
            for item_data in items_data:
                product = item_data['product']
                quantity = item_data['quantity']
                
                if product.stock < quantity:
                    raise serializers.ValidationError(
                        f"Stock insuficiente para el producto: {product.name}. Stock actual: {product.stock}"
                    )
                
                RepairOrderItem.objects.create(repair_order=repair_order, **item_data)
                
                # Descontar stock
                product.stock -= quantity
                product.save()
                
        return repair_order

    def update(self, instance, validated_data):
        # Nota: Una actualización completa debería manejar la adición/eliminación de items y ajustar el stock.
        # Por simplicidad, esta versión solo actualiza los campos principales de la orden.
        return super().update(instance, validated_data)

class InvoiceSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.person.first_name', read_only=True)
    client_last_name = serializers.CharField(source='client.person.last_name', read_only=True)
    repair_order_code = serializers.CharField(source='repair_order.code', read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'