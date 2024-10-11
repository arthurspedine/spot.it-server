import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { client, db } from '.'

migrate(db, { migrationsFolder: '.migrations' }).then(() => {
  client.end()
})
