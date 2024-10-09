import type { FastifyReply, FastifyRequest } from 'fastify'
import type { GetWallyDetailsParams } from './wally.schema'
import { db } from '../../db'
import { wallies, wallyRoles } from '../../db/schema'
import { eq, sql } from 'drizzle-orm'

export async function getWallyDetails(
  req: FastifyRequest<{ Params: GetWallyDetailsParams }>,
  reply: FastifyReply
) {
  const { id } = req.params

  const wallyResponse = await db
    .select({
      id: wallies.id,
      name: wallies.name,
      role: sql /*sql*/`
        JSON_BUILD_OBJECT(
            'name', ${wallyRoles.role},
            'scoreMultiplier', ${wallyRoles.scoreMultiplier}
        )
      `.as('role'),
    })
    .from(wallies)
    .leftJoin(wallyRoles, eq(wallyRoles.id, wallies.roleId))
    .where(eq(wallies.id, id))

  const wally = wallyResponse[0]

  if (!wally) {
    return reply.code(404).send({ error: 'Wally not found.' })
  }

  return reply.code(200).send(wally)
}
