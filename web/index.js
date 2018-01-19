const express = require('express')
const api = require('api-formatter').Api

const pingers = require('./pingers')

;(async () => {
  
  let app = express()
  
  app.use(api.middleware())
  
  
  // Add each of the pingers
  Object.keys(pingers).forEach(name => {
    app.get(`/${name}`, async (req, res) => {
      let pong = await pingers[name]()
      res.api.sendData(pong)
    })
  })
  
  
  // Add a general endpoint
  app.get('/', async (req, res) => {
    let pongs = {}
    await Promise.all(Object.keys(pingers).map(async name => {
      pongs[name] = await pingers[name]()
    }))
    res.api.sendData(pongs)
  })
  
  
  // Listen on 3000
  await new Promise(resolve => app.listen(3000, resolve))
  console.log('Listening on :8080')
  
})()
