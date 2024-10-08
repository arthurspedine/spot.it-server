import fastify from 'fastify'

const app = fastify()

async function main() {
  await app.listen({
    port: 3333,
    host: '0.0.0.0',
  })

  console.log('HTTP server running')
}
main()

export default app
