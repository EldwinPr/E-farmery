const aedes = require('aedes')()
const server = require('net').createServer(aedes.handle)
const port = 1883

// Start the MQTT server
server.listen(port, function() {
  console.log('MQTT broker running on port:', port)
})

// Log client connections
aedes.on('client', function(client) {
  console.log('Client connected:', client.id)
})

// Log client disconnections
aedes.on('clientDisconnect', function(client) {
  console.log('Client disconnected:', client.id)
})

// Log all published messages (only the essential topics we care about)
aedes.on('publish', function(packet, client) {
  if (client) {
    // Extract the topic
    const topic = packet.topic
    
    // Only log moisture sensor data and valve control messages
    if (topic.includes('/moisture') || topic.includes('/valve')) {
      console.log(`Message: ${topic} -> ${packet.payload.toString()}`)
    }
  }
})

console.log('E-Farmery MQTT broker started')
console.log('Waiting for ESP32 connections...')

// Keep the process running
process.on('SIGINT', function() {
  console.log('Shutting down MQTT broker')
  server.close()
  process.exit()
})