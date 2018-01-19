const express = require('express')
const api = require('api-formatter').Api

const pingers = require('./pingers')

;(async () => {
  
  let app = express()
    .use(api.middleware())
  
  // Add an endpoint for all infos
  app.get('/all', async (req, res) => {
    let pongs = {}
    await Promise.all(Object.keys(pingers).map(async name => {
      pongs[name] = await pingers[name]()
    }))
    res.api.sendData(pongs)
  })
  
  // Add an endpoint for each pingers
  Object.keys(pingers).forEach(name => {
    app.get(`/service/${name}`, async (req, res) => {
      let pong = await pingers[name]()
      res.api.sendData(pong, pong.state.online ? 200 : 400)
    })
  })
  
  // Add a state endpoint
  app.get('/', (req, res) => {
    res.api.sendData('ok')
  })
  
  
  // Listen on 3000
  await new Promise(resolve => app.listen(3000, resolve))
  console.log('Listening on :3000')
  
})()
