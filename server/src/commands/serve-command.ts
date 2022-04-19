import fs from 'fs/promises'
import { createTerminus } from '@godaddy/terminus'
import { mask } from 'superstruct'
import { createClient as createRedisClient } from 'redis'
import { createAdapter as createRedisAdapter } from '@socket.io/redis-adapter'

import {
  createDebug,
  EnvStruct,
  PostgresService,
  JwtService,
  EmailService,
} from '../lib/module.js'
import { createServer } from '../server.js'

const debug = createDebug('app:command:serve')

export interface ServeCommandOptions {
  port: number
}

export async function serveCommand(options: ServeCommandOptions) {
  debug('creating context')

  const toDispose: (() => Promise<unknown>)[] = []

  const env = mask(process.env, EnvStruct)
  const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'))
  const pg = new PostgresService({ connectionString: env.DATABASE_URL })
  const jwt = new JwtService({
    secretKey: env.JWT_SECRET,
    issuer: 'data-diaries-01',
  })
  const email = new EmailService({
    apiKey: env.SENDGRID_API_TOKEN,
    fromEmail: 'noreply@openlab.dev',
    replyToEmail: 'openlab@ncl.ac.uk',
    templateId: '',
  })

  toDispose.push(() => {
    debug('closing pg')
    return pg.close()
  })

  debug('creating server')
  const { server, io } = await createServer({ env, pkg, pg, jwt, email })

  if (env.REDIS_URL) {
    debug('using redis')
    const pub = createRedisClient({ url: env.REDIS_URL })
    const sub = createRedisClient({ url: env.REDIS_URL })
    await Promise.all([pub.connect(), sub.connect()])
    io.adapter(createRedisAdapter(pub, sub))
    toDispose.push(() => {
      debug('closing redis')
      return Promise.all([pub.quit(), sub.quit()])
    })
  }

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
          await pg.checkHealth()
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
      debug('terminus@beforeShutdown wait=%dms', wait)
      return new Promise((resolve) => setTimeout(resolve, wait))
    },
    onSignal: async () => {
      debug('terminus@onSignal')
      await Promise.all(toDispose.map((d) => d()))
    },
  })
}
