import { defaulted, Infer, object, string, optional } from 'superstruct'

export type EnvRecord = Infer<typeof EnvRecordStruct>
export const EnvRecordStruct = object({
  SELF_URL: string(),
  CLIENT_URL: string(),
  SHARE_URL: optional(string()),
  DATABASE_URL: string(),
  JWT_SECRET: string(),
  NODE_ENV: defaulted(string(), 'production'),
  SENDGRID_API_TOKEN: string(),
  REDIS_URL: optional(string()),
  TWILIO_ACCOUNT_SID: string(),
  TWILIO_AUTH_TOKEN: string(),
})

export type AppConfigRecord = Infer<typeof AppConfigStruct>
export const AppConfigStruct = object({
  email: object({
    fromEmail: string(),
    replyToEmail: string(),
    templateId: string(),
  }),
  jwt: object({
    issuer: string(),
  }),
  sms: object({
    fromNumber: string(),
  }),
})
