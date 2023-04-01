import { settings, syncSettingsFrontend } from "./settings"

// localStorage control
export function checkLocalStorage() {
  // If this is the first time opened AMI, then write down the default settings
  if (!localStorage.getItem('init')) {
    localStorage.setItem('init', 'true')
    syncLocalStorage(settings)
  } else {
    // Otherwise, loading the earlier settings from localStorage and rewriting
    Object.assign(settings, JSON.parse(localStorage.getItem('settings')))
    syncSettingsFrontend(settings)
  }
}

export function syncLocalStorage(settings) {
  localStorage.setItem('settings', JSON.stringify(settings))
}