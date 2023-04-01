// Initializing a websocket

import io from 'socket.io/client-dist/socket.io'

export let socket = undefined // The instance of socket.io
export let socketIsInit = false // Socket.io initialization flag
export function socketInit() {
  socket = io({ autoConnect: false })
  socketIsInit = true
}
