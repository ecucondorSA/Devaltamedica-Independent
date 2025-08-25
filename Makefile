# Makefile for Devaltamedica Docker Management
.PHONY: help up down restart build logs clean status backup restore dev prod test

# Colors for output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
BLUE=\033[0;34m
NC=\033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)╔══════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║$(NC)  $(GREEN)🏥 DevAltaMedica Docker Management$(NC)                     $(BLUE)║$(NC)"
	@echo "$(BLUE)╚══════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Quick start:$(NC) make dev"

# Development Commands
dev: ## Start development environment
	@echo "$(GREEN)🚀 Starting development environment...$(NC)"
	@docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo "$(GREEN)✅ Development environment is running!$(NC)"
	@echo ""
	@echo "$(YELLOW)Access points:$(NC)"
	@echo "  • Web App:        http://localhost:3000"
	@echo "  • API:            http://localhost:3001"
	@echo "  • Admin Panel:    http://localhost:3002"
	@echo "  • PgAdmin:        http://localhost:5050"
	@echo "  • Grafana:        http://localhost:3003"
	@echo "  • Mailhog:        http://localhost:8025"
	@echo ""
	@echo "$(BLUE)Run 'make logs' to see container logs$(NC)"

prod: ## Start production environment
	@echo "$(GREEN)🚀 Starting production environment...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)✅ Production environment is running!$(NC)"

up: ## Start all containers
	@echo "$(GREEN)Starting containers...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)✅ All containers are up!$(NC)"

down: ## Stop all containers
	@echo "$(YELLOW)Stopping containers...$(NC)"
	@docker-compose down
	@echo "$(GREEN)✅ All containers stopped$(NC)"

restart: ## Restart all containers
	@echo "$(YELLOW)Restarting containers...$(NC)"
	@docker-compose restart
	@echo "$(GREEN)✅ All containers restarted$(NC)"

build: ## Build/rebuild containers
	@echo "$(BLUE)Building containers...$(NC)"
	@docker-compose build --no-cache
	@echo "$(GREEN)✅ Build complete$(NC)"

build-dev: ## Build development containers
	@echo "$(BLUE)Building development containers...$(NC)"
	@docker-compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache
	@echo "$(GREEN)✅ Development build complete$(NC)"

logs: ## Show container logs
	@docker-compose logs -f --tail=100

logs-app: ## Show only app container logs
	@docker-compose logs -f --tail=100 app

status: ## Show container status
	@echo "$(BLUE)Container Status:$(NC)"
	@docker-compose ps
	@echo ""
	@echo "$(BLUE)Resource Usage:$(NC)"
	@docker stats --no-stream

shell: ## Enter app container shell
	@docker-compose exec app sh

shell-db: ## Enter database container shell
	@docker-compose exec postgres psql -U altamedica -d altamedica

clean: ## Clean up containers, volumes, and images
	@echo "$(RED)⚠️  Warning: This will remove all containers, volumes, and images!$(NC)"
	@echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
	@sleep 5
	@echo "$(YELLOW)Cleaning up...$(NC)"
	@docker-compose down -v --rmi all
	@docker system prune -af
	@echo "$(GREEN)✅ Cleanup complete$(NC)"

reset: ## Reset database (removes data)
	@echo "$(RED)⚠️  Warning: This will delete all database data!$(NC)"
	@echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
	@sleep 5
	@docker-compose down -v
	@docker volume rm devaltamedica-independent_postgres_data || true
	@docker-compose up -d postgres
	@echo "$(GREEN)✅ Database reset complete$(NC)"

backup: ## Backup database
	@echo "$(BLUE)Creating database backup...$(NC)"
	@mkdir -p ./backups
	@docker-compose exec -T postgres pg_dump -U altamedica altamedica > ./backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Backup created in ./backups/$(NC)"

restore: ## Restore database from latest backup
	@echo "$(YELLOW)Restoring from latest backup...$(NC)"
	@docker-compose exec -T postgres psql -U altamedica altamedica < $$(ls -t ./backups/*.sql | head -1)
	@echo "$(GREEN)✅ Database restored$(NC)"

test: ## Run tests in containers
	@echo "$(BLUE)Running tests...$(NC)"
	@docker-compose exec app pnpm test
	@echo "$(GREEN)✅ Tests complete$(NC)"

lint: ## Run linting
	@echo "$(BLUE)Running linters...$(NC)"
	@docker-compose exec app pnpm lint
	@echo "$(GREEN)✅ Linting complete$(NC)"

install: ## Install dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@docker-compose exec app pnpm install
	@echo "$(GREEN)✅ Dependencies installed$(NC)"

migrate: ## Run database migrations
	@echo "$(BLUE)Running migrations...$(NC)"
	@docker-compose exec app pnpm migrate
	@echo "$(GREEN)✅ Migrations complete$(NC)"

monitor: ## Open monitoring dashboards
	@echo "$(GREEN)Opening monitoring dashboards...$(NC)"
	@echo "  • Grafana:     http://localhost:3003 (admin/admin123)"
	@echo "  • Prometheus:  http://localhost:9090"
	@echo "  • PgAdmin:     http://localhost:5050 (admin@altamedica.com/admin123)"

health: ## Check health of all services
	@echo "$(BLUE)Checking service health...$(NC)"
	@echo ""
	@echo "$(YELLOW)PostgreSQL:$(NC)"
	@docker-compose exec postgres pg_isready -U altamedica || echo "$(RED)❌ Not healthy$(NC)"
	@echo ""
	@echo "$(YELLOW)Redis:$(NC)"
	@docker-compose exec redis redis-cli ping || echo "$(RED)❌ Not healthy$(NC)"
	@echo ""
	@echo "$(YELLOW)Application:$(NC)"
	@curl -s http://localhost:3001/health || echo "$(RED)❌ Not responding$(NC)"
	@echo ""
	@echo "$(GREEN)✅ Health check complete$(NC)"

# Shortcuts
d: dev ## Shortcut for 'make dev'
u: up ## Shortcut for 'make up'
s: status ## Shortcut for 'make status'
l: logs ## Shortcut for 'make logs'