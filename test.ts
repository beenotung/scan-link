import { closeBrowser, get404Report, scanAndFollow } from './src/scanner'

async function main() {
  let entryUrl = 'http://localhost:8200/'
  await scanAndFollow({ entryUrl })
  await closeBrowser()
  let report = get404Report()
  console.log(report)
}
main().catch(e => console.error(e))
