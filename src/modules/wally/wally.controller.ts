import { count, eq, sql } from 'drizzle-orm'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { db } from '../../db'
import { encounters, wallies, wallyRoles } from '../../db/schema'
import app from '../../server'
import {
  type CreateWallyInput,
  type CreateWallyRoleInput,
  type GetWallyDetailsParams,
  createWallySchema,
} from './wally.schema'

export async function getWallyDetails(
  req: FastifyRequest<{ Params: GetWallyDetailsParams }>,
  reply: FastifyReply
) {
  const { id } = req.params

  const wallyResponse = await db
    .select({
      id: wallies.id,
      name: wallies.name,
      profilePicture: wallies.profilePicture,
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

export async function getWallies(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.user

  const encountersCount = await db.$with('encounters_count').as(
    db
      .select({
        wallyId: encounters.wallyId,
        encountersCount: count(encounters.id).as('encounters_count'),
      })
      .from(encounters)
      .groupBy(encounters.wallyId)
  )

  const walliesResult = await db
    .with(encountersCount)
    .select({
      id: wallies.id,
      name: wallies.name,
      profilePicture: wallies.profilePicture,
      role: sql /*sql*/`
        JSON_BUILD_OBJECT(
            'name', ${wallyRoles.role},
            'scoreMultiplier', ${wallyRoles.scoreMultiplier}
        )
    `.as('role'),
      encounters: sql /*sql*/`
        COALESCE(${encountersCount.encountersCount}::int, 0)
    `.as('encountersCount'),
      hasEncountered: sql /*sql*/`
        EXISTS (
          SELECT 1
          FROM ${encounters}
          WHERE ${encounters.wallyId} = ${wallies.id}
          AND ${encounters.userId} = ${id}
        )
      `.as('hasEncountered'),
    })
    .from(wallies)
    .leftJoin(encountersCount, eq(encountersCount.wallyId, wallies.id))
    .leftJoin(wallyRoles, eq(wallyRoles.id, wallies.roleId))

  return reply.code(200).send(walliesResult)
}

export async function createWally(req: FastifyRequest, reply: FastifyReply) {
  const parts = req.parts()
  const wallyData: Partial<CreateWallyInput> = {}
  let profilePicture: Buffer | null = null

  for await (const part of parts) {
    console.log(part)
    if (part.type === 'file' && part.fieldname === 'profilePicture') {
      profilePicture = await part.toBuffer()
    } else if (part.type === 'field') {
      wallyData[part.fieldname as keyof CreateWallyInput] = part.value as string
    }
  }

  if (!profilePicture) {
    return reply
      .code(400)
      .send({ error: 'Profile picture could not be created.' })
  }

  const parsedWally = createWallySchema.parse(wallyData)

  const { email, name, role } = parsedWally

  const roleResults = await db
    .select()
    .from(wallyRoles)
    .where(eq(wallyRoles.role, role))

  const roleResult = roleResults[0]

  if (!roleResult) {
    return reply.code(404).send({ error: 'Role not found.' })
  }

  const wallyResult = await db
    .insert(wallies)
    .values({
      email,
      name,
      roleId: roleResult.id,
    })
    .returning()

  const wally = wallyResult[0]

  const { supabase } = app
  const { error } = await supabase.storage
    .from('spot.it')
    .upload(`${wally.id}.jpg`, profilePicture, { contentType: 'image/jpg' })

  if (error) {
    console.error(error)
    return reply.code(500).send({ error: 'Something went wrong.' })
  }

  const { publicURL } = await supabase.storage
    .from('spot.it')
    .getPublicUrl(`${wally.id}.jpg`)

  await db
    .update(wallies)
    .set({
      profilePicture: publicURL,
    })
    .where(eq(wallies.id, wally.id))

  return reply.code(201).send({
    message: 'Wally created succesfully.',
    wally: { ...wally },
  })
}

export async function getWallyRoles(req: FastifyRequest, reply: FastifyReply) {
  const wallyRoleResult = await db
    .select({
      id: wallyRoles.id,
      role: wallyRoles.role,
      scoreMultiplier: wallyRoles.scoreMultiplier,
    })
    .from(wallyRoles)

  return reply.code(200).send(wallyRoleResult)
}

export async function createWallyRole(
  req: FastifyRequest<{ Body: CreateWallyRoleInput }>,
  reply: FastifyReply
) {
  const { role, scoreMultiplier } = req.body

  const wallyRoleResult = await db
    .insert(wallyRoles)
    .values({
      role,
      scoreMultiplier: String(scoreMultiplier),
    })
    .returning()

  const wallyRole = wallyRoleResult[0]

  return reply.code(200).send(wallyRole)
}
