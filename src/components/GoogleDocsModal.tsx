import React, { useState, useEffect } from 'react';
import { 
  FileText, 
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
  Share2,
  Download,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { User } from 'firebase/auth';
import { getAccessToken, initAuth } from '../services/googleAuth';
import { 
  listGoogleDocs, 
  getGoogleDoc, 
  extractTextFromDoc, 
  exportActivityToGoogleDoc, 
  exportMultipleActivitiesToGoogleDoc,
  createGoogleDoc,
  GoogleDocItem, 
  DocExportResult,
  ActivityForDocExport
} from '../services/googleDocs';
import { GoogleSignInButton } from './GoogleSignInButton';
import { ActivityRecordItem } from '../types';

interface GoogleDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetActivity?: ActivityRecordItem | null;
  selectedActivities?: ActivityRecordItem[];
  onImportDocText?: (text: string, title?: string) => void;
}

export const GoogleDocsModal: React.FC<GoogleDocsModalProps> = ({
  isOpen,
  onClose,
  targetActivity,
  selectedActivities = [],
  onImportDocText,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'export' | 'browse' | 'create'>('export');

  // Export State
  const [docTitle, setDocTitle] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportResult, setExportResult] = useState<DocExportResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [userConfirmedMutation, setUserConfirmedMutation] = useState<boolean>(false);
  const [batchMode, setBatchMode] = useState<boolean>(false);

  // Browse State
  const [docsList, setDocsList] = useState<GoogleDocItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(false);
  const [importingDocId, setImportingDocId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
        if (token && isOpen && activeTab === 'browse') {
          loadDocs(token);
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

  // Set default title when target changes
  useEffect(() => {
    if (targetActivity) {
      setDocTitle(`【成果佐證】${targetActivity.date}_${targetActivity.title}`);
      setBatchMode(false);
    } else if (selectedActivities.length > 0) {
      setDocTitle(`【優秀分團選拔佐證手冊】共${selectedActivities.length}項活動_${new Date().toISOString().slice(0, 10)}`);
      setBatchMode(true);
    } else {
      setDocTitle(`【佛光青年活動紀錄報告】_${new Date().toISOString().slice(0, 10)}`);
    }
    setExportResult(null);
    setExportError(null);
    setUserConfirmedMutation(false);
  }, [targetActivity, selectedActivities, isOpen]);

  // Load docs when switching to browse tab
  const loadDocs = async (token?: string) => {
    const t = token || accessToken;
    if (!t) return;
    setIsLoadingDocs(true);
    try {
      const list = await listGoogleDocs(t, searchQuery);
      setDocsList(list);
    } catch (err: any) {
      console.error('Failed to list Google Docs:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'browse' && accessToken) {
      loadDocs(accessToken);
    }
  }, [isOpen, activeTab]);

  const handleExport = async () => {
    if (!accessToken) {
      setExportError('請先登入 Google 帳號以取得授權');
      return;
    }
    if (!userConfirmedMutation) {
      setExportError('請勾選下方確認方塊以授權建立 Google 文件');
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      let result: DocExportResult;

      if (batchMode && selectedActivities.length > 0) {
        result = await exportMultipleActivitiesToGoogleDoc(
          accessToken,
          selectedActivities,
          docTitle
        );
      } else if (targetActivity) {
        result = await exportActivityToGoogleDoc(accessToken, {
          ...targetActivity,
          title: docTitle.replace(/^【成果佐證】\d{4}-\d{2}-\d{2}_/, '') || targetActivity.title,
        });
      } else {
        // Create an empty report template
        result = await createGoogleDoc(accessToken, docTitle);
      }

      setExportResult(result);
    } catch (err: any) {
      console.error('Export to Google Docs failed:', err);
      setExportError(err.message || '匯出 Google 文件失敗，請檢查權限設定');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportDoc = async (doc: GoogleDocItem) => {
    if (!accessToken) return;
    setImportingDocId(doc.id);
    try {
      const docData = await getGoogleDoc(accessToken, doc.id);
      const text = extractTextFromDoc(docData);
      if (onImportDocText) {
        onImportDocText(text, doc.name);
      }
      onClose();
    } catch (err: any) {
      alert(`讀取 Google 文件失敗：${err.message}`);
    } finally {
      setImportingDocId(null);
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
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-[#FDFBF7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-stone-900">Google 文件 (Google Docs) 整合中心</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  雲端公文與佐證
                </span>
              </div>
              <p className="text-xs text-stone-500">
                直接將成果報告產出至 Google 文件，或由 Google Drive 匯入文稿
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
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>匯出公文至 Google 文件</span>
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'browse'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>瀏覽雲端文件並匯入</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Unauthenticated Warning */}
          {!accessToken && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-black text-amber-900">需要 Google 帳號授權</h4>
                <p className="text-xs text-amber-800/90 leading-relaxed">
                  本系統將在經您授權的 Google 雲端硬碟中建立並同步 Google 文件。請點擊右上角「Sign in with Google」登入。
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              
              {/* Target Details Card */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="text-xs font-black text-stone-800 flex items-center justify-between">
                  <span>📄 匯出目標資料</span>
                  {selectedActivities.length > 1 && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-stone-600 flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={batchMode}
                          onChange={(e) => setBatchMode(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>批次彙編全部 {selectedActivities.length} 項活動</span>
                      </label>
                    </div>
                  )}
                </div>

                {batchMode ? (
                  <div className="text-xs text-stone-600 space-y-1">
                    <p className="font-semibold text-blue-900">
                      即將把選取的 {selectedActivities.length} 項活動完整佐證（含宗旨、出席人數、成效與亮點）編排為完整版「優秀分團選拔佐證手冊」Google 文件。
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedActivities.slice(0, 5).map((a) => (
                        <span key={a.id} className="px-2 py-0.5 bg-white border border-stone-200 rounded text-[11px] text-stone-700">
                          {a.title}
                        </span>
                      ))}
                      {selectedActivities.length > 5 && (
                        <span className="px-1.5 py-0.5 text-[11px] text-stone-400">
                          +{selectedActivities.length - 5} 案
                        </span>
                      )}
                    </div>
                  </div>
                ) : targetActivity ? (
                  <div className="text-xs text-stone-700 space-y-1">
                    <p className="font-bold text-stone-900 text-sm">{targetActivity.title}</p>
                    <div className="flex items-center gap-3 text-stone-500 text-[11px]">
                      <span>📅 {targetActivity.date}</span>
                      <span>📍 {targetActivity.location}</span>
                      <span>👥 出席 {targetActivity.attendeeTotal || 0} 人</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500">
                    目前尚未選取特定活動，將直接建立一份全新的佛光青年公文報告範本。
                  </p>
                )}
              </div>

              {/* Document Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Google 文件名稱</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="請輸入 Google 文件標題"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* Mandatory Explicit Confirmation for Workspace Mutation */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userConfirmedMutation}
                    onChange={(e) => setUserConfirmedMutation(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="text-xs text-blue-900 leading-relaxed">
                    <span className="font-black">確認授權建立 Google 文件</span>：我同意在我的 Google 雲端硬碟中建立新文件《{docTitle}》，並寫入活動佐證排版內容。
                  </div>
                </label>
              </div>

              {/* Export Button */}
              <div className="pt-2">
                <button
                  onClick={handleExport}
                  disabled={isExporting || !accessToken || !userConfirmedMutation}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>正在建立 Google 文件並寫入佐證內容...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>立即建立並匯出至 Google 文件</span>
                    </>
                  )}
                </button>
              </div>

              {exportError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {exportError}
                </div>
              )}

              {/* Export Success Result Card */}
              {exportResult && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Google 文件已成功建立並同步至雲端硬碟！</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs space-y-1">
                    <div className="font-bold text-stone-900">{exportResult.title}</div>
                    <div className="text-stone-500 text-[11px] truncate">
                      文件編號：{exportResult.documentId}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={exportResult.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all"
                    >
                      <span>在 Google 文件中開啟</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleCopyUrl(exportResult.documentUrl)}
                      className="py-2 px-3 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-100/50 text-emerald-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? '已複製連結' : '複製連結'}</span>
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
                    placeholder="搜尋雲端硬碟中的 Google 文件..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadDocs()}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <button
                  onClick={() => loadDocs()}
                  disabled={isLoadingDocs || !accessToken}
                  className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDocs ? 'animate-spin' : ''}`} />
                  <span>重整</span>
                </button>
              </div>

              {/* Documents List */}
              {isLoadingDocs ? (
                <div className="py-12 text-center text-xs text-stone-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                  <p>正在讀取您的 Google 雲端文件...</p>
                </div>
              ) : docsList.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-400">
                  {accessToken ? '雲端硬碟中找不到相符的 Google 文件' : '請先點擊上方登入 Google 帳號'}
                </div>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {docsList.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl border border-stone-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-stone-900 truncate" title={doc.name}>
                            {doc.name}
                          </div>
                          <div className="text-[11px] text-stone-400">
                            最後修改：{doc.modifiedTime ? new Date(doc.modifiedTime).toLocaleDateString('zh-TW') : '無紀錄'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onImportDocText && (
                          <button
                            onClick={() => handleImportDoc(doc)}
                            disabled={importingDocId === doc.id}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="解析並將內容匯入至報告草稿"
                          >
                            {importingDocId === doc.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <ArrowRight className="w-3 h-3" />
                            )}
                            <span>匯入內文</span>
                          </button>
                        )}
                        <a
                          href={`https://docs.google.com/document/d/${doc.id}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:text-blue-600 hover:bg-white"
                          title="在 Google 文件中開啟"
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
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>支援雙向匯出與雲端讀取 ｜ 遵守 Google OAuth 最小權限原則</span>
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
