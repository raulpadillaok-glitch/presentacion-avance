import os
import django
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
import logging

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_erp.settings')
django.setup()

from workshop.models import ServiceMethod

def create_and_train_model():
    print("Iniciando entrenamiento del modelo NLP de Diagnóstico...")
    
    # Dataset de entrenamiento (Dummy Data para demostración ingenieril)
    # Formato: ("Síntoma que escribe el mecánico", "Nombre exacto del ServiceMethod")
    training_data = [
        # Cambio de Aceite
        ("moto pierde fuerza y el motor esta muy caliente", "Cambio de Aceite"),
        ("toca mantenimiento a los 5000 km cambio de fluidos", "Cambio de Aceite"),
        ("nivel bajo en el medidor y color negro", "Cambio de Aceite"),
        
        # Ajuste de Válvulas
        ("suena como maquina de coser el motor en frio", "Ajuste de Válvulas"),
        ("cascabeleo al acelerar a fondo", "Ajuste de Válvulas"),
        ("se apaga en ralenti y le cuesta arrancar", "Ajuste de Válvulas"),
        
        # Cambio de Pastillas
        ("frena muy largo y rechina el disco delantero", "Cambio de Pastillas"),
        ("ruido metalico al frenar", "Cambio de Pastillas"),
        ("no agarra bien la palanca de freno esta esponjosa", "Cambio de Pastillas"),
        
        # Revisión Eléctrica
        ("no prenden las luces ni los guiñadores", "Revisión Eléctrica"),
        ("bateria se descarga muy rapido", "Revisión Eléctrica"),
        ("el tablero se apaga de la nada", "Revisión Eléctrica"),
        
        # Cambio de Kit Arrastre
        ("cadena suena floja y se sale", "Cambio de Kit Arrastre"),
        ("estrellas desgastadas y vibra al andar", "Cambio de Kit Arrastre"),
        ("tirones al acelerar en primera", "Cambio de Kit Arrastre"),

        # Limpieza de Carburador
        ("se ahoga al dar gas", "Limpieza de Carburador"),
        ("bota gasolina por el desfogue", "Limpieza de Carburador"),
        
        # Reparación de Suspensión
        ("bota aceite por los amortiguadores delanteros", "Reparación de Suspensión"),
        ("muy duro el rebote en baches", "Reparación de Suspensión"),
        
        # Cambio de llantas
        ("goma pinchada y gastada", "Cambio de llantas"),
        ("llanta lisa", "Cambio de llantas"),
        
        # Cambio de refrigerante
        ("se recalienta el motor y no ventila", "Cambio de refrigerante"),
        ("bajo nivel en el radiador", "Cambio de refrigerante"),
    ]

    X_train = [item[0] for item in training_data]
    y_raw_labels = [item[1] for item in training_data]

    # Mapeo a IDs reales de la base de datos
    y_train = []
    
    # Asegurémonos de obtener los IDs correctos si existen
    for text, label in training_data:
        service = ServiceMethod.objects.filter(name=label).first()
        if service:
            y_train.append(service.id)
        else:
            # Si por alguna razon el servicio no existe, creamos uno mock.
            # Ojo: esto es solo para robustez.
            new_service, _ = ServiceMethod.objects.get_or_create(
                name=label, 
                defaults={"description": f"Generado auto para {label}", "labor_cost": 100, "estimated_time_minutes": 60}
            )
            y_train.append(new_service.id)

    print(f"Entrenando con {len(X_train)} ejemplos...")
    
    # Crear Pipeline (Extracción de Features de Texto + Random Forest)
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(stop_words=['el', 'la', 'los', 'las', 'un', 'una', 'y', 'o', 'en', 'muy'])),
        ('clf', RandomForestClassifier(n_estimators=100, random_state=42))
    ])

    pipeline.fit(X_train, y_train)

    # Crear directorio si no existe
    model_dir = os.path.join(django.conf.settings.BASE_DIR, 'workshop', 'ml_models')
    if not os.path.exists(model_dir):
        os.makedirs(model_dir)

    model_path = os.path.join(model_dir, 'fault_classifier.pkl')
    joblib.dump(pipeline, model_path)
    
    print(f"✅ Modelo entrenado y guardado exitosamente en: {model_path}")
    
    # Prueba rápida:
    test_text = "hace ruido metalico al momento de frenar"
    predicted_id = pipeline.predict([test_text])[0]
    predicted_service = ServiceMethod.objects.get(id=predicted_id)
    print(f"Prueba local - Texto: '{test_text}' => Predicción: {predicted_service.name}")

if __name__ == '__main__':
    create_and_train_model()
