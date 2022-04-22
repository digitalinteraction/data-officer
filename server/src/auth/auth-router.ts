import cron from 'cron-parser'
import {
  assert,
  boolean,
  Infer,
  nullable,
  object,
  refine,
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
  AppRoles,
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

const cronExpression = () =>
  refine(string(), 'cron expression', (value) => {
    try {
      cron.parseExpression(value)
      return true
    } catch (_error) {
      return false
    }
  })

const UserRequestStruct = object({
  fullName: string(),
  email: string(),
  phoneNumber: nullable(string()),
  reminderSchedule: cronExpression(),
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

const VerifySmsStruct = object({
  phoneNumber: string(),
  token: string(),
})

function sanitizeEmail(input: string) {
  return input.trim().toLowerCase()
}

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

  async sendSmsVerification(
    client: PostgresClient,
    user: number,
    phoneNumber: string
  ) {
    const token = this.context.jwt.sign({
      sub: user,
      app: { roles: [AppRoles.verifySms] },
    })

    const url = new URL('auth/verify/sms', this.context.env.SELF_URL)
    url.searchParams.set('phoneNumber', phoneNumber)
    url.searchParams.set('token', token)

    const link = await this.context.links.createLink(client, url)
    const shortLink = this.context.links.getLinkUrl(link)

    await this.context.sms.sendSms({
      to: phoneNumber,
      body: `Please verify your phone number to recive DataDiaries reminders. ${shortLink}`,
    })
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
          // Don't update the user because the requester hasn't proven who they are
          // MVP — they'll have to use the update profile instead
        } else {
          // Create a new user
          const [newUser] = await client.sql<IdRecord>`
            INSERT INTO "users" ("fullName", "email", "reminderSchedule", "reminders")
            VALUES (${request.fullName}, ${email}, ${request.reminderSchedule}, ${request.reminders})
            RETURNING "id"
          `
          userId = newUser.id
        }

        // Generate a login url for the client
        const token = this.context.jwt.sign(
          {
            sub: userId,
            app: { roles: [AppRoles.login] },
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

        // Trigger an sms verification if they sent a phone number
        if (request.phoneNumber) {
          await this.sendSmsVerification(client, userId, request.phoneNumber)
        }

        ctx.body = 'ok'
      } finally {
        client.release()
      }
    })

    router.post('/auth/login', async (ctx) => {
      try {
        const request = validateStruct(ctx.request.body, LoginRequestStruct)
        const email = sanitizeEmail(request.email)

        // Find the user in question
        const [user] = await this.context.pg.run(
          (c) =>
            c.sql<IdRecord>`SELECT "id" FROM "users" WHERE email = ${email}`
        )

        if (!user) throw ApiError.badRequest()

        // Generate a login url for the client
        const token = this.context.jwt.sign(
          {
            sub: user.id,
            app: { roles: [AppRoles.login] },
          },
          { expiresIn: '1h' }
        )
        const link = new URL(`auth/login/${token}`, this.context.env.SELF_URL)

        // Send the verification email with their login link in it
        await this.context.email.sendEmail({
          to: email,
          subject: 'Log in to DataDiaries',
          html: `
            <h1>Log in to DataDiaries</h1>
            <p>Click the link below to log in to your DataDiaries account. It will expire in 30 minutes.</p>
            <p><a href="${link}">Log in</a></p>
          `,
        })

        // Redirect the user back to the login page with success
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
        // Verify the token
        const payload = jwt.verify(
          ctx.params.token,
          this.context.env.JWT_SECRET
        )
        assert(payload, AppTokenStruct)

        if (!payload.app.roles.includes(AppRoles.login)) {
          throw ApiError.badRequest()
        }

        userId = payload.sub
      } catch (_error) {
        const link = new URL('bad-login', this.context.env.CLIENT_URL)
        ctx.redirect(link.toString())
        return
      }

      // Update the 'lastLogin' field on the user
      await this.context.pg.run(
        (c) => c.sql`
          UPDATE "users"
          SET "lastLogin" = ${new Date()}
          WHERE id = ${userId}
        `
      )

      // Generate a login link for the client that takes them to their entries
      const authToken = this.context.jwt.sign({
        sub: userId,
        app: { roles: [AppRoles.user] },
      })
      const params = new URLSearchParams({
        token: authToken,
        next: '/entries',
      })
      const link = new URL(`#${params.toString()}`, this.context.env.CLIENT_URL)

      ctx.redirect(link.toString())
    })

    router.get('/auth/verify/sms', async (ctx) => {
      const { phoneNumber, token } = validateStruct(
        ctx.request.query,
        VerifySmsStruct
      )

      // Start building the link to return them to
      const location = new URL('verify-sms', this.context.env.CLIENT_URL)

      try {
        // Check the token passed is authentic
        const payload = this.context.jwt.verify(token)
        if (!payload || !payload.app.roles.includes(AppRoles.verifySms)) {
          throw new Error('Invalid token')
        }

        // Update the user's phone number
        await this.context.pg.run(
          (client) => client.sql`
            UPDATE "users"
            SET "phoneNumber" = ${phoneNumber}
            WHERE "id" = ${payload.sub}
          `
        )

        location.searchParams.set('success', '')
      } catch (error) {
        // If something went wrong, redirect the user to an error page
        console.error('Failed to validate phone nuber')
        console.error(error)
        location.searchParams.set('error', '')
      } finally {
        ctx.redirect(location.toString())
      }
    })

    // TODO: endpoint to update profile
  }
}
