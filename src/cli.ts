import { config } from 'dotenv'
import { ask } from 'npm-init-helper'
import { scanAndFollow } from './scanner'

export async function main() {
  config()

  let entryUrl: string | undefined = undefined
  if (process.argv.length == 3 && !process.env.SITE_URL) {
    entryUrl = process.argv[2]
    console.log('loaded entryUrl from argument.')
  }
  if (!entryUrl && process.env.SITE_URL) {
    entryUrl = process.env.SITE_URL
    console.log('auto loaded SITE_URL from env as entryUrl.')
  }
  if (!entryUrl) {
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
    console.log()
    console.log('Please specified the origins of links to follow.')
    console.log('Multiple origins can be delimited by comma (",").')
    origins = (await ask(`origins (default: "${origin}"): `)) || origin
  }
  let origin_list = origins.split(',').map(origin => origin.trim())
  console.log('origins:', origin_list)
  console.log()

  let csv_file = process.env['404_CSV_FILE']
  if (csv_file) {
    console.log('auto loaded path of CSV file to be saved from env')
  } else {
    csv_file = (await ask('404_CSV_FILE (default "404.csv"): ')) || '404.csv'
  }

  await scanAndFollow({
    entryUrl: entryUrl,
    origins: origin_list,
    report_404_stats: true,
    export_404_csv_file: csv_file,
    close_browser: true,
  })
}
