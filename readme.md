# 🖨️ Flier Designer – PDF Export Tool

This is a prototype web tool that lets users customize a branded flier in the browser and export it as a print-ready 8.5x11" PDF using Puppeteer.

---

## ✨ Features

- **Live Editing:** Users can customize the access code, destination URL, community logo, and QR code
- **Instant PDF Export:** One-click download of the designed flier with consistent layout and assets
- **Preview-Friendly:** Changes update in real-time in the browser
- **Fully Offline-Capable:** Runs locally or deployable to any Node-compatible host

---

## 📁 File Structure

```
flier-designer/
├── public/              # All static assets
│   ├── index.html       # Main HTML flier layout
│   ├── script.js        # jQuery for modal interactions and export logic
│   └── styles.css       # Styling for screen and print
├── dist/                # Custom Bootstrap CSS (not included here)
│   └── css/
├── server.js            # Node/Express app that serves the site and generates PDFs
├── generate-pdf.js      # Standalone script to export a PDF from a running instance
├── Dockerfile           # Used for deployment on platforms like Render
├── package.json         # Node dependencies and start commands
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/PerkSpot/flier-designer.git
cd flier-designer
npm install
```

### 2. Run Locally

```bash
node server.js
```

Then visit:

```
http://localhost:3000
```

### 3. Export a PDF

- Use the on-screen buttons to change access code, URL, logo, or QR code
- Click **Export as PDF** — a file will download instantly with your design

---

## 🔍 How It Works

### `server.js`

- Launches a local Express server on port 3000
- Serves static files from `/public`
- Defines `/generate-pdf` route:
  - Loads the local page using Puppeteer
  - Injects custom values into the layout (code, logo, URL, QR)
  - Waits for images to load
  - Hides everything but `#print-page` before exporting a clean 8.5x11" PDF

### `generate-pdf.js`

- A separate script for exporting a PDF directly (without going through the UI)
- Loads the page at `localhost:8080`, hides non-flier content, and saves a PDF called `output.pdf`
- Good for CLI-based testing

### `script.js`

- Handles all browser interactions with jQuery
- Shows modals when users click buttons to edit the flier
- Updates the DOM immediately with the entered values
- Builds a query string and triggers a hidden request to `/generate-pdf` when "Export as PDF" is clicked

---

## 🔗 Optional URL Parameters

You can control the background image used on the flier by appending a `creativeurl` query parameter to the page URL.

### Syntax

```
http://localhost:3000/?creativeurl=cms.perkspot.com/media/drdfccwd/flier-content-2.png
```

This will set the flier background to:

```
https://cms.perkspot.com/media/drdfccwd/flier-content-2.png
```

If no `creativeurl` is provided, the flier defaults to this background image:

```
https://cms.perkspot.com/media/nnubhrge/flier-content.png
```

This feature makes it easy to share links that pre-load a specific flier design.