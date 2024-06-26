import { Browser, Page, chromium } from 'playwright'
import { find, count } from 'better-sqlite3-proxy'
import { proxy, Page as PageRow, Origin } from './proxy'
import { db } from './db'
import { ProgressCli } from '@beenotung/tslib/progress-cli'
import { writeFileSync } from 'fs'
import { to_csv, json_to_csv } from '@beenotung/tslib/csv'

let browserP: Promise<Browser> | undefined

function getBrowser() {
  if (!browserP) {
    browserP = chromium.launch()
  }
  return browserP
}

/** @description close the lazy loaded browser instance if it's launched */
export async function closeBrowser() {
  if (browserP) {
    let p = browserP.then(browser => browser.close())
    browserP = undefined
    return p
  }
}

let usePage = async <T>(fn: (page: Page) => T | Promise<T>) => {
  let browser = await getBrowser()
  let page = await browser.newPage()
  try {
    return await fn(page)
  } finally {
    await page.close()
  }
}

let origin_cache = Object.create(null) as Record<string, Origin | undefined>

function getOrigin(origin: string): Origin {
  let row = origin_cache[origin]
  if (row) return row

  row = find(proxy.origin, { origin })
  if (!row) {
    let id = proxy.origin.push({ origin, skip: null })
    row = proxy.origin[id]
  }
  origin_cache[origin] = row
  return row
}

type FromPage = {
  url: string
  status: number
  title: string
  origin_id: number
}

function getToPageId(url: string): number {
  let row = find(proxy.page, { url })
  if (row) return row.id!
  return proxy.page.push({
    url,
    status: null,
    title: null,
    origin_id: getOrigin(new URL(url).origin).id!,
  })
}

function storeLink(link: {
  from_page_id: number
  to_page_id: number
  href: string
  text: string
}) {
  let row = find(proxy.link, {
    from_page_id: link.from_page_id,
    to_page_id: link.to_page_id,
  })
  if (!row) return proxy.link.push(link)
  if (row.text != link.text) {
    row.text = link.text
  }
}

type Link = {
  url: string
  href: string
  text: string
}

let storeLinks = (options: {
  from_page: PageRow
  status: number
  title: string
  links: Link[]
}) => {
  let from_page = options.from_page
  if (from_page.status != options.status) {
    from_page.status = options.status
  }
  if (from_page.title != options.title) {
    from_page.title = options.title
  }
  let from_page_id = from_page.id!
  for (let link of options.links) {
    let to_page_id = getToPageId(link.url)
    storeLink({ from_page_id, to_page_id, href: link.href, text: link.text })
  }
}
storeLinks = db.transaction(storeLinks)

async function scanPage(from_page: PageRow) {
  return await usePage(async page => {
    let response = await page.goto(from_page.url, {
      waitUntil: 'domcontentloaded',
    })
    let status = response!.status()
    let title = await page.title()
    let links = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll<HTMLAnchorElement>('a[href]'),
        (a): Link => {
          let url = a.href
          let href = a.getAttribute('href')!
          let text = a.innerText
          return { url, href, text }
        },
      )
    })
    storeLinks({ from_page, status, title, links })
  })
}

let count_pending_pages = db
  .prepare<void[], number>(
    /* sql */ `
select count(*)
from page
inner join origin on origin.id = page.origin_id
where status is null
  and origin.skip = 0
`,
  )
  .pluck()

let get_pending_page_id = db
  .prepare<void[], number>(
    /* sql */ `
select page.id
from page
inner join origin on origin.id = page.origin_id
where status is null
  and origin.skip = 0
limit 1
`,
  )
  .pluck()

export async function scanAndFollow(options: {
  /** @example 'http://localhost:8200/' */
  entryUrl: string
  /** @default same as entryUrl */
  origins?: string[]
  /** @description report stats on 404 pages and links */
  report_404_stats?: boolean
  /** @description specified filename to report 404 links. Skip reporting if not specified. */
  export_404_csv_file?: string
  /**
   * @description auto close browser after all scanning
   * @default true
   */
  close_browser?: boolean
}) {
  let origin = new URL(options.entryUrl).origin
  let origins: string[] = options.origins || [origin]
  let cli = new ProgressCli()
  let i = 0

  // init
  getToPageId(options.entryUrl)
  for (let origin of origins) {
    getOrigin(origin).skip = false
  }

  for (;;) {
    let id = get_pending_page_id.get()
    if (!id) break
    let page = proxy.page[id]
    let n = count_pending_pages.get()!
    cli.update(`scanned: ${i} | pending: ${n} | scanning: ${page.url}`)
    await scanPage(page)
    i++
  }
  cli.update(`scanned: ${i} pages`)
  cli.nextLine()
  if (options.report_404_stats) {
    let report = get404Report({ origin })
    console.log(report)
  }
  if (options.export_404_csv_file) {
    cli.update(
      'exporting 404 pages to file: ' + options.export_404_csv_file + ' ...',
    )
    export404Pages({ csv_file: options.export_404_csv_file, origin })
    cli.update('exported 404 pages to file: ' + options.export_404_csv_file)
    cli.nextLine()
  }
  if (options.close_browser != false) {
    await closeBrowser()
  }
}

let count_404_link = db
  .prepare<{ origin_id: number }, number>(
    /* sql */ `
select count(link.id)
from link
inner join page as from_page on from_page.id = link.from_page_id
inner join page as to_page on to_page.id = link.to_page_id
where to_page.status = 404
  and from_page.origin_id = :origin_id
`,
  )
  .pluck()

let count_all_link = db
  .prepare<{ origin_id: number }, number>(
    /* sql */ `
select count(link.id) from link
inner join page as from_page on from_page.id = link.from_page_id
where from_page.origin_id = :origin_id
`,
  )
  .pluck()

let count_pages_with_404_link = db
  .prepare<{ origin_id: number }, number>(
    /* sql */ `
select count(from_page.id)
from link
inner join page as from_page on from_page.id = link.from_page_id
inner join page as to_page on to_page.id = link.to_page_id
where to_page.status = 404
  and from_page.origin_id = :origin_id
group by from_page.id
`,
  )
  .pluck()

/** @description called by `scanAndFollow()` if `options.report_404_stats` is true */
export function get404Report(options: { origin: string }) {
  let origin_id = getOrigin(options.origin).id!
  return {
    '404 link count': count_404_link.get({ origin_id }) || 0,
    'total link count': count_all_link.get({ origin_id }) || 0,
    'page count with 404 link':
      count_pages_with_404_link.get({ origin_id }) || 0,
    'total page count': count(proxy.page, { origin_id }),
  }
}

let select_404_page = db.prepare<
  { origin_id: number },
  { url: string; text: string; href: string }
>(/* sql */ `
select
  from_page.url
, link.text
, link.href
from link
inner join page as from_page on from_page.id = link.from_page_id
inner join page as to_page on to_page.id = link.to_page_id
where to_page.status = 404
  and from_page.origin_id = :origin_id
`)

/** @description called by `scanAndFollow()` if `options.export_404_csv_file` is specified */
export function export404Pages(options: { csv_file: string; origin: string }) {
  let file = options.csv_file
  let origin_id = getOrigin(options.origin).id!
  let pages = select_404_page.all({ origin_id })
  for (let page of pages) {
    page.text = page.text.trim()
  }
  let csv = to_csv(json_to_csv(pages))
  writeFileSync(file, csv)
}
