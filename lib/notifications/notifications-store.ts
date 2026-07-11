import { normalizeRole, type AppRole } from "@/lib/auth/roles"

export type NotificationType =
  | "new_order"
  | "order_ready"
  | "low_stock"
  | "reservation_reminder"
  | "payment_received"
  | "info"

export type AppNotification = {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  read: boolean
  audience?: AppRole[]
}

const STORAGE_KEY = "jb-notifications"

const DEFAULT_AUDIENCE: Record<NotificationType, AppRole[]> = {
  new_order: ["ADMIN"],
  order_ready: ["ADMIN", "SERVER"],
  low_stock: ["ADMIN"],
  reservation_reminder: ["ADMIN", "SERVER"],
  payment_received: ["ADMIN", "CASHIER"],
  info: ["ADMIN"],
}

type StoreListener = () => void

function load(): AppNotification[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as AppNotification[]
  } catch {
    return []
  }
}

function persist(items: AppNotification[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 80)))
}

function audienceFor(n: AppNotification): AppRole[] {
  return n.audience && n.audience.length > 0
    ? n.audience
    : DEFAULT_AUDIENCE[n.type] ?? ["ADMIN"]
}

function visibleForRole(items: AppNotification[], role: AppRole, isAdmin: boolean): AppNotification[] {
  if (isAdmin) return items
  return items.filter((n) => audienceFor(n).includes(role))
}

function unreadForRole(items: AppNotification[], role: AppRole, isAdmin: boolean): number {
  return visibleForRole(items, role, isAdmin).filter((n) => !n.read).length
}

function notificationsEqual(a: AppNotification[], b: AppNotification[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const x = a[i]
    const y = b[i]
    if (
      x.id !== y.id ||
      x.read !== y.read ||
      x.title !== y.title ||
      x.message !== y.message ||
      x.type !== y.type ||
      x.timestamp !== y.timestamp
    ) {
      return false
    }
  }
  return true
}

class NotificationsStore {
  private items: AppNotification[] = typeof window !== "undefined" ? load() : []
  private listeners = new Set<StoreListener>()
  private revision = 0
  private filteredCache = new Map<string, { revision: number; list: AppNotification[] }>()

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("storage", this.onStorage)
    }
  }

  private onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return
    try {
      const parsed = JSON.parse(e.newValue) as AppNotification[]
      if (!notificationsEqual(this.items, parsed)) {
        this.items = parsed
        this.bump()
      }
    } catch {
      /* ignore */
    }
  }

  subscribe = (listener: StoreListener): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getRevision = (): number => this.revision

  getAll = (): AppNotification[] => this.items

  getForRole = (role: AppRole, isAdmin: boolean): AppNotification[] => {
    const key = `${role}:${isAdmin ? "1" : "0"}`
    const cached = this.filteredCache.get(key)
    if (cached && cached.revision === this.revision) return cached.list

    const list = visibleForRole(this.items, role, isAdmin)
    this.filteredCache.set(key, { revision: this.revision, list })
    return list
  }

  getUnreadCount = (role: AppRole, isAdmin: boolean): number => {
    return unreadForRole(this.items, role, isAdmin)
  }

  private bump() {
    this.revision += 1
    this.filteredCache.clear()
    for (const listener of this.listeners) listener()
  }

  add = (n: Omit<AppNotification, "id" | "timestamp" | "read">): AppNotification => {
    const item: AppNotification = {
      ...n,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      read: false,
    }
    this.items = [item, ...this.items]
    persist(this.items)
    this.bump()
    return item
  }

  markRead = (id: string) => {
    let changed = false
    const next = this.items.map((n) => {
      if (n.id !== id || n.read) return n
      changed = true
      return { ...n, read: true }
    })
    if (!changed) return
    this.items = next
    persist(this.items)
    this.bump()
  }

  markAllRead = (role: AppRole, isAdmin: boolean) => {
    const visibleIds = new Set(visibleForRole(this.items, role, isAdmin).map((n) => n.id))
    let changed = false
    const next = this.items.map((n) => {
      if (!visibleIds.has(n.id) || n.read) return n
      changed = true
      return { ...n, read: true }
    })
    if (!changed) return
    this.items = next
    persist(this.items)
    this.bump()
  }

  dismiss = (id: string) => {
    const next = this.items.filter((n) => n.id !== id)
    if (next.length === this.items.length) return
    this.items = next
    persist(this.items)
    this.bump()
  }
}

export const notificationsStore = new NotificationsStore()

export function notificationRoleKey(userRole: string | undefined): {
  role: AppRole
  isAdmin: boolean
} {
  const role: AppRole = userRole ? normalizeRole(userRole) : "CLIENT"
  return { role, isAdmin: role === "ADMIN" }
}
