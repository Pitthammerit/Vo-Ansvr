// Debug utility for logging with different levels
export interface Logger {
  debug: (message: string, ...args: any[]) => void
  info: (message: string, ...args: any[]) => void
  warn: (message: string, ...args: any[]) => void
  error: (message: string, ...args: any[]) => void
}

export function createLogger(component: string): Logger {
  const isDev = process.env.NODE_ENV === "development"

  return {
    debug: (message: string, ...args: any[]) => {
      if (isDev) {
        console.debug(`[${component}] ${message}`, ...args)
      }
    },
    info: (message: string, ...args: any[]) => {
      if (isDev) {
        console.info(`[${component}] ${message}`, ...args)
      }
    },
    warn: (message: string, ...args: any[]) => {
      console.warn(`[${component}] ${message}`, ...args)
    },
    error: (message: string, ...args: any[]) => {
      console.error(`[${component}] ${message}`, ...args)
    },
  }
}
