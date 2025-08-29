#!/bin/bash

# Docker initialization script for Devaltamedica
set -e

echo "🏥 Devaltamedica Docker Setup"
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check Docker installation
check_docker() {
    echo -e "${BLUE}Checking Docker installation...${NC}"
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed!${NC}"
        echo "Please install Docker first: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        echo -e "${RED}Docker daemon is not running!${NC}"
        echo "Please start Docker and try again."
        exit 1
    fi
    
    echo -e "${GREEN}✓ Docker is installed and running${NC}"
}

# Check Docker Compose
check_compose() {
    echo -e "${BLUE}Checking Docker Compose...${NC}"
    if ! command -v docker-compose &> /dev/null; then
        if ! docker compose version &> /dev/null; then
            echo -e "${RED}Docker Compose is not installed!${NC}"
            exit 1
        else
            echo -e "${GREEN}✓ Docker Compose (plugin) is available${NC}"
            # Create alias for consistency
            alias docker-compose='docker compose'
        fi
    else
        echo -e "${GREEN}✓ Docker Compose is installed${NC}"
    fi
}

# Create necessary directories
setup_directories() {
    echo -e "${BLUE}Setting up directories...${NC}"
    mkdir -p backups
    mkdir -p logs
    mkdir -p data
    echo -e "${GREEN}✓ Directories created${NC}"
}

# Check and create .env file
setup_env() {
    echo -e "${BLUE}Setting up environment...${NC}"
    if [ ! -f .env ]; then
        if [ -f .env.docker ]; then
            cp .env.docker .env
            echo -e "${YELLOW}Created .env from .env.docker${NC}"
            echo -e "${YELLOW}Please update the .env file with your actual credentials${NC}"
        else
            echo -e "${RED}No .env file found!${NC}"
            echo "Creating basic .env file..."
            cat > .env << 'EOF'
# Auto-generated .env file
NODE_ENV=development
DATABASE_URL=postgresql://altamedica:altamedica123@localhost:5432/altamedica
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-this-secret-in-production
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_WEB_APP_URL=http://localhost:3000
EOF
            echo -e "${GREEN}✓ Basic .env file created${NC}"
        fi
    else
        echo -e "${GREEN}✓ .env file exists${NC}"
    fi
}

# Pull required images
pull_images() {
    echo -e "${BLUE}Pulling Docker images...${NC}"
    docker-compose pull || echo -e "${YELLOW}Some images couldn't be pulled${NC}"
    echo -e "${GREEN}✓ Image pull complete${NC}"
}

# Initialize database
init_database() {
    echo -e "${BLUE}Initializing database...${NC}"
    
    # Start only postgres service
    docker-compose up -d postgres
    
    # Wait for postgres to be ready
    echo "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if docker-compose exec postgres pg_isready -U altamedica &> /dev/null; then
            echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
    
    # Create init script if it doesn't exist
    if [ ! -f scripts/init-db.sql ]; then
        echo "Creating database initialization script..."
        cat > scripts/init-db.sql << 'EOF'
-- Devaltamedica Database Initialization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS medical;
CREATE SCHEMA IF NOT EXISTS billing;

-- Basic tables setup will be handled by migrations
GRANT ALL PRIVILEGES ON DATABASE altamedica TO altamedica;
GRANT ALL ON SCHEMA auth TO altamedica;
GRANT ALL ON SCHEMA medical TO altamedica;
GRANT ALL ON SCHEMA billing TO altamedica;
EOF
        echo -e "${GREEN}✓ Database init script created${NC}"
    fi
}

# Start services
start_services() {
    echo -e "${BLUE}Starting services...${NC}"
    
    read -p "Start in development mode? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Starting development environment..."
        make dev
    else
        echo "Starting production environment..."
        make prod
    fi
}

# Main execution
main() {
    echo -e "${GREEN}Starting Devaltamedica Docker Setup...${NC}"
    echo
    
    check_docker
    check_compose
    setup_directories
    setup_env
    
    echo
    read -p "Do you want to pull Docker images? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pull_images
    fi
    
    echo
    read -p "Do you want to initialize the database? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        init_database
    fi
    
    echo
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo -e "${GREEN}Setup complete!${NC}"
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo
    echo "Available commands:"
    echo "  make dev      - Start development environment"
    echo "  make prod     - Start production environment"
    echo "  make status   - Check container status"
    echo "  make logs     - View container logs"
    echo "  make help     - Show all available commands"
    echo
    
    read -p "Do you want to start the services now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_services
    else
        echo -e "${YELLOW}You can start services later with 'make dev' or 'make prod'${NC}"
    fi
}

# Run main function
main