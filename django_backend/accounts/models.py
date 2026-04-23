from django.db import models
from django.contrib.auth.models import AbstractUser

class Person(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    ci_nit = models.CharField(max_length=20, unique=True, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)
    email_contact = models.EmailField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('technician', 'Technician'),
        ('client', 'Client'),
    )
    person = models.OneToOneField(Person, on_delete=models.CASCADE, null=True, blank=True, related_name='user_account')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')
    # AbstractUser gives us 'username', 'email', 'password', 'is_active', etc.
    
    def __str__(self):
        return self.username

class Technician(models.Model):
    person = models.OneToOneField(Person, on_delete=models.CASCADE, related_name='technician_profile')
    specialty = models.CharField(max_length=100)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.person.first_name} (Técnico)"

class Client(models.Model):
    person = models.OneToOneField(Person, on_delete=models.CASCADE, related_name='client_profile')
    loyalty_points = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.person.first_name} (Cliente)"
