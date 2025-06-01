// Simple debug logger with component namespacing
// Used throughout the app for consistent logging

type LogLevel = "debug" | "info" | "warn" | "error"

interface Logger {
  debug: (message: string, ...args: any[]) => void
  info: (message: string, ...args: any[]) => void
  warn: (message: string, ...args: any[]) => void
  error: (message: string, ...args: any[]) => void
}

// Create a logger with component name prefix
export function createLogger(component: string): Logger {
  const logWithLevel = (level: LogLevel, message: string, ...args: any[]) => {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${component}]`
    
    switch (level) {
      case "debug":
        console.debug(`${prefix} ${message}`, ...args)
        break
      case "info":
        console.info(`${prefix} ${message}`, ...args)
        break
      case "warn":
        console.warn(`${prefix} ${message}`, ...args)
        break
      case "error":
        console.error(`${prefix} ${message}`, ...args)
        break
    }
  }

  return {
    debug: (message: string, ...args: any[]) => logWithLevel("debug", message, ...args),
    info: (message: string, ...args: any[]) => logWithLevel("info", message, ...args),
    warn: (message: string, ...args: any[]) => logWithLevel("warn", message, ...args),
    error: (message: string, ...args: any[]) => logWithLevel("error", message, ...args),
  }
}

// App-wide logger
export const logger = createLogger("App")
