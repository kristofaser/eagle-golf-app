/**
 * Logger centralisé pour l'application Eagle
 * Désactive automatiquement les logs en production
 */

const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 999,
}

class Logger {
  private level: LogLevel = isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR;

  setLevel(level: LogLevel) {
    this.level = level;
  }

  debug(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: unknown, ...args: unknown[]) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, error, ...args);
    }
  }

  // Méthode pour les logs temporaires de développement
  // Toujours désactivés en production
  dev(message: string, ...args: unknown[]) {
    if (isDevelopment) {
      console.log(`[DEV] ${message}`, ...args);
    }
  }

  // Grouper les logs
  group(label: string) {
    if (isDevelopment && console.group) {
      console.group(label);
    }
  }

  groupEnd() {
    if (isDevelopment && console.groupEnd) {
      console.groupEnd();
    }
  }

  // Table pour affichage de données structurées
  table(data: unknown) {
    if (isDevelopment && console.table) {
      console.table(data);
    }
  }

  // Timer pour mesurer les performances
  time(label: string) {
    if (isDevelopment && console.time) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (isDevelopment && console.timeEnd) {
      console.timeEnd(label);
    }
  }
}

export const logger = new Logger();

// Exports pour compatibilité avec l'existant
export const log = logger.debug.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);
export const dev = logger.dev.bind(logger);
