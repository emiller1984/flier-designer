const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static('public'));
app.use('/dist', express.static('dist'));

app.get('/generate-pdf', async (req, res) => {
  const browser = await puppeteer.launch({
    headless: 'new', // or true if you're using older Puppeteer
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--single-process',
    ],
  });
  const page = await browser.newPage();

  const code = req.query.code || '';
  const community = req.query.community || '';
  const customUrl = req.query.url || '';
  const qrCode = req.query.qr || '';
  const creativeUrl = req.query.creativeurl || '';

  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0' });

  await page.evaluate((code, community, customUrl, qrCode, creativeUrl) => {
    const el = document.querySelector('.code');
    if (el) el.textContent = code;

    const accessSection = document.querySelector('.access-code-section');
    if (accessSection) {
      accessSection.style.display = code ? 'block' : 'none';
    }

    const logo = document.querySelector('.logo');
    if (logo && community) {
      logo.src = community;
    }

    const urlEl = document.querySelector('.community-url');
    if (urlEl && customUrl) {
      const prefixedUrl = /^https?:\/\//i.test(customUrl) ? customUrl : 'http://' + customUrl;
      urlEl.href = prefixedUrl;
      urlEl.textContent = customUrl.replace(/^https?:\/\//i, '');
    }

    const qr = document.querySelector('.qr-code');
    if (qr) {
      if (qrCode) {
        qr.src = qrCode;
        qr.style.display = 'block';
      } else {
        qr.style.display = 'none';
      }
    }

    const printPage = document.getElementById('print-page');
    if (printPage && creativeUrl) {
      const fullUrl = /^https?:\/\//i.test(creativeUrl)
        ? creativeUrl
        : 'https://' + creativeUrl;
      printPage.style.backgroundImage = `url(${fullUrl})`;
    }
  }, code, community, customUrl, qrCode, creativeUrl);

  // Wait for the updated logo to fully load
  await page.waitForFunction(() => {
    const img = document.querySelector('.logo');
    return img && img.complete && img.naturalHeight !== 0;
  });

  // Wait for the QR code to load if it's visible
  await page.waitForFunction(() => {
    const qr = document.querySelector('.qr-code');
    return !qr || qr.style.display === 'none' || (qr.complete && qr.naturalHeight !== 0);
  });

  // Wait for background image to load if creativeUrl is used
  if (creativeUrl) {
    await page.evaluate(async () => {
      const el = document.getElementById('print-page');
      if (!el) return;

      const style = window.getComputedStyle(el);
      const bg = style.backgroundImage;
      const match = bg.match(/url\("?(.*?)"?\)/);

      if (match && match[1]) {
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.src = match[1];
          img.onload = resolve;
          img.onerror = reject;
        });
      }
    });
  }

  await page.addStyleTag({
    content: `
      body * {
        visibility: hidden !important;
      }
      #print-page, #print-page * {
        visibility: visible !important;
      }
      #print-page {
        position: absolute;
        top: 0;
        left: 0;
      }
    `
  });

  const pdfBuffer = await page.pdf({
    format: 'Letter',
    printBackground: true,
    margin: { top: '0in', right: '0in', bottom: '0in', left: '0in' }
  });

  await browser.close();

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="flier.pdf"',
    'Content-Length': pdfBuffer.length
  });

  res.send(pdfBuffer);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});