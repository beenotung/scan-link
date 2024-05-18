import Knex from 'knex'
import { dirname, join } from 'path'

export let knex = Knex(require('../knexfile').development)

export async function setupDB() {
  let directory = join(dirname(require.resolve('../knexfile')), 'migrations')
  await knex.migrate.latest({
    directory,
  })
}
