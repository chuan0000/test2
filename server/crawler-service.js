import express from 'express';
import { chromium } from 'playwright';

const app = express();
const PORT = process.env.CRAWLER_PORT || 3001;

app.use(express.json({ limit: '10mb' }));

// Enable CORS for local Vite dev server
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'playwright-crawler-service',
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/playwright/scrape
 * Body: {
 *   url: string,
 *   waitForSelector?: string,
 *   timeout?: number, // ms, default 25000
 *   extractMode?: 'markdown' | 'text' | 'html'
 * }
 */
app.post('/api/playwright/scrape', async (req, res) => {
  const { url, waitForSelector, timeout = 25000, extractMode = 'text' } = req.body;

  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return res.status(400).json({
      success: false,
      error: '無效的 URL，請提供包含 http:// 或 https:// 的完整網址',
    });
  }

  let browser = null;
  const startTime = Date.now();

  try {
    console.log(`[Playwright Service] Starting scrape for URL: ${url}`);

    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
      ],
    });

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'zh-TW',
    });

    const page = await context.newPage();

    // Navigate with safe domcontentloaded wait
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout,
    });

    // If custom selector specified, wait for it
    if (waitForSelector) {
      try {
        await page.waitForSelector(waitForSelector, { timeout: 5000 });
      } catch {
        console.warn(`[Playwright Service] Selector ${waitForSelector} not found within 5s, proceeding with current DOM.`);
      }
    } else {
      // Allow lazy scripts 1s to execute
      await page.waitForTimeout(1000);
    }

    // Extract structured contents directly from the DOM
    const result = await page.evaluate(() => {
      // Remove noise elements
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

      // Headings
      const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
        .map((h) => ({
          level: h.tagName.toLowerCase(),
          text: (h.textContent || '').trim(),
        }))
        .filter((h) => h.text.length > 0)
        .slice(0, 15);

      // Paragraphs & Lists
      const paragraphs = Array.from(document.querySelectorAll('article p, main p, p, li'))
        .map((p) => (p.textContent || '').trim())
        .filter((txt) => txt.length > 20 && !txt.includes('Cookies') && !txt.includes('隱私權'))
        .slice(0, 20);

      // Raw text content
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
        rawText: bodyText.slice(0, 12000), // Cap payload size
      };
    });

    const duration = Date.now() - startTime;
    console.log(`[Playwright Service] Scrape completed in ${duration}ms for ${url}`);

    return res.json({
      success: true,
      data: {
        url,
        title: result.title || url,
        description: result.description,
        headings: result.headings,
        paragraphs: result.paragraphs,
        text: result.rawText,
        scrapedAt: new Date().toISOString(),
        durationMs: duration,
      },
    });
  } catch (error) {
    console.error(`[Playwright Service] Error scraping ${url}:`, error);
    return res.status(500).json({
      success: false,
      error: `Playwright 深度擷取失敗: ${error.message || '連線逾時或目標網站限制存取'}`,
    });
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
});

// Start service
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Playwright Service] Microservice running on port ${PORT}`);
});
