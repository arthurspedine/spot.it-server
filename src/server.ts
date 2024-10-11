import fastify, { type FastifyReply, type FastifyRequest } from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { env } from './env'
import fastifyCors from '@fastify/cors'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fCookie from '@fastify/cookie'
import fjwt, { type FastifyJWT } from '@fastify/jwt'
import { userRoutes } from './modules/user/user.route'
import supabase from 'fastify-supabase'
import { wallyRoutes } from './modules/wally/wally.route'
import { encounterRoutes } from './modules/encounter/encounter.route'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.register(fastifyCors, {
  origin: env.CORS_ORIGINS.split(','),
  credentials: true,
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(fjwt, { secret: env.JWT_SECRET })

app.addHook('preHandler', (req, _, next) => {
  req.jwt = app.jwt
  return next()
})
app.register(fCookie, {
  secret: env.COOKIE_SECRET,
  hook: 'preHandler',
})

app.decorate(
  'authenticate',
  async (req: FastifyRequest, reply: FastifyReply) => {
    const token = req.cookies.access_token

    if (!token) {
      return reply.status(401).send({ message: 'Authentication required' })
    }

    const decoded = req.jwt.verify<FastifyJWT['user']>(token)

    if (!decoded) {
      return reply.status(401).send({ message: 'Invalid token' })
    }

    req.user = decoded
  }
)

app.register(supabase, {
  supabaseKey: env.SUPABASE_KEY,
  supabaseUrl: env.SUPABASE_URL,
})

app.register(fastifySwagger, {
  swagger: {
    consumes: ['application/json'],
    produces: ['application/json'],
    info: {
      title: 'spot.it',
      description: 'Especificações da API para o back-end da spot.it.',
      version: '1.0.0',
    },
  },
  transform: jsonSchemaTransform,
})

app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
})

app.register(userRoutes, { prefix: '/user' })
app.register(wallyRoutes, { prefix: '/wally' })
app.register(encounterRoutes, { prefix: '/encounter' })

async function main() {
  await app.listen({
    port: 3333,
    host: '0.0.0.0',
  })

  console.log('HTTP server running')
}
main()

export default app
