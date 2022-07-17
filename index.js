const fs = require('fs')
const https = require('https')
const express = require('express')
const { Server } = require('socket.io')

const app = express()
const server = https.createServer(
  {
    key: fs.readFileSync('./localhost+2-key.pem'),
    cert: fs.readFileSync('./localhost+2.pem'),
    requestCert: false,
    rejectUnauthorized: false,
  },
  app
)
const io = new Server(server)

app.use(express.static(`${__dirname}/client/dist`))

io.on('connection', (socket) => {
  console.log('Connected!')

  io.emit('connection message', io.of('/').sockets.size)

  socket.on('disconnect', (reason) => {
    io.emit('connection message', io.of('/').sockets.size)
  })

  socket.on('motion message', (motionData) => {
    // console.log(motionData)
    io.emit('motion message', motionData)
  })
  socket.on('settings message', (settingsData) => {
    console.log(settingsData)
    io.emit('settings message', settingsData)
  })
})

server.listen(3000, function () {
  console.log('Server is running')
})
