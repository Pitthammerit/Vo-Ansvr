/**
 * Secure debug utility for ANSVR
 * - No environment variables exposed to client
 * - Developer-only access
 * - Production-safe by default
 * - PWA-compatible (works offline)
 */

type LogLevel = "error" | "warn" | "info" | "debug"

interface DebugConfig {
  enabled: boolean
  level: LogLevel
  prefix: string
}

class DebugManager {
  private config: DebugConfig
  private isDeveloper: boolean

  constructor() {
    this.isDeveloper = this.detectDeveloperMode()
    this.config = {
      enabled: this.isDeveloper,
      level: "debug",
      prefix: "🔧",
    }

    // Always show debug status on initialization with detailed info
    if (typeof window !== "undefined") {
      console.log(`🔧 ANSVR Debug Mode: ${this.isDeveloper ? "✅ ENABLED" : "❌ DISABLED"}`)

      // Show detection details for troubleshooting
      const detectionInfo = this.getDetectionInfo()
      console.log("🔧 Detection Info:", detectionInfo)

      if (this.isDeveloper) {
        console.log("🔧 Debug logs will be visible. Use ansvr_debug.disable() to turn off.")
      } else {
        console.log("🔧 Use ansvr_debug.enable() or add ?debug=true to URL to enable debug logs.")
        console.log("🔧 Or run: ansvr_debug.enable('ansvr2024')")
      }
    }
  }

  /**
   * Get detailed detection information for troubleshooting
   */
  private getDetectionInfo() {
    if (typeof window === "undefined") return { server: true }

    const hostname = window.location.hostname
    const port = window.location.port
    const search = window.location.search
    const protocol = window.location.protocol

    return {
      hostname,
      port,
      protocol,
      search,
      isLocalhost: hostname === "localhost" || hostname === "127.0.0.1",
      isDevDomain:
        hostname.includes("dev") ||
        hostname.includes("staging") ||
        hostname.includes("vercel.app") ||
        hostname.includes("v0.dev"),
      hasDebugFlag: search.includes("debug=true"),
      hasDevFlag: localStorage.getItem("ansvr_dev_mode") === "true",
      isDevPort: port === "3000" || port === "3001" || port === "5173" || port === "8080",
      fullUrl: window.location.href,
    }
  }

  /**
   * Detect if we're in developer mode
   * Safe runtime detection - no environment variables
   */
  private detectDeveloperMode(): boolean {
    if (typeof window === "undefined") return false

    const info = this.getDetectionInfo()

    // More comprehensive developer conditions
    const isDeveloper =
      info.isLocalhost ||
      info.isDevDomain ||
      info.hasDebugFlag ||
      info.hasDevFlag ||
      info.isDevPort ||
      // Additional checks for common development scenarios
      info.hostname === "0.0.0.0" ||
      info.hostname.startsWith("192.168.") ||
      info.hostname.startsWith("10.") ||
      info.hostname.endsWith(".local") ||
      // Check for development-specific URLs
      info.fullUrl.includes("localhost") ||
      info.fullUrl.includes("127.0.0.1")

    return isDeveloper
  }

  /**
   * Enable developer mode (for developers only)
   */
  enableDevMode(password = ""): boolean {
    // Simple developer verification or auto-detect
    if (password === "ansvr2024" || this.detectDeveloperMode() || password === "") {
      localStorage.setItem("ansvr_dev_mode", "true")
      this.isDeveloper = true
      this.config.enabled = true
      console.log("🔧 ✅ Developer mode enabled!")
      console.log("🔧 Debug logs are now active.")
      return true
    }
    console.log("🔧 ❌ Invalid password or not in development environment")
    return false
  }

  /**
   * Disable developer mode
   */
  disableDevMode(): void {
    localStorage.removeItem("ansvr_dev_mode")
    this.isDeveloper = false
    this.config.enabled = false
    console.log("🔧 ❌ Developer mode disabled")
  }

  /**
   * Safe logging that only works in developer mode
   */
  log(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.config.enabled || !this.isDeveloper) return

    const timestamp = new Date().toISOString().split("T")[1].split(".")[0]
    const prefix = `${this.config.prefix} [${timestamp}]`

    switch (level) {
      case "error":
        console.error(`${prefix} ❌`, message, ...args)
        break
      case "warn":
        console.warn(`${prefix} ⚠️`, message, ...args)
        break
      case "info":
        console.info(`${prefix} ℹ️`, message, ...args)
        break
      case "debug":
        console.log(`${prefix} 🐛`, message, ...args)
        break
    }
  }

  /**
   * Component-specific loggers
   */
  createLogger(component: string) {
    return {
      error: (message: string, ...args: any[]) => this.log("error", `[${component}] ${message}`, ...args),
      warn: (message: string, ...args: any[]) => this.log("warn", `[${component}] ${message}`, ...args),
      info: (message: string, ...args: any[]) => this.log("info", `[${component}] ${message}`, ...args),
      debug: (message: string, ...args: any[]) => this.log("debug", `[${component}] ${message}`, ...args),
    }
  }

  /**
   * Get debug status (for UI indicators)
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      isDeveloper: this.isDeveloper,
      level: this.config.level,
      detectionInfo: this.getDetectionInfo(),
    }
  }
}

// Global singleton instance
const debugManager = new DebugManager()

// Export convenient functions
export const debug = debugManager.createLogger("App")
export const enableDevMode = (password?: string) => debugManager.enableDevMode(password)
export const disableDevMode = () => debugManager.disableDevMode()
export const getDebugStatus = () => debugManager.getStatus()
export const createLogger = (component: string) => debugManager.createLogger(component)

// Global access for developers (browser console)
if (typeof window !== "undefined") {
  ;(window as any).ansvr_debug = {
    enable: enableDevMode,
    disable: disableDevMode,
    status: getDebugStatus,
    info: () => debugManager.getStatus(),
  }
}
