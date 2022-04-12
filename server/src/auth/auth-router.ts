import KoaRouter from '@koa/router'
import { object, string } from 'superstruct'
import {
  ApiError,
  AppContext,
  AppRouter,
  validateStruct,
} from '../lib/module.js'

interface UserRecord {
  id: number
  fullName: string
  email: string
  phoneNumber: string
  reminderSchedule: string
}

interface UserRequest {
  fullName: string
  email: string
  phoneNumber: string
  reminderSchedule: string
}

const UserRequestStruct = object({
  fullName: string(),
  email: string(),
  phoneNumber: string(),
  reminderSchedule: string(),
})

export class AuthRouter implements AppRouter {
  constructor(private context: AppContext) {}

  apply(router: KoaRouter) {
    router.get('auth.profile', '/auth/me', async (ctx) => {
      const auth = this.context.jwt.getRequestAuth(ctx.headers)
      if (!auth) throw ApiError.unauthorized()

      const [user] = await this.context.pg.run(
        (c) => c.sql<UserRecord>`
          SELECT "id", "fullName", "email", "phoneNumber", "reminderSchedule"
          FROM users
          WHERE id = ${auth.sub}
        `
      )

      if (!user) throw ApiError.unauthorized()
      ctx.body = user
    })

    router.post('auth.register', '/auth/register', async (ctx) => {
      const request = validateStruct(ctx.request.body, UserRequestStruct)

      const client = await this.context.pg.getClient()

      try {
        // Check user already exists ...

        // Create new unverified user ...

        // ???

        await this.context.pg.run(
          (c) => c.sql`
            INSERT INTO users ()
          `
        )
      } catch (error) {
        throw ApiError.internalServerError(error)
      }
    })
  }
}
