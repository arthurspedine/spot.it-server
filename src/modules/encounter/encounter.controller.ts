import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  registerEncounterSchema,
  type RegisterEncounterInput,
} from './encounter.schema'
import { db } from '../../db'
import { encounters, users, wallies } from '../../db/schema'
import { eq } from 'drizzle-orm'
import app from '../../server'
import { env } from '../../env'

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
    .select()
    .from(wallies)
    .where(eq(wallies.id, wallyId))
  const wally = wallyResult[0]

  if (!wally) {
    return reply.code(404).send({ message: 'Wally not found' })
  }

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

      return { encounter }
    })

    return reply.code(200).send(encounter)
  } catch (error) {
    console.error(error)
    return reply
  }
}
