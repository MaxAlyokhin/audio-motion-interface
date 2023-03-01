import { settings, syncSettingsFrontend } from "./settings"

// Управление localStorage
export function checkLocalStorage() {
  // Если первый раз открыли AMI, то записываем дефолтные настройки
  if (!localStorage.getItem('init')) {
    localStorage.setItem('init', 'true')
    syncLocalStorage(settings)
  } else {
    // Иначе грузим из localStorage ранние настройки и переписываем
    Object.assign(settings, JSON.parse(localStorage.getItem('settings')))
    syncSettingsFrontend(settings)
  }
}

export function syncLocalStorage(settings) {
  localStorage.setItem('settings', JSON.stringify(settings))
}