import { config } from 'dotenv'
import { ask } from 'npm-init-helper'
import { scanAndFollow } from './scanner'

export async function main() {
  config()

  let entryUrl = process.env.SITE_DIR
  if (entryUrl) {
    console.log('auto loaded SITE_DIR from env as entryUrl.')
  } else {
    entryUrl = await ask('entryUrl: ')
  }
  if (!entryUrl) {
    console.error('Error: missing entryUrl')
    process.exit(1)
  }

  let origins = process.env.ORIGINS
  if (origins) {
    console.log('auto loaded ORIGINS from env')
  } else {
    let origin = new URL(entryUrl).origin
    origins =
      (await ask(
        `origins (default "${origin}", multiple origins can be delimited by common ","): `,
      )) || origin
  }

  let csv_file = process.env['404_CSV_FILE']
  if (csv_file) {
    console.log('auto loaded path of CSV file to be saved from env')
  } else {
    csv_file = (await ask('404_CSV_FILE (default "404.csv"): ')) || '404.csv'
  }

  await scanAndFollow({
    entryUrl: entryUrl,
    origins: origins.split(',').map(origin => origin.trim()),
    report_404_stats: true,
    export_404_csv_file: csv_file,
    close_browser: true,
  })
}
