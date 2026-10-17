import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  X, 
  Check, 
  RefreshCw, 
  ExternalLink, 
  Sparkles, 
  AlertCircle, 
  LogOut, 
  Link as LinkIcon, 
  Plus, 
  CheckCircle2, 
  Settings2,
  Table
} from 'lucide-react';
import { CheckInRecord } from '../types';
import { 
  googleSignIn, 
  getAccessToken, 
  logoutGoogle, 
  initAuth 
} from '../services/googleAuth';
import { 
  createPunchInSpreadsheet, 
  syncAllRecordsToSheet, 
  appendRecordsToSheet, 
  getSpreadsheetMetadata,
  getStoredSheetInfo,
  saveStoredSheetInfo,
  getStoredAutoSyncSetting,
  saveStoredAutoSyncSetting,
  SpreadsheetInfo 
} from '../services/googleSheets';
import { User } from 'firebase/auth';

interface AdminGoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: CheckInRecord[];
  onAutoSyncChanged?: (enabled: boolean, sheet: SpreadsheetInfo | null) => void;
}

export const AdminGoogleSheetsSyncModal: React.FC<AdminGoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  records,
  onAutoSyncChanged,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [currentSheet, setCurrentSheet] = useState<SpreadsheetInfo | null>(null);
  const [autoSync, setAutoSync] = useState<boolean>(false);

  const [customSheetInput, setCustomSheetInput] = useState('');
  const [isBinding, setIsBinding] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load saved sheet and auto-sync setting on mount
  useEffect(() => {
    const saved = getStoredSheetInfo();
    if (saved) setCurrentSheet(saved);
    setAutoSync(getStoredAutoSyncSetting());
  }, []);

  // Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // When modal opens, check current token
  useEffect(() => {
    if (isOpen) {
      getAccessToken().then((token) => {
        if (token) setAccessToken(token);
      });
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        setSuccessMsg('Google 帳號授權成功！');
      }
    } catch (err: any) {
      setErrorMsg(err.message || '登入失敗，請再試一次');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    setCurrentUser(null);
    setAccessToken(null);
  };

  const handleCreateNewSheet = async () => {
    if (!accessToken) {
      await handleSignIn();
      return;
    }

    setIsCreating(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const sheet = await createPunchInSpreadsheet(accessToken);
      setCurrentSheet(sheet);
      saveStoredSheetInfo(sheet);

      // Immediately sync approved records into the new sheet
      const approved = records.filter((r) => r.status === 'approved');
      if (approved.length > 0) {
        await appendRecordsToSheet(accessToken, sheet.id, approved);
      }

      setSuccessMsg(`已成功建立試算表「${sheet.title}」，並寫入 ${approved.length} 筆已通過打卡資料！`);
      if (onAutoSyncChanged) onAutoSyncChanged(autoSync, sheet);
    } catch (err: any) {
      setErrorMsg(err.message || '建立試算表失敗');
    } finally {
      setIsCreating(false);
    }
  };

  const handleBindExisting = async () => {
    if (!accessToken) {
      await handleSignIn();
      return;
    }

    const input = customSheetInput.trim();
    if (!input) {
      setErrorMsg('請輸入 Google 試算表連結或試算表 ID');
      return;
    }

    // Extract ID if URL: https://docs.google.com/spreadsheets/d/{ID}/edit
    let sheetId = input;
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      sheetId = match[1];
    }

    setIsBinding(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const sheet = await getSpreadsheetMetadata(accessToken, sheetId);
      setCurrentSheet(sheet);
      saveStoredSheetInfo(sheet);
      setCustomSheetInput('');
      setSuccessMsg(`成功綁定試算表：「${sheet.title}」！`);
      if (onAutoSyncChanged) onAutoSyncChanged(autoSync, sheet);
    } catch (err: any) {
      setErrorMsg(err.message || '找不到該試算表，請確認您具有該試算表的共用存取權限');
    } finally {
      setIsBinding(false);
    }
  };

  const handleSyncAllApproved = async () => {
    if (!currentSheet || !accessToken) return;

    setIsSyncing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const approved = records.filter((r) => r.status === 'approved');
      await syncAllRecordsToSheet(accessToken, currentSheet.id, approved);
      setSuccessMsg(`成功同步 ${approved.length} 筆已通過打卡紀錄至 Google 試算表！`);
    } catch (err: any) {
      setErrorMsg(err.message || '同步至試算表失敗');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleAutoSync = () => {
    const nextVal = !autoSync;
    setAutoSync(nextVal);
    saveStoredAutoSyncSetting(nextVal);
    if (onAutoSyncChanged) onAutoSyncChanged(nextVal, currentSheet);
  };

  const handleUnbind = () => {
    if (confirm('確定要解除此 Google 試算表綁定嗎？（雲端上的試算表不會被刪除）')) {
      setCurrentSheet(null);
      saveStoredSheetInfo(null);
      setAutoSync(false);
      saveStoredAutoSyncSetting(false);
      if (onAutoSyncChanged) onAutoSyncChanged(false, null);
    }
  };

  if (!isOpen) return null;

  const approvedCount = records.filter((r) => r.status === 'approved').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                Google Sheets 自動同步與試算表串接
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Official Sheets API
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                將審核通過的青年打卡運動數據，自動寫入並同步至指定的 Google 試算表
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Notification Messages */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-bold">{successMsg}</div>
            </div>
          )}

          {/* Auth Status Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {currentUser && accessToken ? (
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || ''}
                    className="w-10 h-10 rounded-full border border-emerald-300"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                    {currentUser.displayName?.[0] || 'G'}
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{currentUser.displayName || 'Google 幹部授權已連線'}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {currentUser.email}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>請先登入 Google 帳號以啟用 Google Sheets 試算表存取與自動同步</span>
              </div>
            )}

            <div>
              {currentUser && accessToken ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>登出 Google</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isAuthenticating}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer hover:scale-102"
                >
                  {isAuthenticating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Table className="w-3.5 h-3.5" />
                  )}
                  <span>使用 Google 授權連接</span>
                </button>
              )}
            </div>
          </div>

          {/* Current Connected Spreadsheet Card */}
          {currentSheet ? (
            <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">{currentSheet.title}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        已綁定
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate max-w-sm">
                      ID: {currentSheet.id}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={currentSheet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-emerald-700 text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>線上開啟</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleUnbind}
                    className="px-2.5 py-1.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 text-xs transition-colors cursor-pointer"
                    title="解除綁定"
                  >
                    解綁
                  </button>
                </div>
              </div>

              {/* Auto Sync Switch & Manual Sync Bar */}
              <div className="pt-3 border-t border-emerald-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Auto Sync Toggle */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={handleToggleAutoSync}
                    className="sr-only"
                  />
                  <div className={`w-9 h-5 rounded-full transition-colors relative ${autoSync ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-xs ${autoSync ? 'translate-x-4' : ''}`}></div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      即時自動同步 (Auto-Sync)
                    </div>
                    <div className="text-[10px] text-slate-500">
                      幹部點擊「通過審核」時，即時自動追加寫入 Google 試算表
                    </div>
                  </div>
                </label>

                {/* Manual Full Sync Button */}
                <button
                  type="button"
                  disabled={isSyncing || !accessToken}
                  onClick={handleSyncAllApproved}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>全量同步已通過資料 ({approvedCount} 筆)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Setup New or Bind Existing Section */
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-700">選擇試算表設定方式：</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Option 1: Create New */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-400 transition-all space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>選項 1：一鍵建立全新試算表（推薦）</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    自動建立標準格式 Google 試算表，預設具備 16 欄完整公務審核欄位與凍結首列。
                  </p>
                  <button
                    type="button"
                    disabled={isCreating}
                    onClick={handleCreateNewSheet}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  >
                    {isCreating ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>建立分團運動打卡試算表</span>
                  </button>
                </div>

                {/* Option 2: Bind Existing */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-400 transition-all space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                    <LinkIcon className="w-4 h-4 text-teal-600" />
                    <span>選項 2：綁定既有 Google 試算表</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    若您已有分團既有的出席統計試算表，直接貼上網址即可綁定。
                  </p>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="貼上試算表連結或 ID..."
                      value={customSheetInput}
                      onChange={(e) => setCustomSheetInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-stone-50 text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all font-mono"
                    />
                    <button
                      type="button"
                      disabled={isBinding}
                      onClick={handleBindExisting}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shrink-0 cursor-pointer transition-all"
                    >
                      {isBinding ? <RefreshCw className="w-3 h-3 animate-spin" /> : '綁定'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sync Spec Information Table */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-700 flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Google 試算表欄位規格說明：</span>
            </div>
            <div className="text-[11px] text-slate-500 leading-relaxed">
              試算表同步包含：<strong>打卡編號、團員姓名、青年身份、打卡日期、運動類型、時長(分鐘)、里程(km)、步數、燃燒熱量(kcal)、審核狀態、審核幹部、審核時間、心得備註與幹部註記</strong>。
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {autoSync ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 即時同步已啟用，審核通過將自動入表
              </span>
            ) : (
              <span>可手動點擊同步或匯出 CSV 報表</span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer"
          >
            完成並關閉
          </button>
        </div>
      </div>
    </div>
  );
};
