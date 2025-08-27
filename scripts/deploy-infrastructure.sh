#!/bin/bash

# 🚀 AltaMedica Infrastructure Deployment Script
# Este script despliega toda la infraestructura de producción

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
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar dependencias
check_dependencies() {
    log "Verificando dependencias..."
    
    command -v kubectl >/dev/null 2>&1 || error "kubectl no está instalado"
    command -v helm >/dev/null 2>&1 || error "helm no está instalado"
    command -v istioctl >/dev/null 2>&1 || error "istioctl no está instalado"
    command -v vault >/dev/null 2>&1 || error "vault CLI no está instalado"
    
    success "Todas las dependencias están instaladas"
}

# Verificar conexión a cluster
check_cluster() {
    log "Verificando conexión al cluster Kubernetes..."
    
    if ! kubectl cluster-info >/dev/null 2>&1; then
        error "No se puede conectar al cluster Kubernetes"
    fi
    
    success "Conectado al cluster: $(kubectl config current-context)"
}

# Crear namespaces
create_namespaces() {
    log "Creando namespaces..."
    
    kubectl create namespace altamedica --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace istio-system --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace vault --dry-run=client -o yaml | kubectl apply -f -
    
    success "Namespaces creados"
}

# Instalar Istio
install_istio() {
    log "Instalando Istio Service Mesh..."
    
    # Verificar si Istio ya está instalado
    if kubectl get namespace istio-system >/dev/null 2>&1 && kubectl get pods -n istio-system | grep -q "istiod"; then
        warning "Istio ya está instalado, saltando..."
        return 0
    fi
    
    # Instalar Istio
    istioctl install -f k8s/istio/istio-config.yaml --yes
    
    # Habilitar inyección automática de sidecar
    kubectl label namespace altamedica istio-injection=enabled
    
    success "Istio instalado correctamente"
}

# Instalar ArgoCD
install_argocd() {
    log "Instalando ArgoCD para GitOps..."
    
    # Verificar si ArgoCD ya está instalado
    if kubectl get pods -n argocd | grep -q "argocd-server"; then
        warning "ArgoCD ya está instalado, saltando..."
        return 0
    fi
    
    # Agregar repositorio de ArgoCD
    helm repo add argo https://argoproj.github.io/argo-helm
    helm repo update
    
    # Instalar ArgoCD
    helm install argocd argo/argocd \
        --namespace argocd \
        --create-namespace \
        --set server.ingress.enabled=true \
        --set server.ingress.hosts[0]=argocd.altamedica.com \
        --set server.ingress.tls[0].secretName=argocd-tls \
        --set server.ingress.tls[0].hosts[0]=argocd.altamedica.com \
        --set server.ingress.annotations."kubernetes\.io/ingress\.class"=nginx \
        --set server.ingress.annotations."cert-manager\.io/cluster-issuer"=letsencrypt-prod
    
    # Esperar a que ArgoCD esté listo
    log "Esperando a que ArgoCD esté listo..."
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s
    
    success "ArgoCD instalado correctamente"
}

# Instalar Vault
install_vault() {
    log "Instalando HashiCorp Vault..."
    
    # Verificar si Vault ya está instalado
    if kubectl get pods -n vault | grep -q "vault"; then
        warning "Vault ya está instalado, saltando..."
        return 0
    fi
    
    # Aplicar configuración de Vault
    kubectl apply -f k8s/vault/vault-config.yaml
    
    # Esperar a que Vault esté listo
    log "Esperando a que Vault esté listo..."
    kubectl wait --for=condition=ready pod -l app=vault -n vault --timeout=300s
    
    # Ejecutar job de inicialización
    log "Inicializando Vault..."
    kubectl apply -f k8s/vault/vault-config.yaml
    
    # Esperar a que el job de inicialización termine
    kubectl wait --for=condition=complete job/vault-init -n vault --timeout=600s
    
    success "Vault instalado y configurado correctamente"
}

# Instalar stack de monitoreo
install_monitoring() {
    log "Instalando stack de monitoreo..."
    
    # Verificar si Prometheus ya está instalado
    if kubectl get pods -n monitoring | grep -q "prometheus"; then
        warning "Stack de monitoreo ya está instalado, saltando..."
        return 0
    fi
    
    # Agregar repositorios
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo add grafana https://grafana.github.io/helm-charts
    helm repo update
    
    # Instalar Prometheus
    helm install prometheus prometheus-community/prometheus \
        --namespace monitoring \
        --create-namespace \
        --set server.persistentVolume.enabled=true \
        --set server.persistentVolume.size=50Gi \
        --set server.persistentVolume.storageClass=gp2 \
        --set alertmanager.persistentVolume.enabled=true \
        --set alertmanager.persistentVolume.size=10Gi \
        --set alertmanager.persistentVolume.storageClass=gp2
    
    # Instalar Grafana
    helm install grafana grafana/grafana \
        --namespace monitoring \
        --set persistence.enabled=true \
        --set persistence.size=10Gi \
        --set persistence.storageClassName=gp2 \
        --set adminPassword=admin123 \
        --set service.type=ClusterIP
    
    # Aplicar configuración personalizada de Prometheus
    kubectl apply -f k8s/monitoring/prometheus-config.yaml
    
    success "Stack de monitoreo instalado correctamente"
}

# Desplegar aplicaciones
deploy_applications() {
    log "Desplegando aplicaciones AltaMedica..."
    
    # Aplicar deployments
    kubectl apply -f k8s/deployments/
    
    # Aplicar servicios
    kubectl apply -f k8s/services/
    
    # Aplicar ingress
    kubectl apply -f k8s/ingress/
    
    # Esperar a que los pods estén listos
    log "Esperando a que las aplicaciones estén listas..."
    kubectl wait --for=condition=ready pod -l app=altamedica-api-server -n altamedica --timeout=300s
    kubectl wait --for=condition=ready pod -l app=altamedica-web-app -n altamedica --timeout=300s
    
    success "Aplicaciones desplegadas correctamente"
}

# Configurar ArgoCD
configure_argocd() {
    log "Configurando ArgoCD..."
    
    # Aplicar configuración de ArgoCD
    kubectl apply -f k8s/gitops/argocd-config.yaml
    
    # Esperar a que las aplicaciones estén sincronizadas
    log "Esperando sincronización de ArgoCD..."
    sleep 60
    
    success "ArgoCD configurado correctamente"
}

# Verificar estado del despliegue
verify_deployment() {
    log "Verificando estado del despliegue..."
    
    echo ""
    echo "=== ESTADO DE LOS PODS ==="
    kubectl get pods -n altamedica
    kubectl get pods -n monitoring
    kubectl get pods -n istio-system
    kubectl get pods -n argocd
    kubectl get pods -n vault
    
    echo ""
    echo "=== ESTADO DE LOS SERVICIOS ==="
    kubectl get services -n altamedica
    kubectl get services -n monitoring
    
    echo ""
    echo "=== ESTADO DE LOS INGRESS ==="
    kubectl get ingress -n altamedica
    kubectl get ingress -n monitoring
    kubectl get ingress -n argocd
    kubectl get ingress -n vault
    
    echo ""
    echo "=== ESTADO DE ARGOCD ==="
    kubectl get applications -n argocd
    
    success "Verificación completada"
}

# Mostrar información de acceso
show_access_info() {
    log "Información de acceso:"
    echo ""
    echo "🌐 ArgoCD Dashboard: https://argocd.altamedica.com"
    echo "   Usuario: admin"
    echo "   Contraseña: $(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)"
    echo ""
    echo "🔐 Vault Dashboard: https://vault.altamedica.com"
    echo "   (Acceso restringido a IPs internas)"
    echo ""
    echo "📊 Grafana Dashboard: http://grafana.monitoring.svc.cluster.local:3000"
    echo "   Usuario: admin"
    echo "   Contraseña: admin123"
    echo ""
    echo "📈 Prometheus: http://prometheus.monitoring.svc.cluster.local:9090"
    echo ""
    echo "🔍 Kiali Dashboard: http://kiali.istio-system.svc.cluster.local:20001"
    echo ""
    echo "📱 Aplicaciones:"
    echo "   - Web App: https://altamedica.com"
    echo "   - API Server: https://api.altamedica.com"
}

# Función principal
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                🚀 ALTA MEDICA INFRASTRUCTURE                ║"
    echo "║                     DEPLOYMENT SCRIPT                       ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    log "Iniciando despliegue de infraestructura..."
    
    check_dependencies
    check_cluster
    create_namespaces
    install_istio
    install_argocd
    install_vault
    install_monitoring
    deploy_applications
    configure_argocd
    verify_deployment
    show_access_info
    
    echo ""
    success "🎉 ¡Despliegue de infraestructura completado exitosamente!"
    echo ""
    log "Próximos pasos:"
    echo "1. Configurar DNS para apuntar a tu cluster"
    echo "2. Actualizar secrets en Vault con valores reales"
    echo "3. Configurar notificaciones de Slack en ArgoCD"
    echo "4. Revisar dashboards de monitoreo"
    echo "5. Ejecutar tests de carga para validar la infraestructura"
}

# Ejecutar script
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
