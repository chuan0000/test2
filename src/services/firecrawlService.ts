/**
 * Firecrawl Scrape Service
 * 官方端點：https://api.firecrawl.dev/v1/scrape
 * 將外部網頁透過 Firecrawl 雲端服務直接轉換為結構化純淨 Markdown
 */

export interface FirecrawlScrapeOptions {
  onlyMainContent?: boolean;
  timeout?: number;
  waitFor?: number;
}

export interface FirecrawlScrapeResult {
  success: boolean;
  url: string;
  markdown: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  scrapedAt: string;
  durationMs?: number;
}

const STORAGE_KEY_FIRECRAWL_API_KEY = 'blia_firecrawl_api_key';

/**
 * 取得儲存的 Firecrawl API 金鑰
 */
export function getStoredFirecrawlApiKey(): string {
  try {
    const envKey = (import.meta as any).env?.VITE_FIRECRAWL_API_KEY;
    if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
      return envKey.trim();
    }
    const local = localStorage.getItem(STORAGE_KEY_FIRECRAWL_API_KEY);
    return local || '';
  } catch {
    return '';
  }
}

/**
 * 檢查系統環境變數中是否已預設配置 Firecrawl API 金鑰
 */
export function hasEnvFirecrawlApiKey(): boolean {
  try {
    const envKey = (import.meta as any).env?.VITE_FIRECRAWL_API_KEY;
    return Boolean(envKey && typeof envKey === 'string' && envKey.trim().length > 0);
  } catch {
    return false;
  }
}

/**
 * 儲存 Firecrawl API 金鑰至本機
 */
export function setStoredFirecrawlApiKey(apiKey: string): void {
  try {
    if (!apiKey) {
      localStorage.removeItem(STORAGE_KEY_FIRECRAWL_API_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY_FIRECRAWL_API_KEY, apiKey.trim());
    }
  } catch (err) {
    console.warn('無法存取 localStorage 儲存 Firecrawl API Key:', err);
  }
}

/**
 * 專屬爬蟲服務函式：透過 Firecrawl 抓取網頁 Markdown
 * @param url 目標網頁 URL (包含 http/https)
 * @param apiKey Firecrawl API Key
 * @param options 選用爬蟲參數
 */
export async function scrapeWithFirecrawl(
  url: string,
  apiKey: string,
  options?: FirecrawlScrapeOptions
): Promise<FirecrawlScrapeResult> {
  const cleanUrl = (url || '').trim();
  const cleanKey = (apiKey || '').trim();

  // 邊界條件檢查
  if (!cleanUrl) {
    throw new Error('請輸入欲抓取的網址 (URL)');
  }
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    throw new Error('網址格式錯誤，請提供完整包含 http:// 或 https:// 的 URL');
  }
  if (!cleanKey) {
    throw new Error('未提供 Firecrawl API Key，請在設定欄位輸入或設定環境變數 VITE_FIRECRAWL_API_KEY');
  }

  const startTime = Date.now();
  console.info(`[Firecrawl Service] 發起抓取請求 -> ${cleanUrl}`);

  try {
    const controller = new AbortController();
    const timeoutMs = options?.timeout || 35000;
    const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cleanKey}`,
      },
      body: JSON.stringify({
        url: cleanUrl,
        formats: ['markdown', 'html'],
        onlyMainContent: options?.onlyMainContent ?? true,
        waitFor: options?.waitFor ?? 1000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutTimer);

    if (!response.ok) {
      let errorMsg = `Firecrawl API 請求失敗 (HTTP ${response.status})`;
      try {
        const errJson = await response.json();
        if (errJson?.error) {
          errorMsg = `Firecrawl 伺服器回傳錯誤: ${errJson.error}`;
        } else if (errJson?.message) {
          errorMsg = `Firecrawl 訊息: ${errJson.message}`;
        }
      } catch {
        // fallback to text
        const errTxt = await response.text().catch(() => '');
        if (errTxt) errorMsg += ` - ${errTxt.slice(0, 150)}`;
      }

      if (response.status === 401) {
        errorMsg = 'Firecrawl API Key 驗證失敗 (401 Unauthorized)，請確認金鑰是否有效。';
      } else if (response.status === 429) {
        errorMsg = 'Firecrawl 呼叫次數達頻率上限 (429 Rate Limit)，請稍後再試。';
      } else if (response.status === 404) {
        errorMsg = '目標網址不存在或無法由 Firecrawl 爬取 (404 Not Found)。';
      }

      console.error('[Firecrawl Service] API 錯誤:', errorMsg);
      throw new Error(errorMsg);
    }

    const json = await response.json();
    const duration = Date.now() - startTime;

    if (!json.success && !json.data) {
      throw new Error(json.error || 'Firecrawl 未成功解析出網頁資料');
    }

    const data = json.data || {};
    const markdown = data.markdown || '';
    const metadata = data.metadata || {};
    const title = metadata.title || metadata.ogTitle || cleanUrl;
    const description = metadata.description || metadata.ogDescription || '';

    console.info(`[Firecrawl Service] 抓取成功！耗時 ${duration}ms，Markdown 長度: ${markdown.length} 字元`);

    return {
      success: true,
      url: cleanUrl,
      markdown,
      title,
      description,
      metadata,
      scrapedAt: new Date().toLocaleString('zh-TW'),
      durationMs: duration,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      const timeoutError = 'Firecrawl 抓取逾時（超過 35 秒），目標網站可能回應過慢或具備強烈防火牆防護。';
      console.error('[Firecrawl Service] 逾時中斷:', timeoutError);
      throw new Error(timeoutError);
    }
    console.error('[Firecrawl Service] 發生例外狀況:', err);
    throw err;
  }
}
