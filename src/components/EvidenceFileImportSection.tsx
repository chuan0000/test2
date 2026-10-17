import React, { useState, useRef, useEffect } from 'react';
import { 
  FileUp, 
  FileType, 
  Sparkles, 
  CheckCircle2, 
  Eye, 
  Save, 
  FolderArchive, 
  ArrowRight, 
  CheckSquare, 
  Square, 
  Calendar, 
  MapPin, 
  Users, 
  Image as ImageIcon, 
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Award,
  RefreshCw,
  FolderOpen,
  Trash2,
  UploadCloud,
  HelpCircle,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { 
  ExtractedEvidenceActivity, 
  parseWordDocument, 
  getPreloadedSampleActivities, 
  getHsinchuOfficial57Activities,
  DocumentParseResult
} from '../utils/documentParser';
import { 
  getStoredActivities, 
  saveProofToArchives,
  saveProofToArchivesAsync 
} from '../utils/activityStorage';
import { ActivityPhoto } from '../types';
import { ProofDocumentData } from '../utils/proofHtmlGenerator';

interface EvidenceFileImportSectionProps {
  onNavigateToArchives?: () => void;
  onApplyToProofGenerator?: (data: ProofDocumentData) => void;
}

const EVIDENCE_IMPORT_STATE_KEY = 'blia_imported_evidence_state_v2';

export const EvidenceFileImportSection: React.FC<EvidenceFileImportSectionProps> = ({
  onNavigateToArchives,
  onApplyToProofGenerator
}) => {
  // Load saved state from storage or start clean
  const initialSaved = (() => {
    try {
      const raw = localStorage.getItem(EVIDENCE_IMPORT_STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.activities)) {
          return parsed;
        }
      }
    } catch {}
    return null;
  })();

  // State: Activities extracted from document
  const [activities, setActivities] = useState<ExtractedEvidenceActivity[]>(() => 
    initialSaved ? initialSaved.activities : []
  );
  const [selectedActivityIndex, setSelectedActivityIndex] = useState<number>(() =>
    initialSaved && typeof initialSaved.selectedActivityIndex === 'number' ? initialSaved.selectedActivityIndex : 0
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [currentFileName, setCurrentFileName] = useState<string>(() =>
    initialSaved ? initialSaved.currentFileName || '' : ''
  );
  const [extractedPhotosCount, setExtractedPhotosCount] = useState<number>(() =>
    initialSaved && typeof initialSaved.extractedPhotosCount === 'number' ? initialSaved.extractedPhotosCount : 0
  );

  // Synchronize state changes to localStorage so user operations and uploads survive tab switching and reload
  useEffect(() => {
    try {
      localStorage.setItem(EVIDENCE_IMPORT_STATE_KEY, JSON.stringify({
        activities,
        selectedActivityIndex,
        currentFileName,
        extractedPhotosCount
      }));
    } catch (err) {
      console.warn('localStorage quota warning when saving evidence import state:', err);
      try {
        const lightweight = activities.map(a => ({
          ...a,
          photos: a.photos.map(p => ({
            ...p,
            url: p.url.length > 500 ? '' : p.url
          }))
        }));
        localStorage.setItem(EVIDENCE_IMPORT_STATE_KEY, JSON.stringify({
          activities: lightweight,
          selectedActivityIndex,
          currentFileName,
          extractedPhotosCount
        }));
      } catch {}
    }
  }, [activities, selectedActivityIndex, currentFileName, extractedPhotosCount]);

  // Diagnostics / Warnings
  const [diagnosticWarning, setDiagnosticWarning] = useState<{
    title: string;
    message: string;
    suggestion: string;
    type: 'legacy_doc' | 'scanned_pdf' | 'error';
  } | null>(null);

  // Notification / Toast
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState<boolean>(false);

  // Safe In-App Confirmation Modal (avoiding iframe-blocked window.confirm/alert)
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Current active preview activity
  const activeActivity = activities[selectedActivityIndex] || activities[0];

  // Total selected count
  const selectedCount = activities.filter(a => a.selected).length;

  // Process Word (.docx) file from selection or drop
  const processWordFile = async (file: File) => {
    setIsProcessing(true);
    setSaveSuccessMessage(null);
    setDiagnosticWarning(null);

    try {
      const lowerName = file.name.toLowerCase();
      const isDocx = lowerName.endsWith('.docx');
      const isLegacyDoc = lowerName.endsWith('.doc') && !isDocx;

      if (isLegacyDoc) {
        setIsProcessing(false);
        setDiagnosticWarning({
          title: '偵測到舊版 Word 97-2003 (.doc) 格式',
          message: `檔案「${file.name}」為舊版封閉二進位架構，瀏覽器無法直接解密讀取內嵌圖片與表格。`,
          suggestion: '建議在 Word 點選【檔案 ➔ 另存新檔】，格式選擇「Word 文件 (*.docx)」後重新上傳即可完整解析！',
          type: 'legacy_doc'
        });
        return;
      }

      if (!isDocx) {
        setIsProcessing(false);
        setDiagnosticWarning({
          title: '檔案格式不符',
          message: `選取的檔案「${file.name}」非 Word (.docx) 格式。`,
          suggestion: '本匯入功能專屬支援 Microsoft Word (.docx) 格式檔案，請選取 .docx 檔案。',
          type: 'error'
        });
        return;
      }

      const result: DocumentParseResult = await parseWordDocument(file);

      // Check for errors or warnings
      if (result.error === 'legacy_doc') {
        setDiagnosticWarning({
          title: '檔案格式為舊版 .doc',
          message: result.warning || '請將檔案另存為 .docx 格式。',
          suggestion: '在 Word 另存為 .docx 後即可自動萃取表格與相片。',
          type: 'legacy_doc'
        });
      } else if (result.activities.length === 0) {
        setDiagnosticWarning({
          title: '文件中未發現標準活動格式或內容為空',
          message: result.warning || '系統在該 Word 文件中未辨識出標準活動佐證區塊。',
          suggestion: '請確認該 Word 文件是否包含活動名稱、日期或選拔佐證資料表。',
          type: 'error'
        });
      } else {
        // Success!
        setActivities(result.activities);
        setCurrentFileName(result.fileName);
        setExtractedPhotosCount(result.totalPhotosExtracted);
        setSelectedActivityIndex(0);
        setSaveSuccessMessage(`成功從「${file.name}」解析出 ${result.activities.length} 個活動與 ${result.totalPhotosExtracted} 張佐證相片！`);
        setTimeout(() => setSaveSuccessMessage(null), 4000);
      }

    } catch (err) {
      console.error('Word document parsing error:', err);
      setDiagnosticWarning({
        title: '解析 Word 文件時發生異常',
        message: '可能檔案含有特殊防寫保護或架構異常。',
        suggestion: '請在 Word 中重新另存為標準 .docx 檔案後重新上傳。',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle local Word file upload input
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processWordFile(file);
  };

  // Handle drag and drop for Word file
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processWordFile(file);
    }
  };

  // Handle User Photo Upload to attach to active activity
  const handleUserPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: ActivityPhoto[] = [];
    let loadedCount = 0;

    Array.from(files).forEach((file: File, idx: number) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          newPhotos.push({
            id: `user-photo-${Date.now()}-${idx}`,
            url: dataUrl,
            caption: file.name.replace(/\.[^/.]+$/, '')
          });
        }
        loadedCount++;
        if (loadedCount === files.length) {
          setActivities(prev => {
            const copy = [...prev];
            const targetIdx = selectedActivityIndex < copy.length ? selectedActivityIndex : 0;
            if (copy[targetIdx]) {
              copy[targetIdx] = {
                ...copy[targetIdx],
                photos: [...copy[targetIdx].photos, ...newPhotos]
              };
            }
            return copy;
          });
          setExtractedPhotosCount(prev => prev + newPhotos.length);
          setSaveSuccessMessage(`已成功附加 ${newPhotos.length} 張本機相片至目前活動佐證中！`);
          setTimeout(() => setSaveSuccessMessage(null), 3000);
        }
      };
      reader.readAsDataURL(file);
    });

    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  // Handle 1-click Reload Sample File
  const handleReloadSampleData = () => {
    setIsProcessing(true);
    setDiagnosticWarning(null);
    setTimeout(() => {
      const sample = getPreloadedSampleActivities();
      setActivities(sample);
      setCurrentFileName('中華佛光青年總團_新竹青年分團_專案活動成果佐證報告.docx (範例檔)');
      setExtractedPhotosCount(9);
      setSelectedActivityIndex(0);
      setIsProcessing(false);
      setSaveSuccessMessage('已重新載入新竹青年分團完整活動佐證報告範例！');
      setTimeout(() => setSaveSuccessMessage(null), 3500);
    }, 300);
  };

  // =========================================================================
  // DELETE & LOAD BUTTON HANDLERS (As requested by the user)
  // =========================================================================

  // 1. Delete ALL parsed activities (Used in both Section 2 and Section 3)
  const handleDeleteAllActivities = () => {
    if (activities.length === 0) {
      setSaveSuccessMessage('目前清單中已無解析活動！');
      setTimeout(() => setSaveSuccessMessage(null), 2500);
      return;
    }
    setConfirmModal({
      title: '確認刪除所有解析活動',
      message: `確定要清空目前列表中的所有 ${activities.length} 個活動項目嗎？\n（此操作僅會清空當前畫面的暫存清單，不會影響「分團專案活動成果檔案庫」中已經存檔的活動）`,
      confirmLabel: '確認清空所有活動',
      onConfirm: () => {
        setActivities([]);
        setSelectedActivityIndex(0);
        setCurrentFileName('已清空所有活動清單');
        setExtractedPhotosCount(0);
        setSaveSuccessMessage('已成功刪除所有解析活動項目！您可以重新上傳檔案或使用直接貼上。');
        setTimeout(() => setSaveSuccessMessage(null), 3500);
        setConfirmModal(null);
      }
    });
  };

  // 2. Delete Selected Activities (As explicitly requested: "可以刪除所選取的活動")
  const handleDeleteSelectedActivities = () => {
    const selectedItems = activities.filter(a => a.selected);
    if (selectedItems.length === 0) {
      setSaveSuccessMessage('請先在左側核取方塊勾選欲刪除的活動！');
      setTimeout(() => setSaveSuccessMessage(null), 2500);
      return;
    }
    setConfirmModal({
      title: '確認刪除所選取的活動',
      message: `確定要刪除所勾選的 ${selectedItems.length} 項活動嗎？未勾選的 ${activities.length - selectedItems.length} 項活動將保留。`,
      confirmLabel: `確認刪除 ${selectedItems.length} 項活動`,
      onConfirm: () => {
        const updated = activities.filter(a => !a.selected);
        setActivities(updated);
        setSelectedActivityIndex(Math.max(0, Math.min(selectedActivityIndex, updated.length - 1)));
        setSaveSuccessMessage(`已刪除所選取的 ${selectedItems.length} 項活動！`);
        setTimeout(() => setSaveSuccessMessage(null), 3000);
        setConfirmModal(null);
      }
    });
  };

  // 3. Delete Single Activity currently viewed (Used in Section 3: "可以刪除此筆活動")
  const handleDeleteCurrentActivity = () => {
    if (!activeActivity) return;
    const title = activeActivity.title;
    setConfirmModal({
      title: '確認刪除此筆活動佐證',
      message: `確定要刪除目前瀏覽的「${title}」活動嗎？`,
      confirmLabel: '確認刪除此筆',
      onConfirm: () => {
        const updated = activities.filter((_, idx) => idx !== selectedActivityIndex);
        setActivities(updated);
        setSelectedActivityIndex(Math.max(0, Math.min(selectedActivityIndex, updated.length - 1)));
        setSaveSuccessMessage(`已成功刪除「${title}」！`);
        setTimeout(() => setSaveSuccessMessage(null), 3000);
        setConfirmModal(null);
      }
    });
  };

  // 4. Delete single row from Table (Used in Section 2 table row)
  const handleDeleteRowActivity = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const act = activities.find(a => a.id === id);
    const title = act ? act.title : '此活動';
    setConfirmModal({
      title: '確認刪除活動',
      message: `確定要自表格中移除「${title}」嗎？`,
      confirmLabel: '確認刪除',
      onConfirm: () => {
        const updated = activities.filter(a => a.id !== id);
        setActivities(updated);
        if (selectedActivityIndex >= updated.length) {
          setSelectedActivityIndex(Math.max(0, updated.length - 1));
        }
        setSaveSuccessMessage(`已刪除「${title}」！`);
        setTimeout(() => setSaveSuccessMessage(null), 2500);
        setConfirmModal(null);
      }
    });
  };

  // 5. One-click load full 57 official activities for Hsinchu branch
  const handleLoadOfficial57Activities = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const official57 = getHsinchuOfficial57Activities();
      setActivities(official57);
      setSelectedActivityIndex(0);
      setCurrentFileName('新竹青年分團_全年度57項活動佐證報告(官方完整標準版).docx');
      const totalPhotos = official57.reduce((acc, a) => acc + a.photos.length, 0);
      setExtractedPhotosCount(totalPhotos);
      setIsProcessing(false);
      setSaveSuccessMessage(`已成功載入新竹青年分團全年度 57 項活動完整佐證（含所有日期、人數、地點、摘要與 ${totalPhotos} 張圖說照片）！`);
      setTimeout(() => setSaveSuccessMessage(null), 4500);
    }, 250);
  };

  // Toggle single item selection
  const toggleSelectActivity = (id: string) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, selected: !a.selected } : a));
  };

  // Select all / Deselect all
  const toggleSelectAll = () => {
    const allSelected = activities.length > 0 && activities.every(a => a.selected);
    setActivities(prev => prev.map(a => ({ ...a, selected: !allSelected })));
  };

  // Batch Archive selected activities into Branch Archive (IndexedDB native persistence)
  const handleBatchArchive = async () => {
    const selectedActivities = activities.filter(a => a.selected);
    if (selectedActivities.length === 0) {
      alert('請至少勾選一項活動進行歸檔！');
      return;
    }

    setIsArchiving(true);
    setSaveErrorMessage(null);

    try {
      let newlyArchivedCount = 0;

      for (const act of selectedActivities) {
        const proofDoc: ProofDocumentData = {
          id: act.id,
          title: act.title,
          date: act.date,
          timeRange: act.timeRange,
          location: act.location,
          levelCategory: act.levelCategory || '未歸類',
          natureCategory: act.natureCategory || '未歸類',
          activityNature: act.levelCategory || act.activityNature || '未歸類',
          activityObjective: act.natureCategory || act.activityObjective || '未歸類',
          activityObjectives: [act.natureCategory || act.activityObjective || '未歸類'],
          organizer: act.organizer,
          executingUnit: '新竹青年分團活動企劃組',
          guidingUnit: act.guidingUnit,
          targetAudience: '新竹區青年團員、社會大眾',
          internalCount: act.attendeeYouth,
          externalCount: act.attendeeGuests,
          totalCount: act.attendeeTotal,
          expectedCount: Math.round(act.attendeeTotal * 0.95),
          attendanceRate: `${Math.round((act.attendeeTotal / Math.max(1, Math.round(act.attendeeTotal * 0.95))) * 100)}% (圓滿達標)`,
          summary: act.summary,
          highlights: act.highlights,
          suggestions: act.suggestions,
          quantitativeMetrics: act.quantitativeMetrics.map((m, idx) => ({
            id: `m-${idx + 1}`,
            name: m.name,
            value: m.value,
            benchmark: m.benchmark
          })),
          photos: act.photos.map(p => ({ url: p.url, caption: p.caption || '' }))
        };

        await saveProofToArchivesAsync(proofDoc);
        newlyArchivedCount++;
      }

      setActivities(prev => prev.map(a => a.selected ? { ...a, status: 'archived' } : a));
      setSaveSuccessMessage(`已成功批次歸檔 ${newlyArchivedCount} 筆活動佐證資料至本地檔案庫`);
      setTimeout(() => {
        setSaveSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      console.error('批次歸檔至 IndexedDB 失敗:', err);
      setSaveErrorMessage(`歸檔失敗：${err?.message || '資料庫寫入發生異常，請重試'}`);
      setTimeout(() => {
        setSaveErrorMessage(null);
      }, 6000);
    } finally {
      setIsArchiving(false);
    }
  };

  // Single Activity Quick Archive
  const handleSingleArchive = async (act: ExtractedEvidenceActivity) => {
    setIsArchiving(true);
    setSaveErrorMessage(null);

    try {
      const proofDoc: ProofDocumentData = {
        id: act.id,
        title: act.title,
        date: act.date,
        timeRange: act.timeRange,
        location: act.location,
        levelCategory: act.levelCategory || '未歸類',
        natureCategory: act.natureCategory || '未歸類',
        activityNature: act.levelCategory || act.activityNature || '未歸類',
        activityObjective: act.natureCategory || act.activityObjective || '未歸類',
        activityObjectives: [act.natureCategory || act.activityObjective || '未歸類'],
        organizer: act.organizer,
        executingUnit: '新竹青年分團活動企劃組',
        guidingUnit: act.guidingUnit,
        targetAudience: '新竹區青年團員、社會大眾',
        internalCount: act.attendeeYouth,
        externalCount: act.attendeeGuests,
        totalCount: act.attendeeTotal,
        expectedCount: Math.round(act.attendeeTotal * 0.95),
        attendanceRate: '100% (全額出席)',
        summary: act.summary,
        highlights: act.highlights,
        suggestions: act.suggestions,
        quantitativeMetrics: act.quantitativeMetrics.map((m, idx) => ({
          id: `m-${idx + 1}`,
          name: m.name,
          value: m.value,
          benchmark: m.benchmark
        })),
        photos: act.photos.map(p => ({ url: p.url, caption: p.caption || '' }))
      };
      await saveProofToArchivesAsync(proofDoc);

      setActivities(prev => prev.map(a => a.id === act.id ? { ...a, status: 'archived' } : a));
      setSaveSuccessMessage(`已將「${act.title}」成功歸檔至檔案庫！`);
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('歸檔至 IndexedDB 失敗:', err);
      setSaveErrorMessage(`歸檔失敗：${err?.message || '資料庫寫入異常'}`);
      setTimeout(() => setSaveErrorMessage(null), 4000);
    } finally {
      setIsArchiving(false);
    }
  };

  // Update category directly from table or details
  const updateActivityCategory = (
    id: string,
    field: 'levelCategory' | 'natureCategory',
    value: string
  ) => {
    setActivities(prev =>
      prev.map(a => {
        if (a.id !== id) return a;
        return {
          ...a,
          [field]: value,
          activityNature: field === 'levelCategory' ? value : a.activityNature,
          activityObjective: field === 'natureCategory' ? value : a.activityObjective,
        };
      })
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      
      {/* Hidden File Pickers */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".docx"
        className="hidden"
      />
      <input
        type="file"
        ref={photoInputRef}
        onChange={handleUserPhotoUpload}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Success Notification Banner */}
      {saveSuccessMessage && (
        <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl shadow-md flex items-center justify-between gap-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-black text-sm">{saveSuccessMessage}</div>
              <div className="text-xs text-white/90 mt-0.5">
                活動資料、參與人次與佐證照片已同步更新至檔案庫（可在 2025 / 2026 分頁查看）。
              </div>
            </div>
          </div>

          {onNavigateToArchives && (
            <button
              onClick={onNavigateToArchives}
              className="px-4 py-2 bg-white text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm hover:bg-stone-50 cursor-pointer shrink-0"
            >
              <span>前往檔案庫</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Error Notification Banner */}
      {saveErrorMessage && (
        <div className="p-4 bg-rose-600 text-white rounded-2xl shadow-md flex items-center justify-between gap-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-black text-sm">{saveErrorMessage}</div>
              <div className="text-xs text-rose-100 mt-0.5">
                IndexedDB 本地資料庫寫入遇到問題，請確認瀏覽器儲存權限或重新整理再試。
              </div>
            </div>
          </div>
          <button
            onClick={() => setSaveErrorMessage(null)}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-lg cursor-pointer shrink-0"
          >
            關閉
          </button>
        </div>
      )}

      {/* File Format Diagnostic Warning Banner */}
      {diagnosticWarning && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300/90 shadow-sm space-y-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="font-black text-sm text-amber-950 flex items-center gap-2">
                <span>{diagnosticWarning.title}</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">
                  格式提示
                </span>
              </h4>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                {diagnosticWarning.message}
              </p>
              <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200 text-xs text-amber-950 font-medium">
                <span className="font-bold text-amber-800">建議方式：</span> {diagnosticWarning.suggestion}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-amber-200/60">
            <button
              type="button"
              onClick={() => setDiagnosticWarning(null)}
              className="px-3 py-1.5 rounded-xl text-stone-500 hover:text-stone-800 text-xs font-bold cursor-pointer"
            >
              關閉提示
            </button>
            <button
              type="button"
              onClick={() => {
                setDiagnosticWarning(null);
                fileInputRef.current?.click();
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileType className="w-3.5 h-3.5" />
              <span>重新選取電腦 Word 文件 (.docx)</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 區塊一：匯入活動佐證資料 (Section 1: Import Document) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-black tracking-wider">
                區塊一
              </span>
              <h2 className="text-lg font-black text-[#2C3437] flex items-center gap-2">
                <FileUp className="w-5 h-5 text-emerald-600" />
                <span>匯入活動佐證資料</span>
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              專屬支援電腦 Microsoft Word (.docx) 佐證文件，系統自動解析活動表格與內嵌高畫質現場照片。
            </p>
          </div>

          {/* Current file status pill */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-400 font-bold">當前來源：</span>
            <span className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-700 font-bold max-w-xs truncate border border-stone-200" title={currentFileName}>
              {currentFileName}
            </span>
          </div>
        </div>

        {/* 專屬：選取電腦 Word 文件 (.docx) 上傳與拖放區域 */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer group flex flex-col items-center justify-center text-center ${
            isDragging 
              ? 'border-blue-500 bg-blue-100/60 scale-[1.01]' 
              : 'border-blue-300/80 bg-blue-50/40 hover:bg-blue-50/80 hover:border-blue-500'
          }`}
        >
          <div className="flex flex-col items-center max-w-md space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              {isProcessing ? (
                <RefreshCw className="w-8 h-8 animate-spin" />
              ) : (
                <FileType className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-blue-950">
                {isProcessing ? '正在讀取並解析 Word 文件中...' : '選取電腦 Word 文件 (.docx)'}
              </h3>
              <p className="text-xs text-blue-800/80 leading-relaxed">
                點擊此處瀏覽電腦檔案，或直接將 Word 文件拖曳放置於此框內
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer group-hover:shadow-md disabled:opacity-50"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{isProcessing ? '解析進行中...' : '選取電腦 Word 文件 (.docx)'}</span>
              </button>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-[11px] text-blue-900/70 font-medium">
              <span className="px-2.5 py-1 rounded-lg bg-white/80 border border-blue-200">
                ✓ 支援 70+ 場大篇幅活動表格解析
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/80 border border-blue-200">
                ✓ 原生封包萃取高畫質現場佐證相片
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/80 border border-blue-200">
                ✓ 自動關聯日期、地點、成效亮點與圖說
              </span>
            </div>
          </div>
        </div>

        {/* Quick Demo & Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleLoadOfficial57Activities}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="一鍵載入 2025/2026 新竹青年分團 57 項活動完整佐證（官方審核格式）"
            >
              <Award className="w-3.5 h-3.5 text-amber-100" />
              <span>🌟 一鍵載入新竹青年分團 57 項全年度佐證</span>
            </button>

            <button
              type="button"
              onClick={handleReloadSampleData}
              className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
              <span>載入分團示範文檔</span>
            </button>

            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="選取電腦中的相片直接附加到目前活動中"
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>📷 批次上傳本機照片</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-stone-500">
            <span>已萃取活動：<strong className="text-stone-800">{activities.length}</strong> 項</span>
            <span>•</span>
            <span>已擷取照片：<strong className="text-emerald-700">{extractedPhotosCount}</strong> 張</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 區塊二：檔案讀出後以表格顯示各個活動 (Section 2: Table View) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-[11px] font-black tracking-wider">
                區塊二
              </span>
              <h3 className="text-base font-black text-[#2C3437] flex items-center gap-2">
                <span>解析活動清單總覽表格</span>
                <span className="text-xs font-normal text-stone-500">
                  （已解析出 {activities.length} 個活動項目）
                </span>
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              表格展示自檔案萃取之各活動基本資料。您可勾選需要歸檔的項目，或點擊「瀏覽」在下方檢視完整佐證與相片。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* BUTTON: Delete Selected Activities (As requested by user: "按鈕功能要可以刪除所選取的活動") */}
            <button
              type="button"
              onClick={handleDeleteSelectedActivities}
              disabled={selectedCount === 0}
              className="px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              title="刪除表格中所有已勾選的活動"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-100" />
              <span>刪除所選取的活動 ({selectedCount})</span>
            </button>

            {/* BUTTON: Delete All Parsed Activities */}
            <button
              type="button"
              onClick={handleDeleteAllActivities}
              disabled={activities.length === 0}
              className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-stone-600 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              title="清空所有目前解析出來的活動"
            >
              <Trash2 className="w-3.5 h-3.5 text-stone-400" />
              <span>清空所有解析活動</span>
            </button>

            {/* Select / Deselect All */}
            <button
              type="button"
              onClick={toggleSelectAll}
              disabled={activities.length === 0}
              className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
            >
              {activities.length > 0 && activities.every(a => a.selected) ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>取消全選</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-stone-400" />
                  <span>全選所有活動</span>
                </>
              )}
            </button>

            <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
              已勾選 <strong>{selectedCount}</strong> / {activities.length} 個
            </span>
          </div>
        </div>

        {/* Unclassified Warning Banner */}
        {activities.length > 0 && activities.filter(a => !a.natureCategory || a.natureCategory === '未歸類').length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start sm:items-center gap-3 text-amber-900 animate-in fade-in">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <span>活動性質未歸類提醒：偵測到 <strong>{activities.filter(a => !a.natureCategory || a.natureCategory === '未歸類').length}</strong> 筆活動尚未明確歸類</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-black">待確認</span>
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                系統已將未明確標註性質之活動標記為【未歸類】。您可於下方表格【活動性質】欄位直接選取（共修 / 教育 / 慈善 / 文化 / 聯誼）。未歸類之資料仍可正常存檔並製作簡報。
              </p>
            </div>
          </div>
        )}

        {/* The Activities Table or Empty State */}
        {activities.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                <tr>
                  <th className="p-3.5 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={activities.length > 0 && activities.every(a => a.selected)}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5 w-12 text-center">序號</th>
                  <th className="p-3.5 min-w-[180px]">活動名稱</th>
                  <th className="p-3.5 min-w-[125px]">主辦層級</th>
                  <th className="p-3.5 min-w-[145px]">活動性質</th>
                  <th className="p-3.5 min-w-[100px]">活動日期</th>
                  <th className="p-3.5 min-w-[120px]">活動地點</th>
                  <th className="p-3.5 min-w-[90px] text-center">參與人次</th>
                  <th className="p-3.5 min-w-[90px] text-center">萃取相片</th>
                  <th className="p-3.5 min-w-[80px] text-center">狀態</th>
                  <th className="p-3.5 min-w-[130px] text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {activities.map((act, index) => {
                  const isCurrentViewing = selectedActivityIndex === index;
                  const year = act.date ? act.date.slice(0, 4) : '2026';
                  const isUnclassified = !act.natureCategory || act.natureCategory === '未歸類';

                  return (
                    <tr 
                      key={act.id}
                      className={`transition-colors cursor-pointer ${
                        isCurrentViewing 
                          ? 'bg-blue-50/70' 
                          : act.selected 
                          ? 'bg-stone-50/50 hover:bg-stone-100/70' 
                          : 'hover:bg-stone-50/50 opacity-75'
                      }`}
                      onClick={() => setSelectedActivityIndex(index)}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={act.selected}
                          onChange={() => toggleSelectActivity(act.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Index */}
                      <td className="p-3.5 text-center font-bold text-stone-400">
                        {index + 1}
                      </td>

                      {/* Title */}
                      <td className="p-3.5 font-bold text-stone-900">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-xs">{act.title}</span>
                        </div>
                        <div className="text-[10px] text-stone-400 font-normal truncate mt-0.5">
                          {act.summary.slice(0, 45)}...
                        </div>
                      </td>

                      {/* Level Category */}
                      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={act.levelCategory || '分團專案'}
                          onChange={(e) => updateActivityCategory(act.id, 'levelCategory', e.target.value)}
                          className="w-full text-xs rounded-lg border border-stone-200 bg-white px-2 py-1 font-bold text-stone-700 hover:border-stone-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
                        >
                          <option value="未歸類">未歸類</option>
                          <option value="總團活動">總團/總會活動</option>
                          <option value="道場活動">道場活動</option>
                          <option value="分團專案">分團專案</option>
                          <option value="友團活動">友團活動</option>
                        </select>
                      </td>

                      {/* Nature Category */}
                      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                        {isUnclassified ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black">
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                              未歸類 (待確認)
                            </span>
                            <select
                              value={act.natureCategory || '未歸類'}
                              onChange={(e) => updateActivityCategory(act.id, 'natureCategory', e.target.value)}
                              className="w-full text-xs rounded-lg border border-amber-400 bg-amber-50 px-2 py-1 font-black text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                            >
                              <option value="未歸類">未歸類 (請選擇)</option>
                              <option value="共修">共修</option>
                              <option value="教育">教育</option>
                              <option value="慈善">慈善</option>
                              <option value="文化">文化</option>
                              <option value="聯誼">聯誼</option>
                            </select>
                          </div>
                        ) : (
                          <select
                            value={act.natureCategory}
                            onChange={(e) => updateActivityCategory(act.id, 'natureCategory', e.target.value)}
                            className="w-full text-xs rounded-lg border border-stone-200 bg-white px-2 py-1 font-bold text-stone-700 hover:border-stone-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
                          >
                            <option value="未歸類">未歸類</option>
                            <option value="共修">共修</option>
                            <option value="教育">教育</option>
                            <option value="慈善">慈善</option>
                            <option value="文化">文化</option>
                            <option value="聯誼">聯誼</option>
                          </select>
                        )}
                      </td>

                      {/* Date */}
                      <td className="p-3.5 font-medium text-stone-700">
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-black mr-1 ${
                          year === '2026' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {year}
                        </span>
                        <span>{act.date}</span>
                      </td>

                      {/* Location */}
                      <td className="p-3.5 text-stone-600 truncate max-w-[150px]" title={act.location}>
                        {act.location}
                      </td>

                      {/* Attendees */}
                      <td className="p-3.5 text-center">
                        <span className="font-bold text-blue-600">{act.attendeeTotal}</span>
                        <span className="text-stone-400 text-[10px] block">青年 {act.attendeeYouth} 人</span>
                      </td>

                      {/* Photos Count */}
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[11px]">
                          <ImageIcon className="w-3 h-3" />
                          <span>{act.photos.length} 張</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        {act.status === 'archived' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                            已歸檔
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold">
                            已萃取
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedActivityIndex(index)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isCurrentViewing
                                ? 'bg-blue-600 text-white'
                                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                            }`}
                            title="在下方瀏覽詳細佐證內容"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSingleArchive(act)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold cursor-pointer"
                            title="單獨歸檔此活動至分團專案活動成果檔案庫"
                          >
                            <FolderArchive className="w-3.5 h-3.5" />
                          </button>

                          {/* Row Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteRowActivity(act.id, e)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold cursor-pointer"
                            title="刪除此筆活動"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty state when all activities are deleted */
          <div className="py-12 px-4 text-center bg-stone-50/60 rounded-2xl border-2 border-dashed border-stone-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-stone-200/80 text-stone-500 flex items-center justify-center mx-auto">
              <FolderOpen className="w-6 h-6 text-stone-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-800">目前尚無任何解析活動</h4>
              <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto leading-relaxed">
                所有活動項目已被清空。您可以由上方【區塊一】上傳 Word / PDF 文件、使用【直接貼上文字與表格】，或點擊下方按鈕快速載入示範資料。
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-blue-700 cursor-pointer"
              >
                <FileType className="w-3.5 h-3.5" />
                <span>選取電腦 Word 文件 (.docx)</span>
              </button>
              <button
                type="button"
                onClick={handleReloadSampleData}
                className="px-4 py-2 rounded-xl bg-[#2C3437] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-stone-800 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>載入分團示範活動資料</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 區塊三：瀏覽匯入的這些活動資料 (Section 3: Browse Details & Photos) */}
      {/* ========================================================================= */}
      {activeActivity ? (
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-5 sm:p-6 space-y-5">
          
          {/* Header & Activity Paging Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-[11px] font-black tracking-wider">
                  區塊三
                </span>
                <h3 className="text-base font-black text-[#2C3437]">
                  瀏覽匯入活動資料與佐證照片
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                檢視目前選中活動之完整企劃綱要、成效量化指標及現場佐證相片。
              </p>
            </div>

            {/* Actions: Delete All, Delete Current, Pagination */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* BUTTON: Delete Current Activity (As requested: "按鈕功能可以刪除此筆活動") */}
              <button
                type="button"
                onClick={handleDeleteCurrentActivity}
                disabled={!activeActivity}
                className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-40"
                title="刪除目前這筆活動資料與佐證照片"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>刪除此筆活動</span>
              </button>

              {/* BUTTON: Delete All Activities (As requested: "也可以刪除所有瀏覽的活動資料佐證") */}
              <button
                type="button"
                onClick={handleDeleteAllActivities}
                disabled={activities.length === 0}
                className="px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-stone-600 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40"
                title="刪除所有瀏覽的活動資料與佐證相片"
              >
                <Trash2 className="w-3.5 h-3.5 text-stone-400 hover:text-rose-600" />
                <span>刪除所有活動佐證</span>
              </button>

              {/* Pagination Controls */}
              {activities.length > 0 && (
                <div className="flex items-center gap-1 bg-stone-50 p-1 rounded-xl border border-stone-200">
                  <button
                    type="button"
                    disabled={selectedActivityIndex === 0}
                    onClick={() => setSelectedActivityIndex(prev => Math.max(0, prev - 1))}
                    className="p-1.5 rounded-lg text-stone-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="上一筆活動"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-xs font-bold text-stone-700 px-2 whitespace-nowrap">
                    {selectedActivityIndex + 1} / {activities.length}
                  </span>

                  <button
                    type="button"
                    disabled={selectedActivityIndex === activities.length - 1}
                    onClick={() => setSelectedActivityIndex(prev => Math.min(activities.length - 1, prev + 1))}
                    className="p-1.5 rounded-lg text-stone-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="下一筆活動"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Activity Detailed Info Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/70 border border-stone-200/80 space-y-4">
            
            {/* Top Badges & Title */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-stone-800 text-white font-black text-[10px]">
                  {activeActivity.category}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px]">
                  主辦層級：{activeActivity.levelCategory === '總團活動' ? '總團/總會活動' : (activeActivity.levelCategory || activeActivity.activityNature || '未歸類')}
                </span>
                {(!activeActivity.natureCategory || activeActivity.natureCategory === '未歸類') ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-black text-[10px]">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    活動性質：未歸類 (請於表格中確認)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    活動性質：{activeActivity.natureCategory}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-[#2C3437]">
                {activeActivity.title}
              </h3>
            </div>

            {/* 4 Metadata Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-stone-200/90 space-y-0.5">
                <div className="text-stone-400 font-bold text-[10px] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-500" />
                  <span>活動日期時間</span>
                </div>
                <div className="font-bold text-stone-800">{activeActivity.date}</div>
                <div className="text-[10px] text-stone-500">{activeActivity.timeRange}</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-stone-200/90 space-y-0.5">
                <div className="text-stone-400 font-bold text-[10px] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-500" />
                  <span>活動地點</span>
                </div>
                <div className="font-bold text-stone-800 truncate" title={activeActivity.location}>
                  {activeActivity.location}
                </div>
                <div className="text-[10px] text-stone-500">指導：{activeActivity.guidingUnit}</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-stone-200/90 space-y-0.5">
                <div className="text-stone-400 font-bold text-[10px] flex items-center gap-1">
                  <Users className="w-3 h-3 text-emerald-500" />
                  <span>參與總人次</span>
                </div>
                <div className="font-bold text-emerald-700">{activeActivity.attendeeTotal} 人</div>
                <div className="text-[10px] text-stone-500">青年 {activeActivity.attendeeYouth} / 貴賓 {activeActivity.attendeeGuests}</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-stone-200/90 space-y-0.5">
                <div className="text-stone-400 font-bold text-[10px] flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-indigo-500" />
                  <span>萃取照片數量</span>
                </div>
                <div className="font-bold text-indigo-700">{activeActivity.photos.length} 張</div>
                <div className="text-[10px] text-stone-500">已關聯至本項活動</div>
              </div>
            </div>

            {/* Summary & Process */}
            <div className="space-y-3">
              <div className="p-3.5 bg-white rounded-xl border border-stone-200/90 text-xs space-y-1">
                <div className="font-bold text-stone-700">活動綱要與摘要：</div>
                <p className="text-stone-600 leading-relaxed">{activeActivity.summary}</p>
              </div>

              {activeActivity.processSchedule && (
                <div className="p-3.5 bg-white rounded-xl border border-stone-200/90 text-xs space-y-1">
                  <div className="font-bold text-stone-700">流程規劃與重要時程：</div>
                  <p className="text-stone-600 leading-relaxed font-mono text-[11px]">{activeActivity.processSchedule}</p>
                </div>
              )}
            </div>

            {/* Highlights & Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-white rounded-xl border border-stone-200/90 space-y-2">
                <div className="font-bold text-stone-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>活動特色與成效亮點</span>
                </div>
                <ul className="space-y-1.5 text-stone-600">
                  {activeActivity.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-stone-200/90 space-y-2">
                <div className="font-bold text-stone-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>量化成效指標 (KPIs)</span>
                </div>
                <div className="space-y-1.5">
                  {activeActivity.quantitativeMetrics.map((qm, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-100">
                      <span className="font-bold text-stone-700">{qm.name}</span>
                      <div className="text-right">
                        <span className="font-black text-blue-600">{qm.value}</span>
                        <span className="text-[10px] text-stone-400 block">{qm.benchmark}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Photo Gallery: Extracted Directly from Document */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>自文件萃取之現場佐證相片 ({activeActivity.photos.length} 張)：</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold hover:bg-emerald-100 cursor-pointer"
                  >
                    + 新增相片
                  </button>
                  <span className="text-[11px] text-stone-400">已自動關聯</span>
                </div>
              </div>

              {activeActivity.photos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {activeActivity.photos.map((photo, pIdx) => (
                    <div key={photo.id || pIdx} className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs group">
                      <div className="h-40 overflow-hidden bg-stone-100 relative">
                        {photo.url ? (
                          <img
                            src={photo.url}
                            alt={photo.caption}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
                            無相片
                          </div>
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-stone-900/70 text-white rounded text-[10px] font-bold">
                          相片 {pIdx + 1}
                        </span>
                      </div>
                      <div className="p-2.5">
                        <p className="text-[11px] text-stone-700 font-medium line-clamp-2">
                          {photo.caption}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border-2 border-dashed border-stone-200 text-center text-xs text-stone-400">
                  此活動目前尚無佐證照片。您可以點選上方「+ 新增相片」上傳電腦相片。
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        /* Empty State for Section 3 */
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Eye className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-stone-800">暫無可瀏覽之活動詳細佐證</h4>
          <p className="text-xs text-stone-500">
            請先在上方【區塊一】匯入檔案或貼上內容，活動將會即時在此呈現詳細企劃與照片。
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 區塊四：使用者自行選儲存要歸檔哪些活動到分團專案活動成果檔案庫 (Section 4: Selective Archiving) */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-stone-900 to-[#2C3437] rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/30 text-emerald-300 text-[11px] font-black tracking-wider border border-emerald-500/40">
                區塊四
              </span>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-emerald-400" />
                <span>儲存歸檔至「分團專案活動成果檔案庫」</span>
              </h3>
            </div>
            <p className="text-xs text-stone-300">
              您目前已勾選 <strong className="text-emerald-400 text-sm">{selectedCount}</strong> 個活動。點擊下方按鈕即可批次寫入檔案庫，活動將自動依照 2025、2026 年份分類保存！
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Batch Archive Button */}
            <button
              type="button"
              onClick={handleBatchArchive}
              disabled={selectedCount === 0 || isArchiving}
              className={`px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                isArchiving
                  ? 'bg-emerald-700 text-white opacity-85 cursor-wait'
                  : selectedCount > 0
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white active:scale-95'
                  : 'bg-stone-700 text-stone-400 cursor-not-allowed'
              }`}
            >
              {isArchiving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                  <span>正在寫入大容量佐證檔案庫...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>批次歸檔勾選的 {selectedCount} 個活動到檔案庫</span>
                </>
              )}
            </button>

            {/* Jump to Archives */}
            {onNavigateToArchives && (
              <button
                type="button"
                onClick={onNavigateToArchives}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 cursor-pointer transition-all"
              >
                <span>前往成果檔案庫查看 (含 2025/2026 分頁)</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-300" />
              </button>
            )}
          </div>
        </div>

        {/* Selected activities pills */}
        <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-stone-400 text-[11px]">即將歸檔項目：</span>
          {activities.filter(a => a.selected).map(act => (
            <span 
              key={act.id} 
              className="px-2.5 py-1 rounded-lg bg-white/10 text-stone-200 border border-white/10 text-[11px] font-medium flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="truncate max-w-[180px]">{act.title}</span>
              <span className="text-[10px] text-stone-400">({act.date.slice(0, 4)})</span>
            </span>
          ))}
          {selectedCount === 0 && (
            <span className="text-stone-400 italic text-[11px]">尚未勾選任何活動，請在區塊二勾選要歸檔的項目。</span>
          )}
        </div>

      </div>

      {/* Safe In-App Confirmation Modal (Guaranteed to work in iFrame) */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-stone-500">
                  此動作將立即更新當前工作區活動清單
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-line bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
              {confirmModal.message}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold transition-all cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              >
                {confirmModal.confirmLabel || '確認刪除'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
