import React, { useState } from 'react';
import { 
  Presentation, 
  Printer, 
  Download, 
  ExternalLink, 
  X, 
  CheckCircle2, 
  FileCheck, 
  Sparkles, 
  HelpCircle,
  Layers,
  ArrowRight,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { MeetingReportData } from './MeetingReportSlidesSection';
import { exportToPowerPointFile, exportSlidesAsImagePptxFile, SlideCustomOptions } from '../utils/pptxExportHelper';
import { openSlidesPrintInNewTab } from '../utils/slidesPrintPdfHelper';
import { exportSlidesToPdfFile } from '../utils/slidesPdfExportHelper';
import { Slide } from '../types';

interface PPTExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: MeetingReportData;
  slides?: Slide[];
  customOptions?: SlideCustomOptions;
  themeId?: string;
  layoutMode?: 'quad_photos' | 'dual_photos' | 'single_hero' | 'text_cards';
  fontSizeScale?: 'standard' | 'large';
  customBgUrl?: string;
  customLogoUrl?: string;
  onOpenGoogleSlidesModal?: () => void;
}

export const PPTExportModal: React.FC<PPTExportModalProps> = ({
  isOpen,
  onClose,
  reportData,
  slides,
  customOptions,
  themeId,
  layoutMode,
  fontSizeScale,
  customBgUrl,
  customLogoUrl,
  onOpenGoogleSlidesModal
}) => {
  const [isExportingPPTX, setIsExportingPPTX] = useState<boolean>(false);
  const [isExportingImagePPTX, setIsExportingImagePPTX] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progressInfo, setProgressInfo] = useState<{
    title: string;
    current: number;
    total: number;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const isAnyExporting = isExportingPPTX || isExportingImagePPTX || isExportingPDF;

  const mergedOptions: SlideCustomOptions = customOptions || {
    themeId,
    layoutMode,
    fontSizeScale,
    customBgUrl,
    customLogoUrl
  };

  // 1. Export as Real PowerPoint (.pptx) - Vector Native Objects
  const handleExportPPTX = async () => {
    try {
      setIsExportingPPTX(true);
      setProgressInfo({
        title: '正在建置標準 16:9 原生向量 PowerPoint 檔案',
        current: 1,
        total: Math.max(1, (slides || []).length),
        message: '組裝 PowerPoint 向量排版、文字物件與相片圖層...'
      });
      setStatusMessage('正在建置標準 16:9 PowerPoint 簡報檔案（含畫布自訂元件與自適應相片排版）...');
      await exportToPowerPointFile(reportData, mergedOptions, slides);
      setStatusMessage('✅ 原生向量 PowerPoint (.pptx) 簡報已成功下載！文字與相片皆為原生 PowerPoint 物件，可任意編輯修改。');
    } catch (err) {
      console.error('Failed to export PPTX:', err);
      setStatusMessage('❌ 匯出失敗，請確認瀏覽器支援下載或稍後再試。');
    } finally {
      setIsExportingPPTX(false);
      setProgressInfo(null);
    }
  };

  // 1-B. Export as WYSIWYG Image-Based PowerPoint (.pptx) - Zero Shift Guarantee
  const handleExportImagePPTX = async () => {
    try {
      setIsExportingImagePPTX(true);
      setProgressInfo({
        title: '正在產生 100% 畫面擬真滿版高畫質 PPTX',
        current: 0,
        total: Math.max(1, (slides || []).length),
        message: '啟動記憶體安全渲染佇列...'
      });
      setStatusMessage('正在產生 100% 畫面擬真滿版高畫質 PPTX（每頁高解析渲染，絕對不跑版）...');
      await exportSlidesAsImagePptxFile(
        reportData,
        mergedOptions,
        slides,
        (curr, total, msg) => {
          setProgressInfo({
            title: '正在產生 100% 畫面擬真滿版高畫質 PPTX',
            current: curr,
            total: total,
            message: msg
          });
          setStatusMessage(`[${curr}/${total}] ${msg}`);
        }
      );
      setStatusMessage('✅ 滿版無損 PPTX 已成功下載！100% 還原網頁畫布視覺效果，零跑版、零字型跑位。');
    } catch (err) {
      console.error('Failed to export image-based PPTX:', err);
      setStatusMessage('❌ 影像模式匯出失敗，正在嘗試切換原生匯出...');
      handleExportPPTX();
    } finally {
      setIsExportingImagePPTX(false);
      setProgressInfo(null);
    }
  };

  // 2. Open Google Slides Import Guide & Slides Web
  const handleOpenGoogleSlides = async () => {
    // First trigger .pptx download so user has the file
    try {
      setIsExportingPPTX(true);
      setProgressInfo({
        title: '正在準備 PowerPoint 檔案以供匯入 Google 簡報',
        current: 1,
        total: 1,
        message: '建置相容性簡報檔案中...'
      });
      setStatusMessage('正在準備 PowerPoint 檔案以供匯入 Google 簡報...');
      await exportToPowerPointFile(reportData, mergedOptions, slides);
      setStatusMessage('✅ 簡報已下載！請在即將開啟的 Google 簡報中選擇「檔案」➔「匯入投影片」即可上傳編輯。');
    } catch (err) {
      console.warn('PPTX download before google slides import warning:', err);
    } finally {
      setIsExportingPPTX(false);
      setProgressInfo(null);
    }

    // Open Google Slides new blank presentation in new tab
    setTimeout(() => {
      window.open('https://slides.google.com/create', '_blank');
    }, 800);
  };

  // 3. Export as High-Fidelity 16:9 Landscape PDF (jsPDF + html2canvas)
  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      setProgressInfo({
        title: '正在轉換 16:9 橫向滿版高解析 PDF 簡報',
        current: 0,
        total: Math.max(1, (slides || []).length),
        message: '啟動記憶體保護批次渲染隊列...'
      });
      setStatusMessage('正在轉換 16:9 橫向滿版高解析 PDF 簡報...');
      await exportSlidesToPdfFile(
        reportData,
        mergedOptions,
        slides,
        (curr, total, msg) => {
          setProgressInfo({
            title: '正在轉換 16:9 橫向滿版高解析 PDF 簡報',
            current: curr,
            total: total,
            message: msg
          });
          setStatusMessage(`[${curr}/${total}] ${msg}`);
        }
      );
      setStatusMessage('✅ 16:9 橫向無損 PDF 簡報已成功下載！方向鎖定為 16:9 橫向，無黑邊、零旋轉、滿版貼合。');
    } catch (err) {
      console.error('Direct PDF export failed, falling back to print tab:', err);
      setStatusMessage('直接下載未成功，已自動為您在新分頁開啟 16:9 投影片列印視窗！');
      openSlidesPrintInNewTab(
        reportData,
        {
          accentColor: mergedOptions?.accentColor,
          customBgUrl: mergedOptions?.customBgUrl,
          customLogoUrl: mergedOptions?.customLogoUrl
        },
        slides
      );
    } finally {
      setIsExportingPDF(false);
      setProgressInfo(null);
    }
  };

  // 4. Open in browser print tab
  const handleOpenBrowserPrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStatusMessage('已在新分頁開啟 16:9 投影片無損列印視窗！');
    openSlidesPrintInNewTab(
      reportData,
      {
        accentColor: mergedOptions?.accentColor,
        customBgUrl: mergedOptions?.customBgUrl,
        customLogoUrl: mergedOptions?.customLogoUrl
      },
      slides
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => {
        if (!isAnyExporting) onClose();
      }}
    >
      <div 
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-stone-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Overlay (Active during rendering to prevent double-clicks & accidental closing) */}
        {progressInfo && (
          <div className="absolute inset-0 z-50 bg-stone-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center mb-4 shadow-lg animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <h4 className="text-base sm:text-lg font-black text-white tracking-wide">
              {progressInfo.title}
            </h4>
            
            <p className="text-xs text-amber-200/90 mt-1 max-w-md line-clamp-2">
              {progressInfo.message}
            </p>

            {/* Progress Bar */}
            <div className="w-full max-w-sm mt-5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-stone-300 px-1">
                <span>繪製進度 ({progressInfo.current} / {progressInfo.total})</span>
                <span className="text-amber-400">
                  {Math.round((progressInfo.current / Math.max(1, progressInfo.total)) * 100)}%
                </span>
              </div>
              <div className="w-full h-3 bg-stone-800 rounded-full overflow-hidden border border-stone-700 p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${Math.round((progressInfo.current / Math.max(1, progressInfo.total)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Memory-Safe Guarantee Badge */}
            <div className="mt-5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-[11px] text-stone-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>記憶體安全隊列已啟用：每頁繪製後自動清空畫布，避免記憶體溢位</span>
            </div>
          </div>
        )}
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shadow-lg font-black">
              <Presentation className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>匯出簡報 (PowerPoint / Google 簡報 / PDF)</span>
                <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                  16:9 零跑版保證
                </span>
              </h3>
              <p className="text-xs text-stone-300 mt-0.5">
                支援微軟 PPTX、Google 簡報雲端協作、及防跑版橫式 A4 / 16:9 PDF 輸出。
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isAnyExporting}
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:pointer-events-none text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="p-3 px-5 bg-amber-50 border-b border-amber-200 text-xs text-amber-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold">{statusMessage}</span>
            </div>
            <button 
              onClick={() => setStatusMessage('')}
              className="text-stone-400 hover:text-stone-700 text-xs font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Export Options Grid */}
        <div className="p-5 sm:p-6 space-y-3.5 bg-stone-50/70">
          
          {/* Option 1: Native & Image-Based PowerPoint (.pptx) */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-amber-500 hover:shadow-md transition-all group flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white flex items-center justify-center shrink-0 transition-all font-black text-sm">
                PPTX
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-black text-stone-900 group-hover:text-orange-600 transition-colors">
                    輸出微軟 PowerPoint 簡報檔 (.pptx)
                  </h4>
                  <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full">
                    標準 16:9 Widescreen
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  提供兩種匯出模式：<strong>原生向量版</strong>（文字與圖片為 PowerPoint 原生物件，可完全編輯修改）與 <strong>WYSIWYG 擬真版</strong>（以 1920×1080 滿版渲染圖層，保證視覺與網頁 100% 絕對相同、零跑版）。
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                disabled={isExportingPPTX || isExportingImagePPTX}
                onClick={handleExportPPTX}
                className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-105 cursor-pointer"
                title="下載原生向量 PowerPoint，投影片內各文字框與照片皆可直接選取編輯"
              >
                <Download className="w-4 h-4" />
                <span>{isExportingPPTX ? '輸出中...' : '原生向量 PPTX'}</span>
              </button>
              <button
                type="button"
                disabled={isExportingPPTX || isExportingImagePPTX}
                onClick={handleExportImagePPTX}
                className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 disabled:opacity-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                title="以畫布 1:1 滿版影像嵌入 PPTX，100% 鎖定排版防跑位"
              >
                <Layers className="w-3.5 h-3.5 text-amber-700" />
                <span>{isExportingImagePPTX ? '繪製中...' : '100% 擬真 PPTX'}</span>
              </button>
            </div>
          </div>

          {/* Option 2: Google Slides (Google 簡報) */}
          <div 
            onClick={() => {
              if (onOpenGoogleSlidesModal) {
                onOpenGoogleSlidesModal();
              } else {
                handleOpenGoogleSlides();
              }
            }}
            className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group flex items-start justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-stone-950 flex items-center justify-center shrink-0 transition-all font-black text-sm">
                Slides
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-stone-900 group-hover:text-amber-600 transition-colors">
                    同步至 Google 簡報 (Google Slides API)
                  </h4>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                    一鍵直傳
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  使用官方 Google Slides API 直接在您的 Google 雲端硬碟建立新簡報，自動寫入投影片排版與圖層文字，免手動下載上傳！
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenGoogleSlidesModal) {
                  onOpenGoogleSlidesModal();
                } else {
                  handleOpenGoogleSlides();
                }
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black shrink-0 flex items-center gap-1.5 shadow-sm transition-all group-hover:scale-105 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{onOpenGoogleSlidesModal ? '啟動直連同步' : '開啟 Google 簡報'}</span>
            </button>
          </div>

          {/* Option 3: Landscape 16:9 PDF (防跑版橫向滿版) */}
          <div 
            onClick={handleExportPDF}
            className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group flex items-start justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center shrink-0 transition-all font-black text-sm">
                PDF
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-stone-900 group-hover:text-indigo-600 transition-colors">
                    輸出為 16:9 橫向 PDF 簡報（鎖定滿版無黑邊）
                  </h4>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                    16:9 橫向滿版
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  以 1920×1080 規格鎖定橫向 (Landscape) 輸出，徹底解決「橫的直式（旋轉 90 度）」與黑邊問題。支援直接下載無損 PDF，或開啟新分頁進行列印預覽。
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <button
                type="button"
                disabled={isExportingPDF}
                onClick={(e) => {
                  e.stopPropagation();
                  handleExportPDF();
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all group-hover:scale-105 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isExportingPDF ? 'PDF 轉檔中...' : '下載 16:9 PDF'}</span>
              </button>
              <button
                type="button"
                onClick={handleOpenBrowserPrint}
                className="px-2.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="在新分頁開啟進行瀏覽器列印"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">列印預覽</span>
              </button>
            </div>
          </div>

        </div>

        {/* Anti-Shift Layout Tips Box */}
        <div className="p-4 px-6 bg-blue-50/70 border-t border-blue-200 flex items-start gap-3 text-xs text-blue-900">
          <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>💡 如何確保 PDF 100% 不跑版？</strong>
            點擊「列印 / 另存 PDF」進入列印設定時，請確認三項設定：
            <span className="inline-block bg-white px-2 py-0.5 rounded border border-blue-300 font-bold text-blue-900 mx-1">
              方向：橫向 (Landscape)
            </span>
            <span className="inline-block bg-white px-2 py-0.5 rounded border border-blue-300 font-bold text-blue-900 mx-1">
              邊界：無 (None)
            </span>
            <span className="inline-block bg-white px-2 py-0.5 rounded border border-blue-300 font-bold text-blue-900 mx-1">
              勾選「背景圖形」
            </span>
            ，即可保證與畫面呈現完全一致！
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-white border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>共 {reportData.categories.reduce((acc, c) => acc + c.activities.length, 0)} 場選取之活動報告簡報</span>
          <button
            type="button"
            disabled={isAnyExporting}
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:pointer-events-none text-stone-700 font-bold cursor-pointer transition-colors"
          >
            關閉視窗
          </button>
        </div>

      </div>
    </div>
  );
};
