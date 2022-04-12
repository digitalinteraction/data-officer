import fs from 'fs/promises'
import { createTerminus } from '@godaddy/terminus'
import { create } from 'superstruct'

import { createDebug, EnvStruct } from '../lib/module.js'
import { createServer } from '../server.js'

const debug = createDebug('app:command:serve')

export interface ServeCommandOptions {
  port: number
}

export async function serveCommand(options: ServeCommandOptions) {
  debug('creating context')

  const env = create(process.env, EnvStruct)
  const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'))

  debug('creating server')
  const { server } = createServer({ env, pkg })

  createTerminus(server, {
    signals: ['SIGINT', 'SIGTERM'],
  })

  debug('starting server')
  server.listen(options.port, () => {
    debug('Listening on http://0.0.0.0:%d', options.port)
  })

  debug('registering terminus')
  createTerminus(server, {
    signals: ['SIGINT', 'SIGTERM'],
    healthChecks: {
      '/healthz': async () => {
        try {
          // TODO ...
        } catch (error) {
          debug('check failed', error)
          throw error
        }
      },
    },
    beforeShutdown: () => {
      // Wait 5s more to shutdown when in production
      // to give loadbalancers time to update
      const wait = env.NODE_ENV !== 'development' ? 5000 : 0
      debug('beforeShutdown wait=%dms', wait)
      return new Promise((resolve) => setTimeout(resolve, wait))
    },
    onSignal: async () => {
      debug('onSignal')
      // TODO ...
    },
  })
}
