import { createTerminus } from '@godaddy/terminus'
import { createClient as createRedisClient } from 'redis'
import { createAdapter as createRedisAdapter } from '@socket.io/redis-adapter'

import {
  createDebug,
  PostgresService,
  JwtService,
  EmailService,
  getEnvRecord,
  getPackageJson,
  getAppConfig,
} from '../lib/module.js'
import { createServer } from '../server.js'
import { SmsService } from '../lib/sms.js'
import { LinksService } from '../links/links-service.js'

const debug = createDebug('app:command:serve')

export interface ServeCommandOptions {
  port: number
}

export async function serveCommand(options: ServeCommandOptions) {
  debug('start port=%o', options.port)

  const toDispose: (() => Promise<unknown>)[] = []

  const env = getEnvRecord()
  const pkg = getPackageJson()
  const config = getAppConfig()
  const pg = new PostgresService({ connectionString: env.DATABASE_URL })
  const jwt = new JwtService({
    ...config.jwt,
    secretKey: env.JWT_SECRET,
  })
  const email = new EmailService({
    ...config.email,
    apiKey: env.SENDGRID_API_TOKEN,
  })
  const sms = new SmsService({
    ...config.sms,
    authToken: env.TWILIO_AUTH_TOKEN,
    accountSid: env.TWILIO_ACCOUNT_SID,
  })
  const links = new LinksService({
    baseUrl: env.SHARE_URL ?? env.SELF_URL,
  })

  toDispose.push(() => {
    debug('closing pg')
    return pg.close()
  })

  debug('creating server')
  const { server, io } = await createServer({
    env,
    pkg,
    pg,
    jwt,
    email,
    sms,
    links,
  })

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
