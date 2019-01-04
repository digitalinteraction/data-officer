require('dotenv').config()

const express = require('express')
const api = require('api-formatter').Api

const pingers = require('./pingers')

;(async () => {
  let app = express().use(api.middleware())

  // Add an endpoint for all infos
  app.get('/all', async (req, res) => {
    let pongs = {}
    await Promise.all(
      Object.keys(pingers).map(async name => {
        pongs[name] = await pingers[name]()
      })
    )
    res.api.sendData(pongs)
  })

  // Add an endpoint for each pingers
  Object.keys(pingers).forEach(name => {
    app.get(`/service/${name}`, async (req, res) => {
      let pong = await pingers[name]()
      res.api.sendData(pong, pong.state.online ? 200 : 400)
    })
  })

  // Add an enpoint to return all services which are down
  app.get('/down', async (req, res) => {
    let down = {}
    await Promise.all(
      Object.keys(pingers).map(async name => {
        let pong = await pingers[name]()
        if (pong.state.online) return
        down[name] = pong
      })
    )
    res.api.sendData(down)
  })

  // Add a state endpoint
  app.get('/', (req, res) => {
    res.api.sendData({
      msg: 'ok',
      endpoints: {
        '/all': 'Get the status of all services',
        '/down': 'Get the services which are down',
        '/service/:name':
          'Get the status of all services, where :name is the key of the service from /all',
        '/docs': 'More detailed api docs'
      }
    })
  })

  // Add docs
  app.use('/docs', express.static('docs'))

  // Listen on 3000
  await new Promise(resolve => app.listen(3000, resolve))
  console.log('Listening on :3000')
})()
