#!/usr/bin/env node
async function main() {
  await require('./dist/src/knex').setupDB()
  await require('./dist/src/cli').main()
}
main()
