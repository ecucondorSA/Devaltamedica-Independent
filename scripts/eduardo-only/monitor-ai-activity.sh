#!/bin/bash

# 🚨 Monitor de Actividad de IAs - SOLO PARA EDUARDO
# Ejecutar en background: ./monitor-ai-activity.sh &

ROOT_DIR="/home/edu/Devaltamedica-Independent"
LOG_FILE="$ROOT_DIR/logs/ai-monitor.log"
ALERT_FILE="$ROOT_DIR/logs/ai-alerts.log"

# Configuración de límites
MAX_FILES_MODIFIED=50
MAX_LINES_CHANGED=1000
CRITICAL_FILES=(".env" "firebase.json" "package.json" ".github" "secrets")
FORBIDDEN_COMMANDS=("rm -rf" "drop database" "delete from" "format c:" "sudo")

# Colores para output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# Crear directorios si no existen
mkdir -p "$ROOT_DIR/logs"

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
    echo -e "${GREEN}[MONITOR]${NC} $1"
}

alert_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERT: $1" >> "$ALERT_FILE"
    echo -e "${RED}[ALERT]${NC} $1"
    
    # Opcional: Enviar notificación al sistema
    if command -v notify-send &> /dev/null; then
        notify-send "AI Monitor Alert" "$1" -u critical
    fi
}

warning_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG_FILE"
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

check_file_changes() {
    cd "$ROOT_DIR" || exit
    
    # Contar archivos modificados en las últimas 2 horas
    local modified_count=$(find . -type f -mmin -120 -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null | wc -l)
    
    if [ "$modified_count" -gt "$MAX_FILES_MODIFIED" ]; then
        alert_message "⚠️ Más de $MAX_FILES_MODIFIED archivos modificados en 2 horas: $modified_count"
    fi
    
    # Verificar cambios en archivos críticos
    for critical in "${CRITICAL_FILES[@]}"; do
        if find . -name "*$critical*" -mmin -120 2>/dev/null | grep -q .; then
            alert_message "🔴 Archivo crítico modificado: $critical"
        fi
    done
}

check_git_activity() {
    cd "$ROOT_DIR" || exit
    
    # Verificar commits recientes
    local recent_commits=$(git log --oneline --since="2 hours ago" 2>/dev/null | wc -l)
    
    if [ "$recent_commits" -gt 10 ]; then
        warning_message "Muchos commits en poco tiempo: $recent_commits en 2 horas"
    fi
    
    # Verificar cambios no commiteados
    local unstaged=$(git status --porcelain 2>/dev/null | wc -l)
    
    if [ "$unstaged" -gt 30 ]; then
        warning_message "Muchos archivos sin commit: $unstaged archivos"
    fi
}

check_process_activity() {
    # Verificar procesos node activos
    local node_processes=$(pgrep -c node)
    
    if [ "$node_processes" -gt 10 ]; then
        warning_message "Muchos procesos Node activos: $node_processes"
    fi
    
    # Verificar uso de memoria
    local mem_usage=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
    
    if [ "$mem_usage" -gt 80 ]; then
        alert_message "🔴 Uso de memoria alto: ${mem_usage}%"
    fi
}

check_dangerous_commands() {
    # Revisar historial de bash para comandos peligrosos
    if [ -f ~/.bash_history ]; then
        for cmd in "${FORBIDDEN_COMMANDS[@]}"; do
            if tail -100 ~/.bash_history | grep -q "$cmd"; then
                alert_message "🚨 Comando peligroso detectado en historial: $cmd"
            fi
        done
    fi
}

monitor_ai_work_log() {
    local work_log="$ROOT_DIR/AI_WORK_LOG.md"
    
    if [ -f "$work_log" ]; then
        # Verificar si el log fue actualizado hoy
        local today=$(date +%Y-%m-%d)
        if ! grep -q "$today" "$work_log"; then
            warning_message "AI_WORK_LOG.md no actualizado hoy"
        fi
        
        # Contar sesiones del día
        local sessions_today=$(grep -c "## $today" "$work_log" 2>/dev/null || echo 0)
        log_message "Sesiones de IA hoy: $sessions_today"
    fi
}

generate_summary() {
    echo "========================================" >> "$LOG_FILE"
    echo "RESUMEN - $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
    echo "----------------------------------------" >> "$LOG_FILE"
    
    cd "$ROOT_DIR" || exit
    
    # Resumen de actividad
    echo "Archivos modificados (24h): $(find . -type f -mtime -1 -not -path "./node_modules/*" 2>/dev/null | wc -l)" >> "$LOG_FILE"
    echo "Commits hoy: $(git log --oneline --since='24 hours ago' 2>/dev/null | wc -l)" >> "$LOG_FILE"
    echo "Procesos Node activos: $(pgrep -c node)" >> "$LOG_FILE"
    echo "Uso de memoria: $(free | grep Mem | awk '{print int($3/$2 * 100)}')%" >> "$LOG_FILE"
    echo "========================================" >> "$LOG_FILE"
}

# Loop principal de monitoreo
log_message "🚀 Monitor de actividad de IAs iniciado"
log_message "Configuración: MAX_FILES=$MAX_FILES_MODIFIED, Intervalo=5min"

while true; do
    log_message "Ejecutando verificaciones..."
    
    check_file_changes
    check_git_activity
    check_process_activity
    check_dangerous_commands
    monitor_ai_work_log
    
    # Generar resumen cada hora
    if [ "$(date +%M)" == "00" ]; then
        generate_summary
    fi
    
    # Esperar 5 minutos antes de la próxima verificación
    sleep 300
done