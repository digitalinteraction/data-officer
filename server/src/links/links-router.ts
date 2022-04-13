import {
  PostgresClient,
  AppContext,
  AppRouter,
  KoaRouter,
} from '../lib/module.js'
import { LinkRecord } from './link-record.js'

export class LinkRouter implements AppRouter {
  constructor(private context: AppContext) {}

  apply(router: KoaRouter): void {
    router.get('/l/:code', async (ctx) => {
      const client = await this.context.pg.getClient()

      try {
        const [link] = await client.sql<LinkRecord>`
          SELECT "id", "code", "url", "uses"::int
          FROM "links"
          WHERE "code" = ${ctx.params.code}
        `

        console.log(link)

        if (!link) {
          ctx.status = 404
          ctx.body = 'Short link not found'
        } else {
          await client.sql`
            UPDATE "links"
            SET "uses" = ${link.uses + 1}
            WHERE id = ${link.id}
          `

          ctx.redirect(link.url)
        }
      } finally {
        client.release()
      }
    })
  }
}
