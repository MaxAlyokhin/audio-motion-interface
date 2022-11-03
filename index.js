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
    console.log('Disconnected!')
    io.emit('connection message', io.of('/').sockets.size)
  })

  socket.on('motion message', (motionData) => {
    io.emit('motion message', motionData)
  })

  socket.on('settings message', (settingsData) => {
    io.emit('settings message', settingsData)
  })
})

server.listen(443, '0.0.0.0', function () {
  require('dns').lookup(require('os').hostname(), function (err, ip, fam) {
    console.log(`AMI is running on https://${ip}`)
  })
})
