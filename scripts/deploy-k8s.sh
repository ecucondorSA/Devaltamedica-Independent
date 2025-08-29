#!/bin/bash

# AltaMedica Platform - Kubernetes Deployment Script
# This script deploys the complete platform to Kubernetes

set -e

NAMESPACE="altamedica"
ENVIRONMENT="${1:-production}"
CLUSTER="${2:-altamedica-cluster}"

echo "🚀 AltaMedica Platform Deployment"
echo "=================================="
echo "Environment: $ENVIRONMENT"
echo "Cluster: $CLUSTER"
echo "Namespace: $NAMESPACE"
echo ""

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    if ! command -v kubectl &> /dev/null; then
        echo "❌ kubectl is not installed"
        exit 1
    fi
    
    if ! command -v helm &> /dev/null; then
        echo "❌ helm is not installed"
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        echo "❌ Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    echo "✅ All prerequisites met"
}

# Create namespaces
create_namespaces() {
    echo "📁 Creating namespaces..."
    kubectl apply -f k8s/namespace.yaml
    echo "✅ Namespaces created"
}

# Apply secrets
apply_secrets() {
    echo "🔐 Applying secrets..."
    kubectl apply -f k8s/secrets.yaml -n $NAMESPACE
    echo "✅ Secrets applied"
}

# Apply configmaps
apply_configmaps() {
    echo "⚙️ Applying ConfigMaps..."
    kubectl apply -f k8s/configmaps.yaml -n $NAMESPACE
    echo "✅ ConfigMaps applied"
}

# Deploy applications
deploy_applications() {
    echo "📦 Deploying applications..."
    
    # Apply deployments
    for deployment in k8s/deployments/*.yaml; do
        echo "  Deploying $(basename $deployment)..."
        kubectl apply -f $deployment -n $NAMESPACE
    done
    
    echo "✅ Applications deployed"
}

# Apply network policies
apply_network_policies() {
    echo "🔒 Applying network policies..."
    kubectl apply -f k8s/network-policies.yaml -n $NAMESPACE
    echo "✅ Network policies applied"
}

# Apply ingress
apply_ingress() {
    echo "🌐 Applying ingress rules..."
    kubectl apply -f k8s/ingress.yaml -n $NAMESPACE
    echo "✅ Ingress rules applied"
}

# Deploy with Helm
deploy_helm() {
    echo "⚓ Deploying with Helm..."
    
    # Add repositories
    helm repo add bitnami https://charts.bitnami.com/bitnami
    helm repo add elastic https://helm.elastic.co
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo add grafana https://grafana.github.io/helm-charts
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo add jetstack https://charts.jetstack.io
    helm repo update
    
    # Install cert-manager
    echo "  Installing cert-manager..."
    helm upgrade --install cert-manager jetstack/cert-manager \
        --namespace cert-manager \
        --create-namespace \
        --set installCRDs=true \
        --wait
    
    # Install ingress-nginx
    echo "  Installing ingress-nginx..."
    helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
        --namespace ingress-nginx \
        --create-namespace \
        --wait
    
    # Deploy AltaMedica platform
    echo "  Deploying AltaMedica platform..."
    helm upgrade --install altamedica ./helm \
        --namespace $NAMESPACE \
        --create-namespace \
        --values helm/values.yaml \
        --set global.environment=$ENVIRONMENT \
        --wait
    
    echo "✅ Helm deployment completed"
}

# Install ArgoCD
install_argocd() {
    echo "🔄 Installing ArgoCD..."
    
    # Create namespace
    kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
    
    # Install ArgoCD
    kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
    
    # Apply custom configuration
    kubectl apply -f argocd/install.yaml
    
    # Wait for ArgoCD to be ready
    kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd
    
    # Apply applications
    kubectl apply -f argocd/applications/
    
    echo "✅ ArgoCD installed and configured"
}

# Check deployment status
check_status() {
    echo "📊 Checking deployment status..."
    
    # Check pods
    echo ""
    echo "Pods status:"
    kubectl get pods -n $NAMESPACE
    
    # Check services
    echo ""
    echo "Services:"
    kubectl get services -n $NAMESPACE
    
    # Check ingress
    echo ""
    echo "Ingress:"
    kubectl get ingress -n $NAMESPACE
    
    # Check HPA
    echo ""
    echo "Horizontal Pod Autoscalers:"
    kubectl get hpa -n $NAMESPACE
    
    echo ""
    echo "✅ Deployment status checked"
}

# Get access URLs
get_access_urls() {
    echo ""
    echo "🌐 Access URLs:"
    echo "==============="
    
    # Get ingress endpoints
    INGRESS_IP=$(kubectl get ingress -n $NAMESPACE altamedica-ingress -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [ -z "$INGRESS_IP" ]; then
        INGRESS_IP=$(kubectl get ingress -n $NAMESPACE altamedica-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    fi
    
    if [ ! -z "$INGRESS_IP" ]; then
        echo "Main App: https://$INGRESS_IP or https://altamedica.com"
        echo "API: https://api.altamedica.com"
        echo "Doctors Portal: https://doctors.altamedica.com"
        echo "Patients Portal: https://patients.altamedica.com"
        echo "Admin Panel: https://admin.altamedica.com"
        echo "WebRTC Signaling: wss://signaling.altamedica.com"
    else
        echo "⚠️ Ingress IP not yet assigned. Check again in a few minutes."
    fi
    
    # ArgoCD
    echo ""
    echo "ArgoCD UI: https://argocd.altamedica.com"
    echo "Username: admin"
    echo "Password: $(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)"
}

# Main execution
main() {
    echo "Starting deployment..."
    echo ""
    
    check_prerequisites
    create_namespaces
    apply_secrets
    apply_configmaps
    deploy_applications
    apply_network_policies
    apply_ingress
    
    # Optional: Deploy with Helm
    read -p "Deploy with Helm? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_helm
    fi
    
    # Optional: Install ArgoCD
    read -p "Install ArgoCD for GitOps? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_argocd
    fi
    
    check_status
    get_access_urls
    
    echo ""
    echo "✅ Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update DNS records to point to the ingress IP"
    echo "2. Configure SSL certificates (cert-manager should handle this automatically)"
    echo "3. Set up monitoring dashboards in Grafana"
    echo "4. Configure backup policies"
    echo "5. Test all applications"
}

# Run main function
main