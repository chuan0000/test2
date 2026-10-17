import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  X, 
  Check, 
  Calendar, 
  Building2, 
  Layers, 
  Plus, 
  Trash2, 
  Cloud, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  RefreshCw,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AppConfig } from '../types';
import { getStoredAppConfig, saveStoredAppConfig, DEFAULT_APP_CONFIG } from '../services/projectPersistence';
import { GAS_DOCUMENT_EXPORT_SCRIPT_CODE } from '../utils/gasDocumentExportScript';

interface SystemConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: (config: AppConfig) => void;
}

export const SystemConfigModal: React.FC<SystemConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [config, setConfig] = useState<AppConfig>(() => getStoredAppConfig());
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [isTestingGas, setIsTestingGas] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(getStoredAppConfig());
      setSaveToast(false);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (config.categories.includes(trimmed)) return;
    setConfig(prev => ({
      ...prev,
      categories: [...prev.categories, trimmed]
    }));
    setNewCategoryInput('');
  };

  const handleRemoveCategory = (catToRemove: string) => {
    setConfig(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== catToRemove)
    }));
  };

  const handleResetCategories = () => {
    setConfig(prev => ({
      ...prev,
      categories: [...DEFAULT_APP_CONFIG.categories]
    }));
  };

  const handleSave = () => {
    saveStoredAppConfig(config);
    if (onConfigSaved) {
      onConfigSaved(config);
    }
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 900);
  };

  const handleCopyGasScript = async () => {
    try {
      await navigator.clipboard.writeText(GAS_DOCUMENT_EXPORT_SCRIPT_CODE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      // Fallback
      setCopiedCode(true);
    }
  };

  const handleTestGasConnection = async () => {
    if (!config.gasEndpointUrl || !config.gasEndpointUrl.trim()) {
      setTestResult({ success: false, message: '請先輸入 GAS Web App 部署網址' });
      return;
    }
    setIsTestingGas(true);
    setTestResult(null);
    try {
      const resp = await fetch(config.gasEndpointUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ping_test' })
      });
      const data = await resp.json();
      if (data) {
        setTestResult({ success: true, message: 'GAS 雲端端點連線正常，可隨時進行雲端備份存檔！' });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `連線失敗 (${err.message || '跨域限制'})。請確認 GAS 存取權限為「任何人 (Anyone)」`
      });
    } finally {
      setIsTestingGas(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#2C3437] text-white flex items-center justify-between border-b border-stone-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-amber-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>系統與年度設定</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-stone-300">
                  動態設定與雲端串接
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                自由抽換報告年度、主辦組織名稱、自訂活動分類與 Google Apps Script 雲端同步端點
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-stone-700">
          
          {/* Section 1: 年度與主辦單位名稱 */}
          <div className="space-y-4">
            <h4 className="text-xs font-black tracking-wider text-stone-500 uppercase flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>報告年度與組織基本資料</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  目前報告與評鑑年度 (currentYear)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={config.currentYear}
                    onChange={(e) => setConfig({ ...config, currentYear: e.target.value })}
                    placeholder="例如 2026"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex gap-1">
                    {['2025', '2026', '2027'].map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setConfig({ ...config, currentYear: yr })}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          config.currentYear === yr 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  變更後，優秀分團選拔佐證表、專案成果庫與簡報助手將全面改用此年度。
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  輔導道場名稱 (guidingUnit)
                </label>
                <input
                  type="text"
                  value={config.guidingUnit || ''}
                  onChange={(e) => setConfig({ ...config, guidingUnit: e.target.value })}
                  placeholder="例如 佛光山法寶寺"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  主辦單位全銜 (organizationName)
                </label>
                <input
                  type="text"
                  value={config.organizationName}
                  onChange={(e) => setConfig({ ...config, organizationName: e.target.value })}
                  placeholder="例如 國際佛光會中華佛光青年總團 / 新竹青年分團"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  執行分團 / 子隊簡稱 (subUnitName)
                </label>
                <input
                  type="text"
                  value={config.subUnitName || ''}
                  onChange={(e) => setConfig({ ...config, subUnitName: e.target.value })}
                  placeholder="例如 新竹青年分團 / 新竹歌詠隊"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <hr className="border-stone-200" />

          {/* Section 2: 自訂活動分類清單 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black tracking-wider text-stone-500 uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>活動分類清單自訂 (categories)</span>
              </h4>
              <button
                type="button"
                onClick={handleResetCategories}
                className="text-[11px] text-stone-500 hover:text-blue-600 underline cursor-pointer"
              >
                重設為總團預設分類
              </button>
            </div>

            <div className="flex flex-wrap gap-2 p-3 bg-stone-50 rounded-2xl border border-stone-200 min-h-[50px]">
              {config.categories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-semibold shadow-2xs group"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-stone-400 hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer"
                    title="移除分類"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                placeholder="輸入新分類名稱（如：青年歌詠隊團練、跨界研討會）"
                className="flex-1 px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增分類</span>
              </button>
            </div>
          </div>

          <hr className="border-stone-200" />

          {/* Section 3: 雲端 Google Drive / GAS 端點設定 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black tracking-wider text-stone-500 uppercase flex items-center gap-2">
                <Cloud className="w-4 h-4 text-purple-600" />
                <span>Google Drive / GAS 雲端儲存端點</span>
              </h4>
              <button
                type="button"
                onClick={handleCopyGasScript}
                className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? '已複製完整腳本代碼！' : '複製 GAS 雲端儲存腳本'}</span>
              </button>
            </div>

            <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-200 text-xs text-stone-600 space-y-1.5">
              <p className="font-semibold text-purple-900 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span>一鍵雲端真存檔（自動備份至分團專屬 Google Drive 資料夾）</span>
              </p>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                將此 GAS Web App 網址填入下方後，點擊導航列「💾 雲端備份存檔」，系統會自動將所有活動、投影片與設定儲存為 Drive 上的專案檔（<code className="bg-purple-100 px-1 py-0.5 rounded text-purple-900 font-mono">hsinchu_youth_report_data.json</code>）。
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">
                Google Apps Script Web App 網址
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={config.gasEndpointUrl || ''}
                  onChange={(e) => setConfig({ ...config, gasEndpointUrl: e.target.value })}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={handleTestGasConnection}
                  disabled={isTestingGas}
                  className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingGas ? 'animate-spin' : ''}`} />
                  <span>測試連線</span>
                </button>
              </div>
            </div>

            {testResult && (
              <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                testResult.success 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {testResult.success ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <div className="text-xs text-stone-500">
            {saveToast && (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" />
                設定已即時套用並儲存！
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 rounded-xl bg-[#2C3437] hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>儲存並套用設定</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
