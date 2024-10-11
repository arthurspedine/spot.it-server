import type { FastifyInstance } from 'fastify'
import fastifyMultipart from '@fastify/multipart'
import { registerEncounterSchema } from './encounter.schema'
import { registerEncounter } from './encounter.controller'

export async function encounterRoutes(app: FastifyInstance) {
  app.register(fastifyMultipart)

  app.post(
    '/',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['encoutner'],
        description: 'Register an encounter.',
      },
    },
    registerEncounter
  )

  app.log.info('encounter routes registered')
}
