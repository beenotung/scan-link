# scan-link

Scan given website recursively and report 404 links

[![npm Package Version](https://img.shields.io/npm/v/scan-link)](https://www.npmjs.com/package/scan-link)

## Features

- Start scanning from a specified entry URL
- Follow links within specified origins
- Report links that lead to 404 pages
- Export 404 error report as a CSV file

## Installation (optional)

You can install scan-link for version control, or execute it via `npx` without installation.

To install `scan-link`, use npm:

```bash
npm install scan-link
```

You may install it as dev dependency or global dependency based on your preference.

## Usage

You can use `scan-link` from the command line via `npx`. The configuration can be provided via environment variables or interactively during execution.

Usage with dev/global installation:

```bash
npx scan-link
```

Usage without installation:

```bash
npx -y scan-link
```

### Environment Variables

- SITE_URL: The entry URL for the scan
- ORIGINS: A comma-separated list of origins to limit the scan
- REPORT_404_CSV_FILE: Path of the CSV file where the 404 error report will be saved

Example content of `.env` file:

```bash
SITE_DIR=https://example.com
ORIGINS=https://example.com,https://sub.example.com
REPORT_404_CSV_FILE=report.csv
```

### Interactive Usage

If environment variables are not set, `scan-link` will prompt you for the necessary information.

```bash
npx scan-link
```

You will be prompted to setup above variables.

### Example Interactive Session

```bash
$ npx -y scan-link
entryUrl: http://localhost:8200/

Please specified the origins of links to follow.
Multiple origins can be delimited by comma (",").
origins (default: "http://localhost:8200"):
origins: [ 'http://localhost:8200' ]

path of CSV file to be saved (default "404.csv"): report.csv
scanned: 12 | pending: 85 | scanning: http://localhost:8200/about
...
scanned: 119 pages
{
  '404 link count': 1447,
  'total link count': 5036,
  'page count with 404 link': 11,
  'total page count': 119
}
exported 404 pages to file: report.csv
```

## API

For advanced usage, you can import and use the `scanAndFollow()` functions programmatically.

```typescript
export function scanAndFollow(options: {
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
}): Promise<void>

/** @description called by `scanAndFollow()` if `options.report_404_stats` is true */
export function get404Report(options: { origin: string }): {
  '404 link count': number
  'total link count': number
  'page count with 404 link': number
  'total page count': number
}

/** @description called by `scanAndFollow()` if `options.export_404_csv_file` is specified */
export function export404Pages(options: {
  csv_file: string
  origin: string
}): void

/** @description close the lazy loaded browser instance if it's launched */
export function closeBrowser(): Promise<void>
```

## License

This project is licensed with [BSD-2-Clause](./LICENSE)

This is free, libre, and open-source software. It comes down to four essential freedoms [[ref]](https://seirdy.one/2021/01/27/whatsapp-and-the-domestication-of-users.html#fnref:2):

- The freedom to run the program as you wish, for any purpose
- The freedom to study how the program works, and change it so it does your computing as you wish
- The freedom to redistribute copies so you can help others
- The freedom to distribute copies of your modified versions to others
