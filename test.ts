import { scanAndFollow } from './src/scanner'

async function main() {
  let entryUrl = 'http://localhost:8200/'
  await scanAndFollow({
    entryUrl,
    report_404_stats: true,
    export_404_csv_file: '404.csv',
  })
}
main().catch(e => console.error(e))
