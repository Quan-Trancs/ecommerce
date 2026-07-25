'use client'

export const LIVE_TOASTS_STORAGE_KEY = 'notify_in_app_toasts'

/** Toasts are on by default; store '0' to mute. */
export function areLiveToastsEnabled(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(LIVE_TOASTS_STORAGE_KEY) !== '0'
  } catch {
    return true
  }
}

export function setLiveToastsEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return
  try {
    if (enabled) {
      window.localStorage.removeItem(LIVE_TOASTS_STORAGE_KEY)
    } else {
      window.localStorage.setItem(LIVE_TOASTS_STORAGE_KEY, '0')
    }
  } catch {
    // private mode / blocked storage
  }
}
