import type { JWT } from '@fastify/jwt'

declare module 'fastify' {
  interface FastifyRequest {
    jwt: JWT
  }
  export interface FastifyInstance {
    // Nao gosto disso mas estamos sem tempo
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    authenticate: any
  }
}

type UserPayload = {
  id: string
  email: string
  name: string
  username: string
}
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: UserPayload
  }
}
