from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Person, Client, Technician
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        # Añadimos el rol a la respuesta JSON para que el frontend lo lea
        data['role'] = self.user.role
        return data

User = get_user_model()

class PersonSerializer(serializers.ModelSerializer):
    ci_nit = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True, validators=[])
    
    class Meta:
        model = Person
        fields = ['first_name', 'last_name', 'ci_nit', 'phone', 'address', 'email_contact']
        
    def validate_ci_nit(self, value):
        if not value:
            return None
        return value

class UserSerializer(serializers.ModelSerializer):
    person = PersonSerializer()
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User # type: ignore
        fields = ['id', 'username', 'email', 'password', 'role', 'person', 'is_staff', 'is_superuser']
        read_only_fields = ['is_staff', 'is_superuser'] # These should only be set by admin or superuser

    def create(self, validated_data):
        person_data = validated_data.pop('person')
        password = validated_data.pop('password')
        role = validated_data.get('role', 'client')

        # Create or get Person
        person_instance, created = Person.objects.get_or_create(
            ci_nit=person_data.get('ci_nit'),
            defaults=person_data
        )
        if not created and person_instance.email_contact != person_data.get('email_contact'):
            person_instance.email_contact = person_data.get('email_contact')
            person_instance.save()

        # Determine if it's a superuser creation (only if requested by an admin)
        is_staff = validated_data.get('is_staff', False)
        is_superuser = validated_data.get('is_superuser', False)

        if is_superuser and self.context['request'].user.is_superuser:
            user = User.objects.create_superuser(
                username=validated_data['username'],
                email=validated_data.get('email', person_data.get('email_contact')),
                password=password,
                person=person_instance,
                role=role,
            )
        else:
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data.get('email', person_data.get('email_contact')),
                password=password,
                person=person_instance,
                role=role,
            )

        # Create Client or Technician profile if applicable
        if role == 'client':
            Client.objects.get_or_create(person=person_instance)
        elif role == 'technician':
            Technician.objects.get_or_create(person=person_instance)

        return user

    def update(self, instance, validated_data):
        # Simplified update for now, can be expanded to handle nested updates more robustly
        person_data = validated_data.pop('person', {})
        if person_data:
            for attr, value in person_data.items():
                setattr(instance.person, attr, value)
            instance.person.save()
        return super().update(instance, validated_data) # type: ignore

class ClientSerializer(serializers.ModelSerializer):
    # Usamos 'person' para la escritura, que coincide con el payload del frontend
    person = PersonSerializer(source='person_details', write_only=True)
    # Usamos 'person_details' para la lectura, que es lo que el frontend espera
    person_details = PersonSerializer(source='person', read_only=True)

    class Meta:
        model = Client
        fields = ['id', 'person', 'person_details', 'loyalty_points']

    def create(self, validated_data):
        person_data = validated_data.pop('person_details', {})
        ci_nit = person_data.get('ci_nit')
        
        # Avoid get_or_create with empty strings matching other empty strings
        if not ci_nit:
            person_data['ci_nit'] = None
            person = Person.objects.create(**person_data)
        else:
            person, _ = Person.objects.get_or_create(ci_nit=ci_nit, defaults=person_data)
            
        client = Client.objects.create(person=person, **validated_data)
        return client

    def update(self, instance, validated_data):
        person_data = validated_data.pop('person_details', {})
        person = instance.person
        if person_data:
            if not person_data.get('ci_nit'):
                person_data['ci_nit'] = None
            for attr, value in person_data.items():
                setattr(person, attr, value)
            person.save()
        if 'loyalty_points' in validated_data:
            instance.loyalty_points = validated_data['loyalty_points']
        instance.save()
        return instance

class TechnicianSerializer(serializers.ModelSerializer):
    person = PersonSerializer(write_only=True)
    person_details = PersonSerializer(source='person', read_only=True)

    class Meta:
        model = Technician
        fields = ['id', 'person', 'person_details', 'specialty', 'is_available']

    def create(self, validated_data):
        person_data = validated_data.pop('person')
        if not person_data.get('ci_nit'):
            person_data['ci_nit'] = f"T-{person_data.get('phone', '')}"
        person, _ = Person.objects.get_or_create(ci_nit=person_data['ci_nit'], defaults=person_data)
        technician = Technician.objects.create(person=person, **validated_data)
        return technician

    def update(self, instance, validated_data):
        person_data = validated_data.pop('person')
        person = instance.person
        for attr, value in person_data.items():
            setattr(person, attr, value)
        person.save()
        instance.specialty = validated_data.get('specialty', instance.specialty)
        instance.is_available = validated_data.get('is_available', instance.is_available)
        instance.save()
        return instance