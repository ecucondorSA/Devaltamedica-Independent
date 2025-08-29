#!/bin/bash

# AltaMedica Platform - Automated Deployment Script
# Este script automatiza el despliegue completo de la plataforma

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Variables de configuración
ENVIRONMENT=${1:-development}
REGION=${2:-us-east-1}
CLUSTER_NAME="altamedica-cluster"
NAMESPACE="altamedica"

# Verificar dependencias
check_dependencies() {
    log "Verificando dependencias..."
    
    local deps=("kubectl" "helm" "terraform" "aws" "docker")
    local missing_deps=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "Dependencias faltantes: ${missing_deps[*]}"
        error "Por favor instala las dependencias faltantes antes de continuar"
        exit 1
    fi
    
    success "Todas las dependencias están instaladas"
}

# Verificar configuración de AWS
check_aws_config() {
    log "Verificando configuración de AWS..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS no está configurado correctamente"
        error "Ejecuta 'aws configure' antes de continuar"
        exit 1
    fi
    
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    log "Usando cuenta AWS: $account_id"
    success "AWS configurado correctamente"
}

# Verificar configuración de kubectl
check_kubectl_config() {
    log "Verificando configuración de kubectl..."
    
    if ! kubectl cluster-info &> /dev/null; then
        error "kubectl no está configurado correctamente"
        error "Verifica tu configuración de Kubernetes"
        exit 1
    fi
    
    local cluster_info=$(kubectl cluster-info | head -n 1)
    log "Cluster: $cluster_info"
    success "kubectl configurado correctamente"
}

# Desplegar infraestructura con Terraform
deploy_infrastructure() {
    log "Desplegando infraestructura con Terraform..."
    
    cd terraform
    
    # Inicializar Terraform
    log "Inicializando Terraform..."
    terraform init
    
    # Planificar cambios
    log "Planificando cambios..."
    terraform plan -var="environment=$ENVIRONMENT" -var="aws_region=$REGION"
    
    # Aplicar cambios
    log "Aplicando cambios..."
    terraform apply -var="environment=$ENVIRONMENT" -var="aws_region=$REGION" -auto-approve
    
    # Obtener outputs
    local cluster_endpoint=$(terraform output -raw cluster_endpoint)
    local cluster_ca_data=$(terraform output -raw cluster_certificate_authority_data)
    
    log "Cluster endpoint: $cluster_endpoint"
    
    cd ..
    success "Infraestructura desplegada correctamente"
}

# Configurar kubectl para el cluster EKS
configure_kubectl() {
    log "Configurando kubectl para el cluster EKS..."
    
    aws eks update-kubeconfig --region "$REGION" --name "$CLUSTER_NAME"
    
    # Verificar conexión
    if kubectl get nodes &> /dev/null; then
        success "kubectl configurado para el cluster EKS"
    else
        error "No se pudo conectar al cluster EKS"
        exit 1
    fi
}

# Crear namespaces
create_namespaces() {
    log "Creando namespaces..."
    
    kubectl apply -f k8s/namespace.yaml
    
    success "Namespaces creados correctamente"
}

# Instalar Helm charts
install_helm_charts() {
    log "Instalando Helm charts..."
    
    # Agregar repositorios
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo add jetstack https://charts.jetstack.io
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo add elastic https://helm.elastic.co
    helm repo add bitnami https://charts.bitnami.com/bitnami
    helm repo update
    
    # Instalar Nginx Ingress Controller
    log "Instalando Nginx Ingress Controller..."
    helm install ingress-nginx ingress-nginx/ingress-nginx \
        --namespace altamedica-ingress \
        --create-namespace \
        --set controller.replicaCount=2 \
        --set controller.service.type=LoadBalancer
    
    # Instalar Cert Manager
    log "Instalando Cert Manager..."
    helm install cert-manager jetstack/cert-manager \
        --namespace altamedica-monitoring \
        --create-namespace \
        --set installCRDs=true \
        --set replicaCount=1
    
    # Instalar Prometheus Stack
    log "Instalando Prometheus Stack..."
    helm install prometheus prometheus-community/kube-prometheus-stack \
        --namespace altamedica-monitoring \
        --create-namespace \
        --set prometheus.prometheusSpec.retention=15d \
        --set grafana.adminPassword=admin123
    
    # Instalar Elasticsearch
    log "Instalando Elasticsearch..."
    helm install elasticsearch elastic/elasticsearch \
        --namespace altamedica-monitoring \
        --set replicas=1 \
        --set resources.limits.cpu=1000m \
        --set resources.limits.memory=2Gi
    
    # Instalar Kibana
    log "Instalando Kibana..."
    helm install kibana elastic/kibana \
        --namespace altamedica-monitoring \
        --set replicas=1
    
    # Instalar PostgreSQL
    log "Instalando PostgreSQL..."
    helm install postgresql bitnami/postgresql \
        --namespace altamedica \
        --set auth.postgresPassword=postgres123 \
        --set auth.database=altamedica \
        --set auth.username=altamedica \
        --set auth.password=altamedica123 \
        --set primary.persistence.size=20Gi
    
    # Instalar Redis
    log "Instalando Redis..."
    helm install redis bitnami/redis \
        --namespace altamedica \
        --set auth.enabled=true \
        --set auth.password=redis123 \
        --set master.persistence.size=10Gi
    
    success "Helm charts instalados correctamente"
}

# Desplegar aplicaciones
deploy_applications() {
    log "Desplegando aplicaciones..."
    
    # Desplegar API Server
    log "Desplegando API Server..."
    helm install api-server ./helm \
        --namespace altamedica \
        --set apiServer.enabled=true \
        --set global.environment=$ENVIRONMENT
    
    # Desplegar Web App
    log "Desplegando Web App..."
    helm install web-app ./helm \
        --namespace altamedica \
        --set webApp.enabled=true \
        --set global.environment=$ENVIRONMENT
    
    # Desplegar Doctors App
    log "Desplegando Doctors App..."
    helm install doctors-app ./helm \
        --namespace altamedica \
        --set doctorsApp.enabled=true \
        --set global.environment=$ENVIRONMENT
    
    # Desplegar Patients App
    log "Desplegando Patients App..."
    helm install patients-app ./helm \
        --namespace altamedica \
        --set patientsApp.enabled=true \
        --set global.environment=$ENVIRONMENT
    
    # Desplegar Admin App
    log "Desplegando Admin App..."
    helm install admin-app ./helm \
        --namespace altamedica \
        --set adminApp.enabled=true \
        --set global.environment=$ENVIRONMENT
    
    success "Aplicaciones desplegadas correctamente"
}

# Verificar estado del despliegue
verify_deployment() {
    log "Verificando estado del despliegue..."
    
    # Verificar pods
    log "Verificando pods..."
    kubectl get pods -n altamedica
    kubectl get pods -n altamedica-monitoring
    kubectl get pods -n altamedica-ingress
    
    # Verificar servicios
    log "Verificando servicios..."
    kubectl get svc -n altamedica
    kubectl get svc -n altamedica-monitoring
    kubectl get svc -n altamedica-ingress
    
    # Verificar ingress
    log "Verificando ingress..."
    kubectl get ingress -n altamedica
    
    # Verificar certificados
    log "Verificando certificados..."
    kubectl get certificates -n altamedica
    
    success "Despliegue verificado correctamente"
}

# Mostrar información de acceso
show_access_info() {
    log "Información de acceso:"
    
    local load_balancer_ip=$(kubectl get svc -n altamedica-ingress ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [ -n "$load_balancer_ip" ]; then
        echo ""
        echo "🌐 URLs de acceso:"
        echo "  - API Server: http://$load_balancer_ip/api"
        echo "  - Web App: http://$load_balancer_ip"
        echo "  - Doctors App: http://$load_balancer_ip/doctors"
        echo "  - Patients App: http://$load_balancer_ip/patients"
        echo "  - Admin App: http://$load_balancer_ip/admin"
        echo ""
        echo "📊 Monitoreo:"
        echo "  - Grafana: http://$load_balancer_ip/grafana (admin/admin123)"
        echo "  - Kibana: http://$load_balancer_ip/kibana"
        echo ""
        echo "🔐 Credenciales de base de datos:"
        echo "  - PostgreSQL: postgresql.altamedica.svc.cluster.local:5432"
        echo "  - Redis: redis-master.altamedica.svc.cluster.local:6379"
    else
        warning "Load Balancer aún no está disponible. Espera unos minutos y ejecuta 'kubectl get svc -n altamedica-ingress'"
    fi
}

# Función principal
main() {
    log "🚀 Iniciando despliegue de AltaMedica Platform..."
    log "Entorno: $ENVIRONMENT"
    log "Región: $REGION"
    
    # Verificaciones previas
    check_dependencies
    check_aws_config
    check_kubectl_config
    
    # Despliegue
    deploy_infrastructure
    configure_kubectl
    create_namespaces
    install_helm_charts
    deploy_applications
    
    # Verificación
    verify_deployment
    show_access_info
    
    success "🎉 Despliegue completado exitosamente!"
    log "La plataforma AltaMedica está ahora disponible"
}

# Manejo de errores
trap 'error "Error en línea $LINENO. Saliendo..."; exit 1' ERR

# Ejecutar script principal
main "$@"
