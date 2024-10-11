import { createId } from '@paralleldrive/cuid2'
import { numeric, timestamp, text, pgTable } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  score: numeric('score').default('0'),
  profilePicture: text('profile_picture'),
})

export const wallyRoles = pgTable('wally_roles', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  role: text('role').notNull().unique(),
  scoreMultiplier: numeric('score_multiplier').default('1').notNull(),
})

export const wallies = pgTable('wallies', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').$default(() => new Date()),
  roleId: text('role_id')
    .notNull()
    .references(() => wallyRoles.id),
  profilePicture: text('profile_picture'),
})

export const encounters = pgTable('encounters', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  wallyId: text('wally_id')
    .notNull()
    .references(() => wallies.id),
  occuredAt: timestamp('occured_at').$default(() => new Date()),
  encounterPicture: text('encounter_picture'),
})
