import z from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  CORS_ORIGINS: z.string().url(),
  SUPABASE_KEY: z.string(),
  SUPABASE_URL: z.string().url(),
  JWT_SECRET: z.string(),
  COOKIE_SECRET: z.string(),
})

export const env = envSchema.parse(process.env)
