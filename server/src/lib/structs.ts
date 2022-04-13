import { defaulted, Infer, type, string } from 'superstruct'

export const EnvStruct = type({
  SELF_URL: string(),
  CLIENT_URL: string(),
  DATABASE_URL: string(),
  JWT_SECRET: string(),
  NODE_ENV: defaulted(string(), 'production'),
  SENDGRID_API_TOKEN: string(),
})

export type EnvRecord = Infer<typeof EnvStruct>
