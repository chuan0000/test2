import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

function playwrightCrawlerPlugin(): Plugin {
  return {
    name: 'playwright-crawler-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/playwright/scrape' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { url, waitForSelector, timeout = 25000 } = JSON.parse(body || '{}');
              if (!url || typeof url !== 'string' || !url.startsWith('http')) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, error: '請提供有效的網址 (包含 http:// 或 https://)' }));
              }

              const { chromium } = await import('playwright');
              const browser = await chromium.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
              });

              try {
                const context = await browser.newContext({
                  userAgent:
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                  viewport: { width: 1280, height: 800 },
                  locale: 'zh-TW',
                });
                const page = await context.newPage();

                await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
                if (waitForSelector) {
                  await page.waitForSelector(waitForSelector, { timeout: 5000 }).catch(() => {});
                } else {
                  await page.waitForTimeout(1000);
                }

                const result = await page.evaluate(() => {
                  const scripts = document.querySelectorAll('script, style, noscript, nav, footer, iframe, svg');
                  scripts.forEach((el) => el.remove());

                  const title =
                    document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                    document.title ||
                    '';
                  const description =
                    document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                    document.querySelector('meta[name="description"]')?.getAttribute('content') ||
                    '';

                  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
                    .map((h) => ({ level: h.tagName.toLowerCase(), text: (h.textContent || '').trim() }))
                    .filter((h) => h.text.length > 0)
                    .slice(0, 15);

                  const paragraphs = Array.from(document.querySelectorAll('article p, main p, p, li'))
                    .map((p) => (p.textContent || '').trim())
                    .filter((txt) => txt.length > 20 && !txt.includes('Cookies') && !txt.includes('隱私權'))
                    .slice(0, 20);

                  const bodyText = (document.body.innerText || '')
                    .split('\n')
                    .map((line) => line.trim())
                    .filter((line) => line.length > 0)
                    .join('\n');

                  return {
                    title: title.trim(),
                    description: description.trim(),
                    headings,
                    paragraphs,
                    rawText: bodyText.slice(0, 12000),
                  };
                });

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.end(
                  JSON.stringify({
                    success: true,
                    data: {
                      url,
                      title: result.title || url,
                      description: result.description,
                      headings: result.headings,
                      paragraphs: result.paragraphs,
                      text: result.rawText,
                      scrapedAt: new Date().toISOString(),
                    },
                  })
                );
              } finally {
                await browser.close().catch(() => {});
              }
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(
                JSON.stringify({
                  success: false,
                  error: `Playwright 深度擷取失敗: ${err.message || '連線逾時或受目標網站限制'}`,
                })
              );
            }
          });
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), playwrightCrawlerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
