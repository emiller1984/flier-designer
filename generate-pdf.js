const puppeteer = require('puppeteer');

(async () => {
  const flyerUrl = process.env.FLIER_DESIGNER_URL || 'http://127.0.0.1:3000/flier-designer.html';
  const outputPath = process.env.PDF_OUTPUT_PATH || 'output.pdf';
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(flyerUrl, { waitUntil: 'networkidle0' });

    // Only show #print-page
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

  // Force viewport size for consistency
  await page.setViewport({ width: 816, height: 1056 }); // 96dpi * 8.5/11

  await page.pdf({
    path: outputPath,
    format: 'Letter',
    printBackground: true,
    margin: {
      top: '0in',
      right: '0in',
      bottom: '0in',
      left: '0in'
    }
  });

  await browser.close();
  console.log(`PDF saved as ${outputPath}`);
})();
