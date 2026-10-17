import React, { useState, useEffect, useRef } from 'react';
import { 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  X, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Download, 
  Upload, 
  FileCode, 
  Calendar, 
  Layers, 
  FolderOpen,
  ExternalLink,
  ShieldCheck,
  Settings,
  HardDrive
} from 'lucide-react';
import { AppConfig, ProjectBackupPackage } from '../types';
import { 
  getStoredAppConfig, 
  createProjectBackupPackage, 
  saveProjectDataToGas, 
  loadProjectDataFromGas, 
  exportProjectDataAsLocalJsonFile, 
  importProjectDataFromLocalJsonFile,
  restoreProjectBackupPackage
} from '../services/projectPersistence';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'save' | 'load';
  onProjectRestored?: (restoredPackage: ProjectBackupPackage) => void;
  onOpenSystemConfig?: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  mode,
  onProjectRestored,
  onOpenSystemConfig,
}) => {
  const [appConfig, setAppConfig] = useState<AppConfig>(() => getStoredAppConfig());
  const [currentPackage, setCurrentPackage] = useState<ProjectBackupPackage>(() => createProjectBackupPackage());
  const [customFileId, setCustomFileId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [lastSavedId, setLastSavedId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const cfg = getStoredAppConfig();
      setAppConfig(cfg);
      setCurrentPackage(createProjectBackupPackage());
      setCustomFileId(cfg.lastCloudFileId || '');
      setStatusMessage(null);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  // 1. 雲端真存檔 (action: 'save_project_data')
  const handleSaveToGas = async () => {
    if (!appConfig.gasEndpointUrl || !appConfig.gasEndpointUrl.trim()) {
      setStatusMessage({
        type: 'info',
        text: '尚未設定 Google Apps Script (GAS) 部署網址，請先點擊下方「開啟系統設定」進行配置，或直接下載本機備份檔。'
      });
      return;
    }

    setIsProcessing(true);
    setStatusMessage({
      type: 'info',
      text: '正在進行專案佐證圖檔最佳化並安全封裝備份中...'
    });

    try {
      const pkg = createProjectBackupPackage();
      const result = await saveProjectDataToGas(appConfig.gasEndpointUrl, pkg);

      setIsProcessing(false);
      if (result.success) {
        setLastSavedId(result.fileId || '');
        setStatusMessage({
          type: 'success',
          text: `專案已安全備份至 Google Drive！檔案 ID: ${result.fileId || '自動指派'} (${result.updatedAt?.slice(0, 16).replace('T', ' ')})`
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message || '雲端儲存失敗，請檢查網路或 GAS 部署狀態。'
        });
      }
    } catch (err: any) {
      console.error('handleSaveToGas error:', err);
      setIsProcessing(false);
      setStatusMessage({
        type: 'error',
        text: `雲端備份異常: ${err?.message || '資料過大或網路連線中斷'}`
      });
    }
  };

  // 2. 雲端真讀取 (action: 'load_project_data')
  const handleLoadFromGas = async () => {
    if (!appConfig.gasEndpointUrl || !appConfig.gasEndpointUrl.trim()) {
      setStatusMessage({
        type: 'info',
        text: '尚未設定 Google Apps Script (GAS) 部署網址，請先在設定中輸入，或上傳本機備份檔。'
      });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const result = await loadProjectDataFromGas(appConfig.gasEndpointUrl, customFileId.trim() || undefined);

      setIsProcessing(false);
      if (result.success && result.data) {
        if (onProjectRestored) {
          onProjectRestored(result.data);
        }
        setStatusMessage({
          type: 'success',
          text: `專案資料已成功還原！共還原 ${result.data.activities?.length || 0} 筆活動、${result.data.slides?.length || 0} 頁 PPT 投影片。`
        });
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message || '找不到指定的雲端備份或讀取失敗。'
        });
      }
    } catch (err: any) {
      console.error('handleLoadFromGas error:', err);
      setIsProcessing(false);
      setStatusMessage({
        type: 'error',
        text: `雲端讀取異常: ${err?.message || '連線逾時或格式錯誤'}`
      });
    }
  };

  // 3. 本機 JSON 備份檔案下載
  const handleExportLocalJson = () => {
    try {
      const pkg = createProjectBackupPackage();
      exportProjectDataAsLocalJsonFile(pkg, `hsinchu_youth_report_data_${appConfig.currentYear}.json`);
      setStatusMessage({
        type: 'success',
        text: '已成功下載專案備份檔 (hsinchu_youth_report_data.json) 至您的電腦！'
      });
    } catch (err: any) {
      console.error('handleExportLocalJson error:', err);
      setStatusMessage({
        type: 'error',
        text: `下載本機備份失敗: ${err?.message || '資料長度超出系統限制'}`
      });
    }
  };

  // 4. 本機 JSON 檔案上傳還原
  const handleSelectLocalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage(null);

    const result = await importProjectDataFromLocalJsonFile(file);
    setIsProcessing(false);

    if (result.success && result.data) {
      if (onProjectRestored) {
        onProjectRestored(result.data);
      }
      setStatusMessage({
        type: 'success',
        text: `本機備份檔還原成功！已更新 ${result.data.activities?.length || 0} 筆活動資料。`
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setStatusMessage({
        type: 'error',
        text: result.message || '本機檔案解析失敗，請確認為正確的 JSON 專案檔。'
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#2C3437] text-white flex items-center justify-between border-b border-stone-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl text-white ${mode === 'save' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
              {mode === 'save' ? <CloudUpload className="w-5 h-5" /> : <CloudDownload className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>{mode === 'save' ? '💾 雲端備份存檔' : '📂 開啟雲端備份'}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-stone-300">
                  Google Drive / JSON
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                {mode === 'save' 
                  ? '將活動庫、PPT 投影片、底圖與年度設定完整備份至 Google Drive' 
                  : '從 Google Drive 雲端或本機檔案完整反序列化灌回 React 狀態'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-stone-700">
          
          {/* Current Project Snapshot Badge */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="font-black text-stone-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>{appConfig.currentYear} 年度 ｜ {appConfig.organizationName}</span>
              </div>
              <div className="text-stone-500 text-[11px] flex items-center gap-3">
                <span>活動筆數: <strong>{currentPackage.activities.length}</strong> 場</span>
                <span>•</span>
                <span>PPT 頁數: <strong>{currentPackage.slides.length}</strong> 頁</span>
                <span>•</span>
                <span>勾選參與: <strong>{currentPackage.selectedIds.length}</strong> 場</span>
              </div>
            </div>

            {appConfig.lastSyncedAt && (
              <div className="text-right text-[11px] text-stone-400">
                <span>最後雲端同步：</span>
                <div className="font-mono text-stone-600">{appConfig.lastSyncedAt.slice(0, 16).replace('T', ' ')}</div>
              </div>
            )}
          </div>

          {/* Cloud GAS Status Banner */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs text-stone-700">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-purple-600 shrink-0" />
              <div>
                <span className="font-bold text-purple-900">GAS 雲端端點：</span>
                <span className="text-[11px] text-stone-600 ml-1 font-mono">
                  {appConfig.gasEndpointUrl ? '已配置 Google Drive 同步端點' : '未配置 (請點擊右側設定)'}
                </span>
              </div>
            </div>
            {onOpenSystemConfig && (
              <button
                type="button"
                onClick={onOpenSystemConfig}
                className="px-2.5 py-1 rounded-lg bg-white border border-purple-300 text-purple-800 hover:bg-purple-100 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Settings className="w-3 h-3" />
                <span>設定端點</span>
              </button>
            )}
          </div>

          {/* Mode 1: Save */}
          {mode === 'save' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
                <h4 className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                  <CloudUpload className="w-4 h-4 text-emerald-600" />
                  <span>方式一：直存 Google Drive 雲端專案檔 (推薦)</span>
                </h4>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  透過已部署的 Google Apps Script，自動在 Google Drive 建立或更新專屬專案檔 <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800 font-mono">hsinchu_youth_report_data.json</code>，任何裝置皆可隨時還原。
                </p>
                <button
                  type="button"
                  onClick={handleSaveToGas}
                  disabled={isProcessing}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>{isProcessing ? '正在同步存檔至 Google Drive...' : '立即將專案資料備份至 Google Drive'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
                <h4 className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-stone-600" />
                  <span>方式二：下載本機 JSON 備份檔 (零相依 100% 安全)</span>
                </h4>
                <p className="text-[11px] text-stone-500">
                  將整個專案打包為純淨的 JSON 檔案下載至個人電腦，可做為年度永久備份檔案離線保存。
                </p>
                <button
                  type="button"
                  onClick={handleExportLocalJson}
                  className="w-full py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-stone-300"
                >
                  <Download className="w-4 h-4 text-stone-600" />
                  <span>下載本機 JSON 備份檔 (hsinchu_youth_report_data.json)</span>
                </button>
              </div>
            </div>
          )}

          {/* Mode 2: Load */}
          {mode === 'load' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
                <h4 className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                  <CloudDownload className="w-4 h-4 text-blue-600" />
                  <span>方式一：從 Google Drive 雲端載入最新備份</span>
                </h4>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  自動搜尋 Google Drive 專屬備份資料夾內的最新版本並將狀態完全還原。
                </p>
                
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-stone-600">
                    指定 Google Drive 檔案 ID (選填，留空則自動抓取最新備份)
                  </label>
                  <input
                    type="text"
                    value={customFileId}
                    onChange={(e) => setCustomFileId(e.target.value)}
                    placeholder="例如 1a2B3c4D... (可留空自動抓取)"
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleLoadFromGas}
                  disabled={isProcessing}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>{isProcessing ? '正在從雲端載入並反序列化...' : '載入並還原 Google Drive 雲端備份'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
                <h4 className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-stone-600" />
                  <span>方式二：從本機上傳 JSON 專案檔還原</span>
                </h4>
                <p className="text-[11px] text-stone-500">
                  選取之前下載的 <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800 font-mono">hsinchu_youth_report_data.json</code>，一秒重建所有歷史紀錄與投影片。
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleSelectLocalFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-stone-300"
                >
                  <Upload className="w-4 h-4 text-stone-600" />
                  <span>選取電腦中的 JSON 備份檔案還原</span>
                </button>
              </div>
            </div>
          )}

          {/* Status Message Display */}
          {statusMessage && (
            <div className={`p-3 rounded-2xl text-xs font-medium flex items-start gap-2 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : statusMessage.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>具備 Debounce 本地雙層防護，即使重新部署也不遺失</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
          >
            關閉視窗
          </button>
        </div>

      </div>
    </div>
  );
};
