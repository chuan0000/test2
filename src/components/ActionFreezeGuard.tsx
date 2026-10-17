import React, { useState, useEffect } from 'react';
import { useUiText } from '../contexts/UiTextContext';
import { isAdminAuthenticated } from '../utils/storage';
import { Lock, Unlock, AlertCircle, Edit3, X } from 'lucide-react';

/**
 * 全站按鈕行為安全凍結與就地編輯常駐狀態列 (Action Freeze Mode Guard)
 * 
 * 核心機制：
 * 1. 當管理員開啟「就地視覺化編輯模式 (isVisualEditModeActive === true)」時：
 *    - 於 window 頂層 Capture 階段 (useCapture: true) 攔截所有的 click 與 submit 事件。
 *    - 若點擊事件源非 EditableText 控制項本身（如輸入框、確認、取消按鈕或本提示列按鈕），
 *      自動執行 preventDefault() 與 stopPropagation()。
 *    - 徹底阻止任何原生跳轉、頁面切換、表單送出、資料庫刪除或 API 請求，使按鈕僅保留文字就地修改功能！
 * 2. 於頁面頂部常駐浮動警示列，提醒目前為「純改字模式」，並提供一鍵退出編輯模式。
 */
export const ActionFreezeGuard: React.FC = () => {
  const { isVisualEditModeActive, setIsVisualEditModeActive } = useUiText();
  const [isAdmin, setIsAdmin] = useState<boolean>(() => isAdminAuthenticated());

  useEffect(() => {
    const handleAuthChange = (e: any) => {
      const auth = e?.detail?.auth ?? isAdminAuthenticated();
      setIsAdmin(Boolean(auth));
      if (!auth && isVisualEditModeActive) {
        setIsVisualEditModeActive(false);
      }
    };
    window.addEventListener('blia_admin_auth_changed', handleAuthChange);
    return () => {
      window.removeEventListener('blia_admin_auth_changed', handleAuthChange);
    };
  }, [isVisualEditModeActive, setIsVisualEditModeActive]);

  // 全域事件 Capture 階段攔截
  useEffect(() => {
    if (!isAdmin || !isVisualEditModeActive) {
      return;
    }

    const handleGlobalClickCapture = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // 允許本控制面板操作
      if (target.closest('[data-freeze-bypass="true"]')) {
        return;
      }

      // 允許 EditableText 的輸入與控制項操作 (如 input, textarea, save/cancel buttons)
      if (target.closest('[data-editable-control="true"]')) {
        return;
      }

      // 如果點擊了可編輯元素本身（觸發開始改字），允許事件抵達 EditableText 觸發 isEditing
      if (target.closest('.group\\/edit') || target.closest('[data-editable-text="true"]')) {
        // 若該元素在 button 內部，為了防止 button 原生的 onClick 觸發業務邏輯，阻止父層 button 的原生行為
        const parentBtn = target.closest('button, a, form');
        if (parentBtn) {
          e.preventDefault();
        }
        return;
      }

      // 如果點擊了任何一般按鈕、連結或表單控制項，全部安全凍結！
      const interactiveEl = target.closest('button, a, input:not([data-editable-control="true"]), textarea:not([data-editable-control="true"]), select');
      if (interactiveEl) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleGlobalSubmitCapture = (e: SubmitEvent) => {
      // 凍結模式下全面攔截表單送出
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('click', handleGlobalClickCapture, true);
    window.addEventListener('submit', handleGlobalSubmitCapture, true);

    return () => {
      window.removeEventListener('click', handleGlobalClickCapture, true);
      window.removeEventListener('submit', handleGlobalSubmitCapture, true);
    };
  }, [isAdmin, isVisualEditModeActive]);

  if (!isAdmin || !isVisualEditModeActive) {
    return null;
  }

  return (
    <div 
      data-freeze-bypass="true"
      className="sticky top-0 z-50 bg-amber-500 text-stone-950 px-4 py-2 shadow-lg border-b-2 border-amber-600 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-center gap-2.5 text-xs sm:text-sm font-black">
        <span className="p-1 rounded-lg bg-stone-950 text-amber-400 flex items-center justify-center animate-pulse">
          <Lock className="w-4 h-4" />
        </span>
        <div className="flex items-center gap-2">
          <span className="bg-stone-950 text-white px-2 py-0.5 rounded text-xs tracking-wide">
            純改字安全模式已啟動
          </span>
          <span className="text-stone-900 hidden md:inline">
            全站所有按鈕與跳轉行為已暫時凍結，畫面上所有虛線標記文字均可直接點擊修改，絕不誤觸業務功能！
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsVisualEditModeActive(false)}
          className="px-3 py-1 rounded-lg bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Unlock className="w-3.5 h-3.5 text-amber-400" />
          <span>結束改字模式（恢復按鈕功能）</span>
        </button>
      </div>
    </div>
  );
};
