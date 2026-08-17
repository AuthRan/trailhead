# Trailhead

A local-first job application tracker. Everything lives in the browser — no
backend, no accounts, no network calls. Track roles you are chasing, move them
through the pipeline, and see where applications stall.

## Why

Spreadsheets lose the interaction history and job boards lose the roles you
found elsewhere. Trailhead keeps one record per application with its full
activity trail, and answers the questions that actually matter mid-search:
what is waiting on me, what has gone quiet, and where do I keep dropping out.

## Features

- **List view** — search, filter by stage/tag/remote, sort, multi-select with
  bulk stage changes.
- **Board view** — the same applications as a pipeline board, movable by
  keyboard.
- **Detail drawer** — edit a record inline with an unsaved-changes guard.
- **Stats** — funnel conversion, response rates, and stalled applications.
- **Undo** — destructive actions land in a toast with an undo affordance.
- **CSV export** — download the applications currently on screen, filters and
  all, for a spreadsheet.
- **Backup and restore** — write the whole workspace to a versioned JSON file
  and read it back, with every record validated on the way in.

## Getting started

Requires Node.js 20.19+ (or 22.12+).

```sh
npm install
npm run dev
```

## Using the workspace

- Use **Add application** from the List view to start a new record.
- Press <kbd>/</kbd> anywhere outside a text field to jump to the search box.
- The Board provides Previous and Next controls for moving a card through the
  pipeline without opening its detail drawer.
- Statistics reflect the current filtered result, making it easy to inspect a
  focused part of the job search.
- **Export these as CSV** downloads exactly the rows a filter has left on
  screen; with no filter active it exports the whole workspace. Fields are
  quoted per RFC 4180, so commas, quotes, and multi-line notes survive the
  round trip into a spreadsheet.

## Scripts

| Script              | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Start the Vite dev server                |
| `npm run build`     | Typecheck and produce a production build |
| `npm run preview`   | Serve the production build locally       |
| `npm test`          | Run the Vitest suite once                |
| `npm run test:watch`| Run Vitest in watch mode                 |
| `npm run typecheck` | Typecheck without emitting               |
| `npm run lint`      | Lint with oxlint                         |

## Storage

State is persisted to `localStorage` under a versioned key. Clearing site data
resets the app to its seed applications. The sort column is remembered
separately, so a reload keeps the view you left.

**Back up** writes the whole workspace — not just the filtered rows — to
`trailhead-backup-<date>.json`. The file carries a schema version, and reading
one back validates every record, refusing the import rather than silently
dropping anything it cannot read.
