import fastifyMultipart from '@fastify/multipart'
import type { FastifyInstance } from 'fastify'
import { getWallyDetailsSchema } from './wally.schema'
import { createWally, getWallies, getWallyDetails } from './wally.controller'

export async function wallyRoutes(app: FastifyInstance) {
  app.register(fastifyMultipart)

  app.get(
    '/:id',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['wally'],
        description: 'Get a wally details.',
        params: getWallyDetailsSchema,
      },
    },
    getWallyDetails
  )

  app.get(
    '/',
    {
      schema: {
        tags: ['wally'],
        description: 'Get all wallies.',
      },
    },
    getWallies
  )

  app.post(
    '/register',
    {
      schema: {
        tags: ['wally'],
        description: 'Create a wally.',
      },
    },
    createWally
  )

  app.post(
    '/role',
    {
      schema: {
        tags: ['wally'],
        description: 'Create a wally role.',
      },
    },
    () => {}
  )

  app.log.info('wally routes registered')
}
