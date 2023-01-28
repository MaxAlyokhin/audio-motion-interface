const fs = require('fs')
const os = require('os')
const https = require('https')
const express = require('express')
const { Server } = require('socket.io')
const { lookup } = require('dns')
const open = require('open')

const hostname = os.hostname()
const app = express()
const server = https.createServer(
  {
    key: fs.readFileSync(`${__dirname}/localhost+2-key.pem`),
    cert: fs.readFileSync(`${__dirname}/localhost+2.pem`),
    requestCert: false,
    rejectUnauthorized: false,
  },
  app
)

const io = new Server(server)

app.use(express.static(`${__dirname}/client/dist`))

io.on('connection', (socket) => {
  console.log(`${getDate()} New device is connected`)

  io.emit('connection message', io.of('/').sockets.size)

  socket.on('disconnect', (reason) => {
    console.log(`${getDate()} Device is disconnected`)
    io.emit('connection message', io.of('/').sockets.size)
  })

  socket.on('motion message', (motionData) => {
    io.emit('motion message', motionData)
  })

  socket.on('settings message', (settingsData) => {
    io.emit('settings message', settingsData)
  })
})

function getDate() {
  let date = new Date()
  return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`
}

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
  console.log(`${getDate()} Audio-motion interface is up and running`)
  lookup(hostname, options, function (err, ips, fam) {
    const serverIP = ips.find(ip => ip.address.indexOf('192.168') === 0)
    if (serverIP) {
      address = serverIP.address
      console.log(`${getDate()} Opening https://${address} in default browser`)
      open(`https://${address}`)
      console.log(`${getDate()} Close terminal for exit from AMI`)
    } else {
      address = 'ami.stranno.su'
    }
  })
})


