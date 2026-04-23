import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_erp.settings')
django.setup()
from workshop.serializers import QuoteSerializer
data = {
    "client": "",
    "motorcycle": "",
    "status": "draft",
    "description": "test",
    "issue_date": "2026-04-09",
    "valid_until": "2026-04-24",
    "total": "20.50",
    "items": []
}
ser = QuoteSerializer(data=data)
if not ser.is_valid():
    print("ERRORS:", ser.errors)
else:
    print("Valid!")
