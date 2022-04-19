import { array, object, string } from 'superstruct'
import {
  ApiError,
  AppContext,
  AppRouter,
  KoaRouter,
  validateStruct,
} from '../lib/module.js'

interface EntryRecord<T = unknown> {
  id: number
  created: Date
  response: T
  user: number
}

const EntryStruct = object({
  q1: string(),
  q2: string(),
  q3: array(string()),
})

export class EntriesRouter implements AppRouter {
  constructor(private context: AppContext) {}

  applyRoutes(router: KoaRouter): void {
    router.get('/entries', async (ctx) => {
      const auth = this.context.jwt.getRequestAuth(ctx.request.headers)
      if (!auth) throw ApiError.unauthorized()

      const client = await this.context.pg.getClient()
      try {
        const entries = await client.sql<EntryRecord>`
          SELECT "id", "created", "response"::jsonb, "user"::int
          FROM "entries"
          WHERE "user" = ${auth.sub}
        `

        ctx.body = entries
      } finally {
        client.release()
      }
    })

    router.post('/entries', async (ctx) => {
      const auth = this.context.jwt.getRequestAuth(ctx.request.headers)
      if (!auth) throw ApiError.unauthorized()

      const response = validateStruct(ctx.request.body, EntryStruct)

      await this.context.pg.run(
        (c) => c.sql`
          INSERT INTO "entries" ("response", "user")
          VALUES (${response}, ${auth.sub})
        `
      )
      ctx.body = 'ok'
    })
  }
}
