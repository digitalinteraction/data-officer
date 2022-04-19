import { any, object, optional, string, Struct, validate } from 'superstruct'
import {
  AppBroker,
  AppContext,
  createDebug,
  PostgresClient,
  SocketIoServer,
} from '../lib/module.js'

const debug = createDebug('app:general:metrics-broker')
const metrics = new Map<string, Struct<any>>()

metrics.set(
  'pageView',
  object({
    name: optional(string()),
    path: optional(string()),
    params: any(),
  })
)

export class MetricsBroker implements AppBroker {
  constructor(private context: AppContext) {}

  applyIo(io: SocketIoServer): void {
    io.on('connection', (socket) => {
      socket.on('metric', async (metric, payload) => {
        const struct = metrics.get(metric)
        if (!struct || !validate(payload, struct)) {
          debug('#metric invalid payload')
          return
        }
        debug(`#metric %o %O`, metric, payload)

        this.context.pg
          .run(
            (client) => client.sql`
              INSERT INTO "logs" ("session", "metric", "payload")
              VALUES (${socket.id}, ${metric}, ${payload})
            `
          )
          .catch((error) => {
            console.error('Failed to write metric %O', error)
          })
      })
    })
  }
}
