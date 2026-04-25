type LogoutHandler = (skipApiCall?: boolean) => Promise<void>
type ModalCloseHandler = () => void

class GlobalHandlers {
  private logoutHandler: LogoutHandler | null = null
  private modalCloseHandlers: Set<ModalCloseHandler> = new Set()
  private isHandlingUnauthorized = false

  setLogoutHandler(handler: LogoutHandler): void {
    this.logoutHandler = handler
  }

  async executeLogout(skipApiCall = false): Promise<void> {
    if (this.logoutHandler) {
      await this.logoutHandler(skipApiCall)
    }
  }

  registerModalCloseHandler(handler: ModalCloseHandler): () => void {
    this.modalCloseHandlers.add(handler)
    return () => { this.modalCloseHandlers.delete(handler) }
  }

  async handleUnauthorized(): Promise<void> {
    if (this.isHandlingUnauthorized) return
    this.isHandlingUnauthorized = true
    try {
      this.modalCloseHandlers.forEach(h => { try { h() } catch {} })
      await this.executeLogout(true)
    } finally {
      this.isHandlingUnauthorized = false
    }
  }
}

export const globalHandlers = new GlobalHandlers()
