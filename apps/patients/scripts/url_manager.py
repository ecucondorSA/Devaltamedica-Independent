#!/usr/bin/env python3
"""
URL Manager para AltaMedica Patients App
Sistema de gestión y navegación de URLs para desarrollo
"""

import webbrowser
import json
import os
from datetime import datetime
from typing import Dict, List, Optional
import subprocess
import sys

class URLManager:
    def __init__(self):
        self.base_url = "http://localhost:3003"
        self.urls = {
            # Páginas principales
            "home": {
                "path": "/",
                "name": "Dashboard Principal",
                "description": "Panel principal del paciente con diagnóstico IA",
                "category": "main"
            },
            
            # Diagnóstico IA
            "ai-diagnosis": {
                "path": "/ai-diagnosis",
                "name": "Diagnóstico IA Completo",
                "description": "Sistema completo de diagnóstico con IA y 3D",
                "category": "ai"
            },
            "ai-diagnosis-history": {
                "path": "/ai-diagnosis/history",
                "name": "Historial de Diagnósticos IA",
                "description": "Ver diagnósticos anteriores realizados con IA",
                "category": "ai"
            },
            
            # Citas médicas
            "appointments": {
                "path": "/appointments",
                "name": "Mis Citas",
                "description": "Lista de todas las citas médicas",
                "category": "appointments"
            },
            "appointments-new": {
                "path": "/appointments/new",
                "name": "Agendar Cita",
                "description": "Programar nueva cita médica",
                "category": "appointments"
            },
            "appointments-book": {
                "path": "/appointments/book",
                "name": "Reservar Cita Rápida",
                "description": "Sistema de reserva rápida",
                "category": "appointments"
            },
            
            # Telemedicina
            "telemedicine": {
                "path": "/telemedicine",
                "name": "Telemedicina",
                "description": "Portal de consultas virtuales",
                "category": "telemedicine"
            },
            "telemedicine-test": {
                "path": "/telemedicine/test",
                "name": "Test de Video",
                "description": "Probar cámara y micrófono",
                "category": "telemedicine"
            },
            "telemedicine-waiting": {
                "path": "/telemedicine/waiting",
                "name": "Sala de Espera Virtual",
                "description": "Sala de espera para consultas",
                "category": "telemedicine"
            },
            
            # Historial médico
            "medical-history": {
                "path": "/medical-history",
                "name": "Historial Médico",
                "description": "Expediente médico completo",
                "category": "medical"
            },
            "prescriptions": {
                "path": "/prescriptions",
                "name": "Recetas Médicas",
                "description": "Medicamentos y prescripciones",
                "category": "medical"
            },
            "lab-results": {
                "path": "/lab-results",
                "name": "Resultados de Laboratorio",
                "description": "Análisis y estudios médicos",
                "category": "medical"
            },
            "test-results": {
                "path": "/test-results",
                "name": "Resultados de Pruebas",
                "description": "Otros resultados médicos",
                "category": "medical"
            },
            
            # Perfil y configuración
            "profile": {
                "path": "/profile",
                "name": "Mi Perfil",
                "description": "Información personal y médica",
                "category": "user"
            },
            "settings": {
                "path": "/settings",
                "name": "Configuración",
                "description": "Preferencias de la aplicación",
                "category": "user"
            },
            "health-metrics": {
                "path": "/health-metrics",
                "name": "Métricas de Salud",
                "description": "Signos vitales y métricas",
                "category": "user"
            },
            
            # Otros
            "doctors": {
                "path": "/doctors",
                "name": "Buscar Doctores",
                "description": "Directorio de especialistas",
                "category": "other"
            },
            "support": {
                "path": "/support",
                "name": "Soporte 24/7",
                "description": "Ayuda y asistencia",
                "category": "other"
            },
            "notifications": {
                "path": "/notifications",
                "name": "Notificaciones",
                "description": "Centro de notificaciones",
                "category": "other"
            },
            "emergency": {
                "path": "/emergency",
                "name": "Emergencia",
                "description": "Acceso rápido a emergencias",
                "category": "other"
            },
            
            # Páginas especiales
            "onboarding": {
                "path": "/onboarding",
                "name": "Onboarding",
                "description": "Proceso de bienvenida",
                "category": "special"
            },
            "post-consultation": {
                "path": "/post-consultation",
                "name": "Post Consulta",
                "description": "Seguimiento después de consulta",
                "category": "special"
            },
            "galeria-componentes": {
                "path": "/galeria-componentes",
                "name": "Galería de Componentes",
                "description": "Showcase de componentes UI",
                "category": "special"
            }
        }
        
        # Configuración de colores para categorías
        self.category_colors = {
            "main": "\033[92m",      # Verde
            "ai": "\033[95m",        # Magenta
            "appointments": "\033[94m", # Azul
            "telemedicine": "\033[96m", # Cyan
            "medical": "\033[93m",    # Amarillo
            "user": "\033[91m",       # Rojo
            "other": "\033[90m",      # Gris
            "special": "\033[97m"     # Blanco
        }
        
        self.RESET = "\033[0m"
        self.BOLD = "\033[1m"
        
    def get_full_url(self, key: str) -> Optional[str]:
        """Obtiene la URL completa para una clave dada"""
        if key in self.urls:
            return f"{self.base_url}{self.urls[key]['path']}"
        return None
    
    def open_url(self, key: str):
        """Abre una URL en el navegador"""
        url = self.get_full_url(key)
        if url:
            print(f"🌐 Abriendo: {self.urls[key]['name']} - {url}")
            webbrowser.open(url)
            self.log_access(key)
        else:
            print(f"❌ URL no encontrada: {key}")
    
    def list_urls(self, category: Optional[str] = None):
        """Lista todas las URLs o las de una categoría específica"""
        print(f"\n{self.BOLD}🏥 URLs de AltaMedica Patients App{self.RESET}")
        print(f"{self.BOLD}{'='*60}{self.RESET}\n")
        
        categories = {}
        for key, data in self.urls.items():
            cat = data['category']
            if category and cat != category:
                continue
            if cat not in categories:
                categories[cat] = []
            categories[cat].append((key, data))
        
        for cat, urls in categories.items():
            color = self.category_colors.get(cat, "")
            print(f"{color}{self.BOLD}📁 {cat.upper()}{self.RESET}")
            print(f"{'-'*60}")
            
            for key, data in sorted(urls):
                print(f"  {self.BOLD}{key:<25}{self.RESET} {data['path']:<30}")
                print(f"  {'':25} 📝 {data['description']}")
                print()
    
    def search_urls(self, query: str):
        """Busca URLs por nombre o descripción"""
        query = query.lower()
        results = []
        
        for key, data in self.urls.items():
            if (query in key.lower() or 
                query in data['name'].lower() or 
                query in data['description'].lower()):
                results.append((key, data))
        
        if results:
            print(f"\n🔍 Resultados para '{query}':")
            print(f"{'='*60}\n")
            for key, data in results:
                print(f"{self.BOLD}{key}{self.RESET}: {data['path']}")
                print(f"   {data['description']}\n")
        else:
            print(f"❌ No se encontraron resultados para '{query}'")
    
    def log_access(self, key: str):
        """Registra el acceso a una URL"""
        log_file = "url_access_log.json"
        try:
            if os.path.exists(log_file):
                with open(log_file, 'r') as f:
                    log = json.load(f)
            else:
                log = {}
            
            if key not in log:
                log[key] = {
                    "count": 0,
                    "first_access": datetime.now().isoformat(),
                    "last_access": None
                }
            
            log[key]["count"] += 1
            log[key]["last_access"] = datetime.now().isoformat()
            
            with open(log_file, 'w') as f:
                json.dump(log, f, indent=2)
        except Exception as e:
            print(f"⚠️ Error al registrar acceso: {e}")
    
    def show_popular_urls(self, limit: int = 10):
        """Muestra las URLs más visitadas"""
        log_file = "url_access_log.json"
        
        if not os.path.exists(log_file):
            print("📊 No hay datos de acceso disponibles")
            return
        
        try:
            with open(log_file, 'r') as f:
                log = json.load(f)
            
            sorted_urls = sorted(log.items(), key=lambda x: x[1]['count'], reverse=True)[:limit]
            
            print(f"\n📊 Top {limit} URLs más visitadas:")
            print(f"{'='*60}\n")
            
            for i, (key, data) in enumerate(sorted_urls, 1):
                if key in self.urls:
                    print(f"{i}. {self.BOLD}{self.urls[key]['name']}{self.RESET}")
                    print(f"   Visitas: {data['count']}")
                    print(f"   Última visita: {data['last_access'][:10]}\n")
        except Exception as e:
            print(f"⚠️ Error al leer estadísticas: {e}")
    
    def create_bookmark_file(self):
        """Crea un archivo HTML con bookmarks"""
        html = """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AltaMedica Patients - Bookmarks</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h1 {
            color: #0ea5e9;
            text-align: center;
            margin-bottom: 30px;
        }
        .category {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .category h2 {
            color: #3b82f6;
            margin-bottom: 15px;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 10px;
        }
        .url-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
        }
        .url-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
            transition: all 0.3s ease;
        }
        .url-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            border-color: #0ea5e9;
        }
        .url-card a {
            color: #0ea5e9;
            text-decoration: none;
            font-weight: bold;
            font-size: 16px;
        }
        .url-card p {
            color: #666;
            margin: 5px 0 0 0;
            font-size: 14px;
        }
        .url-path {
            color: #999;
            font-size: 12px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <h1>🏥 AltaMedica Patients - Directorio de URLs</h1>
"""
        
        categories = {}
        for key, data in self.urls.items():
            cat = data['category']
            if cat not in categories:
                categories[cat] = []
            categories[cat].append((key, data))
        
        for cat, urls in categories.items():
            html += f"""
    <div class="category">
        <h2>{cat.upper()}</h2>
        <div class="url-grid">
"""
            for key, data in sorted(urls):
                url = f"{self.base_url}{data['path']}"
                html += f"""
            <div class="url-card">
                <a href="{url}" target="_blank">{data['name']}</a>
                <p>{data['description']}</p>
                <div class="url-path">{data['path']}</div>
            </div>
"""
            html += """
        </div>
    </div>
"""
        
        html += """
</body>
</html>
"""
        
        filename = "altamedica_patients_urls.html"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html)
        
        print(f"✅ Archivo de bookmarks creado: {filename}")
        webbrowser.open(f"file://{os.path.abspath(filename)}")
    
    def interactive_menu(self):
        """Menú interactivo para navegar las URLs"""
        while True:
            print(f"\n{self.BOLD}🏥 AltaMedica URL Manager{self.RESET}")
            print(f"{'='*40}")
            print("1. Listar todas las URLs")
            print("2. Buscar URL")
            print("3. Abrir URL por clave")
            print("4. Ver URLs más populares")
            print("5. Crear archivo de bookmarks")
            print("6. Abrir diagnóstico IA")
            print("7. Salir")
            print(f"{'='*40}")
            
            choice = input("\n👉 Selecciona una opción (1-7): ").strip()
            
            if choice == '1':
                self.list_urls()
                input("\nPresiona Enter para continuar...")
            
            elif choice == '2':
                query = input("🔍 Buscar: ").strip()
                if query:
                    self.search_urls(query)
                input("\nPresiona Enter para continuar...")
            
            elif choice == '3':
                key = input("🔑 Ingresa la clave de URL: ").strip()
                if key:
                    self.open_url(key)
                input("\nPresiona Enter para continuar...")
            
            elif choice == '4':
                self.show_popular_urls()
                input("\nPresiona Enter para continuar...")
            
            elif choice == '5':
                self.create_bookmark_file()
                input("\nPresiona Enter para continuar...")
            
            elif choice == '6':
                self.open_url('ai-diagnosis')
                input("\nPresiona Enter para continuar...")
            
            elif choice == '7':
                print("👋 ¡Hasta luego!")
                break
            
            else:
                print("❌ Opción no válida")

def main():
    """Función principal"""
    manager = URLManager()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "list":
            category = sys.argv[2] if len(sys.argv) > 2 else None
            manager.list_urls(category)
        
        elif command == "open":
            if len(sys.argv) > 2:
                manager.open_url(sys.argv[2])
            else:
                print("❌ Especifica una clave de URL")
        
        elif command == "search":
            if len(sys.argv) > 2:
                manager.search_urls(" ".join(sys.argv[2:]))
            else:
                print("❌ Especifica un término de búsqueda")
        
        elif command == "popular":
            manager.show_popular_urls()
        
        elif command == "bookmarks":
            manager.create_bookmark_file()
        
        else:
            print(f"❌ Comando no reconocido: {command}")
            print("\nComandos disponibles:")
            print("  list [category]  - Lista URLs")
            print("  open <key>       - Abre una URL")
            print("  search <query>   - Busca URLs")
            print("  popular          - URLs más visitadas")
            print("  bookmarks        - Crear archivo HTML")
    else:
        # Modo interactivo
        manager.interactive_menu()

if __name__ == "__main__":
    main()