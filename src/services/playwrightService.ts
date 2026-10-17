/**
 * Playwright Headless Browser Scrape Service
 * 前端呼叫由 Express / Vite 中介層轉發之 Playwright 無頭瀏覽器微服務
 * 端點：POST /api/playwright/scrape
 */

export interface PlaywrightScrapeOptions {
  waitForSelector?: string;
  timeout?: number; // ms, default 30000
  serviceBaseUrl?: string;
}

export interface PlaywrightHeadingItem {
  level: string;
  text: string;
}

export interface PlaywrightScrapeResult {
  success: boolean;
  url: string;
  title: string;
  description?: string;
  headings: PlaywrightHeadingItem[];
  paragraphs: string[];
  text: string;
  scrapedAt: string;
  durationMs?: number;
}

export const DEFAULT_PLAYWRIGHT_URL = 'http://localhost:3001';

export class PlaywrightUnavailableError extends Error {
  isServiceOffline: boolean;
  constructor(message: string, isOffline = true) {
    super(message);
    this.name = 'PlaywrightUnavailableError';
    this.isServiceOffline = isOffline;
  }
}

/**
 * 快速偵測 Playwright 微服務是否在線運作
 */
export async function pingPlaywrightServer(baseUrl?: string): Promise<boolean> {
  const url = (baseUrl || (import.meta as any).env?.VITE_PLAYWRIGHT_SERVICE_URL || DEFAULT_PLAYWRIGHT_URL).replace(/\/$/, '');
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${url}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    // Also try local dev proxy /api/health
    try {
      const res = await fetch('/api/health');
      return res.ok;
    } catch {
      return false;
    }
  }
}

/**
 * 專屬爬蟲函式：呼叫本機/後端 Playwright 轉發路由執行無頭瀏覽器渲染爬取
 * 預設連線端點：http://localhost:3001 或本機代理 /api/playwright/scrape
 * @param url 目標網頁 URL (需包含 http/https)
 * @param options 選用微服務參數
 */
export async function scrapeWithPlaywright(
  url: string,
  options?: PlaywrightScrapeOptions
): Promise<PlaywrightScrapeResult> {
  const cleanUrl = (url || '').trim();

  // 邊界條件檢查
  if (!cleanUrl) {
    throw new Error('請輸入欲抓取的網址 (URL)');
  }
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    throw new Error('網址格式錯誤，請提供完整包含 http:// 或 https:// 的 URL');
  }

  // 決定目標 endpoint，預設為 http://localhost:3001，若未配置或選用時可 fallback 至同源 proxy
  const configuredBaseUrl =
    options?.serviceBaseUrl ||
    (import.meta as any).env?.VITE_PLAYWRIGHT_SERVICE_URL ||
    DEFAULT_PLAYWRIGHT_URL;

  const endpointsToTry = [
    `${configuredBaseUrl.replace(/\/$/, '')}/api/playwright/scrape`,
    '/api/playwright/scrape',
  ];

  const startTime = Date.now();
  let lastError: any = null;

  for (const endpoint of endpointsToTry) {
    try {
      console.info(`[Playwright Service] 嘗試發起深度渲染爬取 -> ${cleanUrl} (端點: ${endpoint})`);

      const controller = new AbortController();
      const timeoutMs = options?.timeout || 30000;
      const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: cleanUrl,
          waitForSelector: options?.waitForSelector,
          timeout: options?.timeout || 25000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutTimer);

      if (!response.ok) {
        let errorMsg = `Playwright 服務回應錯誤 (HTTP ${response.status})`;
        try {
          const errJson = await response.json();
          if (errJson?.error) errorMsg = errJson.error;
        } catch {
          const errTxt = await response.text().catch(() => '');
          if (errTxt) errorMsg += ` - ${errTxt.slice(0, 150)}`;
        }
        throw new Error(errorMsg);
      }

      const json = await response.json();
      const duration = Date.now() - startTime;

      if (!json.success || !json.data) {
        throw new Error(json.error || 'Playwright 執行完成但未回傳有效的頁面數據');
      }

      const data = json.data;
      console.info(
        `[Playwright Service] 深度渲染爬取成功！耗時 ${duration}ms，共取得 ${data.headings?.length || 0} 個標題、${data.paragraphs?.length || 0} 個段落`
      );

      return {
        success: true,
        url: cleanUrl,
        title: data.title || cleanUrl,
        description: data.description || '',
        headings: data.headings || [],
        paragraphs: data.paragraphs || [],
        text: data.text || '',
        scrapedAt: new Date().toLocaleString('zh-TW'),
        durationMs: duration,
      };
    } catch (err: any) {
      lastError = err;
      const isNetworkError =
        err.name === 'TypeError' ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError') ||
        err.message?.includes('ECONNREFUSED');

      if (isNetworkError) {
        console.warn(`[Playwright Service] 端點 ${endpoint} 無法連線，嘗試下一個備用端點...`);
        continue;
      }
      // 其他業務錯誤或逾時直接丟出
      break;
    }
  }

  // 若所有端點皆連線失敗
  const isOffline =
    lastError?.name === 'TypeError' ||
    lastError?.message?.includes('Failed to fetch') ||
    lastError?.message?.includes('ECONNREFUSED');

  if (isOffline) {
    throw new PlaywrightUnavailableError(
      `無法連線至 Playwright 伺服器 (${configuredBaseUrl})。伺服器尚未架設或處於離線狀態。`,
      true
    );
  }

  if (lastError?.name === 'AbortError') {
    throw new Error('Playwright 爬取逾時（超過 30 秒），無頭瀏覽器載入或解析時間過長。');
  }

  throw lastError || new Error('Playwright 執行發生未知連線錯誤');
}
