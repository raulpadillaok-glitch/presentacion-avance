import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_erp.settings')
django.setup()

from accounts.models import Client, Person
from workshop.models import Motorcycle
from workshop.serializers import QuoteSerializer

# create dummy
person = Person.objects.create(first_name="a", last_name="b")
client = Client.objects.create(person=person)
moto = Motorcycle.objects.create(client=client, plate="123", brand="onda", model_name="a")

data = {
    "client": client.id,
    "motorcycle": moto.id,
    "status": "draft",
    "description": "test",
    "issue_date": "2026-04-09",
    "valid_until": "2026-04-24",
    "total": "20.50",
    "items": [
        {
          "is_product": True,
          "product_item": None,
          "service_item": None,
          "quantity": "1",
          "unit_price": "20.50",
          "subtotal": "20.50"
        }
    ]
}
ser = QuoteSerializer(data=data)
if not ser.is_valid():
    print(ser.errors)
else:
    q = ser.save()
    print("Valid! quote ID:", q.id)
