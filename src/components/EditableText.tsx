import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { useUiText } from '../contexts/UiTextContext';
import { isAdminAuthenticated } from '../utils/storage';

export interface EditableTextProps {
  fieldKey: string;
  defaultText: string;
  multiline?: boolean;
  className?: string;
  inputClassName?: string;
  tag?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4';
  placeholder?: string;
}

/**
 * 就地視覺化編輯元件 (In-Place CMS Editable Text)
 * 
 * 1. 一般模式 / 非管理員模式：
 *    - 依循【純淨 UI 原則】，直接渲染乾淨純文字（零額外編輯框、按鈕或 AI 思考字串）
 * 2. 管理員模式 + 啟用就地編輯模式：
 *    - 滑鼠懸停顯示淡藍色/琥珀虛線框與編輯鉛筆提示
 *    - 點擊直接切換為 input / textarea
 *    - 失焦（onBlur）或按 Enter（多行則 Ctrl/Cmd + Enter）即時儲存至全域字典與 localStorage
 */
export const EditableText: React.FC<EditableTextProps> = ({
  fieldKey,
  defaultText,
  multiline = false,
  className = '',
  inputClassName = '',
  tag: Tag = 'span',
  placeholder = '請輸入內容...'
}) => {
  const { getText, updateText, isVisualEditModeActive } = useUiText();
  const currentText = getText(fieldKey, defaultText);

  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(currentText);
  const [isAdmin, setIsAdmin] = useState(() => isAdminAuthenticated());
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // 監聽管理員認證狀態
  useEffect(() => {
    const handleAuthChange = (e: any) => {
      const auth = e?.detail?.auth ?? isAdminAuthenticated();
      setIsAdmin(Boolean(auth));
      if (!auth) {
        setIsEditing(false);
      }
    };
    window.addEventListener('blia_admin_auth_changed', handleAuthChange);
    return () => {
      window.removeEventListener('blia_admin_auth_changed', handleAuthChange);
    };
  }, []);

  // 同步外部文字更新
  useEffect(() => {
    if (!isEditing) {
      setDraftValue(currentText);
    }
  }, [currentText, isEditing]);

  // 自動聚焦輸入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const canEdit = isAdmin && isVisualEditModeActive;

  // 儲存修改
  const handleSave = () => {
    const trimmed = draftValue.trim();
    if (trimmed !== currentText) {
      updateText(fieldKey, trimmed || defaultText);
    }
    setIsEditing(false);
  };

  // 取消修改
  const handleCancel = () => {
    setDraftValue(currentText);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
      return;
    }

    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (multiline && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  // 1. 純淨 UI 輸出：若非管理員或未開啟編輯模式
  if (!canEdit) {
    return <Tag className={className}>{currentText}</Tag>;
  }

  // 2. 編輯中狀態：In-Place Input/Textarea
  if (isEditing) {
    return (
      <span 
        data-editable-control="true"
        className="inline-flex items-center gap-1.5 align-middle max-w-full my-0.5" 
        onClick={(e) => e.stopPropagation()}
      >
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={2}
            className={`px-2 py-1 text-xs font-normal text-stone-900 bg-white border-2 border-[#70C1B3] rounded-lg shadow-md focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]/30 min-w-[220px] max-w-full resize-y ${inputClassName}`}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`px-2 py-0.5 text-xs font-normal text-stone-900 bg-white border-2 border-[#70C1B3] rounded-md shadow-md focus:outline-hidden focus:ring-2 focus:ring-[#70C1B3]/30 min-w-[140px] ${inputClassName}`}
          />
        )}
        <span className="inline-flex items-center gap-1 shrink-0">
          <span
            role="button"
            tabIndex={0}
            onMouseDown={(e) => {
              e.preventDefault();
              handleSave();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSave();
              }
            }}
            className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer select-none"
            title="儲存 (Enter)"
          >
            <Check className="w-3 h-3" />
          </span>
          <span
            role="button"
            tabIndex={0}
            onMouseDown={(e) => {
              e.preventDefault();
              handleCancel();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCancel();
              }
            }}
            className="p-1 rounded bg-stone-300 hover:bg-stone-400 text-stone-700 shadow-xs cursor-pointer select-none"
            title="取消 (Esc)"
          >
            <X className="w-3 h-3" />
          </span>
        </span>
      </span>
    );
  }

  // 3. 管理員就地編輯預覽狀態：滑鼠懸停顯示編輯邊框與圖示
  return (
    <span
      data-editable-text="true"
      onClick={(e) => {
        e.stopPropagation();
        setDraftValue(currentText);
        setIsEditing(true);
      }}
      className={`group/edit relative inline-flex items-center gap-1 cursor-pointer transition-all border border-dashed border-sky-400/60 hover:border-sky-500 hover:bg-sky-100/40 dark:hover:bg-sky-950/30 px-1.5 py-0.5 rounded-md ${className}`}
      title="點擊直接修改文案（In-Place Edit）"
    >
      <Tag className="inline whitespace-pre-wrap">{currentText}</Tag>
      <Pencil className="w-2.5 h-2.5 text-sky-500 opacity-70 group-hover/edit:opacity-100 group-hover/edit:scale-110 transition-all shrink-0" />
    </span>
  );
};
