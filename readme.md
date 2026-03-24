# Flier Designer

Flier Designer is a small Node/Express app for previewing and exporting branded 8.5" x 11" flyers as PDFs. It includes a standard flyer editor, an admin version with extra controls, and a bulk export tool that combines community records with background templates to generate ZIPs of PDFs.

## What is in this repo

- A static browser UI served by Express
- Server-side PDF generation powered by Puppeteer
- CSV-backed community/template data for the bulk export flow
- A standalone portable HTML version of the primary flyer layout for handoff to other development teams

## Requirements

- Node.js 20+ recommended
- npm

The app also depends on remote assets:

- background/template images hosted on PerkSpot/CDN URLs
- community logo URLs
- QR images, including QR code generation via `api.qrserver.com` in some flows

## Install and run locally

```bash
npm install
npm start
```

The app starts on `http://localhost:3000`.

## Browser entry points

After starting the server, the landing page at `http://localhost:3000` links to the main browser surfaces:

- `/flier-designer.html`
  Standard flyer editor. Lets you set the community URL, toggle QR code/access code, share the configured URL, and export a PDF.
- `/flier-designer-admin.html`
  Admin-oriented variant with extra fields for logo and creative background URLs.
- `/bulk-export.html`
  Bulk export utility that combines selected communities with selected templates and downloads ZIP files of PDFs.

## Current package scripts

- `npm start`
  Starts the Express server from [server.js](/Users/evanmillerpersonal/Desktop/repositories/flier-designer/server.js).
- `npm run export`
  Runs [generate-pdf.js](/Users/evanmillerpersonal/Desktop/repositories/flier-designer/generate-pdf.js) and saves a local `output.pdf`.
  This is an optional helper and expects the app server to already be running.
  Defaults:
  - flyer URL: `http://127.0.0.1:3000/flier-designer.html`
  - output path: `output.pdf`
  Optional overrides:
  - `FLIER_DESIGNER_URL`
  - `PDF_OUTPUT_PATH`

## How the app works

### Single-flyer flow

- The printable surface is the `#print-page` element in the designer pages.
- [public/script.js](/Users/evanmillerpersonal/Desktop/repositories/flier-designer/public/script.js) updates the DOM in the browser and syncs the current state into the page URL.
- Clicking `Export as PDF` calls `/generate-pdf` with the current flyer values in the query string.
- [server.js](/Users/evanmillerpersonal/Desktop/repositories/flier-designer/server.js) opens `/flier-designer.html` in Puppeteer, applies the requested values, waits for images to load, hides non-print content, and returns a Letter-sized PDF.

### Bulk export flow

- [public/bulk-export.js](/Users/evanmillerpersonal/Desktop/repositories/flier-designer/public/bulk-export.js) loads communities and template URLs from CSV files.
- Users pick one or more communities and one or more templates.
- The browser posts those selections to `/api/bulk-generate`.
- The server renders one PDF per community/template combination and streams the results back as a ZIP archive.

## Data and template files

- [data/communities.csv](/Users/evanmillerpersonal/Desktop/repositories/flier-designer/data/communities.csv)
  Community IDs, URL aliases, and access codes used by the bulk exporter.
- [templates/templates.csv](/Users/evanmillerpersonal/Desktop/repositories/flier-designer/templates/templates.csv)
  Background/template image URLs shown in the bulk exporter.
- `templates/`
  Also stores uploaded template images from the admin/bulk tooling.

## Portable flyer artifact

A standalone copy of the primary flyer layout is included for reuse outside this app:

- [portable/primary-letter-flier/index.html](/Users/evanmillerpersonal/Desktop/repositories/flier-designer/portable/primary-letter-flier/index.html)

Properties of this file:

- no JavaScript
- no dynamic editor controls
- inline `<style>` only
- opens directly from disk with `file://`
- uses a hardcoded background asset URL
- preserves the current sample logo, URL text, access code, and QR image from the primary flyer layout

This file is intended as a portable handoff artifact, not as a shared runtime template for the app.

## Docker

A Dockerfile is included for containerized local runs or deployment.

Example:

```bash
docker build -t flier-designer .
docker run --rm -p 3000:3000 flier-designer
```

Then open `http://localhost:3000`.

## Notes and caveats

- The root landing page is only a launcher page. It is not the printable flyer.
- PDF generation relies on Chromium via Puppeteer and on externally hosted images being reachable.
- Bulk export can take time for larger selections because every community/template combination is rendered into a separate PDF.
- Uploaded template URLs are appended to `templates/templates.csv`; there is no deduplication or admin/auth layer in this prototype.
