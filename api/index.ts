// FUCK VERCEL
import type { VercelRequest, VercelResponse } from '@vercel/node'
import app from '../src/server'

export default async (req: VercelRequest, res: VercelResponse) => {
  await app.ready() // Garante que o Fastify esteja pronto
  app.server.emit('request', req, res)
}
