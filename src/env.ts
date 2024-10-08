import z from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  CORS_ORIGINS: z.string().url(),
})

export const env = envSchema.parse(process.env)
