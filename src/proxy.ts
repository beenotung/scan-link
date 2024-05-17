import { proxySchema } from 'better-sqlite3-proxy'
import { db } from './db'

export type Origin = {
  id?: null | number
  origin: string
  skip: null | boolean
}

export type Page = {
  id?: null | number
  status: null | number
  title: null | string
  url: string
  origin_id: number
  origin?: Origin
}

export type Link = {
  id?: null | number
  href: string
  text: string
  from_page_id: number
  from_page?: Page
  to_page_id: number
  to_page?: Page
}

export type DBProxy = {
  origin: Origin[]
  page: Page[]
  link: Link[]
}

export let proxy = proxySchema<DBProxy>({
  db,
  tableFields: {
    origin: [],
    page: [
      /* foreign references */
      ['origin', { field: 'origin_id', table: 'origin' }],
    ],
    link: [
      /* foreign references */
      ['from_page', { field: 'from_page_id', table: 'page' }],
      ['to_page', { field: 'to_page_id', table: 'page' }],
    ],
  },
})
