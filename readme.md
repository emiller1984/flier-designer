# PDF Export Demo

This is a prototype tool that lets users customize a flier in the browser and export it as an 8.5x11" PDF using Puppeteer.

## ✨ Features

- Live preview and editing of:
  - Access Code
  - Community logo
  - Destination URL (both text + link)
  - QR Code (change or hide)
- Consistent PDF output regardless of OS or browser
- Bootstrap 4.6 + jQuery front-end
- Simple local Node.js + Express server for export

## 📁 File Structure

pdf-export-demo/
├── public/              # HTML, CSS, JS for the client UI
│   ├── index.html       # Main flier UI
│   ├── script.js        # Interactivity and export logic
│   └── styles.css       # Print and screen styles
├── dist/                # Your custom Bootstrap build
│   └── css/
├── server.js            # Node server w/ Puppeteer export logic
├── package.json
└── README.md


## 🚀 Getting Started

### 1. Install dependencies

npm install

### 2. Start the local server

node server.js

* Then open your browser to:

http://localhost:3000

### 3. Customize and Export

* Use the UI to edit the access code, community ID (logo), URL, and QR code
* Click Export as PDF to download a print-ready PDF of your flier