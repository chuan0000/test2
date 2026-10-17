import React, { useState, useEffect } from 'react';
import { 
  Presentation, 
  X, 
  Search, 
  Check, 
  RefreshCw, 
  ExternalLink, 
  Sparkles, 
  AlertCircle, 
  Plus, 
  CheckCircle2, 
  Copy, 
  Download,
  Layers,
  ArrowRight,
  MonitorPlay,
  Cloud
} from 'lucide-react';
import { User } from 'firebase/auth';
import { getAccessToken, initAuth } from '../services/googleAuth';
import { 
  listGoogleSlides, 
  getGooglePresentation, 
  importGooglePresentationToSlides,
  exportSlidesToGoogleSlides,
  GooglePresentationItem, 
  SlideExportResult 
} from '../services/googleSlides';
import { exportSlidesToGoogleSlidesViaGas } from '../services/googleSlidesExportService';
import { GoogleSignInButton } from './GoogleSignInButton';
import { Slide } from '../types';

interface GoogleSlidesModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: Slide[];
  defaultTitle?: string;
  onImportSlides?: (importedSlides: Slide[]) => void;
}

export const GoogleSlidesModal: React.FC<GoogleSlidesModalProps> = ({
  isOpen,
  onClose,
  slides,
  defaultTitle = '【聯團會議簡報】新竹佛光青年工作成果與工作報告',
  onImportSlides,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'export' | 'browse'>('export');

  // Export State & Engine
  const [exportEngine, setExportEngine] = useState<'gas' | 'oauth'>('gas');
  const [presentationTitle, setPresentationTitle] = useState<string>(defaultTitle);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [exportResult, setExportResult] = useState<SlideExportResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [userConfirmedMutation, setUserConfirmedMutation] = useState<boolean>(false);

  // Browse State
  const [slidesList, setSlidesList] = useState<GooglePresentationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
        if (token && isOpen && activeTab === 'browse') {
          loadSlidesList(token);
        }
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );

    getAccessToken().then((token) => {
      if (token) setAccessToken(token);
    });

    return () => unsubscribe();
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (isOpen) {
      setPresentationTitle(defaultTitle || '【聯團會議簡報】新竹佛光青年工作成果');
      setExportResult(null);
      setExportError(null);
      setUserConfirmedMutation(false);
      setProgressMsg('');
      setProgressPercent(0);
    }
  }, [isOpen, defaultTitle]);

  const loadSlidesList = async (token?: string) => {
    const t = token || accessToken;
    if (!t) return;
    setIsLoadingList(true);
    try {
      const list = await listGoogleSlides(t, searchQuery);
      setSlidesList(list);
    } catch (err: any) {
      console.error('Failed to list Google Slides:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'browse' && accessToken) {
      loadSlidesList(accessToken);
    }
  }, [isOpen, activeTab]);

  const handleExport = async () => {
    if (!userConfirmedMutation) {
      setExportError('請勾選下方確認方塊以授權建立 Google 簡報');
      return;
    }
    if (slides.length === 0) {
      setExportError('目前沒有任何投影片可供匯出');
      return;
    }

    if (exportEngine === 'oauth') {
      if (!accessToken) {
        setExportError('請先點擊右上角登入 Google 帳號，以使用 Google 帳號原生建立模式');
        return;
      }

      setIsExporting(true);
      setExportError(null);
      setProgressMsg('正在透過 Google Workspace 原生 API 建立簡報...');
      setProgressPercent(10);

      try {
        const res = await exportSlidesToGoogleSlides(
          accessToken,
          presentationTitle,
          slides,
          (msg, current, total) => {
            setProgressMsg(msg);
            setProgressPercent(Math.round((current / total) * 100));
          }
        );

        setExportResult(res);
        setProgressPercent(100);
      } catch (err: any) {
        console.error('Export to Google Slides via OAuth failed:', err);
        setExportError(err.message || '透過 Google 原生 API 建立簡報失敗，請確認授權或切換至 GAS 雲端免登入引擎');
      } finally {
        setIsExporting(false);
      }
      return;
    }

    // Default: GAS Cloud Snapshot Engine
    setIsExporting(true);
    setExportError(null);
    setProgressMsg('正在準備投影片影像並建立連線...');
    setProgressPercent(5);

    try {
      const res = await exportSlidesToGoogleSlidesViaGas(
        slides,
        presentationTitle,
        undefined, // automatically read from localStorage or fallback
        (msg, current, total) => {
          setProgressMsg(msg);
          setProgressPercent(Math.round((current / total) * 100));
        }
      );

      setExportResult({
        presentationId: res.presentationId || '',
        presentationUrl: res.presentationUrl || '',
        title: presentationTitle,
        slideCount: res.totalSlides || slides.length,
      });
      setProgressPercent(100);
    } catch (err: any) {
      console.error('Export to Google Slides via GAS failed:', err);
      setExportError(err.message || '匯出 Google 簡報失敗，請確認網路與 Google Apps Script 設定');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (item: GooglePresentationItem) => {
    if (!accessToken) return;
    setImportingId(item.id);
    try {
      const presentationData = await getGooglePresentation(accessToken, item.id);
      const parsedSlides = importGooglePresentationToSlides(presentationData);
      if (parsedSlides.length === 0) {
        alert('該簡報中未解析出可用的投影片或文字圖層');
        return;
      }
      if (onImportSlides) {
        onImportSlides(parsedSlides);
      }
      onClose();
    } catch (err: any) {
      alert(`讀取 Google 簡報失敗：${err.message}`);
    } finally {
      setImportingId(null);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-[#FDFBF7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 shadow-xs">
              <Presentation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-stone-900">Google 簡報 (Google Slides) 整合中心</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                  雲端簡報同步
                </span>
              </div>
              <p className="text-xs text-stone-500">
                將 Canva Studio 編輯成果一鍵匯出為 Google 簡報，或從雲端匯入現有投影片
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <GoogleSignInButton
              onAuthChange={(user, token) => {
                setCurrentUser(user);
                setAccessToken(token);
              }}
              compact
            />
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-stone-200/70 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50/70 px-6">
          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'export'
                ? 'border-amber-500 text-amber-900 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>匯出至 Google 簡報</span>
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'browse'
                ? 'border-amber-500 text-amber-900 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>瀏覽雲端簡報並匯入</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Unauthenticated Warning for Browse */}
          {!accessToken && activeTab === 'browse' && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-black text-amber-900">瀏覽雲端簡報需要 Google 帳號授權</h4>
                <p className="text-xs text-amber-800/90 leading-relaxed">
                  瀏覽與匯入雲端硬碟中的既有 Google 簡報需要讀取權限。請點擊右上角「Sign in with Google」登入以取得授權。
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              
              {/* Slides Summary Card */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-stone-800">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <span>即將匯出的投影片內容（共 {slides.length} 頁）</span>
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-700">
                    16:9 寬螢幕規格
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[140px] overflow-y-auto pr-1">
                  {slides.map((s, idx) => (
                    <div
                      key={s.id}
                      className="p-2 rounded-xl bg-white border border-stone-200 text-left space-y-1 shadow-2xs"
                    >
                      <div className="text-[10px] font-black text-amber-700">P.{idx + 1}</div>
                      <div className="text-[11px] font-bold text-stone-800 truncate" title={s.title}>
                        {s.title || '簡報頁面'}
                      </div>
                      <div className="text-[9px] text-stone-400">
                        {s.elements?.length || 0} 個元件
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Presentation Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Google 簡報名稱</label>
                <input
                  type="text"
                  value={presentationTitle}
                  onChange={(e) => setPresentationTitle(e.target.value)}
                  placeholder="請輸入簡報標題"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              {/* Dual Export Engine Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">匯出建立引擎</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setExportEngine('gas'); setExportError(null); }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      exportEngine === 'gas'
                        ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                        : 'bg-stone-50 border-stone-200 hover:bg-stone-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Cloud className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-xs font-black text-stone-900">GAS 雲端快照引擎</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900 font-bold">免登入推薦</span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      100% 所見即所得滿版無損快照，徹底防跑版與疊字，即產即用。
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setExportEngine('oauth'); setExportError(null); }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      exportEngine === 'oauth'
                        ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                        : 'bg-stone-50 border-stone-200 hover:bg-stone-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs font-black text-stone-900">Google 原生圖層引擎</span>
                      </div>
                      {accessToken ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">已登入就緒</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 text-stone-600 font-bold">需登入授權</span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      將投影片轉為原生向量文字與形狀圖層，直接存於個人雲端硬碟。
                    </p>
                  </button>
                </div>
              </div>

              {/* Mandatory Explicit Confirmation for Workspace Mutation */}
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userConfirmedMutation}
                    onChange={(e) => setUserConfirmedMutation(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="text-xs text-amber-950 leading-relaxed">
                    <span className="font-black">確認授權建立 Google 簡報</span>：我同意在我的 Google 雲端硬碟建立新簡報《{presentationTitle}》，並將 {slides.length} 頁投影片內容以【{exportEngine === 'gas' ? 'GAS 雲端快照引擎' : 'Google 原生圖層引擎'}】寫入。
                  </div>
                </label>
              </div>

              {/* Progress Bar (if exporting) */}
              {isExporting && (
                <div className="space-y-2 p-3 rounded-xl bg-stone-50 border border-stone-200 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
                    <span>{progressMsg}</span>
                    <span className="font-bold text-amber-600">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Export Button */}
              <div className="pt-2">
                <button
                  onClick={handleExport}
                  disabled={isExporting || !userConfirmedMutation || slides.length === 0}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>正在批次建立 Google 簡報與圖層...</span>
                    </>
                  ) : (
                    <>
                      <Presentation className="w-4 h-4" />
                      <span>立即建立並發布至 Google 簡報</span>
                    </>
                  )}
                </button>
              </div>

              {exportError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed font-medium">{exportError}</div>
                  </div>
                  {exportEngine === 'gas' && accessToken && (
                    <button
                      type="button"
                      onClick={() => {
                        setExportEngine('oauth');
                        setExportError(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-300 text-red-800 text-[11px] font-bold hover:bg-red-100/60 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span>切換使用【Google 原生圖層引擎】建立</span>
                    </button>
                  )}
                  {exportEngine === 'oauth' && (
                    <button
                      type="button"
                      onClick={() => {
                        setExportEngine('gas');
                        setExportError(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-300 text-red-800 text-[11px] font-bold hover:bg-red-100/60 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Cloud className="w-3.5 h-3.5 text-amber-600" />
                      <span>切換回【GAS 雲端快照引擎】建立</span>
                    </button>
                  )}
                </div>
              )}

              {/* Export Success Result Card */}
              {exportResult && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Google 簡報已成功產出並上傳至雲端！</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs space-y-1">
                    <div className="font-bold text-stone-900">{exportResult.title}</div>
                    <div className="text-stone-500 text-[11px]">
                      簡報編號：{exportResult.presentationId} ｜ 總頁數：{exportResult.slideCount} 頁
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={exportResult.presentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all"
                    >
                      <MonitorPlay className="w-4 h-4" />
                      <span>在 Google 簡報中立即開啟</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </a>
                    <button
                      onClick={() => handleCopyUrl(exportResult.presentationUrl)}
                      className="py-2 px-3 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-100/50 text-emerald-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? '已複製' : '複製連結'}</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: BROWSE & IMPORT */}
          {activeTab === 'browse' && (
            <div className="space-y-4">
              
              {/* Search Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="搜尋雲端硬碟中的 Google 簡報檔案..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadSlidesList()}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <button
                  onClick={() => loadSlidesList()}
                  disabled={isLoadingList || !accessToken}
                  className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />
                  <span>重整</span>
                </button>
              </div>

              {/* Presentations List */}
              {isLoadingList ? (
                <div className="py-12 text-center text-xs text-stone-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                  <p>正在讀取您的 Google 雲端簡報...</p>
                </div>
              ) : slidesList.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-400">
                  {accessToken ? '雲端硬碟中找不到相符的 Google 簡報檔案' : '請先點擊右上角登入 Google 帳號'}
                </div>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {slidesList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-stone-200 bg-white hover:border-amber-300 hover:bg-amber-50/30 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                          <Presentation className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-stone-900 truncate" title={item.name}>
                            {item.name}
                          </div>
                          <div className="text-[11px] text-stone-400">
                            最後修改：{item.modifiedTime ? new Date(item.modifiedTime).toLocaleDateString('zh-TW') : '無紀錄'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onImportSlides && (
                          <button
                            onClick={() => handleImport(item)}
                            disabled={importingId === item.id}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-[11px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                            title="將此簡報的頁面與圖層匯入至 Canva Studio"
                          >
                            {importingId === item.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <ArrowRight className="w-3 h-3" />
                            )}
                            <span>匯入簡報</span>
                          </button>
                        )}
                        <a
                          href={`https://docs.google.com/presentation/d/${item.id}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:text-amber-700 hover:bg-white"
                          title="在 Google 簡報中開啟"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>原生相容 Google Slides 格式 ｜ 支援在線放映與雲端共同編輯</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-200 text-stone-700 font-bold transition-colors cursor-pointer"
          >
            關閉
          </button>
        </div>

      </div>
    </div>
  );
};
