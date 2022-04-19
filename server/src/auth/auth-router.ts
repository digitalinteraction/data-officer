import {
  assert,
  boolean,
  Infer,
  nullable,
  object,
  string,
  type,
} from 'superstruct'
import jwt from 'jsonwebtoken'

import {
  ApiError,
  AppContext,
  AppRouter,
  AppTokenStruct,
  validateStruct,
  KoaRouter,
  PostgresClient,
} from '../lib/module.js'

interface IdRecord {
  id: number
}

interface UserRecord {
  id: number
  fullName: string
  email: string
  phoneNumber?: string
  reminderSchedule: string
  reminders: { email?: boolean; sms?: boolean }
}

const userReminders = () =>
  object({
    email: boolean(),
    sms: boolean(),
  })

const UserRequestStruct = object({
  fullName: string(),
  email: string(),
  phoneNumber: nullable(string()),
  reminderSchedule: string(),
  reminders: userReminders(),
})

const UserUpdateStruct = object({
  fullName: string(),
  phoneNumber: nullable(string()),
  reminderSchedule: string(),
  reminders: userReminders(),
})

const LoginRequestStruct = type({
  email: string(),
})

function sanitizeEmail(input: string) {
  return input.trim().toLowerCase()
}

const queries = (client: PostgresClient) => ({
  async updateUser(id: number, update: Infer<typeof UserUpdateStruct>) {
    await client.sql`
      UPDATE "users"
      SET 
        "fullName" = ${update.fullName},
        "phoneNumber" = ${update.phoneNumber},
        "reminderSchedule" = ${update.reminderSchedule},
        "reminders" = ${update.reminders}
      WHERE "id" = ${id}
    `
  },
})

export class AuthRouter implements AppRouter {
  constructor(private context: AppContext) {}

  updateUser(
    client: PostgresClient,
    id: number,
    update: Infer<typeof UserUpdateStruct>
  ) {
    return client.sql`
      UPDATE "users"
      SET 
        "fullName" = ${update.fullName},
        "phoneNumber" = ${update.phoneNumber},
        "reminderSchedule" = ${update.reminderSchedule},
        "reminders" = ${update.reminders}
      WHERE "id" = ${id}
    `
  }

  applyRoutes(router: KoaRouter) {
    router.get('/auth/me', async (ctx) => {
      const auth = this.context.jwt.getRequestAuth(ctx.headers)
      if (!auth) throw ApiError.unauthorized()

      const [user] = await this.context.pg.run(
        (c) => c.sql<UserRecord>`
          SELECT "id", "fullName", "email", "phoneNumber", "reminderSchedule", "reminders"
          FROM "users"
          WHERE "id" = ${auth.sub}
        `
      )

      if (!user) throw ApiError.unauthorized()
      ctx.body = user
    })

    router.post('/auth/register', async (ctx) => {
      const request = validateStruct(ctx.request.body, UserRequestStruct)
      const email = sanitizeEmail(request.email)

      // TODO: check phone number is real
      // TODO: check schedule is a cron statement

      const client = await this.context.pg.getClient()

      try {
        // Check user already exists ...
        const [existingUser] = await client.sql<IdRecord>`
          SELECT "id"
          FROM "users"
          WHERE "email" = ${email}
        `
        let userId: number

        // Re-use the existing user or create a new one
        if (existingUser) {
          userId = existingUser.id

          await this.updateUser(client, existingUser.id, request)
        } else {
          const [newUser] = await client.sql<IdRecord>`
            INSERT INTO "users" ("fullName", "email", "phoneNumber", "reminderSchedule", "reminders")
            VALUES (${request.fullName}, ${email}, ${request.phoneNumber}, ${request.reminderSchedule}, ${request.reminders})
            RETURNING "id"
          `
          userId = newUser.id
        }

        const token = this.context.jwt.sign(
          {
            sub: userId,
            app: {
              roles: ['login'],
            },
          },
          { expiresIn: '1h' }
        )
        const link = new URL(
          `auth/login/${token}`,
          this.context.env.SELF_URL
        ).toString()

        // Send verification email
        await this.context.email.sendEmail({
          to: email,
          subject: 'Verify your DataDiaries account',
          html: `
            <h1>Verify your DataDiaries account</h1>
            <p>Click the link below to verify the email address for DataDiaries and log in to your new account. This link will expire after 30 minutes.</p>
            <p><a href="${link}">Verify and log in</a></p>
          `,
        })

        ctx.body = 'ok'
      } finally {
        client.release()
      }
    })

    router.post('/auth/login', async (ctx) => {
      try {
        const request = validateStruct(ctx.request.body, LoginRequestStruct)
        const email = sanitizeEmail(request.email)

        const [user] = await this.context.pg.run(
          (c) =>
            c.sql<IdRecord>`SELECT "id" FROM "users" WHERE email = ${email}`
        )

        if (!user) throw ApiError.badRequest()

        const token = this.context.jwt.sign(
          {
            sub: user.id,
            app: {
              roles: ['login'],
            },
          },
          { expiresIn: '1h' }
        )
        const link = new URL(`auth/login/${token}`, this.context.env.SELF_URL)

        await this.context.email.sendEmail({
          to: email,
          subject: 'Log in to DataDiaries',
          html: `
            <h1>Log in to DataDiaries</h1>
            <p>Click the link below to log in to your DataDiaries account. It will expire in 30 minutes.</p>
            <p><a href="${link}">Log in</a></p>
          `,
        })

        const url = new URL('login?success', this.context.env.CLIENT_URL)
        ctx.redirect(url.toString())
      } catch (error) {
        const url = new URL('login?error', this.context.env.CLIENT_URL)
        ctx.redirect(url.toString())
        return
      }
    })

    router.get('/auth/login/:token', async (ctx) => {
      let userId: number

      try {
        const payload = jwt.verify(
          ctx.params.token,
          this.context.env.JWT_SECRET
        )
        assert(payload, AppTokenStruct)

        if (!payload.app.roles.includes('login')) {
          throw ApiError.badRequest()
        }

        userId = payload.sub
      } catch (error) {
        throw ApiError.badRequest()
      }

      await this.context.pg.run(
        (c) => c.sql`
          UPDATE "users"
          SET "lastLogin" = ${new Date()}
          WHERE id = ${userId}
        `
      )

      const authToken = this.context.jwt.sign({
        sub: userId,
        app: {
          roles: ['user'],
        },
      })
      const link = new URL(
        `login#token=${authToken}`,
        this.context.env.CLIENT_URL
      )

      ctx.redirect(link.toString())
    })

    // TODO: endpoint to update profile
  }
}
