// Настройки системы
export let settings = {
  motion: {
    threshold: 1,
  },
  sound: {},
}

export const mutations = {
  motion: {
    setThreshold: (threshold) => {
      console.log(threshold)
    },
  },
}

export function settingsInit() {
  let thresholdElement = document.querySelector('.threshold')
  thresholdElement.addEventListener('input', function (event) {
    console.log(this.value)
  })
}
