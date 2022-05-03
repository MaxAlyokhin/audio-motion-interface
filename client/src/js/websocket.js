// Инициализация вебсокета

import io from 'socket.io/client-dist/socket.io'

export let socket = undefined // Экземпляр socket.io
export let socketIsInit = false // Флаг инициализации socket.io
export function socketInit() {
  socket = io({ autoConnect: false })
  socketIsInit = true
}
