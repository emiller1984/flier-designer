const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Enable JSON parsing for POST bodies
app.use(bodyParser.json());

const upload = multer({
  dest: path.join(__dirname, 'templates'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Serve static files
app.use(express.static('public'));
app.use('/dist', express.static('dist'));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/templates', express.static(path.join(__dirname, 'templates')));

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
      let fullUrl = creativeUrl;
      if (creativeUrl.startsWith('/')) {
        fullUrl = 'http://localhost:3000' + creativeUrl;
      } else if (!creativeUrl.startsWith('http')) {
        fullUrl = 'https://' + creativeUrl;
      }
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

app.post('/api/upload-template', upload.single('template'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const originalName = req.file.originalname;
  const tempPath = req.file.path;
  const targetPath = path.join(__dirname, 'templates', originalName);

  fs.rename(tempPath, targetPath, err => {
    if (err) {
      console.error('Error moving uploaded file:', err);
      return res.status(500).json({ error: 'Upload failed' });
    }

    const relativeUrl = `/templates/${originalName}`;
    const csvPath = path.join(__dirname, 'templates', 'templates.csv');

    fs.readFile(csvPath, 'utf8', (readErr, data) => {
      if (readErr && readErr.code !== 'ENOENT') {
        console.error('Error reading templates.csv:', readErr);
        return res.status(500).json({ error: 'Failed to read template list' });
      }

      const needsNewline = data && !data.endsWith('\n');
      const line = (needsNewline ? '\n' : '') + `${relativeUrl}\n`;

      fs.appendFile(csvPath, line, appendErr => {
        if (appendErr) {
          console.error('Failed to write to templates.csv:', appendErr);
          return res.status(500).json({ error: 'Failed to update template list' });
        }
        return res.json({ success: true, path: relativeUrl });
      });
    });
  });
});

app.post('/api/add-template-url', (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const csvPath = path.join(__dirname, 'templates', 'templates.csv');
  const line = `${url.trim()}\n`;

  fs.appendFile(csvPath, line, err => {
    if (err) {
      console.error('Failed to append template URL:', err);
      return res.status(500).json({ error: 'Failed to write to CSV' });
    }
    return res.json({ success: true });
  });
});


const archiver = require('archiver');

app.post('/api/bulk-generate', async (req, res) => {
  const { communities, templates } = req.body;

  if (!Array.isArray(communities) || !Array.isArray(templates) || !communities.length || !templates.length) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--window-size=1920,1080',
      '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
    ]
  });

  const archive = archiver('zip', { zlib: { level: 9 } });
  res.set({
    'Content-Type': 'application/zip',
    'Content-Disposition': 'attachment; filename="bulk-flier-export.zip"'
  });
  archive.pipe(res);

  for (const community of communities) {
    const communityData = getCommunityById(community);
    if (!communityData) continue;

    for (const template of templates) {
      const page = await browser.newPage();

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
          let fullUrl = creativeUrl;
          if (creativeUrl.startsWith('/')) {
            fullUrl = 'http://localhost:3000' + creativeUrl;
          } else if (!creativeUrl.startsWith('http')) {
            fullUrl = 'https://' + creativeUrl;
          }
          printPage.style.backgroundImage = `url(${fullUrl})`;
        }
      }, communityData.access_code,
         `https://psprods3ep.azureedge.net/cdn.perkspot.com/images/communities/logo_${communityData.id}.png`,
         `${communityData.url_alias}.perkspot.com`,
         `https://api.qrserver.com/v1/create-qr-code/?data=${communityData.url_alias}.perkspot.com&size=200x200`,
         template);

      // Wait for logo to load (timeout 15s, warn if fails)
      try {
        await page.waitForFunction(() => {
          const img = document.querySelector('.logo');
          return img && img.complete && img.naturalHeight !== 0;
        }, { timeout: 15000 });
      } catch {
        console.warn('Logo image timed out for', communityData.url_alias);
      }

      // Wait for QR code if visible (timeout 15s, warn if fails)
      try {
        await page.waitForFunction(() => {
          const qr = document.querySelector('.qr-code');
          return !qr || qr.style.display === 'none' || (qr.complete && qr.naturalHeight !== 0);
        }, { timeout: 15000 });
      } catch {
        console.warn('QR code image timed out for', communityData.url_alias);
      }

      // Wait for background image (timeout 15s, warn if fails)
      try {
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
              setTimeout(resolve, 15000); // fail-safe
            });
          }
        });
      } catch {
        console.warn('Creative image timed out for', communityData.url_alias);
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

      await page.close();

      let bufferToUse = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);

      if (Buffer.isBuffer(bufferToUse)) {
        const filename = `${communityData.url_alias}_${path.basename(template)}`.replace(/[^a-z0-9_.-]/gi, '_');
        archive.append(bufferToUse, { name: filename.replace('.png', '.pdf') });
      } else {
        console.warn(`Skipped PDF for ${communityData.url_alias} + ${template}: invalid or uncastable buffer`);
      }
    }
  }

  await browser.close();
  archive.finalize();

  function getCommunityById(id) {
    try {
      const csvData = fs.readFileSync(path.join(__dirname, 'data', 'communities.csv'), 'utf-8');
      const lines = csvData.trim().split('\n').slice(1);
      for (const line of lines) {
        const [community_id, url_alias, access_code] = line.split(',');
        if (community_id === id) {
          return { id: community_id, url_alias, access_code };
        }
      }
    } catch (err) {
      console.error('Error reading community CSV:', err);
    }
    return null;
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});