import { eq } from 'drizzle-orm'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { db } from '../../db'
import { encounters, users, wallies, wallyRoles } from '../../db/schema'
import { env } from '../../env'
import app from '../../server'
import {
  type RegisterEncounterInput,
  registerEncounterSchema,
} from './encounter.schema'

export async function registerEncounter(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const parts = req.parts()
  const encounterData: Partial<RegisterEncounterInput> = {}
  let encounterPicture: Buffer | null = null

  for await (const part of parts) {
    if (part.type === 'file' && part.fieldname === 'encounterPicture') {
      encounterPicture = await part.toBuffer()
    } else if (part.type === 'field') {
      encounterData[part.fieldname as keyof RegisterEncounterInput] =
        part.value as string
    }
  }

  if (!encounterPicture) {
    return reply
      .code(400)
      .send({ error: 'Profile picture could not be created.' })
  }

  const parsedEncounter = registerEncounterSchema.parse(encounterData)

  const { wallyId } = parsedEncounter
  const { id } = req.user

  const userResult = await db.select().from(users).where(eq(users.id, id))
  const user = userResult[0]

  if (!user) {
    return reply.code(404).send({ message: 'User not found' })
  }

  const wallyResult = await db
    .select({
      id: wallies.id,
      name: wallies.name,
      roleId: wallies.roleId,
      scoreMultiplier: wallyRoles.scoreMultiplier,
    })
    .from(wallies)
    .leftJoin(wallyRoles, eq(wallies.roleId, wallyRoles.id))
    .leftJoin(encounters, eq(wallies.id, encounters.wallyId))
    .where(eq(wallies.id, wallyId))
  const wally = wallyResult[0]

  if (!wally) {
    return reply.code(404).send({ message: 'Wally not found' })
  }

  const wallyEncountersResult = await db
    .select()
    .from(encounters)
    .where(eq(encounters.wallyId, wally.id))

  const hasEncounter = wallyEncountersResult[0]

  try {
    const { encounter } = await db.transaction(async tx => {
      const encounterInsert = await tx
        .insert(encounters)
        .values({
          userId: id,
          wallyId: wallyId,
        })
        .returning()

      const encounter = encounterInsert[0]

      const { supabase } = app
      const { error } = await supabase.storage
        .from('spot.it')
        .upload(`${encounter.id}.jpg`, encounterPicture, {
          contentType: 'image/jpg',
        })

      if (error) {
        throw new Error('Something went wrong.')
      }

      const request = await fetch(`${env.AI_URL}/validate-encounter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          wallyId: wally.id,
          encounterId: encounter.id,
        }),
      })

      if (request.status === 400) {
        await supabase.storage.from('spot.it').remove([`${encounter.id}.jpg`])
        reply.code(400).send({ error: 'Invalid encounter.' })
        return tx.rollback()
      }

      if (request.status === 404) {
        await supabase.storage.from('spot.it').remove([`${encounter.id}.jpg`])
        reply.code(404).send({ error: 'Invalid images.' })
        return tx.rollback()
      }

      if (request.status === 500) {
        await supabase.storage.from('spot.it').remove([`${encounter.id}.jpg`])
        reply.code(500).send({ error: 'Something went wrong.' })
        return tx.rollback()
      }

      const { publicURL } = await supabase.storage
        .from('spot.it')
        .getPublicUrl(`${encounter.id}.jpg`)

      await tx
        .update(encounters)
        .set({ encounterPicture: publicURL })
        .where(eq(encounters.id, encounter.id))

      return { encounter }
    })

    await db
      .update(users)
      .set({
        score: String(
          (Number(user.score) || 0) +
            1 * Number(wally.scoreMultiplier ?? 0) *
            (hasEncounter ? 1 : 2)
        ),
      })
      .where(eq(users.id, user.id))

    return reply.code(200).send(encounter)
  } catch (error) {
    console.error(error)
    return reply
  }
}
