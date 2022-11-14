const fs = require('fs')
const os = require('os')
const https = require('https')
const express = require('express')
const { Server } = require('socket.io')
const { lookup } = require('dns')

const hostname = os.hostname()
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

let address = null

app.get('/hostname', (request, responce) => {
  responce.status(200).type('text/html')
  responce.send(address)
})

const options = {
  family: 4,
  all: true,
}

server.listen(443, '0.0.0.0', function () {
  lookup(hostname, options, function (err, ips, fam) {
    ips.forEach(ip => {
      if (ip.address.indexOf('192.168') === 0) {
        address = ip.address
      } else {
        address = 'ami.stranno.su'
      }
    })
  })
})


