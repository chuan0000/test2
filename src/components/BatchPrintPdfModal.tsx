import React, { useState } from 'react';
import { ProofDocumentData } from '../utils/proofHtmlGenerator';
import { 
  openPrintableDocumentInNewTab, 
  downloadPrintableHtmlFile, 
  printViaHiddenIframe 
} from '../utils/pdfPrintHelper';
import { OfficialProofDocument } from './OfficialProofDocument';
import { 
  Printer, 
  ExternalLink, 
  Download, 
  X, 
  CheckCircle2, 
  HelpCircle, 
  FileText,
  Eye
} from 'lucide-react';

interface BatchPrintPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  proofDocuments: ProofDocumentData[];
}

export const BatchPrintPdfModal: React.FC<BatchPrintPdfModalProps> = ({
  isOpen,
  onClose,
  proofDocuments
}) => {
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);
  const [isPrintingDirectly, setIsPrintingDirectly] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  if (!isOpen || proofDocuments.length === 0) return null;

  const currentDoc = proofDocuments[activePreviewIndex] || proofDocuments[0];

  // 1. Open in new tab and auto print
  const handleOpenNewTab = () => {
    const success = openPrintableDocumentInNewTab(proofDocuments);
    if (success) {
      setFeedbackMessage('已在新分頁開啟列印文件！系統將自動開啟列印視窗，請於「目的地」選取「另存為 PDF」。');
    } else {
      setFeedbackMessage('瀏覽器可能封鎖了彈出視窗，建議點擊「下載列印專用檔」或「直接本頁列印」。');
    }
  };

  // 2. Direct print via hidden iframe
  const handleDirectPrint = async () => {
    setIsPrintingDirectly(true);
    setFeedbackMessage('正在準備列印排版...');
    const ok = await printViaHiddenIframe(proofDocuments);
    setIsPrintingDirectly(false);
    if (ok) {
      setFeedbackMessage('已喚起列印視窗！請在「目的地」選擇「另存為 PDF」以儲存檔案。');
    } else {
      // fallback to native window.print()
      try {
        window.print();
      } catch (err) {
        console.warn('Native window.print also failed:', err);
        setFeedbackMessage('本預覽環境限制了直接列印，請點擊上方綠色「在新分頁開啟列印」按鈕！');
      }
    }
  };

  // 3. Download standalone HTML
  const handleDownloadHtml = () => {
    downloadPrintableHtmlFile(proofDocuments);
    setFeedbackMessage('已下載佐證手冊列印檔！以 Chrome / Edge 等瀏覽器開啟後按 Ctrl+P 即可存為 PDF。');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-inner">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>匯出 / 列印活動佐證手冊（PDF）</span>
                <span className="text-xs bg-indigo-500/80 text-white px-2 py-0.5 rounded-full font-bold">
                  共選取 {proofDocuments.length} 項活動
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                符合評審標準之專案活動成效與佐證手冊，可直接列印或另存為高畫質 PDF。
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Primary Option: Open in New Tab (Bypasses iframe completely) */}
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>在新分頁開啟列印並另存 PDF（最推薦）</span>
            </button>

            {/* Option 2: Direct print */}
            <button
              type="button"
              onClick={handleDirectPrint}
              disabled={isPrintingDirectly}
              className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrintingDirectly ? '準備列印中...' : '直接列印 / 存為 PDF'}</span>
            </button>

            {/* Option 3: Download standalone file */}
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>下載離線列印檔 (.html)</span>
            </button>
          </div>

          {/* Activity switcher pills if multiple selected */}
          {proofDocuments.length > 1 && (
            <div className="flex items-center gap-1 overflow-x-auto max-w-full py-1 text-xs">
              <span className="font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> 預覽切換：
              </span>
              {proofDocuments.map((doc, idx) => (
                <button
                  key={doc.id || idx}
                  type="button"
                  onClick={() => setActivePreviewIndex(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer truncate max-w-[120px] ${
                    activePreviewIndex === idx
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                  title={doc.title}
                >
                  {idx + 1}. {doc.title || '活動'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Feedback message banner if triggered */}
        {feedbackMessage && (
          <div className="p-2.5 px-4 bg-blue-50 border-b border-blue-200 text-xs text-blue-900 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
            <button 
              onClick={() => setFeedbackMessage('')}
              className="text-blue-500 hover:text-blue-800 text-xs font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Instructions Box */}
        <div className="bg-amber-50/70 border-b border-amber-200 p-2.5 px-4 text-[11.5px] text-amber-900 flex items-start gap-2 shrink-0">
          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong>💡 如何儲存為 PDF 檔案？</strong>
            點擊「在新分頁開啟列印並另存 PDF」或「直接列印」，在跳出的瀏覽器列印對話框中，將「<strong>目的地 (Destination)</strong>」下拉選單切換為「<strong>另存為 PDF (Save as PDF)</strong>」，勾選「<strong>背景圖形</strong>」，即可將所有選取活動無損匯出成標準 A4 公文手冊 PDF！
          </div>
        </div>

        {/* Scrollable Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/80 flex flex-col items-center">
          <div className="w-full max-w-[210mm] bg-white rounded-lg shadow-sm border border-slate-300 p-2 sm:p-4 mb-4">
            <div className="text-center text-xs font-bold text-slate-500 pb-2 border-b border-slate-200 mb-4 flex items-center justify-between">
              <span>📄 頁面預覽：第 {activePreviewIndex + 1} 項 / 共 {proofDocuments.length} 項活動</span>
              <span className="text-[11px] text-slate-400">列印時將包含全部 {proofDocuments.length} 項活動（依序分頁）</span>
            </div>
            <OfficialProofDocument data={currentDoc} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <div>
            已選取 {proofDocuments.length} 項活動，預估列印頁數：約 {proofDocuments.length} ~ {proofDocuments.length * 2} 頁 A4
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
          >
            關閉預覽
          </button>
        </div>

      </div>
    </div>
  );
};
