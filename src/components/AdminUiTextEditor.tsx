import React, { useState, useMemo } from 'react';
import { 
  Type, 
  Search, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  MousePointerClick,
  Sparkles,
  Undo2
} from 'lucide-react';
import { useUiText, DEFAULT_UI_TEXTS_CATALOG } from '../contexts/UiTextContext';

export const AdminUiTextEditor: React.FC = () => {
  const { 
    customTexts, 
    updateMultipleTexts, 
    resetText, 
    resetAllToDefault,
    isVisualEditModeActive,
    setIsVisualEditModeActive
  } = useUiText();

  // Local draft state for editing before batch save
  const [draftTexts, setDraftTexts] = useState<Record<string, string>>(() => ({ ...customTexts }));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string>('');
  const [confirmResetAll, setConfirmResetAll] = useState<boolean>(false);

  // Sync draft if external customTexts change
  React.useEffect(() => {
    setDraftTexts({ ...customTexts });
  }, [customTexts]);

  // Categories list
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    DEFAULT_UI_TEXTS_CATALOG.forEach(item => {
      map.set(item.category, item.categoryLabel);
    });
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, []);

  // Filtered items
  const filteredItems = useMemo(() => {
    return DEFAULT_UI_TEXTS_CATALOG.filter(item => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchSearch = 
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.key.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.defaultText.toLowerCase().includes(query) ||
        (draftTexts[item.key] && draftTexts[item.key].toLowerCase().includes(query));
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery, draftTexts]);

  // Count modified items
  const modifiedCount = useMemo(() => {
    return Object.keys(customTexts).filter(k => customTexts[k] !== undefined && customTexts[k].trim() !== '').length;
  }, [customTexts]);

  // Pending unsaved edits count in current form
  const hasUnsavedChanges = useMemo(() => {
    for (const key of Object.keys(draftTexts)) {
      if (draftTexts[key] !== (customTexts[key] || '')) return true;
    }
    return false;
  }, [draftTexts, customTexts]);

  const handleInputChange = (key: string, value: string) => {
    setDraftTexts(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveAll = () => {
    updateMultipleTexts(draftTexts);
    setSaveSuccessNotice('已成功儲存全站介面文字設定！全站即時生效。');
    setTimeout(() => setSaveSuccessNotice(''), 4000);
  };

  const handleResetSingle = (key: string) => {
    resetText(key);
    setDraftTexts(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleResetAll = () => {
    resetAllToDefault();
    setDraftTexts({});
    setConfirmResetAll(false);
    setSaveSuccessNotice('已恢復全站原廠預設文字！');
    setTimeout(() => setSaveSuccessNotice(''), 4000);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Top Banner & Fast Controls */}
      <div className="bg-gradient-to-r from-[#2C3437] via-[#3a4549] to-[#2C3437] text-white p-5 rounded-2xl border border-stone-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <Type className="w-4 h-4" />
            <span>全站顯示文字管理 (Visual UI Text Editor)</span>
          </div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <span>視覺化介面文案自訂與永續維護</span>
            <span className="text-xs font-normal text-stone-300 bg-stone-800 px-2 py-0.5 rounded-full border border-stone-700">
              已自訂 {modifiedCount} 處文案
            </span>
          </h3>
          <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
            此功能專供幹部彈性調整全站按鈕標籤、欄位名稱與區塊提示文案。<strong>所有修改僅限於文字內容替換，絕不影響原按鈕點擊功能與資料庫運作。</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick toggle for Visual Alt+Click helper notice */}
          <button
            type="button"
            onClick={() => setIsVisualEditModeActive(!isVisualEditModeActive)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              isVisualEditModeActive
                ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm font-black'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
            }`}
            title="開啟後，瀏覽任何頁面只要按住 Alt 鍵並點擊支援的文案，即可就地跳出文字編輯視窗（不觸發按鈕原功能）"
          >
            <MousePointerClick className="w-4 h-4" />
            <span>{isVisualEditModeActive ? '就地編輯模式：已開啟' : '開啟就地快捷編輯'}</span>
          </button>

          {/* Reset All to Factory Defaults */}
          <button
            type="button"
            onClick={() => setConfirmResetAll(true)}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-rose-950/40 text-stone-300 hover:text-rose-300 border border-stone-700 hover:border-rose-800/60 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="清空所有自訂文字，恢復全站程式預設文案"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢復原廠預設文字</span>
          </button>

          {/* Save All Changes Button */}
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#70C1B3] to-[#599e92] hover:brightness-105 text-[#2C3437] text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>儲存文字設定</span>
            {hasUnsavedChanges && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccessNotice && (
        <div className="p-3 bg-emerald-600 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* Mode helper hint */}
      {isVisualEditModeActive && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>就地快捷編輯已就緒：</strong>返回前台頁面（如活動成果庫、簡報中心或導覽列），<strong>按住鍵盤 Alt 鍵並滑鼠左鍵點擊任一文案</strong>，即可就地開啟快速編輯彈窗，完全不觸發按鈕既有業務點擊事件！
          </span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            全部類別 ({DEFAULT_UI_TEXTS_CATALOG.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                selectedCategory === cat.key
                  ? 'bg-[#70C1B3] text-[#2C3437] shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜尋欄位名稱、鍵值或預設文案..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-stone-300 rounded-xl text-xs bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#70C1B3] focus:outline-hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Editor Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100/80 text-stone-600 border-b border-stone-200 font-bold">
                <th className="py-3 px-4 w-44">欄位名稱與位置</th>
                <th className="py-3 px-4 w-60">原廠預設文字</th>
                <th className="py-3 px-4">當前自訂顯示文字（可直接修改）</th>
                <th className="py-3 px-4 w-28 text-center">單項操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-stone-400">
                    <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold">找不到符合條件的介面文字欄位</p>
                    <p className="text-[11px] mt-1">請嘗試更換關鍵字或點擊全部類別</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const currentValue = draftTexts[item.key] !== undefined ? draftTexts[item.key] : '';
                  const isCustomized = currentValue.trim() !== '' && currentValue !== item.defaultText;

                  return (
                    <tr 
                      key={item.key} 
                      className={`hover:bg-stone-50/70 transition-colors ${
                        isCustomized ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Name & Meta */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-black text-stone-800 text-xs">{item.name}</div>
                        <div className="text-[10px] text-stone-400 mt-0.5">{item.description}</div>
                        <div className="mt-1">
                          <code className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200 select-all">
                            {item.key}
                          </code>
                        </div>
                      </td>

                      {/* Default Text */}
                      <td className="py-3.5 px-4 align-top text-stone-500 select-all">
                        <div className="p-2 bg-stone-50 rounded-lg border border-stone-200/80 leading-relaxed break-words font-mono text-[11px]">
                          {item.defaultText}
                        </div>
                      </td>

                      {/* Editable Input */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={currentValue}
                            placeholder={`保持預設（${item.defaultText}）`}
                            onChange={(e) => handleInputChange(item.key, e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                              isCustomized
                                ? 'border-amber-400 bg-amber-50/40 text-stone-900 focus:ring-2 focus:ring-amber-500 focus:bg-white'
                                : 'border-stone-300 bg-white text-stone-800 focus:ring-2 focus:ring-[#70C1B3]'
                            } focus:outline-hidden`}
                          />
                          {isCustomized && (
                            <div className="flex items-center gap-1.5 text-[10px] text-amber-700 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span>已自訂顯示文案（原值將被取代呈現）</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Single Action */}
                      <td className="py-3.5 px-4 align-top text-center">
                        {isCustomized ? (
                          <button
                            type="button"
                            onClick={() => handleResetSingle(item.key)}
                            className="px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 hover:text-stone-900 text-xs font-bold flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                            title="還原此欄位至預設值"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            <span>還原</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-stone-400 font-medium">使用預設</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Save Reminder Bar */}
        <div className="p-3.5 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-stone-500 font-medium">
            💡 提示：在此頁完成文字修改後，請點擊「儲存文字設定」，變更將立刻同步寫入並儲存於本機儲存空間（localStorage）。
          </div>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-4 py-1.5 rounded-xl bg-[#70C1B3] hover:bg-[#5fa89c] text-[#2C3437] font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>確認儲存設定</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Reset All to Factory Defaults */}
      {confirmResetAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>確定恢復原廠預設文字？</span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              此操作將清空幹部所有的介面自訂文字，全站所有按鈕與標籤將恢復為系統出廠初始設定。<strong>這不會影響任何活動資料庫、相片佐證或打卡紀錄。</strong>
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmResetAll(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleResetAll}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
              >
                確定恢復預設
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
