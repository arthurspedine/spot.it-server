import type { FastifyInstance } from 'fastify'
import {
  createUserSchema,
  loginResponseSchema,
  loginSchema,
} from './user.schema'

export async function userRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      schema: {
        tags: ['user'],
        description: 'Get a user details.',
      },
    },
    () => {}
  )

  app.get(
    '/rank',
    {
      schema: {
        tags: ['user'],
        description: 'Get the users rank.',
      },
    },
    () => {}
  )

  app.post(
    '/register',
    {
      schema: {
        tags: ['user'],
        description: 'Create a user.',
        body: createUserSchema,
      },
    },
    () => {}
  )

  app.post(
    '/login',
    {
      schema: {
        tags: ['user'],
        description: 'Login a user.',
        body: loginSchema,
        response: { 201: loginResponseSchema },
      },
    },
    () => {}
  )

  app.log.info('user routes registered')
}
