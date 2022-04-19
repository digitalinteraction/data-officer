import { defaulted, Infer, object, string, optional } from 'superstruct'

export const EnvStruct = object({
  SELF_URL: string(),
  CLIENT_URL: string(),
  DATABASE_URL: string(),
  JWT_SECRET: string(),
  NODE_ENV: defaulted(string(), 'production'),
  SENDGRID_API_TOKEN: string(),
  REDIS_URL: optional(string()),
})

export type EnvRecord = Infer<typeof EnvStruct>
