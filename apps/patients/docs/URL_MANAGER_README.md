# 🌐 URL Manager - AltaMedica Patients App

Sistema completo de gestión y navegación de URLs para la aplicación de pacientes de AltaMedica.

## 🚀 Inicio Rápido

### Modo Interactivo (Recomendado)
```bash
# Windows
run-url-manager.bat

# O directamente con Python
python url_manager.py
```

### Modo Comando
```bash
# Listar todas las URLs
python url_manager.py list

# Listar URLs por categoría
python url_manager.py list ai
python url_manager.py list medical
python url_manager.py list telemedicine

# Abrir una URL específica
python url_manager.py open ai-diagnosis
python url_manager.py open appointments

# Buscar URLs
python url_manager.py search "diagnóstico"
python url_manager.py search "cita"

# Ver URLs más populares
python url_manager.py popular

# Crear archivo de bookmarks HTML
python url_manager.py bookmarks
```

## 📚 Categorías de URLs

### 🏠 Main (Principal)
- `/` - Dashboard principal con diagnóstico IA

### 🤖 AI (Inteligencia Artificial)
- `/ai-diagnosis` - Sistema completo de diagnóstico con IA
- `/ai-diagnosis/history` - Historial de diagnósticos

### 📅 Appointments (Citas)
- `/appointments` - Lista de citas médicas
- `/appointments/new` - Agendar nueva cita
- `/appointments/book` - Reserva rápida

### 🎥 Telemedicine (Telemedicina)
- `/telemedicine` - Portal de consultas virtuales
- `/telemedicine/test` - Probar dispositivos
- `/telemedicine/waiting` - Sala de espera virtual

### 🏥 Medical (Médico)
- `/medical-history` - Expediente médico
- `/prescriptions` - Recetas médicas
- `/lab-results` - Resultados de laboratorio
- `/test-results` - Otros resultados

### 👤 User (Usuario)
- `/profile` - Perfil personal
- `/settings` - Configuración
- `/health-metrics` - Métricas de salud

### 🔧 Other (Otros)
- `/doctors` - Buscar doctores
- `/support` - Soporte 24/7
- `/notifications` - Notificaciones
- `/emergency` - Emergencia

### ⭐ Special (Especiales)
- `/onboarding` - Proceso de bienvenida
- `/post-consultation` - Post consulta
- `/galeria-componentes` - Showcase UI

## 🎯 Características

### 1. **Navegación Rápida**
- Abre cualquier URL con un comando simple
- Sistema de búsqueda integrado
- Categorización clara de rutas

### 2. **Registro de Uso**
- Rastrea las URLs más visitadas
- Historial de accesos con fechas
- Estadísticas de uso

### 3. **Generación de Bookmarks**
- Crea archivo HTML con todas las URLs
- Diseño responsive y atractivo
- Abre automáticamente en el navegador

### 4. **Menú Interactivo**
- Interfaz amigable en consola
- Navegación con números
- Feedback visual con emojis

## 💡 Ejemplos de Uso

### Desarrollo Diario
```bash
# Abrir diagnóstico IA rápidamente
python url_manager.py open ai-diagnosis

# Ver todas las rutas médicas
python url_manager.py list medical

# Buscar rutas relacionadas con citas
python url_manager.py search cita
```

### Testing
```bash
# Crear bookmarks para testing manual
python url_manager.py bookmarks

# Ver qué rutas se usan más
python url_manager.py popular
```

### Documentación
```bash
# Listar todas las URLs para documentación
python url_manager.py list > urls_documentation.txt
```

## 🔧 Configuración

El archivo `url_manager.py` contiene:
- `base_url`: URL base de la aplicación (default: `http://localhost:3003`)
- `urls`: Diccionario con todas las rutas disponibles
- `category_colors`: Colores para cada categoría en la consola

## 📝 Notas

- Las URLs se abren en el navegador predeterminado
- El log de accesos se guarda en `url_access_log.json`
- Los bookmarks se guardan en `altamedica_patients_urls.html`
- Compatible con Windows, macOS y Linux

## 🚨 Troubleshooting

### Python no encontrado
```bash
# Instalar Python desde https://www.python.org/
# Asegurarse de agregar Python al PATH durante la instalación
```

### Puerto diferente
```python
# Editar url_manager.py línea 17:
self.base_url = "http://localhost:3003"  # Cambiar puerto aquí
```

### Permisos en Linux/macOS
```bash
chmod +x url_manager.py
./url_manager.py
```

---

¡Disfruta navegando tu aplicación de manera eficiente! 🚀