import React, { useState, useEffect } from 'react';
import {
  Globe,
  Flame,
  Bot,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Plus,
  FilePlus,
  RefreshCw,
  Key,
  X,
  Code,
  ListOrdered,
  FileText,
  HelpCircle,
} from 'lucide-react';
import {
  scrapeWithFirecrawl,
  getStoredFirecrawlApiKey,
  setStoredFirecrawlApiKey,
  hasEnvFirecrawlApiKey,
  FirecrawlScrapeResult,
} from '../services/firecrawlService';
import {
  scrapeWithPlaywright,
  pingPlaywrightServer,
  DEFAULT_PLAYWRIGHT_URL,
  PlaywrightScrapeResult,
} from '../services/playwrightService';
import {
  parseWebContentLocally,
  createSlideFromWebScrape,
  createElementsForCurrentSlide,
  ExtractedWebSlideData,
} from '../utils/webContentToSlide';
import { Slide, SlideElement } from '../types';

export interface WebScraperModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlideIndex: number;
  currentSlide?: Slide;
  themeAccentColor?: string;
  onInsertElementToCurrentSlide: (element: SlideElement) => void;
  onAddNewSlide: (newSlide: Slide) => void;
}

type EngineType = 'firecrawl' | 'playwright';

const SAMPLE_URLS = [
  { label: '佛光山全球資訊網', url: 'https://www.fgs.org.tw/' },
  { label: '佛光青年總團', url: 'https://foguang.org.tw/' },
  { label: '維基百科：佛光山', url: 'https://zh.wikipedia.org/wiki/%E4%BD%9B%E5%85%89%E5%B1%B1' },
];

export const WebScraperModal: React.FC<WebScraperModalProps> = ({
  isOpen,
  onClose,
  currentSlideIndex,
  currentSlide,
  themeAccentColor = '#E29B27',
  onInsertElementToCurrentSlide,
  onAddNewSlide,
}) => {
  const [url, setUrl] = useState<string>('');
  const [engine, setEngine] = useState<EngineType>('firecrawl');
  const [firecrawlApiKey, setFirecrawlApiKey] = useState<string>(() => getStoredFirecrawlApiKey());
  const [isRememberKey, setIsRememberKey] = useState<boolean>(true);
  const [hasEnvKey] = useState<boolean>(() => hasEnvFirecrawlApiKey());

  // Playwright fallback endpoint config
  const [playwrightUrl, setPlaywrightUrl] = useState<string>(() => {
    return (import.meta as any).env?.VITE_PLAYWRIGHT_SERVICE_URL || DEFAULT_PLAYWRIGHT_URL;
  });
  const [playwrightStatus, setPlaywrightStatus] = useState<'idle' | 'checking' | 'online' | 'offline'>('idle');

  // Status & Logs
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorLog, setErrorLog] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // Scraped Data
  const [extractedData, setExtractedData] = useState<ExtractedWebSlideData | null>(null);
  const [previewTab, setPreviewTab] = useState<'structured' | 'raw'>('structured');
  const [copied, setCopied] = useState<boolean>(false);

  // Check Playwright server health when user selects playwright
  useEffect(() => {
    if (engine === 'playwright' && playwrightStatus === 'idle') {
      setPlaywrightStatus('checking');
      pingPlaywrightServer(playwrightUrl).then((isOnline) => {
        setPlaywrightStatus(isOnline ? 'online' : 'offline');
      });
    }
  }, [engine, playwrightUrl, playwrightStatus]);

  // Keep key sync
  useEffect(() => {
    if (isRememberKey && firecrawlApiKey) {
      setStoredFirecrawlApiKey(firecrawlApiKey);
    }
  }, [firecrawlApiKey, isRememberKey]);

  if (!isOpen) return null;

  const handleCheckPlaywrightHealth = async () => {
    setPlaywrightStatus('checking');
    const isOnline = await pingPlaywrightServer(playwrightUrl);
    setPlaywrightStatus(isOnline ? 'online' : 'offline');
  };

  const handleStartScrape = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetUrl = url.trim();

    if (!targetUrl) {
      setErrorLog('請輸入要擷取資料的網頁網址 (URL)');
      return;
    }

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      setErrorLog('網址格式錯誤，請提供包含 http:// 或 https:// 的完整網址');
      return;
    }

    setErrorLog(null);
    setSuccessInfo(null);
    setExtractedData(null);
    setIsLoading(true);

    try {
      if (engine === 'firecrawl') {
        if (!firecrawlApiKey.trim()) {
          throw new Error('使用 Firecrawl 引擎需要有效的 API Key，請輸入金鑰或確認環境變數配置');
        }
        setLoadingStep('正在連線至 Firecrawl 雲端服務並解析純淨 Markdown...');
        const result: FirecrawlScrapeResult = await scrapeWithFirecrawl(targetUrl, firecrawlApiKey);

        setLoadingStep('正在分析內容結構與關鍵洞察...');
        const parsed = parseWebContentLocally(result.markdown, targetUrl, 'firecrawl', result.title);
        setExtractedData(parsed);
        setSuccessInfo(`成功透過 Firecrawl 核心引擎擷取完成 (耗時: ${result.durationMs || 0}ms)`);
      } else {
        // Playwright with automatic fallback to Firecrawl
        setLoadingStep(`正在嘗試連線 Playwright 渲染微服務 (${playwrightUrl})...`);
        try {
          const result: PlaywrightScrapeResult = await scrapeWithPlaywright(targetUrl, {
            serviceBaseUrl: playwrightUrl,
            timeout: 25000,
          });

          setLoadingStep('正在提取渲染後的結構化文字與標題清單...');
          const combinedText = [
            result.title,
            result.description,
            result.headings.map((h) => `${h.level.toUpperCase()}: ${h.text}`).join('\n'),
            result.paragraphs.join('\n\n'),
            result.text,
          ].filter(Boolean).join('\n\n');

          const parsed = parseWebContentLocally(combinedText, targetUrl, 'playwright', result.title);
          setExtractedData(parsed);
          setPlaywrightStatus('online');
          setSuccessInfo(`成功透過 Playwright 深度動態渲染完成 (耗時: ${result.durationMs || 0}ms)`);
        } catch (pwError: any) {
          console.warn('[Playwright Scrape] 連線失敗或未架設伺服器，檢查是否可自動 Fallback 至 Firecrawl:', pwError);
          setPlaywrightStatus('offline');

          // 若已配置 Firecrawl API Key，自動無縫降級改用 Firecrawl
          if (firecrawlApiKey && firecrawlApiKey.trim().length > 0) {
            setLoadingStep('⚠️ Playwright 伺服器未連線，系統已自動無縫切換至 Firecrawl 雲端服務繼續擷取...');
            const fcResult = await scrapeWithFirecrawl(targetUrl, firecrawlApiKey.trim());

            setLoadingStep('正在分析內容結構與關鍵洞察...');
            const parsed = parseWebContentLocally(fcResult.markdown, targetUrl, 'firecrawl', fcResult.title);
            setExtractedData(parsed);
            setSuccessInfo(`⚠️ Playwright 服務未連線 (${playwrightUrl})，已自動啟用 Firecrawl 備援並成功擷取！(耗時: ${fcResult.durationMs || 0}ms)`);
          } else {
            // 未配置 Firecrawl Key 時，提供明確引導
            throw new Error(
              `Playwright 伺服器連線失敗 (${pwError.message || '無法連線到 ' + playwrightUrl})。且目前未配置 Firecrawl API Key 作為備援。請啟動本機伺服器，或切換為預設核心「Firecrawl」並填入金鑰。`
            );
          }
        }
      }
    } catch (err: any) {
      console.error('[WebScraperModal] 爬取失敗:', err);
      setErrorLog(err.message || '抓取過程發生未知錯誤，請確認網址或微服務連線狀態');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Insert to current slide
  const handleInsertToCurrentSlide = () => {
    if (!extractedData) return;
    const newElement = createElementsForCurrentSlide(
      extractedData,
      currentSlide?.elements?.length || 0
    );
    onInsertElementToCurrentSlide(newElement);
    onClose();
  };

  // Create as new slide
  const handleCreateNewSlide = () => {
    if (!extractedData) return;
    const newSlide = createSlideFromWebScrape(extractedData, themeAccentColor);
    onAddNewSlide(newSlide);
    onClose();
  };

  // Copy raw content
  const handleCopyRaw = async () => {
    if (!extractedData?.rawContent) return;
    try {
      await navigator.clipboard.writeText(extractedData.rawContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="web-scraper-modal"
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
                外部網址爬取與智慧匯入
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                  Firecrawl / Playwright 雙引擎
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                自動爬取外部網站與活動頁面，萃取核心資訊並轉換為投影片卡片或全新簡報頁
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Engine Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <span>選擇爬蟲引擎模式</span>
              <span className="text-stone-400 text-[11px] font-normal">
                (依據目標網站架構選擇最適模式)
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Firecrawl Option */}
              <div
                onClick={() => {
                  setEngine('firecrawl');
                  setErrorLog(null);
                }}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  engine === 'firecrawl'
                    ? 'border-amber-500 bg-amber-50/40 shadow-xs ring-1 ring-amber-500/20'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                        <span>Firecrawl 雲端服務</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-stone-950">
                          預設核心
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500">純雲端 REST API・直接產出純淨 Markdown</div>
                    </div>
                  </div>
                  {engine === 'firecrawl' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  )}
                </div>
                <p className="text-[11px] text-stone-600 mt-2 leading-relaxed">
                  無需額外維運背景瀏覽器，適合各類網頁、新聞公告、維基百科。自動去除雜訊與樣式干擾。
                </p>
              </div>

              {/* Playwright Option */}
              <div
                onClick={() => {
                  setEngine('playwright');
                  setErrorLog(null);
                }}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  engine === 'playwright'
                    ? 'border-blue-500 bg-blue-50/40 shadow-xs ring-1 ring-blue-500/20'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                        <span>Playwright 無頭瀏覽器</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 border border-stone-300">
                          可選 Fallback
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500">本機伺服器 (3001 埠)・完整執行 JS 動態頁面</div>
                    </div>
                  </div>
                  {engine === 'playwright' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  )}
                </div>
                <p className="text-[11px] text-stone-600 mt-2 leading-relaxed">
                  預留給本地微服務或複雜 SPA 專案。若伺服器未開啟，系統將<strong>自動無縫切換 Firecrawl 備援</strong>。
                </p>
              </div>
            </div>
          </div>

          {/* Firecrawl API Key input if Firecrawl selected */}
          {engine === 'firecrawl' && (
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>Firecrawl API Key</span>
                  {hasEnvKey && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                      已由環境自動載入
                    </span>
                  )}
                </label>
                <a
                  href="https://www.firecrawl.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-amber-600 hover:underline flex items-center gap-1 font-medium"
                >
                  免費取得金鑰 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  placeholder="fc-xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={firecrawlApiKey}
                  onChange={(e) => setFirecrawlApiKey(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 font-mono"
                />
                <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isRememberKey}
                    onChange={(e) => setIsRememberKey(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>記住金鑰</span>
                </label>
              </div>
            </div>
          )}

          {/* Playwright Configuration & Fallback info if Playwright selected */}
          {engine === 'playwright' && (
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-blue-600" />
                  <span>Playwright 伺服器端點 (預留本機端點)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCheckPlaywrightHealth}
                    className="text-[11px] text-blue-700 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${playwrightStatus === 'checking' ? 'animate-spin' : ''}`} />
                    測試連線
                  </button>
                  {playwrightStatus === 'online' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 伺服器在線
                    </span>
                  )}
                  {playwrightStatus === 'offline' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-1" title="若未開啟，點擊爬取將自動以 Firecrawl 替代">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> 伺服器離線 (自動備援)
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="http://localhost:3001"
                  value={playwrightUrl}
                  onChange={(e) => setPlaywrightUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 font-mono"
                />
              </div>
              <p className="text-[11px] text-blue-800/80 leading-relaxed">
                💡 <strong>雙重防護機制</strong>：若您尚未啟動獨立伺服器，發起爬取時系統會透過 <code>try...catch</code> 自動偵測，並<strong>無縫轉由 Firecrawl API 完成擷取</strong>，作業完全不中斷。
              </p>
            </div>
          )}

          {/* URL Input Form */}
          <form onSubmit={handleStartScrape} className="space-y-2">
            <label className="text-xs font-bold text-stone-700">目標網址 (URL)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  required
                  placeholder="https://example.com/activity-announcement"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                />
                <Globe className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 rounded-xl text-white text-xs font-black shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all ${
                  engine === 'firecrawl'
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>擷取處理中...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>開始擷取</span>
                  </>
                )}
              </button>
            </div>

            {/* Sample Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-stone-400">快速填入範例：</span>
              {SAMPLE_URLS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setUrl(sample.url)}
                  className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 text-[11px] transition-colors cursor-pointer"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </form>

          {/* Loading status bar */}
          {isLoading && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 animate-pulse">
              <Loader2 className="w-5 h-5 text-amber-600 animate-spin shrink-0" />
              <div className="text-xs text-amber-900 font-medium">
                {loadingStep || '正在發起爬蟲請求，請稍候...'}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorLog && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold">擷取未完成</div>
                <div className="mt-0.5 text-red-600">{errorLog}</div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successInfo && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">{successInfo}</span>
            </div>
          )}

          {/* Scraped Result Presentation */}
          {extractedData && (
            <div className="space-y-3 pt-2">
              {/* Tab Header */}
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('structured')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      previewTab === 'structured'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    結構化簡報預覽
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('raw')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      previewTab === 'raw'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    原始文字 / Markdown
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyRaw}
                  className="px-2.5 py-1 rounded-md text-stone-600 hover:bg-stone-100 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? '已複製！' : '複製內容'}
                </button>
              </div>

              {/* Preview Content */}
              {previewTab === 'structured' ? (
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3 text-stone-800">
                  {/* Title & Engine Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 uppercase">
                        {extractedData.engine}
                      </span>
                      <h3 className="text-base font-black text-stone-900 mt-1">
                        {extractedData.title}
                      </h3>
                      <p className="text-[11px] text-stone-400 break-all">{extractedData.sourceUrl}</p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-3 rounded-lg bg-white border border-stone-200 text-xs leading-relaxed text-stone-700">
                    <span className="font-bold text-stone-900 block mb-1">📌 核心內容提要：</span>
                    {extractedData.summary}
                  </div>

                  {/* Bullet Points */}
                  {extractedData.bulletPoints.length > 0 && (
                    <div className="p-3 rounded-lg bg-white border border-stone-200 text-xs space-y-1 text-stone-700">
                      <span className="font-bold text-stone-900 block mb-1">🎯 關鍵重點條列：</span>
                      {extractedData.bulletPoints.map((bp, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold shrink-0">{i + 1}.</span>
                          <span>{bp}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Keywords */}
                  {extractedData.keywords.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[11px] text-stone-400">核心標籤：</span>
                      {extractedData.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-stone-200/70 text-stone-700 text-[11px] font-medium"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-stone-900 text-stone-100 font-mono text-xs max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {extractedData.rawContent}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 border-t border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="text-xs text-stone-500">
            目前檢視第 {currentSlideIndex + 1} 頁投影片
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-stone-600 hover:bg-stone-200 text-xs font-bold transition-colors cursor-pointer"
            >
              取消
            </button>

            {extractedData && (
              <>
                <button
                  type="button"
                  onClick={handleInsertToCurrentSlide}
                  className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all hover:scale-102"
                >
                  <Plus className="w-3.5 h-3.5 text-stone-300" />
                  <span>➕ 插入當前投影片卡片</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreateNewSlide}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-sm flex items-center gap-1.5 cursor-pointer transition-all hover:scale-102"
                >
                  <FilePlus className="w-3.5 h-3.5 text-amber-100" />
                  <span>📑 建立為全新簡報頁</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
