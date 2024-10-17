import fastifyMultipart from '@fastify/multipart'
import type { FastifyInstance } from 'fastify'
import {
  createWally,
  createWallyRole,
  getWallies,
  getWallyDetails,
  getWallyRoles,
} from './wally.controller'
import { getWallyDetailsSchema } from './wally.schema'

export async function wallyRoutes(app: FastifyInstance) {
  app.register(fastifyMultipart, {
    limits: {
      files: 1,
      fileSize: 10000000,
    },
  })

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

  app.get(
    '/role',
    {
      schema: {
        tags: ['wally'],
        description: 'Get all wally roles.',
      },
    },
    getWallyRoles
  )

  app.post(
    '/role',
    {
      schema: {
        tags: ['wally'],
        description: 'Create a wally role.',
      },
    },
    createWallyRole
  )

  app.log.info('wally routes registered')
}
