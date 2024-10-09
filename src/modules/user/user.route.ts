import type { FastifyInstance } from 'fastify'
import {
  createUserSchema,
  loginResponseSchema,
  loginSchema,
} from './user.schema'
import fastifyMultipart from '@fastify/multipart'
import { createUser, getUserDetails, login } from './user.controller'

export async function userRoutes(app: FastifyInstance) {
  app.register(fastifyMultipart)

  app.get(
    '/',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['user'],
        description: 'Get a user details.',
      },
    },
    getUserDetails
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
      },
    },
    createUser
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
    login
  )

  app.log.info('user routes registered')
}
