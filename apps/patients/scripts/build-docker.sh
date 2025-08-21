#!/bin/bash

# Script para construir la imagen Docker de la aplicación patients
# Debe ejecutarse desde la raíz del proyecto AltaMedica

echo "🏥 Construyendo imagen Docker para AltaMedica Patients App..."

# Ir a la raíz del proyecto
cd ../..

# Verificar que estamos en la raíz correcta
if [ ! -f "package.json" ] || [ ! -f "pnpm-workspace.yaml" ]; then
    echo "❌ Error: No se encuentra en la raíz del proyecto AltaMedica"
    exit 1
fi

echo "📁 Directorio correcto encontrado: $(pwd)"

# Construir la imagen Docker
echo "🔨 Iniciando construcción de imagen Docker..."
docker build -f apps/patients/Dockerfile -t altamedica-patients:latest .

if [ $? -eq 0 ]; then
    echo "✅ Imagen Docker construída exitosamente: altamedica-patients:latest"
    echo "🚀 Para ejecutar el contenedor:"
    echo "   docker run -p 3003:3003 --name patients-app altamedica-patients:latest"
else
    echo "❌ Error en la construcción de la imagen Docker"
    exit 1
fi