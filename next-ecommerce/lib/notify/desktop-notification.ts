'use client'

export const DESKTOP_ALERTS_STORAGE_KEY = 'notify_desktop_alerts'

export function isDesktopAlertsEnabled(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(DESKTOP_ALERTS_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setDesktopAlertsEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return
  try {
    if (enabled) {
      window.localStorage.setItem(DESKTOP_ALERTS_STORAGE_KEY, '1')
    } else {
      window.localStorage.removeItem(DESKTOP_ALERTS_STORAGE_KEY)
    }
  } catch {
    // private mode / blocked storage
  }
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

/**
 * Show a system notification when the tab is backgrounded.
 * Returns true if a desktop notification was shown.
 */
export function showDesktopNotification(input: {
  id: number | string
  title: string
  body: string
  href: string
}): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (!isDesktopAlertsEnabled()) return false
  if (Notification.permission !== 'granted') return false
  if (document.visibilityState !== 'hidden') return false

  const notification = new Notification(input.title, {
    body: input.body.slice(0, 160),
    tag: `in-app-${input.id}`,
    data: { href: input.href },
  })

  notification.onclick = () => {
    try {
      window.focus()
      if (input.href) {
        window.location.assign(input.href)
      }
    } finally {
      notification.close()
    }
  }

  return true
}
