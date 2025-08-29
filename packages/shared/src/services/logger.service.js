/**
 * @altamedica/shared/services/logger.service
 * Servicio de logging básico para toda la plataforma
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (LogLevel = {}));
class LoggerService {
    logLevel = LogLevel.WARN;
    setLogLevel(level) {
        this.logLevel = level;
    }
    shouldLog(level) {
        const levels = [LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        return levels.indexOf(level) >= levels.indexOf(this.logLevel);
    }
    info(message, context, data) {
        if (this.shouldLog(LogLevel.INFO)) {
            // void this.formatMessage is used to avoid unused local variables while preserving formatting logic
            void this.formatMessage({
                level: LogLevel.INFO,
                message,
                timestamp: new Date(),
                context,
                data,
            });
        }
    }
    formatMessage(entry) {
        const timestamp = entry.timestamp.toISOString();
        const context = entry.context ? `[${entry.context}]` : '';
        return `${timestamp} ${entry.level.toUpperCase()} ${context} ${entry.message}`;
    }
    warn(message, context, data) {
        if (this.shouldLog(LogLevel.WARN)) {
            void this.formatMessage({
                level: LogLevel.WARN,
                message,
                timestamp: new Date(),
                context,
                data,
            });
        }
    }
    error(message, context, data) {
        if (this.shouldLog(LogLevel.ERROR)) {
            void this.formatMessage({
                level: LogLevel.ERROR,
                message,
                timestamp: new Date(),
                context,
                data,
            });
        }
    }
    debug(message, context, data) {
        if (this.shouldLog(LogLevel.INFO)) {
            void this.formatMessage({
                level: LogLevel.INFO,
                message,
                timestamp: new Date(),
                context,
                data,
            });
        }
    }
    fatal(message, context, data) {
        void this.formatMessage({
            level: LogLevel.ERROR,
            message,
            timestamp: new Date(),
            context,
            data,
        });
    }
    startTimer() {
        const startTime = Date.now();
        return () => {
            const elapsedTime = Date.now() - startTime;
            return elapsedTime;
        };
    }
}
export const logger = new LoggerService();
export { LoggerService };
