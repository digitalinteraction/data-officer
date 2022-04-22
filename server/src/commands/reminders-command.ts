import cron from 'cron-parser'

import {
  AppRoles,
  createDebug,
  EmailService,
  getAppConfig,
  getEnvRecord,
  getPackageJson,
  JwtService,
  PostgresClient,
  PostgresService,
  SmsService,
} from '../lib/module.js'
import { LinksService } from '../links/links-service.js'

const debug = createDebug('app:command:reminders')

interface UserToRemind {
  id: number
  fullName: string
  email: string
  phoneNumber: string | null
  reminderSchedule: string
  reminders: Record<string, unknown>
  lastReminder: Date | null
}
interface NewReminderRecord {
  type: 'sms' | 'email'
  user: number
  link: number
}

export interface RemindersCommand {
  dryRun: boolean
}

export async function remindersCommand(options: RemindersCommand) {
  debug('start dryRun=%o', options.dryRun)

  const env = getEnvRecord()
  const config = getAppConfig()
  const pg = new PostgresService({ connectionString: env.DATABASE_URL })
  const email = new EmailService({
    ...config.email,
    apiKey: env.SENDGRID_API_TOKEN,
  })
  const jwt = new JwtService({
    ...config.jwt,
    secretKey: env.JWT_SECRET,
  })
  const links = new LinksService({
    baseUrl: env.SELF_URL,
  })
  const sms = new SmsService({
    ...config.sms,
    authToken: env.TWILIO_AUTH_TOKEN,
    accountSid: env.TWILIO_ACCOUNT_SID,
  })

  const client = await pg.getClient()

  async function createReminder(
    type: 'email' | 'sms',
    userId: number,
    authToken: string
  ) {
    const link = await links.createLink(client, '')
    const reminder = await createReminderRecord(client, {
      type: type,
      user: userId,
      link: link.id,
    })

    await links.updateLink(
      client,
      link.id,
      getReminderUrl(reminder.id, authToken, env.CLIENT_URL).toString()
    )
    const shortLink = links.getLinkUrl(link)

    return { link, reminder, shortLink }
  }

  try {
    debug('fetching users')
    const users = await client.sql<UserToRemind>`
      SELECT
        "id", "fullName", "email", "phoneNumber", "reminderSchedule", "reminders",
        "lastReminder", "lastLogin"
      FROM "users"
      WHERE
        "lastLogin" IS NOT NULL
        AND "reminderSchedule" IS NOT NULL
    `

    for (const user of users) {
      const nextReminder = getLastReminder(user.reminderSchedule)
      const lastReminded = user.lastReminder ?? new Date(0)

      if (
        !nextReminder ||
        nextReminder.getTime() <= lastReminded.getTime() ||
        (typeof user.reminders !== 'object' && user.reminders !== null)
      ) {
        debug('skipping user=%o', user.id)
        continue
      }

      debug('reminding user=%o', user.id)

      const authToken = jwt.sign(
        {
          sub: user.id,
          app: { roles: [AppRoles.user] },
        },
        { expiresIn: '7d' }
      )

      // TODO: handle the expiry case on the front-end

      if (user.reminders?.email === true) {
        debug('sending email to %o', user.email)
        const { shortLink } = await createReminder('email', user.id, authToken)

        if (options.dryRun) {
          console.log('email=%o link=', user.email, shortLink)
        } else {
          await email.sendEmail({
            to: user.email,
            subject: 'Fill in your DataDiary',
            html: `
              <p>Hi ${user.fullName},</p>
              <p>This email is a reminder to fill in your DataDiary, this link will take you there and log you in: <a href="${shortLink}">Fill in my diary</a>.<p>
              <p>Thanks,<br>The DataDiaries team</p>
            `,
          })
        }
      }
      if (user.reminders?.sms === true && user.phoneNumber) {
        debug('sending sms to %o', user.phoneNumber)
        const { shortLink } = await createReminder('sms', user.id, authToken)

        if (options.dryRun) {
          console.log('sms=%o link=%o', user.phoneNumber, shortLink)
        } else {
          await sms.sendSms({
            to: user.phoneNumber,
            body: `Please fill in your DataDiary, this link will take you there and log you in: ${shortLink}`,
          })
        }
      }

      if (!options.dryRun) {
        await client.sql`
          UPDATE "users"
          SET "lastReminder" = ${new Date()}
          WHERE "id" = ${user.id}
        `
      }
    }
  } finally {
    client.release()
  }

  await pg.close()
}

function getReminderUrl(
  reminder: number,
  authToken: string,
  clientUrl: string
) {
  const authParams = new URLSearchParams({
    token: authToken,
    next: `/new-entry?reminder=${reminder}`,
  })

  const url = new URL('new-entry', clientUrl)
  url.searchParams.set('reminder', reminder.toString())
  url.hash = authParams.toString()
  return url
}

function getLastReminder(expression: string) {
  try {
    return cron.parseExpression(expression).prev().toDate()
  } catch (error) {
    console.error('Invalid cron expression: %o', expression)
    return null
  }
}

async function createReminderRecord(
  client: PostgresClient,
  record: NewReminderRecord
) {
  const [reminder] = await client.sql<{ id: number }>`
    INSERT INTO "reminders" ("type", "user", "link")
    VALUES (${record.type}, ${record.user}, ${record.link})
    RETURNING "id"
  `
  return reminder
}
