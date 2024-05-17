import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('origin'))) {
    await knex.schema.createTable('origin', table => {
      table.increments('id')
      table.text('origin').notNullable().unique()
      table.boolean('skip').nullable()
      table.timestamps(false, true)
    })
  }

  if (!(await knex.schema.hasTable('page'))) {
    await knex.schema.createTable('page', table => {
      table.increments('id')
      table.integer('status').nullable()
      table.text('title').nullable()
      table.text('url').notNullable().unique()
      table.integer('origin_id').unsigned().notNullable().references('origin.id')
      table.timestamps(false, true)
    })
  }

  if (!(await knex.schema.hasTable('link'))) {
    await knex.schema.createTable('link', table => {
      table.increments('id')
      table.text('href').notNullable()
      table.text('text').notNullable()
      table.integer('from_page_id').unsigned().notNullable().references('page.id')
      table.integer('to_page_id').unsigned().notNullable().references('page.id')
      table.timestamps(false, true)
    })
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('link')
  await knex.schema.dropTableIfExists('page')
  await knex.schema.dropTableIfExists('origin')
}
