import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  createUserSchema,
  type LoginInput,
  type CreateUserInput,
} from './user.schema'
import app from '../../server'
import { db } from '../../db'
import bcrypt from 'bcrypt'
import { encounters, users, wallies, wallyRoles } from '../../db/schema'
import { unknown } from 'zod'
import { desc, eq, or, sql } from 'drizzle-orm'

export async function createUser(req: FastifyRequest, reply: FastifyReply) {
  const parts = req.parts()
  const userData: Partial<CreateUserInput> = {}
  let profilePicture: Buffer | null = null

  for await (const part of parts) {
    console.log(part)
    if (part.type === 'file' && part.fieldname === 'profilePicture') {
      profilePicture = await part.toBuffer()
    } else if (part.type === 'field') {
      userData[part.fieldname as keyof CreateUserInput] = part.value as string
    }
  }

  if (!profilePicture) {
    return reply
      .code(400)
      .send({ error: 'Profile picture could not be created.' })
  }

  const parsedUser = createUserSchema.parse(userData)

  const { email, name, password, username } = parsedUser

  const saltRounds = 10
  const hashedPassword = await bcrypt.hash(password, saltRounds)

  const userResult = await db
    .insert(users)
    .values({
      name,
      password: hashedPassword,
      email,
      username,
    })
    .returning()

  const user = userResult[0]

  const { supabase } = app
  const { error } = await supabase.storage
    .from('spot.it')
    .upload(`${user.id}.jpg`, profilePicture, { contentType: 'image/jpg' })

  if (error) {
    console.error(error)
    return reply.code(500).send({ error: 'Something went wrong.' })
  }

  const { publicURL } = await supabase.storage
    .from('spot.it')
    .getPublicUrl(`${user.id}.jpg`)

  await db
    .update(users)
    .set({
      profilePicture: publicURL,
    })
    .where(eq(users.id, user.id))

  return reply.code(201).send({
    message: 'User created succesfully.',
    user: { ...user, password: unknown },
  })
}

export async function login(
  req: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply
) {
  const { identifier, password } = req.body

  const userResult = await db
    .select()
    .from(users)
    .where(or(eq(users.email, identifier), eq(users.username, identifier)))

  const user = userResult[0]

  const isMatch = user && (await bcrypt.compare(password, user.password))

  if (!user || !isMatch) {
    return reply.code(401).send({
      message: 'Invalid email or password',
    })
  }

  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
  }

  const token = req.jwt.sign(payload)
  reply.setCookie('access_token', token, {
    path: '/',
    httpOnly: true,
    secure: true,
  })

  return { accessToken: token }
}

export async function getUserDetails(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.user

  const encountersDetails = await db.$with('encounters_details').as(
    db
      .select({
        id: encounters.id,
        userId: encounters.userId,
        occuredAt: encounters.occuredAt,
        encounterPicture: encounters.encounterPicture,
        wally: sql /*sql*/`
          JSON_BUILD_OBJECT(
            'id', ${wallies.id},
            'name', ${wallies.name},
            'role', ${wallyRoles.role}
          )
        `.as('wally'),
      })
      .from(encounters)
      .leftJoin(wallies, eq(encounters.wallyId, wallies.id))
      .leftJoin(wallyRoles, eq(wallies.roleId, wallyRoles.id))
  )

  const userEncounters = await db.$with('user_encounters').as(
    db
      .select({
        userId: encountersDetails.userId,
        encounters: sql /*sql*/`
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', ${encountersDetails.id},
                'occuredAt', ${encountersDetails.occuredAt},
                'wally', ${encountersDetails.wally}
              )
            ),
            '[]'::json
          )
        `.as('encounters'),
      })
      .from(encountersDetails)
      .where(eq(encountersDetails.userId, id))
      .groupBy(encountersDetails.userId)
  )

  const userResult = await db
    .with(encountersDetails, userEncounters)
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      username: users.username,
      profilePicture: users.profilePicture,
      score: sql<number> /*sql*/`${users.score}::int`.as('score'),
      encounters: sql /*sql*/`
        COALESCE(${userEncounters.encounters}, '[]'::json)
      `.as('encounters'),
    })
    .from(users)
    .leftJoin(userEncounters, eq(userEncounters.userId, users.id))
    .where(eq(users.id, id))

  const user = userResult[0]

  if (!user) {
    return reply.code(404).send({ error: 'User not found.' })
  }

  return reply.code(200).send(user)
}

export async function getRank(_: FastifyRequest, reply: FastifyReply) {
  const usersResult = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      profilePicture: users.profilePicture,
      score: sql<number> /*sql*/`${users.score}::int`.as('score'),
    })
    .from(users)
    .orderBy(desc(users.score))

  return reply.code(200).send(usersResult)
}
