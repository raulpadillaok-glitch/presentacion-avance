import os
import django
import random
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_erp.settings')
django.setup()

from accounts.models import Person, Client, Technician, User # Asegúrate que User esté importado
from inventory.models import Category, Product, Supplier
from workshop.models import Motorcycle, ServiceMethod, Quote, QuoteItem, RepairOrder, RepairOrderItem

first_names = ["Carlos", "Luis", "Ana", "Maria", "Jorge", "Pablo", "Sofia", "Lucia", "Elena", "Pedro", "Manuel", "Raul", "Miguel", "Isabel", "Camila", "Andres", "Victor", "Julia", "Marta", "Fernando", "Diego", "Valeria", "Roberto"]
last_names = ["Perez", "Gomez", "Lopez", "Diaz", "Torres", "Ramirez", "Flores", "Rojas", "Vargas", "Morales", "Castro", "Ortiz", "Navarro", "Rios", "Silva", "Mendoza", "Ruiz", "Romero", "Herrera", "Medina", "Salas", "Cruz"]

brands = ["Honda", "Yamaha", "Suzuki", "Kawasaki", "KTM", "BMW", "Ducati", "TVS", "Bajaj", "Hero"]
models = ["CB190R", "MT-03", "FZ-S", "Ninja 300", "Duke 200", "G 310 R", "Pulsar NS200", "Apache 200", "Xre 300", "R15"]

cat_names = ["Lubricantes", "Frenos", "Eléctrico", "Llantas", "Transmisión", "Motor", "Accesorios", "Herramientas", "Filtros", "Suspensión"]
prod_names = ["Aceite Motul 10W40", "Bujía NGK", "Filtro de Aire K&N", "Pastillas de freno Brembo", "Cadena DID O-Ring", "Llanta Michelin Pilot", "Batería Yuasa YTX", "Kit de Arrastre", "Líquido de frenos DOT4", "Foco LED H4", "Espejo deportivo", "Manillas ajustables", "Cable de embrague", "Retenes de horquilla", "Líquido refrigerante", "Filtro de aceite original", "Kit cilindro", "Válvulas", "Empaquetadura completa", "Llanta Pirelli Diablo"]

service_names = ["Mantenimiento Completo", "Cambio de Aceite", "Ajuste de Válvulas", "Limpieza de Carburador", "Cambio de Pastillas", "Revisión Eléctrica", "Lavado a detalle", "Sincronización cuerpo de aceleración", "Reparación de Suspensión", "Cambio de Kit Arrastre", "Mantenimiento Básico", "Cambio de llantas", "Pintura de aros", "Cambio de refrigerante", "Instalación de accesorios extras", "Revisión general", "Diagnóstico escáner", "Soldadura escape", "Reparación sistema frenos", "Ajuste cadena"]

def run_seed():
    print("Seeding database...")

    # 0. Create Superuser
    print("Creating superuser (admin/admin)...")
    admin_user = User.objects.filter(username='admin').first()
    if not admin_user:
        admin_person, _ = Person.objects.get_or_create(
            ci_nit="11111111",
            defaults={"first_name": "Admin", "last_name": "User", "phone": "12345678", "email_contact": "admin@example.com"}
        ) # type: ignore
        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin',
            person=admin_person,
            role='admin'
        )
        
    # Forzar la contraseña siempre para que funcione
    admin_user.set_password('admin')
    admin_user.save()

    
    # 1. Categories
    print("Creating categories...")
    categories = []
    for c in cat_names:
        cat, _ = Category.objects.get_or_create(name=c, description="Categoria " + c)
        categories.append(cat)
    # create generic more to reach 20 if needed
    for i in range(10):
        cat, _ = Category.objects.get_or_create(name=f"Categoría Extra {i}", description="Extra")
        categories.append(cat)

    print("Creating suppliers...")
    supplier, _ = Supplier.objects.get_or_create(
        nit="123456789",
        defaults={
            "business_name": "Motomaniacos S.R.L.",
            "business_phone": "70001234",
            "business_address": "Av. Principal 123"
        }
    )

    # 2. Products
    print("Creating products...")
    products = []
    for i, p in enumerate(prod_names):
        sku = f"PROD-10{i+1:02d}"
        prod, _ = Product.objects.get_or_create(
            sku=sku,
            defaults={
                "name": p,
                "category": random.choice(categories),
                "supplier": supplier,
                "purchase_price": random.randint(50, 300),
                "sale_price": random.randint(80, 500),
                "stock": random.randint(5, 50),
                "min_stock": 5
            }
        )
        products.append(prod)

    # 3. Technicians & their Users
    print("Creating technicians...")
    technicians = []
    for i in range(20):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        ci = f"T{random.randint(1000000, 9999999)}"
        email = f"tech{i}@chickenmoto.com"
        p, _ = Person.objects.get_or_create(ci_nit=ci, defaults={"first_name": fn, "last_name": ln, "phone": f"7{random.randint(1000000, 9999999)}", "email_contact": email})
        tech, _ = Technician.objects.get_or_create(person=p, defaults={"specialty": "Mecánica General", "is_available": True})
        technicians.append(tech)
        
        # Create User for Technician
        user, created = User.objects.get_or_create(
            username=f"tech{i}",
            defaults={
                "email": email,
                "person": p,
                "role": "technician",
                "is_staff": False
            }
        )
        user.set_password("password")
        user.save()

    # 4. Clients & their Users
    print("Creating clients...")
    clients = []
    for i in range(20):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        ci = f"C{random.randint(1000000, 9999999)}"
        email = f"client{i}@chickenmoto.com"
        p, _ = Person.objects.get_or_create(ci_nit=ci, defaults={"first_name": fn, "last_name": ln, "phone": f"6{random.randint(1000000, 9999999)}", "email_contact": email})
        cli, _ = Client.objects.get_or_create(person=p, defaults={"loyalty_points": random.randint(0, 100)})
        clients.append(cli)

        # Create User for Client
        user, created = User.objects.get_or_create(
            username=f"client{i}",
            defaults={
                "email": email,
                "person": p,
                "role": "client",
                "is_staff": False
            }
        )
        user.set_password("password")
        user.save()

    # 5. Motorcycles (20 motos, distributed among clients)
    print("Creating motorcycles...")
    motorcycles = []
    for i in range(20):
        m, _ = Motorcycle.objects.get_or_create(
            plate=f"{random.randint(1000, 9999)}{random.choice('ABCDEFGH')}{random.choice('ABCDEFGH')}{random.choice('ABCDEFGH')}",
            defaults={
                "client": random.choice(clients),
                "brand": random.choice(brands),
                "model_name": random.choice(models),
                "color": random.choice(["Negro", "Rojo", "Azul", "Blanco", "Gris", "Naranja", "Verde"]),
                "year": random.randint(2010, 2024)
            }
        )
        motorcycles.append(m)

    # 6. ServiceMethods (20)
    print("Creating services...")
    services = []
    for i, s in enumerate(service_names):
        serv, _ = ServiceMethod.objects.get_or_create(
            name=s,
            defaults={
                "description": f"Proceso estándar de {s.lower()}",
                "labor_cost": random.randint(50, 400),
                "estimated_time_minutes": random.choice([30, 45, 60, 90, 120, 180])
            }
        )
        services.append(serv)

    # 7. Quotes (20)
    print("Creating quotes...")
    quotes = []
    for i in range(20):
        moto = motorcycles[i]
        q, created = Quote.objects.get_or_create(
            client=moto.client,
            motorcycle=moto,
            issue_date=timezone.now().date() - timedelta(days=random.randint(1, 30)),
            valid_until=timezone.now().date() + timedelta(days=15),
            defaults={
                "description": f"Cotización de repuestos y servicio {i+1}",
                "status": random.choice(["draft", "sent", "approved", "rejected"]),
                "notes": "Validez 15 días.",
                "total": 0 
            }
        )
        quotes.append(q)
        if created:
            # add items to quote
            subt = 0
            # product item
            prod = random.choice(products)
            q1 = random.randint(1, 3)
            sub1 = prod.sale_price * q1
            QuoteItem.objects.create(quote=q, is_product=True, product_item=prod, quantity=q1, unit_price=prod.sale_price, subtotal=sub1)
            subt += sub1
            
            # service item
            serv = random.choice(services)
            q2 = 1
            sub2 = serv.labor_cost * q2
            QuoteItem.objects.create(quote=q, is_product=False, service_item=serv, quantity=q2, unit_price=serv.labor_cost, subtotal=sub2)
            subt += sub2
            
            q.total = subt
            q.save()

    # 8. RepairOrders (20)
    print("Creating repair orders...")
    for i in range(20):
        moto = motorcycles[i]
        try:
            ro, _ = RepairOrder.objects.get_or_create(
                code=f"ORD-100{i}",
                defaults={
                    "motorcycle": moto,
                    "technician": random.choice(technicians),
                    "status": random.choice(["pending", "diagnosing", "waiting_parts", "in_process", "finished", "delivered"]),
                    "problem_description": f"El cliente reporta fallas en {random.choice(['motor', 'frenos', 'sistema eléctrico', 'transmisión'])}",
                    "entry_at": timezone.now() - timedelta(days=random.randint(1, 20))
                }
            )
        except Exception:
            ro = RepairOrder.objects.filter(code=f"ORD-100{i}").first()
        
        # Add items to the repair order
        if ro and not ro.items.exists():
            prod_to_use = random.choice(products)
            if prod_to_use.stock > 2:
                RepairOrderItem.objects.create(
                    repair_order=ro,
                    product=prod_to_use,
                    quantity=1,
                    unit_price=prod_to_use.sale_price
                )
                prod_to_use.stock -= 1
                prod_to_use.save()

    print("✅ Seed completado con éxito! Tienes 20+ datos en todo lado.")

if __name__ == '__main__':
    run_seed()
